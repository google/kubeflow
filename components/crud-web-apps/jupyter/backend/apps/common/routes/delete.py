from kubeflow.kubeflow.crud_backend import api, logging

from . import bp

log = logging.getLogger(__name__)


@bp.route(
    "/api/namespaces/<namespace>/notebooks/<notebook>", methods=["DELETE"]
)
def delete_notebook(notebook, namespace):
    log.info("Deleting Notebook '%s/%s'" % (namespace, notebook))
    api.delete_notebook(notebook, namespace)

    return api.success_response(
        "message", "Notebook %s successfully deleted." % notebook
    )
