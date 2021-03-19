import json

from kubernetes import client, config
from kubernetes.client.rest import ApiException
from kubernetes.config import ConfigException

from . import auth
from . import utils

logger = utils.create_logger(__name__)

try:
    # Load configuration inside the Pod
    config.load_incluster_config()
except ConfigException:
    # Load configuration for testing
    config.load_kube_config()

# Create the Apis
v1_core = client.CoreV1Api()
custom_api = client.CustomObjectsApi()
storage_api = client.StorageV1Api()


def parse_error(e):
    try:
        err = json.loads(e.body)["message"]
    except (json.JSONDecodeError, KeyError, AttributeError):
        err = str(e)

    return err


# Wrapper Functions for error handling
def wrap_resp(rsrc, fn, *args, **kwargs):
    '''
    rsrc: Name of the resource, used as the dict key
    fn: function to get the resource
    '''
    data = {
        "success": True,
        "log": ""
    }

    try:
        data[rsrc] = fn(*args, **kwargs)
    except ApiException as e:
        data[rsrc] = {}
        data["success"] = False
        data["log"] = parse_error(e)
    except Exception as e:
        data[rsrc] = {}
        data["success"] = False
        data["log"] = parse_error(e)

    return data


def wrap(fn, *args, **kwargs):
    '''
    fn: function to get the resource
    '''
    data = {
        "success": True,
        "log": ""
    }

    try:
        fn(*args, **kwargs)
    except ApiException as e:
        data["success"] = False
        data["log"] = parse_error(e)
    except Exception as e:
        data["success"] = False
        data["log"] = parse_error(e)

    return data


# API Functions
# GETers
@auth.needs_authorization("list", "", "v1", "persistentvolumeclaims")
def list_pvcs(namespace):
    return wrap_resp(
        "pvcs",
        v1_core.list_namespaced_persistent_volume_claim,
        namespace=namespace
    )


@auth.needs_authorization("list", "kubeflow.org", "v1beta1", "notebooks")
def list_notebooks(namespace):
    return wrap_resp(
        "notebooks",
        custom_api.list_namespaced_custom_object,
        "kubeflow.org",
        "v1beta1",
        namespace,
        "notebooks"
    )


# We don't do a subject access review on notebook events because
# notebook events are cluster scoped resources. Users however are only
# granted access to particular namespacs. We rely on the notebook webserver
# to filter out information a user shouldn't see.
def list_notebook_events(namespace, nb_name):
    '''
    V1EventList with events whose source the Notebook with 'nb_name' from namespace 'namespace'
    '''
    return wrap_resp(
        "notebook-events",
        v1_core.list_namespaced_event,
        namespace=namespace,
        field_selector="involvedObject.kind=Notebook,involvedObject.name=" + nb_name
    )


@auth.needs_authorization("list", "kubeflow.org", "v1alpha1", "poddefaults")
def list_poddefaults(namespace):
    return wrap_resp(
        "poddefaults",
        custom_api.list_namespaced_custom_object,
        "kubeflow.org",
        "v1alpha1",
        namespace,
        "poddefaults"
    )


@auth.needs_authorization("get", "", "v1", "secrets")
def get_secret(name, namespace):
    return wrap_resp(
        "secret",
        v1_core.read_namespaced_secret,
        name,
        namespace
    )


@auth.needs_authorization("list", "", "v1", "namespaces")
def list_namespaces():
    return wrap_resp(
        "namespaces",
        v1_core.list_namespace
    )


# @auth.needs_authorization("list", "storage.k8s.io", "v1", "storageclasses")
# NOTE: This function is only used from the backend in order to determine if a
# default StorageClass is set. Currently, the role aggregation does not use a
# ClusterRoleBinding, thus we can't currently give this permission to a user.
# The backend does not expose any endpoint that would allow an unauthorized
# user to list the storage classes using this function.
def list_storageclasses():
    return wrap_resp(
        "storageclasses",
        storage_api.list_storage_class
    )


# POSTers
@auth.needs_authorization("create", "kubeflow.org", "v1beta1", "notebooks")
def create_notebook(notebook, namespace):
    return wrap(
        custom_api.create_namespaced_custom_object,
        "kubeflow.org",
        "v1beta1",
        namespace,
        "notebooks",
        notebook
    )


@auth.needs_authorization("create", "", "v1", "persistentvolumeclaims")
def create_pvc(pvc, namespace):
    return wrap_resp(
        "pvc",
        v1_core.create_namespaced_persistent_volume_claim,
        namespace,
        pvc
    )


# DELETErs
@auth.needs_authorization("delete", "kubeflow.org", "v1beta1", "notebooks")
def delete_notebook(notebook_name, namespace):
    return wrap(
        custom_api.delete_namespaced_custom_object,
        "kubeflow.org",
        "v1beta1",
        namespace,
        "notebooks",
        notebook_name
    )


# PATCHrs
@auth.needs_authorization("patch", "kubeflow.org", "v1beta1", "notebooks")
def patch_notebook(notebook_name, namespace, body):
    return wrap(
        custom_api.patch_namespaced_custom_object,
        "kubeflow.org",
        "v1beta1",
        namespace,
        "notebooks",
        notebook_name,
        body
    )


# Readiness Probe helper
def can_connect_to_k8s():
    try:
        custom_api.list_namespaced_custom_object(
            "kubeflow.org",
            "v1beta1",
            "default",
            "notebooks",
        )
        return True

    except ApiException:
        return False

    return True
