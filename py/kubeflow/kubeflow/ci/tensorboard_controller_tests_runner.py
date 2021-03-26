# This file is only intended for development purposes
from kubeflow.kubeflow.ci import base_runner

base_runner.main(component_name="tensorboard_controller_tests",
                 workflow_name="tb-c-test")
