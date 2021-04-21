GIT_TAG ?= $(shell git describe --tags --always)
IMG ?= public.ecr.aws/j1r0q0g6/notebooks/jupyter-web-app
DOCKERFILE ?= jupyter/Dockerfile

docker-build:
	cd ../ && docker build -t ${IMG}:${GIT_TAG} -f ${DOCKERFILE} .

docker-push:
	docker push $(IMG):$(GIT_TAG)

image: docker-build docker-push
