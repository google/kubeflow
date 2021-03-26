from kubeflow.kubeflow.crud_backend import api, logging

from ...common import status
from .. import utils
from . import bp

log = logging.getLogger(__name__)


@bp.route("/api/namespaces/<namespace>/pvcs")
def get_pvcs(namespace):
    # Get the active viewers for each pvc as a dictionary
    # with Key:PVC name and Value:Status of Viewer
    viewers_lst = api.list_custom_rsrc(*utils.PVCVIEWER, namespace)

    viewers = {}
    for v in viewers_lst["items"]:
        pvc_name = v["spec"]["pvc"]
        viewers[pvc_name] = status.viewer_status(v)

    # Return the list of PVCs and the corresponding Viewer's state
    pvcs = api.list_pvcs(namespace)
    content = [utils.parse_pvc(pvc, viewers) for pvc in pvcs.items]

    return api.success_response("pvcs", content)
