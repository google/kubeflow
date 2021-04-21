FROM public.ecr.aws/j1r0q0g6/notebooks/notebook-servers/base:master-1831e436

USER root

# args - software versions
ARG CONDA_VERSION="4.9.2"
ARG MINIFORGE_ARCH="x86_64"
ARG MINIFORGE_SHA256="91d5aa5f732b5e02002a371196a2607f839bab166970ea06e6ecc602cb446848"
ARG MINIFORGE_VERSION="${CONDA_VERSION}-7"
ARG PIP_VERSION="21.0.1"
ARG PYTHON_VERSION="3.8.8"

# install -- node.js
RUN export DEBIAN_FRONTEND=noninteractive \
 && curl -sL "https://deb.nodesource.com/gpgkey/nodesource.gpg.key" | apt-key add - \
 && echo "deb https://deb.nodesource.com/node_14.x focal main" > /etc/apt/sources.list.d/nodesource.list \
 && apt-get -yq update \
 && apt-get -yq install --no-install-recommends \
    nodejs \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# setup environment for conda
ENV CONDA_DIR /opt/conda
ENV PATH "${CONDA_DIR}/bin:${PATH}"
RUN mkdir -p ${CONDA_DIR} \
 && echo ". /opt/conda/etc/profile.d/conda.sh" >> ${HOME}/.bashrc \
 && echo ". /opt/conda/etc/profile.d/conda.sh" >> /etc/profile \
 && echo "conda activate base" >> ${HOME}/.bashrc \
 && echo "conda activate base" >> /etc/profile \
 && chown -R ${NB_USER}:users ${CONDA_DIR} \
 && chown -R ${NB_USER}:users ${HOME}

# switch to NB_UID for installs
USER ${NB_UID}

# install - conda, pip, python
RUN curl -sL "https://github.com/conda-forge/miniforge/releases/download/${MINIFORGE_VERSION}/Miniforge3-${MINIFORGE_VERSION}-Linux-${MINIFORGE_ARCH}.sh" -o /tmp/Miniforge3.sh \
 && echo "${MINIFORGE_SHA256} /tmp/Miniforge3.sh" | sha256sum --check \
 && /bin/bash /tmp/Miniforge3.sh -b -f -p ${CONDA_DIR} \
 && rm /tmp/Miniforge3.sh \
 && conda config --system --set auto_update_conda false \
 && conda config --system --set show_channel_urls true \
 && echo "conda ${CONDA_VERSION}" >> ${CONDA_DIR}/conda-meta/pinned \
 && echo "python ${PYTHON_VERSION}" >> ${CONDA_DIR}/conda-meta/pinned \
 && conda install -y -q \
    python=${PYTHON_VERSION} \
    conda=${CONDA_VERSION} \
    pip=${PIP_VERSION} \
 && conda update -y -q --all \
 && conda clean -a -f -y \
 && chown -R ${NB_USER}:users ${CONDA_DIR} \
 && chown -R ${NB_USER}:users ${HOME}

# install - requirements.txt
COPY --chown=jovyan:users requirements.txt /tmp
RUN python3 -m pip install -r /tmp/requirements.txt --quiet --no-cache-dir \
 && rm -f /tmp/requirements.txt \
 && jupyter lab --generate-config \
 && rm -rf ${HOME}/.cache/yarn \
 && chown -R ${NB_USER}:users ${CONDA_DIR} \
 && chown -R ${NB_USER}:users ${HOME}

# s6 - copy scripts
COPY --chown=jovyan:users s6/ /etc

# s6 - 01-copy-tmp-home
USER root
RUN mkdir -p /tmp_home \
 && cp -r ${HOME} /tmp_home \
 && chown -R ${NB_USER}:users /tmp_home
USER ${NB_UID}

EXPOSE 8888

ENTRYPOINT ["/init"]
