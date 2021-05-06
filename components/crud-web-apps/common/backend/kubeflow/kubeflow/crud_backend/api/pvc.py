from .. import authz
from . import v1_core


def get_pvc(pvc, namespace):
    authz.ensure_authorized(
        "get", "", "v1", "persistentvolumeclaims", namespace
    )
    return v1_core.read_namespaced_persistent_volume_claim(pvc, namespace)


def create_pvc(pvc, namespace):
    authz.ensure_authorized(
        "create", "", "v1", "persistentvolumeclaims", namespace
    )
    return v1_core.create_namespaced_persistent_volume_claim(namespace, pvc)


def delete_pvc(pvc, namespace):
    authz.ensure_authorized(
        "delete", "", "v1", "persistentvolumeclaims", namespace
    )
    return v1_core.delete_namespaced_persistent_volume_claim(pvc, namespace)


def list_pvcs(namespace):
    authz.ensure_authorized(
        "list", "", "v1", "persistentvolumeclaims", namespace
    )
    return v1_core.list_namespaced_persistent_volume_claim(namespace)
