### Manifests

This folder contains manifests for installing `profile-controller`. The structure is the following:

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
    - `overlays/kubeflow`: Installs `profile-controller` as part of Kubeflow. The resulting manifests should be the same as the result of the [deprecated `base_v3` from kubeflow/manifests](https://github.com/kubeflow/manifests/tree/306d02979124bc29e48152272ddd60a59be9306c/profiles/base_v3). At a glance, it makes the following changes:
        - Use namespace `kubeflow`.
        - Remove namespace resource.
        - Add KFAM container.
        - Add KFAM Service and VirtualService.
    - `overlays/standalone`: Install `profile-controller` in its own namespace. Useful for testing or for users that prefer to install just the controller.
