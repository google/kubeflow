""""Argo Workflow for building notebook-server-tensorflow-full OCI images using Kaniko"""
from kubeflow.kubeflow.cd import config, kaniko_builder


def create_workflow(name=None, namespace=None, bucket=None, **kwargs):
    """
    Args:
        name: Name to give to the workflow. This can also be used to name
              things associated with the workflow.
    """
    builder = kaniko_builder.Builder(name=name, namespace=namespace, bucket=bucket, **kwargs)

    return builder.build(dockerfile="components/example-notebook-servers/jupyter-tensorflow-full/cpu.Dockerfile",
                         context="components/example-notebook-servers/jupyter-tensorflow-full/",
                         destination=config.NOTEBOOK_SERVER_JUPYTER_TENSORFLOW_FULL,
                         second_dockerfile="components/example-notebook-servers/jupyter-tensorflow-full/cuda.Dockerfile",
                         second_destination=config.NOTEBOOK_SERVER_JUPYTER_TENSORFLOW_CUDA_FULL,
                         mem_override="8Gi",
                         deadline_override=6000)
