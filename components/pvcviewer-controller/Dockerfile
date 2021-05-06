# Build the manager binary
# The Docker context is expected to be:
#
# ${PATH_TO_KUBEFLOW/KUBEFLOW repo}/components
#
# This is necessary because the Jupyter controller now depends on
# components/common
FROM golang:1.16.2 as builder

WORKDIR /workspace
# Copy the Go Modules manifests
# Copy the Go Modules manifests
COPY pvcviewer-controller /workspace/pvcviewer-controller
COPY common /workspace/common
# cache deps before building and copying source so that we don't need to re-download as much
# and so that source changes don't invalidate our downloaded layer
RUN cd /workspace/pvcviewer-controller && go mod download

WORKDIR /workspace/pvcviewer-controller

# Build
RUN if [ "$(uname -m)" = "aarch64" ]; then \
        CGO_ENABLED=0 GOOS=linux GOARCH=arm64 GO111MODULE=on go build -a -o manager main.go; \
    else \
        CGO_ENABLED=0 GOOS=linux GOARCH=amd64 GO111MODULE=on go build -a -o manager main.go; \
    fi

# Use distroless as minimal base image to package the manager binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details
FROM gcr.io/distroless/static:nonroot 
WORKDIR /
COPY --from=builder /workspace/pvcviewer-controller/manager .
USER nonroot:nonroot

ENTRYPOINT ["/manager"]
