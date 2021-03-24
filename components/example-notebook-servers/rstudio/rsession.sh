#!/usr/bin/env bash

# use conda base environment with reticulate
. /opt/conda/etc/profile.d/conda.sh
conda activate base
export RETICULATE_PYTHON=$CONDA_PREFIX/bin/python

/usr/lib/rstudio-server/bin/rsession "$@"