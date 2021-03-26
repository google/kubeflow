# Volumes web app

This web app is responsible for allowing the user to manipulate PVCs in their Kubeflow cluster. To achieve this it provides a user friendly way to handle the lifecycle of PVC objects.

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
cd ../../../volumes/frontend
npm i
npm link kubeflow
npm run build:watch
```

### Backend
```bash
# create a virtual env and install deps
# https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/
cd component/crud-web-apps/volumes/backend
python3.7 -m pip install --user virtualenv
python3.7 -m venv web-apps-dev
source web-apps-dev/bin/activate

# install the deps on the activated virtual env
make -C backend install-deps

# run the backend
make -C backend run-dev
```
