# GSoC 2020 - TENSORBOARD CONTROLLER

### Related Closed Issues

- [Extend Tensorboard Controller to Support PVCs #5039](https://github.com/kubeflow/kubeflow/issues/5039)

- [Tensorboard controller creates servers that always mount user-gcp-sa secret #5065](https://github.com/kubeflow/kubeflow/issues/5065)

- [Tensorboard CR doesn't contain information about the Tensorboard Server being ready or not #5166](https://github.com/kubeflow/kubeflow/issues/5166)

### Related Pull Requests

- [Mount GCP secret only when accessing Google storage #5069](https://github.com/kubeflow/kubeflow/pull/5069)

- [Add scheduling functionality for Tensorboard servers that use RWO PVCs as log storages #5218](https://github.com/kubeflow/kubeflow/pull/5218)

- [Add functionality to inform TWA frontend about the status of Tensorboard servers #5259](https://github.com/kubeflow/kubeflow/pull/5259)

Prequisites to build and run the controller:

1. GO

2. Docker

3. kustomize

4. kubectl

## RUN TENSORBOARD CONTROLLER LOCALLY

Steps: 


1. Clone the repository 

2. Change directories to `components/tensorboard-controller`

3. Generate and install manifests and build the controller:  `make install` 

4. Run the controller locally:   `make run`

If you want to enable the scheduling functionality for Tensorboard servers that use ReadWriteOnce PVCs as log storages, then set the `RWO_PVC_SCHEDULING` to `true` and run: `RWO_PVC_SCHEDULING="true" make run`

## BUILD TENSORBOARD CONTROLLER IMAGE AND DEPLOY TO CLUSTER

1. Clone the repository 

2. Change directories to `components/tensorboard-controller`

3. Generate and install manifests and build the controller: `make manifests` 

4. Build and push the docker image: `make docker-build docker-push IMG=YOUR_IMAGE_NAME`

5. Deploy the Tensorboard controller: `make deploy IMG=YOUR_IMAGE_NAME`

If you want to enable the scheduling functionality for Tensorboard servers that use ReadWriteOnce PVCs as log storages, then: 

1. Change directories to `components/tensorboard-controller/config/manager`
2. Modify the `manager.yaml` file by navigating to the `deployment.spec.template.spec` field and manually setting the value of the `RWO_PVC_SCHEDULING` env var to `"true"` in the manager container.

3. Run: `make deploy IMG=YOUR_IMAGE_NAME`