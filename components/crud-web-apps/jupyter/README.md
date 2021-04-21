# Jupyter web app

This web app is responsible for allowing the user to manipulate the Jupyter Notebooks in their Kubeflow cluster. To achieve this it provides a user friendly way to handle the lifecycle of Notebook CRs.

## Image Groups

With the release of Kubeflow 1.3, two types have Notebook Servers have been added
alongside the familiar JupyterLab:

- Group 1
- Group 2

Some extra configurations are applied Notebook Servers belonging to these groups:

The annotation `notebooks.kubeflow.org/http-rewrite-uri: /` is added to Notebook
resources of both groups. This configures Istio to rewrite the URI to `/` on
the container. This is useful for applications which host their on `/`
and do not allow you to change the URI subpath easily.

The annotation `notebooks.kubeflow.org/http-headers-request-set:`
`'{"X-RStudio-Root-Path":"/notebook/<namespace>/<name>/"}'` is added to
Notebook resources belonging to Group 2. This configures Istio to add
this header to requests, which is necessary for images from Group 2 to work.

The Jupyter Web App displays the logos for each Notebook Server group
in a button toggle in the Spawner UI. To easily identify the group of
a running Notebook Server, the Index page contains a column that displays
the icon for each image group. The SVG logos and icons for each group are added
with a [configmap](./manifests/base/configs/logos-configmap.yaml) to make it easy for users to customize the logos and icons for their environment.

## Development

Requirements:
* node 12.0.0
* python 3.7

### Frontend

```bash
# build the common library
cd components/crud-web-apps/common/frontend/kubeflow-common-lib
npm i
npm run build
cd dist/kubeflow
npm link

# build the app frontend
cd ../../../jupyter/frontend
npm i
npm link kubeflow
npm run build:watch
```

### Backend
```bash
# create a virtual env and install deps
# https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/
cd component/crud-web-apps/jupyter/backend
python3.7 -m pip install --user virtualenv
python3.7 -m venv web-apps-dev
source web-apps-dev/bin/activate

# install the deps on the activated virtual env
make -C backend install-deps

# run the backend
make -C backend run-dev
```
