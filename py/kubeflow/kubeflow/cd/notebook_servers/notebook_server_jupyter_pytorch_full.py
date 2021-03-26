""""Argo Workflow for building the notebook-server-jupyter-pytorch-full OCI images using Kaniko"""
from kubeflow.kubeflow.cd import config, kaniko_builder


def create_workflow(name=None, namespace=None, bucket=None, **kwargs):
    """
    Args:
        name: Name to give to the workflow. This can also be used to name
              things associated with the workflow.
    """
    builder = kaniko_builder.Builder(name=name, namespace=namespace, bucket=bucket, **kwargs)

    return builder.build(dockerfile="components/example-notebook-servers/jupyter-pytorch-full/cpu.Dockerfile",
                         context="components/example-notebook-servers/jupyter-pytorch-full/",
                         destination=config.NOTEBOOK_SERVER_JUPYTER_PYTORCH_FULL,
                         second_dockerfile="components/example-notebook-servers/jupyter-pytorch-full/cuda.Dockerfile",
                         second_destination=config.NOTEBOOK_SERVER_JUPYTER_PYTORCH_CUDA_FULL)
