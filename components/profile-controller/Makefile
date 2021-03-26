PROJECT ?= kubeflow-dev
# Image URL to use all building/pushing image targets
IMG ?= gcr.io/$(PROJECT)/profile-controller
TAG ?= $(eval TAG := $(shell date +v%Y%m%d)-$(shell git describe --tags --always --dirty)-$(shell git diff | shasum -a256 | cut -c -6))$(TAG)
GOLANG_VERSION ?= 1.15
CONTROLLER_GEN_VERSION ?= 0.4.0

# Get the currently used golang install path (in GOPATH/bin, unless GOBIN is set)
ifeq (,$(shell go env GOBIN))
GOBIN=$(shell go env GOPATH)/bin
else
GOBIN=$(shell go env GOBIN)
endif

all: manager

# Run tests
test: generate fmt vet
	go test ./... -coverprofile cover.out

# Build manager binary
manager: generate fmt vet
	go build -o bin/manager main.go

# Run against the configured Kubernetes cluster in ~/.kube/config
run: generate fmt vet
	go run ./main.go

# Install CRDs into a cluster
install:
	kustomize build config/crd | kubectl apply -f -

# Deploy controller in the configured Kubernetes cluster in ~/.kube/config
deploy: manifests
	cd config/manager && kustomize edit set image gcr.io/kubeflow-images-public/profile-controller=${IMG}
	kustomize build config/default | kubectl apply -f -

# Generate manifests e.g. CRD, RBAC etc.
manifests: controller-gen
	$(CONTROLLER_GEN) crd:trivialVersions=true paths="./..." output:crd:artifacts:config=config/crd/bases
	# Uncomment when we remove the permissive ClusterRoleBinding to cluster-admin
	# $(CONTROLLER_GEN) rbac:roleName=cluster-role-binding webhook paths="./..."

# Run go fmt against code
fmt:
	go fmt ./...

# Run go vet against code
vet:
	go vet ./...

# Generate code
generate: controller-gen
	$(CONTROLLER_GEN) object:headerFile=./hack/boilerplate.go.txt paths="./..."

# Build the docker image
build:
	docker build --build-arg GOLANG_VERSION=${GOLANG_VERSION} -t ${IMG}:${TAG} .
	@echo Built ${IMG}:${TAG}

build-gcb:
	gcloud --project=$(PROJECT) \
		builds submit \
		--machine-type=n1-highcpu-32 \
		--substitutions=_TAG=$(TAG),_REGISTRY=$(PROJECT) \
		--config=cloudbuild.yaml .

# Push the docker image
push: build
	docker push ${IMG}:${TAG}
	@echo Pushed ${IMG}:${TAG}

# find or download controller-gen
# download controller-gen if necessary
controller-gen:
ifeq (, $(shell which controller-gen))
	go get sigs.k8s.io/controller-tools/cmd/controller-gen@v${CONTROLLER_GEN_VERSION}
CONTROLLER_GEN=$(GOBIN)/controller-gen
else
CONTROLLER_GEN=$(shell which controller-gen)
endif
