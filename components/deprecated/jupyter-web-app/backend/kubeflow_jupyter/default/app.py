from flask import Flask, request, jsonify, send_from_directory
from ..common.base_app import app as base
from ..common import utils, api

app = Flask(__name__)
app.register_blueprint(base)
logger = utils.create_logger(__name__)

NOTEBOOK = "./kubeflow_jupyter/common/yaml/notebook.yaml"


# POSTers
@app.route("/api/namespaces/<namespace>/notebooks", methods=["POST"])
def post_notebook(namespace):
    body = request.get_json()
    defaults = utils.spawner_ui_config()
    logger.info("Got Notebook: {}".format(body))

    notebook = utils.load_param_yaml(NOTEBOOK,
                                     name=body["name"],
                                     namespace=namespace,
                                     serviceAccount="default-editor")

    utils.set_notebook_image(notebook, body, defaults)
    utils.set_notebook_cpu(notebook, body, defaults)
    utils.set_notebook_memory(notebook, body, defaults)
    utils.set_notebook_affinity(notebook, body, defaults)
    utils.set_notebook_tolerations(notebook, body, defaults)
    utils.set_notebook_gpus(notebook, body, defaults)
    utils.set_notebook_configurations(notebook, body, defaults)

    # Workspace Volume
    workspace_vol = utils.get_workspace_vol(body, defaults)
    if not body.get("noWorkspace", False) and workspace_vol["type"] == "New":
        # Create the PVC
        ws_pvc = utils.pvc_from_dict(workspace_vol, namespace)

        logger.info("Creating Workspace Volume: {}".format(ws_pvc.to_dict()))
        r = api.create_pvc(ws_pvc, namespace=namespace)
        if not r["success"]:
            return jsonify(r)

    if not body.get("noWorkspace", False) and workspace_vol["type"] != "None":
        utils.add_notebook_volume(
            notebook,
            workspace_vol["name"],
            workspace_vol["name"],
            "/home/jovyan",
        )

    # Add the Data Volumes
    for vol in utils.get_data_vols(body, defaults):
        if vol["type"] == "New":
            # Create the PVC
            dtvol_pvc = utils.pvc_from_dict(vol, namespace)

            logger.info("Creating Data Volume {}:".format(dtvol_pvc))
            r = api.create_pvc(dtvol_pvc, namespace=namespace)
            if not r["success"]:
                return jsonify(r)

        utils.add_notebook_volume(
            notebook,
            vol["name"],
            vol["name"],
            vol["path"]
        )

    # shm
    utils.set_notebook_shm(notebook, body, defaults)

    logger.info("Creating Notebook: {}".format(notebook))
    return jsonify(api.create_notebook(notebook, namespace=namespace))


# Since Angular is a SPA, we serve index.html every time
@app.route("/")
def serve_root():
    return send_from_directory("./static/", "index.html")


@app.route("/<path:path>", methods=["GET"])
def static_proxy(path):
    logger.info("Sending file '/static/{}' for path: {}".format(path, path))
    return send_from_directory("./static/", path)


@app.errorhandler(404)
def page_not_found(e):
    logger.info("Sending file 'index.html'")
    return send_from_directory("./static/", "index.html")
