import functools
from kubernetes import client, config
from kubernetes.config import ConfigException
from kubernetes.client.rest import ApiException
from . import utils
from . import settings

logger = utils.create_logger(__name__)

try:
    # Load configuration inside the Pod
    config.load_incluster_config()
except ConfigException:
    # Load configuration for testing
    config.load_kube_config()

# The API object for submitting SubjecAccessReviews
api = client.AuthorizationV1Api()


def create_subject_access_review(user, verb, namespace, group, version,
                                 resource):
    '''
    Create the SubjecAccessReview object which we will use to determine if the
    user is authorized.
    '''
    return client.V1SubjectAccessReview(
        spec=client.V1SubjectAccessReviewSpec(
            user=user,
            resource_attributes=client.V1ResourceAttributes(
                group=group,
                namespace=namespace,
                verb=verb,
                resource=resource,
                version=version
            )
        )
    )


def is_authorized(user, verb, namespace, group, version, resource):
    '''
    Create a SubjectAccessReview to the K8s API to determine if the user is
    authorized to perform a specific verb on a resource.
    '''
    if settings.DEV_MODE:
        logger.warning(
            ("Running in developement mode. No authorization checks will be"
             " issued")
        )
        return True

    if user is None:
        logger.warning(
            ("No user credentials were found! Make sure you"
             " have correctly set the USERID_HEADER in the"
             " Jupyter Web App's deployment.")
        )
        return False

    sar = create_subject_access_review(user, verb, namespace, group, version,
                                       resource)
    try:
        obj = api.create_subject_access_review(sar)
    except ApiException as e:
        logger.error(
            "Error submitting SubjecAccessReview: {}, {}".format(
                sar, utils.parse_error(e))
        )
        return False

    if obj.status is not None:
        return obj.status.allowed
    else:
        logger.error("SubjectAccessReview doesn't have status.")
        return False


def needs_authorization(verb, group, version, resource):
    '''
    This function will serve as a decorator. It will be used to make sure that
    the decorated function is authorized to perform the corresponding k8s api
    verb on a specific resource.
    '''
    def wrapper(func):
        @functools.wraps(func)
        def runner(*args, **kwargs):
            user = utils.get_username_from_request()
            namespace = kwargs.get("namespace", None)

            if is_authorized(user, verb, namespace, group, version, resource):
                return func(*args, **kwargs)
            else:
                msg = ("User {} is not authorized to {} {} for namespace: "
                       "{}").format(user,
                                    verb,
                                    f"{group}.{version}.{resource}",
                                    namespace)
                return {
                    "success": False,
                    "log": msg,
                }

        return runner

    return wrapper
