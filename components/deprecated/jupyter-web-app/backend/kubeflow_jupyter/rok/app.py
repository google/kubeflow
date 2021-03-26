import base64
from flask import Flask, request, jsonify, send_from_directory
from ..common.base_app import app as base
from ..common import utils, api
from . import rok

# Use the BaseApp, override the POST Notebook Endpoint
app = Flask(__name__)
app.register_blueprint(base)
logger = utils.create_logger(__name__)

NOTEBOOK = "./kubeflow_jupyter/common/yaml/notebook.yaml"


# GETers
@app.route("/api/rok/namespaces/<namespace>/token")
def get_token(namespace):
    '''Retrieve the token to authenticate with Rok.'''
    secret = None
    name = rok.rok_secret_name()
    token = {
        "name": name,
        "value": "",
    }

    data = api.get_secret(name, namespace=namespace)
    if not data["success"]:
        logger.warning("Couldn't load ROK token in namespace '{}': {}".format(
            namespace, data["log"]
        ))
        data["token"] = token
        return jsonify(data)

    secret = data["secret"]
    if secret.data is None:
        logger.warning(
            "ROK Secret doesn't exist in namespace '%s'" % namespace
        )
        return jsonify({
            "success": False,
            "log": "ROK Secret doesn't exist in namespace '%s'" % namespace,
            "token": token
        })

    token = secret.data.get("token", "")
    data["token"] = {
        "value": base64.b64decode(token).decode("utf-8"),
        "name": name
    }
    del data["secret"]

    return jsonify(data)


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

    rok.attach_rok_token_secret(notebook)
    utils.set_notebook_image(notebook, body, defaults)
    utils.set_notebook_cpu(notebook, body, defaults)
    utils.set_notebook_memory(notebook, body, defaults)
    utils.set_notebook_affinity(notebook, body, defaults)
    utils.set_notebook_tolerations(notebook, body, defaults)
    utils.set_notebook_gpus(notebook, body, defaults)
    utils.set_notebook_configurations(notebook, body, defaults)

    # Workspace Volume
    workspace_vol = utils.get_workspace_vol(body, defaults)
    if not body.get("noWorkspace", False) and workspace_vol["type"] != "None":
        # Create the PVC
        ws_pvc = rok.rok_pvc_from_dict(workspace_vol, namespace)

        if workspace_vol["type"] == "Existing":
            rok.add_workspace_volume_annotations(ws_pvc, workspace_vol)

        logger.info("Creating Workspace Volume: {}".format(ws_pvc.to_dict()))
        r = api.create_pvc(ws_pvc, namespace=namespace)
        if not r["success"]:
            return jsonify(r)

        utils.add_notebook_volume(
            notebook,
            r["pvc"].metadata.name,
            r["pvc"].metadata.name,
            "/home/jovyan",
        )

    # Add the Data Volumes
    for vol in utils.get_data_vols(body, defaults):
        # Create the PVC
        dtvol_pvc = rok.rok_pvc_from_dict(vol, namespace)

        if vol["type"] == "Existing":
            rok.add_data_volume_annotations(dtvol_pvc, vol)

        logger.info("Creating Data Volume {}:".format(dtvol_pvc))
        r = api.create_pvc(dtvol_pvc, namespace=namespace)
        if not r["success"]:
            return jsonify(r)

        utils.add_notebook_volume(
            notebook,
            r["pvc"].metadata.name,
            r["pvc"].metadata.name,
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
    return send_from_directory("./static/", path)


@app.errorhandler(404)
def page_not_found(e):
    logger.info("Sending file 'index.html'")
    return send_from_directory("./static/", "index.html")
