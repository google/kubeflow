IMG ?= public.ecr.aws/j1r0q0g6/notebooks/volumes-web-app
TAG ?= $(shell git describe --tags --always)
DOCKERFILE ?= volumes/Dockerfile

docker-build:
	cd ../ && docker build -t ${IMG}:${TAG} -f ${DOCKERFILE} .


docker-push:
	docker push $(IMG):$(TAG)

image: docker-build docker-push
	@echo "Updated image ${IMG}"
