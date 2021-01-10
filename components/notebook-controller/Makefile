# Image URL to use all building/pushing image targets
IMG ?= gcr.io/kubeflow-images-public/notebook-controller
TAG ?= $(eval TAG := $(shell date +v%Y%m%d)-$(shell git describe --tags --always --dirty)-$(shell git diff | shasum -a256 | cut -c -6))$(TAG)
GOLANG_VERSION ?= 1.11.2
SHELL := /bin/bash
# Produce CRDs that work back to Kubernetes 1.11 (no version conversion)
CRD_OPTIONS ?= "crd"

# Based on recommendation https://sdk.operatorframework.io/docs/building-operators/golang/references/envtest-setup/
ENVTEST_ASSETS_DIR=$(shell pwd)/testbin

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

all: manager

# check license
check-license:
	./third_party/check-license.sh

# Run tests
test: generate fmt vet manifests
	mkdir -p ${ENVTEST_ASSETS_DIR}
	test -f ${ENVTEST_ASSETS_DIR}/setup-envtest.sh || curl -sSLo ${ENVTEST_ASSETS_DIR}/setup-envtest.sh https://raw.githubusercontent.com/kubernetes-sigs/controller-runtime/a9bd9117a77a2f84bbc546e28991136fe0000dc0/hack/setup-envtest.sh
	source ${ENVTEST_ASSETS_DIR}/setup-envtest.sh; fetch_envtest_tools $(ENVTEST_ASSETS_DIR); setup_envtest_env $(ENVTEST_ASSETS_DIR);
	go test ./api/... ./controllers/... -coverprofile cover.out

# Build manager binary
manager: generate fmt vet
	go build -o bin/manager main.go

# Uninstall CRDs from a cluster
uninstall: manifests
	kustomize build config/crd | kubectl delete -f -

# Run against the configured Kubernetes cluster in ~/.kube/config
run: generate fmt vet
	go run ./main.go

# Install CRDs into a cluster
install: manifests
	kubectl apply -f config/crd/bases

# Deploy controller in the configured Kubernetes cluster in ~/.kube/config
deploy: manifests
	kubectl apply -f config/crd/bases
	kustomize build config/default | kubectl apply -f -

# Generate manifests e.g. CRD, RBAC etc.
manifests: controller-gen
	$(CONTROLLER_GEN) $(CRD_OPTIONS) rbac:roleName=manager-role webhook paths="./..." output:crd:artifacts:config=config/crd/bases

# Run go fmt against code
fmt:
	go fmt ./...

# Run go vet against code
vet:
	go vet ./...

# Generate code
generate: controller-gen
	$(CONTROLLER_GEN) object:headerFile=./hack/boilerplate.go.txt paths=./api/...

# Build the docker image
docker-build: test
	cd .. && docker build . -t ${IMG}:${TAG} -f ./notebook-controller/Dockerfile
	@echo "updating kustomize image patch file for manager resource"
	sed -i'' -e 's@image: .*@image: '"${IMG}"'@' ./config/default/manager_image_patch.yaml


# Push the docker image
docker-push:
	docker push ${IMG}

# find or download controller-gen
# download controller-gen if necessary
controller-gen:
ifeq (, $(shell which controller-gen))
	go get sigs.k8s.io/controller-tools/cmd/controller-gen@v0.2.0
CONTROLLER_GEN=$(GOBIN)/controller-gen
else
CONTROLLER_GEN=$(shell which controller-gen)
endif

# TODO(jlewi): Can we get rid of this and just use skaffold?
build-gcr: test
	docker build -t $(IMG):$(TAG) .
	@echo Built $(IMG):$(TAG)

push-gcr: build-gcr
	docker push $(IMG):$(TAG)
	@echo Pushed $(IMG):$(TAG)

k3d:
ifeq (, $(shell which k3d))
	curl -sS https://raw.githubusercontent.com/rancher/k3d/1030f0fa47b65d78eb9ffbdf94f0623a08d19b97/install.sh  | TAG=v3.2.0 bash
endif

# Functional test using existing k8s cluster
e2e-tests-existing-cluster: k3d docker-build manifests
		# Assumes that the notebook controller image is loaded into the k8s cluster.
		# The tests doesn't load the image into the cluster.
		@echo "Testing notebook controller with the existing k8s cluster"
		 TEST_USE_EXISTING_CLUSTER=true  ginkgo --focus="E2E TEST:" -v  ./e2e/...

# Functional test using k3d cluster.
e2e-tests-k3d: k3d docker-build manifests
		@echo "Testing k3d 1.16"
		TEST_K3D_DOCKER_IMAGE=docker.io/rancher/k3s:v1.16.14-k3s1 TEST_USE_EXISTING_CLUSTER=false TEST_IMAGE=$(IMG):$(TAG) ginkgo --focus="E2E TEST:" -v  ./e2e/...
		@echo "Testing k3d 1.17"
		TEST_K3D_DOCKER_IMAGE=docker.io/rancher/k3s:v1.17.14-k3s2 TEST_USE_EXISTING_CLUSTER=false TEST_IMAGE=$(IMG):$(TAG) ginkgo --focus="E2E TEST:" -v  ./e2e/...
		@echo "Testing k3d 1.18"
		TEST_K3D_DOCKER_IMAGE=docker.io/rancher/k3s:v1.18.12-k3s1 TEST_USE_EXISTING_CLUSTER=false TEST_IMAGE=$(IMG):$(TAG) ginkgo --focus="E2E TEST:" -v  ./e2e/...

