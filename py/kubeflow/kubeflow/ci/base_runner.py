import os
import yaml
from importlib import import_module

def main(component_name, workflow_name):
    component = import_module("kubeflow.kubeflow.ci.%s" % component_name)
    
    WORKFLOW_NAME = os.getenv("WORKFLOW_NAME", workflow_name)
    WORKFLOW_NAMESPACE = os.getenv("WORKFLOW_NAMESPACE", "kubeflow-user")
    print(yaml.dump(component.create_workflow(WORKFLOW_NAME, WORKFLOW_NAMESPACE)))

if __name__ == "__main__":
    main(component, workflow_name)
