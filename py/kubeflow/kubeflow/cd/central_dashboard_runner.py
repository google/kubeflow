# This file is only intended for development purposes
from kubeflow.kubeflow.cd import base_runner

base_runner.main(component_name="central_dashboard",
                 workflow_name="cdash-build")
