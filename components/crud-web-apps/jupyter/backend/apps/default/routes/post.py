from flask import request

from kubeflow.kubeflow.crud_backend import (api, decorators, helpers,
                                                  logging)

from ...common import form, utils
from . import bp

log = logging.getLogger(__name__)


@bp.route("/api/namespaces/<namespace>/notebooks", methods=["POST"])
@decorators.request_is_json_type
@decorators.required_body_params("name")
def post_pvc(namespace):
    body = request.get_json()
    log.info(f"Got body: {body}")

    notebook = helpers.load_param_yaml(
        utils.NOTEBOOK_TEMPLATE_YAML,
        name=body["name"],
        namespace=namespace,
        serviceAccount="default-editor",
    )

    defaults = utils.load_spawner_ui_config()

    form.set_notebook_image(notebook, body, defaults)
    form.set_notebook_image_pull_policy(notebook, body, defaults)
    form.set_notebook_cpu(notebook, body, defaults)
    form.set_notebook_memory(notebook, body, defaults)
    form.set_notebook_port(notebook, body, defaults)
    form.set_notebook_gpus(notebook, body, defaults)
    form.set_notebook_tolerations(notebook, body, defaults)
    form.set_notebook_affinity(notebook, body, defaults)
    form.set_notebook_configurations(notebook, body, defaults)

    # Workspace Volume
    workspace_vol = form.get_workspace_vol(body, defaults)
    if not body.get("noWorkspace", False) and workspace_vol["type"] == "New":
        # Create the PVC
        ws_pvc = utils.pvc_from_dict(workspace_vol, namespace)

        log.info("Creating Workspace Volume: %s", ws_pvc.to_dict())
        api.create_pvc(ws_pvc, namespace)

    if not body.get("noWorkspace", False) and workspace_vol["type"] != "None":
        form.add_notebook_volume(
            notebook,
            workspace_vol["name"],
            workspace_vol["name"],
            "/home/jovyan",
        )

    # Add the Data Volumes
    for vol in form.get_data_vols(body, defaults):
        if vol["type"] == "New":
            # Create the PVC
            dtvol_pvc = utils.pvc_from_dict(vol, namespace)

            log.info("Creating Data Volume: %s", dtvol_pvc)
            api.create_pvc(dtvol_pvc, namespace=namespace)

        form.add_notebook_volume(
            notebook, vol["name"], vol["name"], vol["path"]
        )

    # shm
    form.set_notebook_shm(notebook, body, defaults)

    log.info("Creating Notebook: %s", notebook)
    api.create_notebook(notebook, namespace)

    return api.success_response("message", "Notebook created successfully.")
