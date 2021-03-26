from flask import request

from kubeflow.kubeflow.crud_backend import (api, decorators, helpers,
                                                  logging)

from ...common import form, utils
from ..utils import common as rok_common
from . import bp

log = logging.getLogger(__name__)


@bp.route("/api/namespaces/<namespace>/notebooks", methods=["POST"])
@decorators.request_is_json_type
@decorators.required_body_params("name")
def post_notebook(namespace):
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
    form.set_server_type(notebook, body, defaults)
    form.set_notebook_cpu(notebook, body, defaults)
    form.set_notebook_memory(notebook, body, defaults)
    form.set_notebook_gpus(notebook, body, defaults)
    form.set_notebook_tolerations(notebook, body, defaults)
    form.set_notebook_affinity(notebook, body, defaults)
    form.set_notebook_configurations(notebook, body, defaults)
    form.set_notebook_environment(notebook, body, defaults)

    # Workspace Volume
    ws_pvc = None
    workspace_vol = form.get_workspace_vol(body, defaults)
    if not body.get("noWorkspace", False) and workspace_vol["type"] != "None":
        ws_pvc = rok_common.rok_pvc_from_dict(workspace_vol, namespace)

        rok_common.add_workspace_volume_annotations(ws_pvc, workspace_vol)

        form.add_notebook_volume(
            notebook,
            ws_pvc.metadata.name,
            ws_pvc.metadata.name,
            "/home/jovyan",
        )

    # Add the Data Volumes
    dtvol_pvcs = []
    for vol in form.get_data_vols(body, defaults):
        dtvol_pvc = rok_common.rok_pvc_from_dict(vol, namespace)
        dtvol_pvcs.append(dtvol_pvc)

        rok_common.add_data_volume_annotations(dtvol_pvc, vol)

        form.add_notebook_volume(
            notebook,
            dtvol_pvc.metadata.name,
            dtvol_pvc.metadata.name,
            vol["path"],
        )

    # shm
    form.set_notebook_shm(notebook, body, defaults)

    # Create the Notebook before creating the PVCs
    log.info("Creating Notebook: %s", notebook)
    notebook = api.create_notebook(notebook, namespace)

    # Create the PVCs with owner references to the Notebook
    if ws_pvc is not None:
        rok_common.add_owner_reference(ws_pvc, notebook)
        log.info("Creating Workspace Volume: %s", ws_pvc.to_dict())
        api.create_pvc(ws_pvc, namespace)

    for dtvol_pvc in dtvol_pvcs:
        rok_common.add_owner_reference(dtvol_pvc, notebook)
        log.info("Creating Data Volume %s:", dtvol_pvc)
        api.create_pvc(dtvol_pvc, namespace=namespace)

    return api.success_response("message", "Notebook created successfully.")
