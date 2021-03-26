# This file is only intended for development purposes
from kubeflow.kubeflow.ci import base_runner

base_runner.main(component_name="notebook_servers.notebook_server_base_tests",
                 workflow_name="nb-base-tests")
