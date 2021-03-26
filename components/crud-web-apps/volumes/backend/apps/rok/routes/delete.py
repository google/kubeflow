from werkzeug import exceptions

from kubeflow.kubeflow.crud_backend import api, logging

from ...common import utils as common_utils
from .. import utils as rok_utils
from . import bp

log = logging.getLogger(__name__)


@bp.route("/api/namespaces/<namespace>/pvcs/<pvc>", methods=["DELETE"])
def delete_pvc(pvc, namespace):
    """
    Delete a PVC, even if it is only mounted on PVCViewer Pods.
    Get list of PVCViewers that use the requested PVC. If no other Pods
    are using that PVC then delete the Viewer Pods as well as the PVC.
    """
    pods = common_utils.get_pods_using_pvc(pvc, namespace)
    non_viewer_pods = [p for p in pods if not rok_utils.is_viewer_pod(p)]
    if non_viewer_pods:
        pod_names = [p.metadata.name for p in non_viewer_pods]
        raise exceptions.Conflict("Cannot delete PVC '%s' because it is being"
                                  " used by pods: %s" % (pvc, pod_names))

    log.info("Deleting PVC %s/%s...", namespace, pvc)
    api.delete_pvc(pvc, namespace)
    log.info("Successfully deleted PVC %s/%s", namespace, pvc)

    return api.success_response("message",
                                "PVC %s successfully deleted." % pvc)
