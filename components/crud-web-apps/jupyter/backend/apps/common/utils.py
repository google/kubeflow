import os

from kubernetes import client
from werkzeug import exceptions

from kubeflow.kubeflow.crud_backend import helpers, logging

from . import status

log = logging.getLogger(__name__)

FILE_ABS_PATH = os.path.abspath(os.path.dirname(__file__))

NOTEBOOK_TEMPLATE_YAML = os.path.join(
    FILE_ABS_PATH, "yaml/notebook_template.yaml"
)

# The production configuration is mounted on the app's pod via a configmap
DEV_CONFIG = os.path.join(FILE_ABS_PATH, "yaml/spawner_ui_config.yaml")
CONFIGS = [
    "/etc/config/spawner_ui_config.yaml",
    DEV_CONFIG,
]


def load_notebook_template(**kwargs):
    """
    kwargs: the parameters to be replaced in the yaml

    Reads the yaml for the web app's custom resource, replaces the variables
    and returns it as a python dict.
    """
    return helpers.load_param_yaml(NOTEBOOK_TEMPLATE_YAML, **kwargs)


def load_spawner_ui_config():
    for config in CONFIGS:
        config_dict = helpers.load_yaml(config)

        if config_dict is not None:
            log.info("Using config file: %s", config)
            return config_dict["spawnerFormDefaults"]

    log.error("Couldn't find any config file.")
    raise exceptions.NotFound("Couldn't find any config file.")


def process_gpus(container):
    """
    This function will expose two things, regarding GPUs:
    1. The total number of GPUs that the Notebook has requested
    2. A message describing how many GPUs from each venders it requested

    This function will check the vendors that the admin has defined in the
    app's config file.
    """
    # get the GPU vendors from the app's config
    config = load_spawner_ui_config()
    cfg_vendors = config.get("gpus", {}).get("value", {}).get("vendors", [])
    # create a dict mapping the limits key with the UI name.
    # For example: "nvidia.com/gpu": "NVIDIA"
    gpu_vendors = {v["limitsKey"]: v["uiName"] for v in cfg_vendors}

    count = 0
    gpus = []
    resource_limits = container.get("resources", {}).get("limits", {})
    for vendor in gpu_vendors.keys():
        if vendor not in resource_limits:
            continue

        gpu_count = resource_limits[vendor]
        count += int(gpu_count)

        # final message will be like: 1 NVIDIA, 2 AMD
        gpus.append("%s %s" % (gpu_count, gpu_vendors[vendor]))

    return {"count": count, "message": ", ".join(gpus)}


def pvc_from_dict(vol, namespace):
    if vol is None:
        return None

    return client.V1PersistentVolumeClaim(
        metadata=client.V1ObjectMeta(name=vol["name"], namespace=namespace,),
        spec=client.V1PersistentVolumeClaimSpec(
            access_modes=[vol["mode"]],
            storage_class_name=get_storage_class(vol),
            resources=client.V1ResourceRequirements(
                requests={"storage": vol["size"]}
            ),
        ),
    )


def get_storage_class(vol):
    # handle the StorageClass
    if "class" not in vol:
        return None
    if vol["class"] == "{empty}":
        return ""
    if vol["class"] == "{none}":
        return None
    else:
        return vol["class"]


# Functions for transforming the data from k8s api
def pvc_dict_from_k8s_obj(pvc):
    return {
        "name": pvc.metadata.name,
        "namespace": pvc.metadata.namespace,
        "size": pvc.spec.resources.requests["storage"],
        "mode": pvc.spec.access_modes,
        "class": pvc.spec.storage_class_name,
    }


def notebook_dict_from_k8s_obj(notebook):
    cntr = notebook["spec"]["template"]["spec"]["containers"][0]
    server_type = None
    if notebook["metadata"].get("annotations"):
        annotations = notebook["metadata"]["annotations"]
        server_type = annotations.get("notebooks.kubeflow.org/server-type")

    return {
        "name": notebook["metadata"]["name"],
        "namespace": notebook["metadata"]["namespace"],
        "serverType": server_type,
        "age": helpers.get_uptime(notebook["metadata"]["creationTimestamp"]),
        "image": cntr["image"],
        "shortImage": cntr["image"].split("/")[-1],
        "cpu": cntr["resources"]["requests"]["cpu"],
        "gpus": process_gpus(cntr),
        "memory": cntr["resources"]["requests"]["memory"],
        "volumes": [v["name"] for v in cntr["volumeMounts"]],
        "status": status.process_status(notebook),
    }
