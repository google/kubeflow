""""Argo Workflow for building the notebook-server-jupyter-pytorch OCI images using Kaniko"""
from kubeflow.kubeflow.cd import config, kaniko_builder


def create_workflow(name=None, namespace=None, bucket=None, **kwargs):
    """
    Args:
        name: Name to give to the workflow. This can also be used to name
              things associated with the workflow.
    """
    builder = kaniko_builder.Builder(name=name, namespace=namespace, bucket=bucket, **kwargs)

    return builder.build(dockerfile="components/example-notebook-servers/jupyter-pytorch/cpu.Dockerfile",
                         context="components/example-notebook-servers/jupyter-pytorch/",
                         destination=config.NOTEBOOK_SERVER_JUPYTER_PYTORCH,
                         second_dockerfile="components/example-notebook-servers/jupyter-pytorch/cuda.Dockerfile",
                         second_destination=config.NOTEBOOK_SERVER_JUPYTER_PYTORCH_CUDA)
