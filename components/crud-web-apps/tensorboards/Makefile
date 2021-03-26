IMG ?= public.ecr.aws/j1r0q0g6/notebooks/tensorboards-web-app
TAG ?= $(shell git log -n 1 --pretty=format:"%h" ./)
DOCKERFILE=tensorboards/Dockerfile

docker-build:
	cp Dockerfile.dockerignore ../.dockerignore
	-cd ../ && docker build -t ${IMG}:${TAG} -f ${DOCKERFILE} .
	rm ../.dockerignore


docker-push:
	docker push $(IMG):$(TAG)

image: docker-build docker-push
	@echo "Updated image ${IMG}"
