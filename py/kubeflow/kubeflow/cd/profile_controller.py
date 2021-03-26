""""Argo Workflow for building Profile Controller's OCI image using Kaniko"""
from kubeflow.kubeflow.cd import config, kaniko_builder


def create_workflow(name=None, namespace=None, bucket=None, **kwargs):
    """
    Args:
        name: Name to give to the workflow. This can also be used to name
              things associated with the workflow.
    """
    builder = kaniko_builder.Builder(name=name, namespace=namespace, bucket=bucket, **kwargs)

    return builder.build(dockerfile="components/profile-controller/Dockerfile",
                         context="components/profile-controller/",
                         destination=config.PROFILE_CONTROLLER_IMAGE)
