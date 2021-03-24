FROM public.ecr.aws/j1r0q0g6/notebooks/notebook-servers/rstudio:master-15d229d4

# args - software versions
ARG R_TIDYVERSE_VERSION="1.3.0"

# switch to root user for conda installation
# (only necessary when installing r-tidyverse with Kaniko)
USER root

# install - r-tidyverse
RUN conda install -y -q \
    r-tidyverse=${R_TIDYVERSE_VERSION} \
 && conda update -y -q --all \
 && conda clean -a -f -y \
 && chown -R ${NB_USER}:users ${CONDA_DIR} \
 && chown -R ${NB_USER}:users ${HOME}

USER ${NB_USER}
