# This file is only intended for development purposes

# change this env var based on where kubeflow/testing repo lives
# in your local machine
KUBEFLOW_TESTING_REPO ?= /tmp/kubeflow/testing
KUBEFLOW_KUBEFLOW_REPO ?= /tmp/kubeflow/kubeflow
PYTHONPATH ?= "${KUBEFLOW_KUBEFLOW_REPO}/py:${KUBEFLOW_TESTING_REPO}/py"

check-local-jwa-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python jwa_runner.py

check-prod-jwa-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python jwa_runner.py

check-local-access-management-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python access_management_runner.py

check-prod-access-management-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python access_management_runner.py

check-local-admission-webhook-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python admission_webhook_runner.py

check-prod-admission-webhook-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python admission_webhook_runner.py

check-local-central-dashboard-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python central_dashboard_runner.py

check-prod-central-dashboard-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python central_dashboard_runner.py

check-local-twa-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python twa_runner.py

check-prod-twa-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python twa_runner.py

check-local-notebook-controller-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_controller_runner.py

check-prod-notebook-controller-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python notebook_controller_runner.py

check-local-profile-controller-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python profile_controller_runner.py

check-prod-profile-controller-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python profile_controller_runner.py

check-local-tensorboard-controller-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python tensorboard_controller_runner.py

check-prod-tensorboard-controller-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python tensorboard_controller_runner.py

check-local-vwa-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python vwa_runner.py

check-prod-vwa-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python vwa_runner.py

check-local-nb-base-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_base_runner.py

check-prod-nb-base-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_base_runner.py

check-local-nb-jupyter-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_jupyter_runner.py

check-prod-nb-jupyter-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_jupyter_runner.py

check-local-nb-rstudio-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_rstudio_runner.py

check-prod-nb-rstudio-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_rstudio_runner.py

check-local-nb-codeserver-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_codeserver_runner.py

check-prod-nb-codeserver-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_codeserver_runner.py

check-local-nb-jupyter-pytorch-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_jupyter_pytorch_runner.py

check-prod-nb-jupyter-pytorch-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_jupyter_pytorch_runner.py

check-local-nb-jupyter-tensorflow-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_jupyter_tensorflow_runner.py

check-prod-nb-jupyter-tensorflow-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_jupyter_tensorflow_runner.py

check-local-nb-jupyter-pytorch-full-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_jupyter_pytorch_full_runner.py

check-prod-nb-jupyter-pytorch-full-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_jupyter_pytorch_full_runner.py

check-local-nb-jupyter-tensorflow-full-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_jupyter_tensorflow_full_runner.py

check-prod-nb-jupyter-tensorflow-full-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_jupyter_tensorflow_full_runner.py

check-local-nb-jupyter-scipy-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_jupyter_scipy_runner.py

check-prod-nb-jupyter-scipy-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_jupyter_scipy_runner.py

check-local-nb-codeserver-python-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_codeserver_python_runner.py

check-prod-nb-codeserver-python-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_codeserver_python_runner.py

check-local-nb-rstudio-tidyverse-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_rstudio_tidyverse_runner.py

check-prod-nb-rstudio-tidyverse-kaniko-build:
	@PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_rstudio_tidyverse_runner.py

