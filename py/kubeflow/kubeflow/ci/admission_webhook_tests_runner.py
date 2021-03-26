# This file is only intended for development purposes
from kubeflow.kubeflow.ci import base_runner

base_runner.main(component_name="admission_webhook_tests",
                 workflow_name="adm-wh-tests")
