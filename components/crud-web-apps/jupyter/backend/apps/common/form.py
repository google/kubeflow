import json

from werkzeug.exceptions import BadRequest

from kubeflow.kubeflow.crud_backend import logging

from . import utils

log = logging.getLogger(__name__)

SERVER_TYPE_ANNOTATION = "notebooks.kubeflow.org/server-type"
HEADERS_ANNOTATION = "notebooks.kubeflow.org/http-headers-request-set"
URI_REWRITE_ANNOTATION = "notebooks.kubeflow.org/http-rewrite-uri"


def get_form_value(body, defaults, body_field, defaults_field=None):
    """
    Get the value to set by respecting the readOnly configuration for
    the field.
    If the field does not exist in the configuration then just use the form
    value.
    """
    if defaults_field is None:
        defaults_field = body_field

    user_value = body.get(body_field, None)
    if defaults_field not in defaults:
        return user_value

    readonly = defaults[defaults_field].get("readOnly", False)
    default_value = defaults[defaults_field]["value"]

    if readonly:
        if body_field in body:
            raise BadRequest(
                "'%s' is readonly but a value was provided: %s"
                % (body_field, user_value),
            )

        log.info("Using default value for '%s': %s", body_field, default_value)
        return default_value

    # field is not readonly
    if user_value is None:
        raise BadRequest("No value provided for: %s" % body_field)

    log.info("Using provided value for '%s': %s", body_field, user_value)
    return user_value


# Volume handling functions
def is_config_volume(vol):
    if "name" not in vol:
        return False

    if not isinstance(vol["name"], dict):
        return False

    return True


def volume_from_config(config_vol, notebook):
    """
    Create a Volume Dict from the config.yaml. This dict has the same fields as
    a Volume returned from the frontend
    """
    vol_name = config_vol["name"]["value"].replace(
        "{notebook-name}", notebook["name"]
    )
    vol_class = utils.get_storage_class(config_vol["class"]["value"])

    return {
        "name": vol_name,
        "type": config_vol["type"]["value"],
        "size": config_vol["size"]["value"],
        "mode": config_vol["accessModes"]["value"],
        "path": config_vol["mountPath"]["value"],
        "class": vol_class,
        "extraFields": config_vol.get("extra", {}),
    }


def get_workspace_vol(body, defaults):
    """
    Checks the config and the form values and returns a Volume Dict for the
    workspace.
    """
    if body.get("noWorkspace", False):
        log.info("Requested to NOT use persistent storage for home dir")
        return {}

    workspace_vol = get_form_value(
        body, defaults, "workspace", "workspaceVolume"
    )

    # check if it is a value from the config
    if is_config_volume(workspace_vol):
        workspace_vol = volume_from_config(workspace_vol, body)

    return workspace_vol


def get_data_vols(body, defaults):
    """
    Checks the config and the form values and returns a list of Volume
    Dictionaries for the Notebook's Data Volumes.
    """
    vols = get_form_value(body, defaults, "datavols", "dataVolumes")
    data_vols = []

    for vol in vols:
        if is_config_volume(vol):
            vol = volume_from_config(vol, body)

        data_vols.append(vol)

    return data_vols


# Notebook YAML processing
def set_notebook_image(notebook, body, defaults):
    """
    If the image is set to readOnly, use only the value from the config
    """
    image_body_field = "image"
    is_custom_image = body.get("customImage", False)
    if is_custom_image:
        image_body_field = "customImage"

    image = get_form_value(body, defaults, image_body_field, "image")
    notebook["spec"]["template"]["spec"]["containers"][0]["image"] = image


def set_notebook_image_pull_policy(notebook, body, defaults):
    container = notebook["spec"]["template"]["spec"]["containers"][0]

    container["imagePullPolicy"] = get_form_value(
        body, defaults, "imagePullPolicy"
    )


def set_server_type(notebook, body, defaults):
    valid_server_types = ["jupyter", "group-one", "group-two"]
    notebook_annotations = notebook["metadata"]["annotations"]
    server_type = get_form_value(body, defaults, "serverType")
    if server_type == "":
        server_type == "jupyter"
    if server_type not in valid_server_types:
        raise BadRequest("'%s' is not a valid server type" % server_type)

    nb_name = get_form_value(body, defaults, "name")
    nb_ns = get_form_value(body, defaults, "namespace")
    rstudio_header = '{"X-RStudio-Root-Path":"/notebook/%s/%s/"}' % (nb_ns,
                                                                     nb_name)
    notebook_annotations[SERVER_TYPE_ANNOTATION] = server_type
    if server_type == "group-one" or server_type == "group-two":
        notebook_annotations[URI_REWRITE_ANNOTATION] = "/"
    if server_type == "group-two":
        notebook_annotations[HEADERS_ANNOTATION] = rstudio_header


def set_notebook_cpu(notebook, body, defaults):
    container = notebook["spec"]["template"]["spec"]["containers"][0]

    cpu = get_form_value(body, defaults, "cpu")
    cpu_limit = get_form_value(body, defaults, "cpuLimit")

    limit_factor = utils.load_spawner_ui_config()["cpu"].get("limitFactor")
    if not cpu_limit and limit_factor != "none":
        cpu_limit = str(round((float(cpu) * float(limit_factor)), 1))

    container["resources"]["requests"]["cpu"] = cpu

    if cpu_limit is None or cpu_limit == "":
        # user explicitly asked for no limits
        return

    if float(cpu_limit) < float(cpu):
        raise BadRequest("CPU limit must be greater than the request")

    limits = container["resources"].get("limits", {})
    limits["cpu"] = cpu_limit
    container["resources"]["limits"] = limits


