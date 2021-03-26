AWS_REGISTRY = "public.ecr.aws/j1r0q0g6/notebooks"

# list of public images
JUPYTER_WEB_APP_IMAGE = "%s/jupyter-web-app" % AWS_REGISTRY
TENSORBOARDS_WEB_APP_IMAGE = "%s/tensorboards-web-app" % AWS_REGISTRY
VOLUMES_WEB_APP_IMAGE = "%s/volumes-web-app" % AWS_REGISTRY
CENTRAL_DASHBOARD_IMAGE = "%s/central-dashboard" % AWS_REGISTRY

ADMISSION_WEBHOOK_IMAGE = "%s/admission-webhook" % AWS_REGISTRY
ACCESS_MANAGEMENT_IMAGE = "%s/access-management" % AWS_REGISTRY

PROFILE_CONTROLLER_IMAGE = "%s/profile-controller" % AWS_REGISTRY
NOTEBOOK_CONTROLLER_IMAGE = "%s/notebook-controller" % AWS_REGISTRY
TENSORBOARD_CONTROLLER_IMAGE = "%s/tensorboard-controller" % AWS_REGISTRY

NOTEBOOK_SERVER_BASE = "%s/notebook-servers/base" % AWS_REGISTRY
NOTEBOOK_SERVER_JUPYTER = "%s/notebook-servers/jupyter" % AWS_REGISTRY
NOTEBOOK_SERVER_RSTUDIO = "%s/notebook-servers/rstudio" % AWS_REGISTRY
NOTEBOOK_SERVER_CODESERVER = "%s/notebook-servers/codeserver" % AWS_REGISTRY
NOTEBOOK_SERVER_JUPYTER_PYTORCH = "%s/notebook-servers/jupyter-pytorch" % AWS_REGISTRY
NOTEBOOK_SERVER_JUPYTER_PYTORCH_CUDA = "%s/notebook-servers/jupyter-pytorch-cuda" % AWS_REGISTRY
NOTEBOOK_SERVER_JUPYTER_TENSORFLOW = "%s/notebook-servers/jupyter-tensorflow" % AWS_REGISTRY
NOTEBOOK_SERVER_JUPYTER_TENSORFLOW_CUDA = "%s/notebook-servers/jupyter-tensorflow-cuda" % AWS_REGISTRY
NOTEBOOK_SERVER_JUPYTER_PYTORCH_FULL = "%s/notebook-servers/jupyter-pytorch-full" % AWS_REGISTRY
NOTEBOOK_SERVER_JUPYTER_PYTORCH_CUDA_FULL = "%s/notebook-servers/jupyter-pytorch-cuda-full" % AWS_REGISTRY
NOTEBOOK_SERVER_JUPYTER_TENSORFLOW_FULL = "%s/notebook-servers/jupyter-tensorflow-full" % AWS_REGISTRY
NOTEBOOK_SERVER_JUPYTER_TENSORFLOW_CUDA_FULL = "%s/notebook-servers/jupyter-tensorflow-cuda-full" % AWS_REGISTRY
NOTEBOOK_SERVER_JUPYTER_SCIPY = "%s/notebook-servers/jupyter-scipy" % AWS_REGISTRY
NOTEBOOK_SERVER_CODESERVER_PYTHON = "%s/notebook-servers/codeserver-python" % AWS_REGISTRY
NOTEBOOK_SERVER_RSTUDIO_TIDYVERSE = "%s/notebook-servers/rstudio-tidyverse" % AWS_REGISTRY
NOTEBOOK_SERVER_JUPYTER_PYSPARK = "%s/notebook-servers/jupyter-pyspark" % AWS_REGISTRY
