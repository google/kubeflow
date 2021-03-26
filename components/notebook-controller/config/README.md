### Manifests

This folder contains manifests for installing `notebook-controller`. The structure is the following:

```
.
├── crd
├── default
├── manager
├── rbac
├── samples
├── base
├── overlays
│   ├── kubeflow
│   └── standalone
```

The breakdown is the following:
- `crd`, `default`, `manager`, `rbac`, `samples`: Kubebuilder-generated structure. We keep this in order to be compatible with kubebuilder workflows. This is not meant for the consumer of the manifests.
- `base`, `overlays`: Kustomizations meant for consumption by the user:
    - `overlays/kubeflow`: Installs `notebook-controller` as part of Kubeflow. The resulting manifests should be the same as the result of the [deprecated `base_v3` from kubeflow/manifests](https://github.com/kubeflow/manifests/tree/306d02979124bc29e48152272ddd60a59be9306c/profiles/base_v3). At a glance, it makes the following changes:
        - Use namespace `kubeflow`.
        - Remove namespace resource.
        - Add KFAM container.
        - Add KFAM Service and VirtualService.
    - `overlays/standalone`: Install `notebook-controller` in its own namespace. Useful for testing or for users that prefer to install just the controller.

### CRD Issue

We patch the kubebuilder-generated CRD with an older version. That's because the validation was more relaxed in a previous version and now we ended up with some clients and resources in a state that fails more detailed validation, but works correctly. For more information, see: https://github.com/kubeflow/kubeflow/issues/5722