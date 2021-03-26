# Build the manager binary
ARG GOLANG_VERSION=1.15
FROM golang:${GOLANG_VERSION} as builder

WORKDIR /workspace
# Copy the Go Modules manifests
COPY go.mod go.mod
COPY go.sum go.sum
# cache deps before building and copying source so that we don't need to re-download as much
# and so that source changes don't invalidate our downloaded layer
RUN go mod download

# Copy the go source
COPY main.go main.go
COPY api/ api/
COPY controllers/ controllers/
RUN cp /bin/dash /workspace/dash

# Build
RUN if [ "$(uname -m)" = "aarch64" ]; then \
        CGO_ENABLED=0 GOOS=linux GOARCH=arm64 GO111MODULE=on go build -a -o manager main.go; \
    else \
        CGO_ENABLED=0 GOOS=linux GOARCH=amd64 GO111MODULE=on go build -a -o manager main.go; \
    fi

# Use distroless as minimal base image to package the manager binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details
FROM gcr.io/distroless/base:latest as serve
WORKDIR /
COPY --from=builder /workspace/dash /bin/dash

COPY third_party third_party
COPY --from=builder /workspace/manager .
COPY --from=builder /go/pkg/mod/github.com/hashicorp third_party/library/

EXPOSE 8080

ENTRYPOINT ["/manager"]