def set_notebook_memory(notebook, body, defaults):
    container = notebook["spec"]["template"]["spec"]["containers"][0]

    memory = get_form_value(body, defaults, "memory")
    memory_limit = get_form_value(body, defaults, "memoryLimit")

    limit_factor = utils.load_spawner_ui_config()["memory"].get("limitFactor")
    if not memory_limit and limit_factor != "none":
        memory_limit = str(
            round((
                float(memory.replace('Gi', '')) * float(
                    limit_factor)), 1)) + "Gi"

    container["resources"]["requests"]["memory"] = memory

    if memory_limit is None or memory_limit == "":
        # user explicitly asked for no limits
        return

    if float(memory_limit.replace('Gi', '')) < float(
            memory.replace('Gi', '')):
        raise BadRequest("Memory limit must be greater than the request")

    limits = container["resources"].get("limits", {})
    limits["memory"] = memory_limit
    container["resources"]["limits"] = limits


def set_notebook_tolerations(notebook, body, defaults):
    tolerations_group_key = get_form_value(body, defaults, "tolerationGroup")

    if tolerations_group_key == "none":
        return

    notebook_tolerations = notebook["spec"]["template"]["spec"]["tolerations"]
    config = utils.load_spawner_ui_config()
    toleration_groups = config.get("tolerationGroup", {}).get("options", [])

    for group in toleration_groups:
        if group["groupKey"] != tolerations_group_key:
            continue

        log.info("Appending Notebook tolerations: %s", group["tolerations"])
        notebook_tolerations.extend(group["tolerations"])
        return

    log.warning(
        "Didn't find any Toleration Group with key '%s' in the config",
        tolerations_group_key,
    )


def set_notebook_affinity(notebook, body, defaults):
    affinity_config_key = get_form_value(body, defaults, "affinityConfig")

    if affinity_config_key == "none":
        return

    notebook_spec = notebook["spec"]["template"]["spec"]
    config = utils.load_spawner_ui_config()
    affinity_configs = config.get("affinityConfig", {}).get("options", [])

    for affinity_config in affinity_configs:
        if affinity_config["configKey"] != affinity_config_key:
            continue

        log.info("Setting Notebook affinity: %s", affinity_config["affinity"])
        notebook_spec["affinity"] = affinity_config["affinity"]
        return

    log.warning(
        "Didn't find any Affinity Config with key '%s' in the config",
        affinity_config_key,
    )


def set_notebook_gpus(notebook, body, defaults):
    gpus = get_form_value(body, defaults, "gpus")

    # Make sure the GPUs value is properly formatted
    if "num" not in gpus:
        raise BadRequest("'gpus' must have a 'num' field")

    if gpus["num"] == "none":
        return

    if "vendor" not in gpus:
        raise BadRequest("'gpus' must have a 'vendor' field")

    # set the gpus annotation
    container = notebook["spec"]["template"]["spec"]["containers"][0]
    vendor = gpus["vendor"]
    try:
        num = int(gpus["num"])
    except ValueError:
        raise BadRequest("gpus.num is not a valid number: %s" % gpus["num"])

    limits = container["resources"].get("limits", {})
    limits[vendor] = num

    container["resources"]["limits"] = limits


def set_notebook_configurations(notebook, body, defaults):
    notebook_labels = notebook["metadata"]["labels"]
    labels = get_form_value(body, defaults, "configurations")

    if not isinstance(labels, list):
        raise BadRequest("Labels for PodDefaults are not list: %s" % labels)

    for label in labels:
        notebook_labels[label] = "true"


def set_notebook_shm(notebook, body, defaults):
    shm = get_form_value(body, defaults, "shm")
    if not shm:
        return

    notebook_spec = notebook["spec"]["template"]["spec"]
    notebook_cont = notebook["spec"]["template"]["spec"]["containers"][0]

    shm_volume = {"name": "dshm", "emptyDir": {"medium": "Memory"}}
    notebook_spec["volumes"].append(shm_volume)

    shm_mnt = {"mountPath": "/dev/shm", "name": "dshm"}
    notebook_cont["volumeMounts"].append(shm_mnt)


def set_notebook_environment(notebook, body, defaults):
    env = get_form_value(body, defaults, "environment")

    # FIXME: Validate the environment?
    env = json.loads(env) if env else {}

    env = [{"name": name, "value": str(value)} for name, value in env.items()]
    notebook["spec"]["template"]["spec"]["containers"][0]["env"] += env


# Volume add functions
def add_notebook_volume(notebook, vol_name, claim, mnt_path):
    spec = notebook["spec"]["template"]["spec"]
    container = notebook["spec"]["template"]["spec"]["containers"][0]

    volume = {"name": vol_name, "persistentVolumeClaim": {"claimName": claim}}
    spec["volumes"].append(volume)

    # Container Mounts
    mnt = {"mountPath": mnt_path, "name": vol_name}
    container["volumeMounts"].append(mnt)
