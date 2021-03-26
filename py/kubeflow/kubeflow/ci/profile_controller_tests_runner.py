# This file is only intended for development purposes
from kubeflow.kubeflow.ci import base_runner

base_runner.main(component_name="profile_controller_tests",
                 workflow_name="pro-c-test")
