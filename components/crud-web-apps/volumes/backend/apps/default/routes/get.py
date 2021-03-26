from kubeflow.kubeflow.crud_backend import api, logging

from ...common import utils
from . import bp

log = logging.getLogger(__name__)


@bp.route("/api/namespaces/<namespace>/pvcs")
def get_pvcs(namespace):
    # Return the list of PVCs
    pvcs = api.list_pvcs(namespace)
    content = [utils.parse_pvc(pvc) for pvc in pvcs.items]

    return api.success_response("pvcs", content)
