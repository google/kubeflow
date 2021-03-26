import os
from ..common import utils

ROK_SECRET_MOUNT = "/var/run/secrets/rok"
logger = utils.create_logger(__name__)


def parse_user_template(string):
    return string.format(username="user")


def rok_secret_name():
    secret = os.environ.get("ROK_SECRET_NAME", "secret-rok-user")
    secret = parse_user_template(secret)
    return secret


def attach_rok_token_secret(notebook):
    # Mount the Rok token as a Volume
    secret_name = rok_secret_name()
    secret_volume_name = "volume-%s" % secret_name
    utils.add_notebook_volume_secret(
        notebook,
        secret_volume_name,
        secret_name,
        ROK_SECRET_MOUNT,
        420
    )

    # Set ENV variables needed for rok cli
    notebook["spec"]["template"]["spec"]["containers"][0]["env"] += [
        {
            "name": "ROK_GW_TOKEN",
            "value": "file:%s/token" % ROK_SECRET_MOUNT
        },
        {
            "name": "ROK_GW_URL",
            "value": "file:%s/url" % ROK_SECRET_MOUNT
        },
        {
            "name": "ROK_GW_PARAM_REGISTER_JUPYTER_LAB",
            "value": notebook["metadata"]["name"] + "-0"
        },
    ]


def get_pvc_name(pvc):
    name = ""
    try:
        name = pvc.metadata.generate_name
    except AttributeError:
        name = pvc.metadata.name

    return name


def add_workspace_volume_annotations(pvc, vol):
    '''
    Attach the needed annotation to the PVC k8s object
    '''
    name = get_pvc_name(pvc)
    
    annotations = {
        "rok/creds-secret-name": rok_secret_name(),
        "jupyter-workspace": name,
    }

    if vol["type"] == "Existing":
        annotations["rok/origin"] = vol["extraFields"].get("rokUrl", "")

    labels = {"component": "singleuser-storage"}

    pvc.metadata.annotations = annotations
    pvc.metadata.labels = labels


def add_data_volume_annotations(pvc, vol):
    name = get_pvc_name(pvc)

    annotations = {
        "rok/creds-secret-name": rok_secret_name(),
        "jupyter-dataset": name,
    }

    if vol["type"] == "Existing":
        annotations["rok/origin"] = vol["extraFields"].get("rokUrl", "")

    labels = {"component": "singleuser-storage"}

    pvc.metadata.annotations = annotations
    pvc.metadata.labels = labels


def rok_pvc_from_dict(vol, namespace):
    pvc = utils.pvc_from_dict(vol, namespace)
    pvc.metadata.name = None
    pvc.metadata.generate_name = vol["name"] + "-"
    return pvc
