from werkzeug import exceptions

from kubeflow.kubeflow.crud_backend import api, logging

from ...common import utils as common_utils
from . import bp

log = logging.getLogger(__name__)


@bp.route("/api/namespaces/<namespace>/pvcs/<pvc>", methods=["DELETE"])
def delete_pvc(pvc, namespace):
    """
    Delete a PVC only if it is not used from any Pod
    """
    pods = common_utils.get_pods_using_pvc(pvc, namespace)
    if pods:
        pod_names = [p.metadata.name for p in pods]
        raise exceptions.Conflict("Cannot delete PVC '%s' because it is being"
                                  " used by pods: %s" % (pvc, pod_names))

    log.info("Deleting PVC %s/%s...", namespace, pvc)
    api.delete_pvc(pvc, namespace)
    log.info("Successfully deleted PVC %s/%s", namespace, pvc)

    return api.success_response("message",
                                "PVC %s successfully deleted." % pvc)
