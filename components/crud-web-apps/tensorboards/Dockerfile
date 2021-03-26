# --- Build the backend kubeflow-wheel ---
FROM python:3.8-slim-buster AS backend-kubeflow-wheel

WORKDIR /src

COPY ./common/backend/ .
RUN python3 setup.py bdist_wheel

# --- Build the frontend kubeflow library ---
FROM node:12-buster-slim as frontend-kubeflow-lib

WORKDIR /src

COPY ./common/frontend/kubeflow-common-lib/package*.json ./
RUN npm install

COPY ./common/frontend/kubeflow-common-lib/ .
RUN npm run build

# --- Build the frontend ---
FROM node:12-buster-slim as frontend
RUN npm install -g @angular/cli

WORKDIR /src
COPY ./tensorboards/frontend/package*.json ./
RUN npm install
COPY --from=frontend-kubeflow-lib /src/dist/kubeflow/ ./node_modules/kubeflow/

COPY ./tensorboards/frontend/ .
# RUN ls node_modules

RUN npm run build -- --output-path=./dist --configuration=production

# Web App
FROM python:3.8-slim-buster

WORKDIR /package
COPY --from=backend-kubeflow-wheel /src .
RUN pip3 install .

WORKDIR /src
COPY ./tensorboards/backend/requirements.txt .
RUN pip3 install -r requirements.txt

COPY ./tensorboards/backend/app/ ./app
COPY ./tensorboards/backend/entrypoint.py .
COPY ./tensorboards/backend/Makefile .

COPY --from=frontend /src/dist/ /src/app/static/

ENTRYPOINT ["/bin/bash","-c","gunicorn -w 3 --bind 0.0.0.0:5000 --access-logfile - entrypoint:app"]
