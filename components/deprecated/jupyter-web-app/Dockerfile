# Stage 0: UI Build Stage
FROM node:10 as build-stage

WORKDIR /app

COPY ./frontend/package*.json /app/
RUN npm install

COPY ./frontend/ /app/

# Download the source code for all third party libraries.
RUN npm install
# Build the default and rok frontends
RUN npm run build frontend -- --output-path=./dist/out/default --configuration=production
RUN npm run build frontend -- --output-path=./dist/out/rok --configuration=rok-prod

# Stage 2: Backend code and UI serving
FROM ubuntu:18.04

RUN apt-get update -y && \
    apt-get install -y apt-utils  build-essential curl wget\
	python-dev python3-pip \
    libssl-dev libffi-dev python3-bcrypt

# We copy just the requirements.txt first to leverage Docker cache
COPY ./backend/requirements.txt /app/requirements.txt

RUN pip3 install -r /app/requirements.txt

# Backend code
COPY ./backend/kubeflow_jupyter /app/kubeflow_jupyter
COPY ./backend/main.py /app/main.py
# Copy backend third party library licenses and source code if need.
COPY ./backend/third_party /app/third_party/backend
RUN wget https://github.com/certifi/python-certifi -O /app/third_party/backend/python-certifi

# Frontend code
COPY --from=build-stage /app/dist/out/default /app/kubeflow_jupyter/default/static/
COPY --from=build-stage /app/dist/out/rok /app/kubeflow_jupyter/rok/static/
# Copy frontend third party library licenses and source code.
COPY ./frontend/third_party /app/third_party/frontend
COPY --from=build-stage /app/node_modules /app/third_party/frontend/node_modules

WORKDIR /app/

ENTRYPOINT ["python3"]
CMD ["main.py"]
