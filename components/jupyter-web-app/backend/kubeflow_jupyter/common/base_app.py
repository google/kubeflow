import datetime as dt

from flask import jsonify, request, Blueprint
from kubernetes import client

from . import api
from . import utils

# The BaseApp is a Blueprint that other UIs will use
app = Blueprint("base_app", __name__)
logger = utils.create_logger(__name__)


# Helper function for getting the prefix of the webapp
def prefix():
    if request.headers.get("x-forwarded-prefix"):
        return request.headers.get("x-forwarded-prefix")
    else:
        return ""


# REST Routes
@app.route("/api/namespaces/<namespace>/notebooks")
def get_notebooks(namespace):
    data = api.list_notebooks(namespace=namespace)

    if not data["success"]:
        return jsonify(data)

    items = []
    for nb in data["notebooks"]["items"]:
        nb_name = nb["metadata"]["name"]
        nb_creation_time = dt.datetime.strptime(
            nb["metadata"]["creationTimestamp"], "%Y-%m-%dT%H:%M:%SZ")
        nb_events = api.list_notebook_events(namespace, nb_name)
        if not nb_events["success"]:
            return jsonify(nb_events)
        # User can delete and then create a nb server with the same name
        # Make sure previous events are not taken into account
        nb_events = filter(lambda e: utils.event_timestamp(e) >= nb_creation_time,
                           nb_events["notebook-events"].items)
        items.append(utils.process_resource(nb, nb_events))

    data["notebooks"] = items
    return jsonify(data)


@app.route("/api/namespaces/<namespace>/poddefaults")
def get_poddefaults(namespace):
    data = api.list_poddefaults(namespace=namespace)

    if not data["success"]:
        return jsonify(data)

    # Return a list of (label, desc) with the pod defaults
    pdefaults = []
    for pd in data["poddefaults"]["items"]:
        label = list(pd["spec"]["selector"]["matchLabels"].keys())[0]
        if "desc" in pd["spec"]:
            desc = pd["spec"]["desc"]
        else:
            desc = pd["metadata"]["name"]

        pdefaults.append({"label": label, "desc": desc})

    logger.info("Found poddefaults: {}".format(pdefaults))
    data["poddefaults"] = pdefaults
    return jsonify(data)


@app.route("/api/namespaces/<namespace>/pvcs")
def get_pvcs(namespace):
    data = api.list_pvcs(namespace=namespace)
    if not data["success"]:
        return jsonify(data)

    data["pvcs"] = [utils.process_pvc(pvc) for pvc in data["pvcs"].items]

    return jsonify(data)


@app.route("/api/namespaces")
def get_namespaces():
    data = api.list_namespaces()

    # Result must be jsonify-able
    if data["success"]:
        nmsps = data["namespaces"]
        data["namespaces"] = [ns.metadata.name for ns in nmsps.items]

    return jsonify(data)


@app.route("/api/storageclasses/default")
def get_default_storageclass():
    data = api.list_storageclasses()
    if not data["success"]:
        return jsonify({
            "success": False,
            "log": data["log"]
        })

    strg_classes = data["storageclasses"].items
    for strgclss in strg_classes:
        annotations = strgclss.metadata.annotations
        if annotations is None:
            continue

        # List of possible annotations
        keys = [
            "storageclass.kubernetes.io/is-default-class",
            "storageclass.beta.kubernetes.io/is-default-class"  # GKE
        ]

        for key in keys:
            is_default = annotations.get(key, "false")

            if is_default == "true":
                return jsonify({
                    "success": True,
                    "defaultStorageClass": strgclss.metadata.name
                })

    # No StorageClass is default
    return jsonify({
        "success": True,
        "defaultStorageClass": ""
    })


@app.route("/api/config")
def get_config():
    data = {"success": True}

    data["config"] = utils.spawner_ui_config()
    return jsonify(data)


# POSTers
@app.route("/api/namespaces/<namespace>/pvcs", methods=["POST"])
def post_pvc(namespace):
    body = request.get_json()

    pvc = client.V1PersistentVolumeClaim(
        metadata=client.V1ObjectMeta(
            name=body["name"],
            namespace=namespace
        ),
        spec=client.V1PersistentVolumeClaimSpec(
            access_modes=[body["mode"]],
            resources=client.V1ResourceRequirements(
                requests={
                    "storage": body["size"] + "Gi"
                }
            )
        )
    )

    return jsonify(api.create_pvc(pvc, namespace=namespace))


# DELETErs
@app.route("/api/namespaces/<namespace>/notebooks/<notebook>",
           methods=["DELETE"])
def delete_notebook(namespace, notebook):
    return jsonify(api.delete_notebook(notebook_name=notebook, namespace=namespace))


# PATCHrs
@app.route("/api/namespaces/<namespace>/notebooks/<notebook>",
           methods=["PATCH"])
def patch_notebook(namespace, notebook):
    return jsonify(api.patch_notebook(notebook_name=notebook, namespace=namespace,
                                      body=request.get_json()))


# Liveness/Readiness Probes
@app.route("/healthz/liveness", methods=["GET"])
def liveness_probe():
    return jsonify("alive"), 200


@app.route("/healthz/readiness", methods=["GET"])
def readiness_probe():
    # Check if the backend can communicate with the k8s API Server
    if not api.can_connect_to_k8s():
        return jsonify("not ready"), 503

    return jsonify("ready"), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0")
