# This file is only intended for development purposes
from kubeflow.kubeflow.cd import base_runner

base_runner.main(component_name="notebook_servers.notebook_server_jupyter_tensorflow_full",
                 workflow_name="nb-j-tf-f-build")
