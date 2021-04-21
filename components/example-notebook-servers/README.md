> 🛑️️ These server images are provided as __examples only__ and are supported on a best-effort basis.
> Contributions are greatly appreciated.

# Example Notebook Servers

## Overview:

In this folder, we have tried to make an extendable image structure which you can easily augment with additional tools and packages.

![flow-chart of kubeflow notebook server images](image-flow-chart.png)

__The following images are considered 'base' images, which you can extend:__

Name | Description
--- | ---
[./base](./base) | the common base for all other images
[./jupyter](./jupyter) | the base [JupyterLab](https://github.com/jupyterlab/jupyterlab) image
[./codeserver](./codeserver) | the base [code-server](https://github.com/cdr/code-server) (Visual Studio Code) image
[./rstudio](./rstudio) | the base [RStudio](https://github.com/rstudio/rstudio) image

__Important points about the images:__

- they make use of the [s6-overlay](https://github.com/just-containers/s6-overlay) init system
- they all run as the non-root `jovyan` user

## How do I extend these images?

> ⚠️ any changes made by users __after spawning__ a Kubeflow notebook will only last the lifetime of the pod, unless they are installed into a PVC-backed directory

### Adding conda/pip packages:

Extend one of the base images and install any `pip` or `conda` packages your Kubeflow Notebook users are likely to need. 

As a guide, look at [jupyter-pytorch-full.cpu](./jupyter-pytorch-full/cpu.Dockerfile) for a `pip install ...` example, and the [rstudio-tidyverse](./rstudio-tidyverse/Dockerfile) for `conda install ...`.

__WARNING:__ a common cause of errors is users running `pip install --user ...`, causing the home-directory (which is backed by a PVC) to contain a different or incompatible version of a package contained in  `/opt/conda/...`

### Adding apt-get packages:

Extend one of the base images and install any `apt-get` packages your Kubeflow Notebook users are likely to need.

__WARNING:__ ensure you swap to `root` in the Dockerfile before running `apt-get`, and swap back to `jovyan` after.

### Adding container startup scripts:

Some use-cases might require custom scripts to run during the startup of the Notebook Server container, or advanced users might want to add additional services that run inside the container (for example, an Apache or NGINX web server).
To make this easy, we use the [s6-overlay](https://github.com/just-containers/s6-overlay).

The [s6-overlay](https://github.com/just-containers/s6-overlay) differs from other init systems, such as the popular [tini](https://github.com/krallin/tini).
While `tini` was created to handle a single process running in a container as PID 1, the `s6-overlay` is built to manage multiple processes and allows the creator of the image to determine which process failures should silently restart, and which should cause the container to exit.

__Custom startup scripts:__

Scripts that need to run during the startup of the container can be placed in `/etc/cont-init.d/`, and are executed in ascending alphanumeric order.

An example of a startup script can be found in [./rstudio/s6/cont-init.d/02-rstudio-env-fix](./rstudio/s6/cont-init.d/02-rstudio-env-fix).
This script uses the [with-contenv](https://github.com/just-containers/s6-overlay#container-environment) helper so that environment variables (passed to container) are available in the script. 
The purpose of this script is to snapshot any `KUBERNETES_*` environment variables into the `Renviron.site` at pod startup, as without these variables `kubectl` does not work.

__Custom service scripts:__

Extra services to be monitored by `s6-overlay` should be placed in their own folder under `/etc/services.d/` containing a script called `run` and optionally a finishing script `finish`. 

An example of a service can be found in [jupyter/s6/services.d/jupyterlab](jupyter/s6/services.d/jupyterlab) which is used to start JupyterLab itself.
For more information about the `run` and `finish` scripts, please see the [s6-overlay documentation](https://github.com/just-containers/s6-overlay#writing-a-service-script).

__WARNING:__ our example images run `s6-overlay` as `$NB_USER` not `root`, meaning any files or scripts related to `s6-overlay` should be owned by the `$NB_USER` user

There may be cases when you need to run a service as root. 
To do this, you can change the Dockerfile to have `USER root` at the end, and then use `s6-setuidgid` to run the user-facing services as `$NB_USER`.

For example, here is a `run` script for `code-server`:

```bash
#!/usr/bin/with-contenv bash

export SHELL='/bin/bash'
exec s6-setuidgid $NB_USER \
     /usr/local/bin/code-server \
     --bind-addr 0.0.0.0:8888 \
     --disable-telemetry \
     --auth none
```