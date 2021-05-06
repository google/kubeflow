from kubernetes import client

from .. import authz
from . import custom_api, v1_core


def get_volumesnapshot(volumesnapshot, namespace):
    authz.ensure_authorized(
        "get", "snapshot.storage.k8s.io", "v1beta1",
        "volumesnapshots", namespace
    )
    return custom_api.get_namespaced_custom_object(
        "snapshot.storage.k8s.io", "v1beta1",
        namespace, "volumesnapshots", volumesnapshot
    )


def create_volumesnapshot(volumesnapshot, namespace):
    authz.ensure_authorized(
        "create", "snapshot.storage.k8s.io", "v1beta1",
        "volumesnapshots", namespace
    )
    return custom_api.create_namespaced_custom_object(
        "snapshot.storage.k8s.io", "v1beta1",
        namespace, "volumesnapshots", volumesnapshot
    )


def list_volumesnapshots(namespace):
    authz.ensure_authorized(
        "list", "snapshot.storage.k8s.io", "v1beta1",
        "volumesnapshots", namespace
    )
    return custom_api.list_namespaced_custom_object(
        "snapshot.storage.k8s.io", "v1beta1",
        namespace, "volumesnapshots"
    )


def delete_volumesnapshot(volumesnapshot, namespace):
    authz.ensure_authorized(
        "delete", "snapshot.storage.k8s.io", "v1beta1",
        "volumesnapshots", namespace
    )
    return custom_api.delete_namespaced_custom_object(
        "snapshot.storage.k8s.io",
        "v1beta1",
        namespace,
        "volumesnapshots",
        volumesnapshot,
        client.V1DeleteOptions(propagation_policy="Foreground"),
    )


def list_volumesnapshot_events(volumesnapshot, namespace):
    selector = "involvedObject.kind=VolumeSnapshot,involvedObject.name="
    + volumesnapshot

    return v1_core.list_namespaced_event(
        namespace=namespace, field_selector=selector
    )
