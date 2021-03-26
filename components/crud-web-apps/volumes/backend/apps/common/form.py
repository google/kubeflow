from kubernetes import client


def handle_storage_class(vol):
    """
    vol: dict (send from the frontend)

    If the fronend sent the special values `{none}` or `{empty}` then the
    backend will need to set the corresponding storage_class value that the
    python client expects.
    """
    if "class" not in vol:
        return None
    if vol["class"] == "{none}":
        return ""
    if vol["class"] == "{empty}":
        return None
    else:
        return vol["class"]


def pvc_from_dict(body, namespace):
    """
    body: json object (frontend json data)

    Convert the PVC json object that is sent from the backend to a python
    client PVC instance.
    """
    return client.V1PersistentVolumeClaim(
        metadata=client.V1ObjectMeta(name=body["name"], namespace=namespace),
        spec=client.V1PersistentVolumeClaimSpec(
            access_modes=[body["mode"]],
            storage_class_name=handle_storage_class(body),
            resources=client.V1ResourceRequirements(
                requests={"storage": body["size"]}
            ),
        ),
    )
