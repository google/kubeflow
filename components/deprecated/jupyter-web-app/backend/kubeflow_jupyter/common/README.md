### BaseUI: Shared functions and Utilities
This module holds functions/configs that both the Default and Rok Jupyter UIs use. Each UI will need to handle its own routes. 

This module is loaded into the `default` and `rok` UIs with the `PYTHONPATH` environment variable. To test the UIs locally, use the corresponding `make` commands.

### Shared Memory
Some Libraries like pyTorch use [Shared Memory](https://en.wikipedia.org/wiki/Shared_memory) for Multiprocessing. Currently (2019-04) there is no implementation in Kubernetes to activate this. As a workaround a empty directory at `/dev/shm` is added. See [this issue](https://github.com/kubernetes/kubernetes/issues/28272) for more details on this topic.