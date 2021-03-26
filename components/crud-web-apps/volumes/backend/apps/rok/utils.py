import os

from kubeflow.kubeflow.crud_backend import helpers, status

from ..common import utils as common_utils

KIND = "PVCViewer"
GROUP = "kubeflow.org"
VERSION = "v1alpha1"
PLURAL = "pvcviewers"
PVCVIEWER = [GROUP, VERSION, PLURAL]

PVCVIEWER_YAML = os.path.join(
    os.path.abspath(os.path.dirname(__file__)), "pvcviewer.yaml"
)


def load_pvcviewer_yaml_template(**kwargs):
    """
    kwargs: the parameters to be replaced in the yaml

    Reads the yaml for the web app's custom resource, replaces the variables
    and returns it as a python dict.
    """
    return helpers.load_param_yaml(PVCVIEWER_YAML, **kwargs)


def add_pvc_rok_annotations(pvc, body):
    """Set the necessary Rok annotations"""
    annotations = pvc.metadata.annotations or {}

    if body["type"] == "rok_snapshot" and "snapshot" in body:
        annotations["rok/origin"] = body["snapshot"]

    labels = pvc.metadata.labels or {}
    labels["component"] = "singleuser-storage"

    pvc.metadata.annotations = annotations
    pvc.metadata.labels = labels


def parse_pvc(pvc, viewers):
    """
    pvc: client.V1PersistentVolumeClaim
    viewers: dict(Key:PVC Name, Value: Viewer's Status)

    Process the PVC and format it as the UI expects it. If a Viewer is active
    for that PVC, then include this information
    """
    parsed_pvc = common_utils.parse_pvc(pvc)
    parsed_pvc["viewer"] = viewers.get(pvc.metadata.name,
                                       status.STATUS_PHASE.UNINITIALIZED)

    return parsed_pvc


def get_viewer_owning_pod(pod):
    """
    Return a list of PVCViewer names that own the Pod
    """
    owner_refs = pod.metadata.owner_references
    for owner_ref in owner_refs:
        if owner_ref.kind == KIND:
            return owner_ref.name

    return None


def is_viewer_pod(pod):
    """
    Checks if the given Pod belongs to a PVCViewer
    """
    return get_viewer_owning_pod(pod) is not None


def get_viewers_owning_pods(pods):
    """
    Return the name of PVCViewers that own a subset of the given Pods
    """
    viewers = []
    for pod in pods:
        if not is_viewer_pod(pod):
            continue

        viewers.append(get_viewer_owning_pod(pod))

    return viewers
