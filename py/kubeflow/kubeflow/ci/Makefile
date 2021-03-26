# This file is only intended for development purposes

# change this env var based on where kubeflow/testing repo lives
# in your local machine
KUBEFLOW_TESTING_REPO ?= /tmp/kubeflow/testing
KUBEFLOW_KUBEFLOW_REPO ?= /tmp/kubeflow/kubeflow
PYTHONPATH ?= "${KUBEFLOW_KUBEFLOW_REPO}/py:${KUBEFLOW_TESTING_REPO}/py"

check-local-common-ui-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python common_ui_tests_runner.py

check-prod-common-ui-tests:
	PYTHONPATH=${PYTHONPATH} \
	python common_ui_tests_runner.py

check-local-access-management-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python access_management_tests_runner.py

check-prod-access-management-tests:
	PYTHONPATH=${PYTHONPATH} \
	python access_management_tests_runner.py

check-local-admission-webhook-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python admission_webhook_tests_runner.py

check-prod-admission-webhook-tests:
	PYTHONPATH=${PYTHONPATH} \
	python admission_webhook_tests_runner.py

check-local-central-dashboard-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python central_dashboard_tests_runner.py

check-prod-central-dashboard-tests:
	PYTHONPATH=${PYTHONPATH} \
	python central_dashboard_tests_runner.py

check-local-jwa-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python jwa_tests_runner.py

check-prod-jwa-tests:
	PYTHONPATH=${PYTHONPATH} \
	python jwa_tests_runner.py

check-local-notebook-controller-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_controller_tests_runner.py

check-prod-notebook-controller-tests:
	PYTHONPATH=${PYTHONPATH} \
	python notebook_controller_tests_runner.py

check-local-profile-controller-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python profile_controller_tests_runner.py

check-prod-profile-controller-tests:
	PYTHONPATH=${PYTHONPATH} \
	python profile_controller_tests_runner.py

check-local-tensorboard-controller-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python tensorboard_controller_tests_runner.py

check-prod-tensorboard-controller-tests:
	PYTHONPATH=${PYTHONPATH} \
	python tensorboard_controller_tests_runner.py

check-local-twa-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python twa_tests_runner.py

check-prod-twa-tests:
	PYTHONPATH=${PYTHONPATH} \
	python twa_tests_runner.py

check-local-vwa-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python vwa_tests_runner.py

check-prod-vwa-tests:
	PYTHONPATH=${PYTHONPATH} \
	python vwa_tests_runner.py

check-local-notebook-server-base-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_base_tests_runner.py

check-prod-notebook-server-base-tests:
	PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_base_tests_runner.py

check-local-notebook-server-jupyter-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_jupyter_tests_runner.py

check-prod-notebook-server-jupyter-tests:
	PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_jupyter_tests_runner.py

check-local-notebook-server-rstudio-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_rstudio_tests_runner.py

check-prod-notebook-server-rstudio-tests:
	PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_rstudio_tests_runner.py

check-local-notebook-server-codeserver-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_codeserver_tests_runner.py

check-prod-notebook-server-codeserver-tests:
	PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_codeserver_tests_runner.py

check-local-notebook-server-jupyter-pytorch-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_jupyter_pytorch_tests_runner.py

check-prod-notebook-server-jupyter-pytorch-tests:
	PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_jupyter_pytorch_tests_runner.py

check-local-notebook-server-jupyter-tensorflow-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_jupyter_tensorflow_tests_runner.py

check-prod-notebook-server-jupyter-tensorflow-tests:
	PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_jupyter_tensorflow_tests_runner.py

check-local-notebook-server-jupyter-pytorch-full-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_jupyter_pytorch_full_tests_runner.py

check-prod-notebook-server-jupyter-pytorch-full-tests:
	PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_jupyter_pytorch_full_tests_runner.py

check-local-notebook-server-jupyter-tensorflow-full-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_jupyter_tensorflow_full_tests_runner.py

check-prod-notebook-server-jupyter-tensorflow-full-tests:
	PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_jupyter_tensorflow_full_tests_runner.py

check-local-notebook-server-jupyter-scipy-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_jupyter_scipy_tests_runner.py

check-prod-notebook-server-jupyter-scipy-tests:
	PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_jupyter_scipy_tests_runner.py

check-local-notebook-server-codeserver-python-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_codeserver_python_tests_runner.py

check-prod-notebook-server-codeserver-python-tests:
	PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_codeserver_python_tests_runner.py

check-local-notebook-server-rstudio-tidyverse-tests:
	PYTHONPATH=${PYTHONPATH} \
	LOCAL_TESTING=True \
	python notebook_servers/notebook_server_rstudio_tidyverse_tests_runner.py

check-prod-notebook-server-rstudio-tidyverse-tests:
	PYTHONPATH=${PYTHONPATH} \
	python notebook_servers/notebook_server_rstudio_tests_tidyverse_runner.py

