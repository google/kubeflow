# Copyright 2017 The Kubernetes Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Project used with GCB
PROJECT ?= kubeflow-dev
# Registry where the image should be published
REGISTRY_PROJECT ?= kubeflow-dev
OUTPUT ?= output.yaml

# We want the git tag to be the last commit to this directory so we don't
# bump the image on unrelated changes.
GIT_TAG ?= $(shell git log -n 1 --pretty=format:"%h" ./)

info:
	echo image: \"gcr.io/$(REGISTRY_PROJECT)/jupyter-web-app:$(GIT_TAG)\" > $(OUTPUT)

build-gcb: info
	gcloud --project=$(PROJECT) \
		builds submit \
		--machine-type=n1-highcpu-32 \
		--substitutions=_GIT_VERSION=$(GIT_TAG),_REGISTRY=$(REGISTRY_PROJECT) \
		--config=cloudbuild.yaml .

build-gcb-win: info
	cmd /c gcloud --project=$(PROJECT) \
		builds submit \
		--machine-type=n1-highcpu-32 \
		--substitutions=_GIT_VERSION=$(GIT_TAG),_REGISTRY=$(REGISTRY_PROJECT) \
		--config=cloudbuild.yaml .