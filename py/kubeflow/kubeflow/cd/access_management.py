""""Argo Workflow for building Access Management's OCI image using Kaniko"""
from kubeflow.kubeflow import ci
from kubeflow.kubeflow.cd import config
from kubeflow.testing import argo_build_util


class Builder(ci.workflow_utils.ArgoTestBuilder):
    def __init__(self, name=None, namespace=None, bucket=None,
                 test_target_name=None, **kwargs):
        super().__init__(name=name, namespace=namespace, bucket=bucket,
                         test_target_name=test_target_name, **kwargs)

    def build(self):
        """Build the Argo workflow graph"""
        workflow = self.build_init_workflow(exit_dag=False)
        task_template = self.build_task_template()

        # Build Access Management using Kaniko
        dockerfile = ("%s/components/access-management"
                      "/Dockerfile") % self.src_dir
        context = "dir://%s/components/access-management/" % self.src_dir
        destination = config.ACCESS_MANAGEMENT_IMAGE

        kaniko_task = self.create_kaniko_task(task_template, dockerfile,
                                              context, destination)
        argo_build_util.add_task_to_dag(workflow,
                                        ci.workflow_utils.E2E_DAG_NAME,
                                        kaniko_task, [self.mkdir_task_name])

        # Set the labels on all templates
        workflow = argo_build_util.set_task_template_labels(workflow)

        return workflow


def create_workflow(name=None, namespace=None, bucket=None, **kwargs):
    """
    Args:
        name: Name to give to the workflow. This can also be used to name
              things associated with the workflow.
    """
    builder = Builder(name=name, namespace=namespace, bucket=bucket, **kwargs)

    return builder.build()
