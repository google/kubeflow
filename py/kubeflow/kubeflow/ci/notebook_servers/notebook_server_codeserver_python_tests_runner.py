# This file is only intended for development purposes
from kubeflow.kubeflow.ci import base_runner

base_runner.main(component_name="notebook_servers.notebook_server_codeserver_python_tests",
                 workflow_name="nb-codeserver-python-tests")
