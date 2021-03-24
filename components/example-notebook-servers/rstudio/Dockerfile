FROM public.ecr.aws/j1r0q0g6/notebooks/notebook-servers/base:master-4892c583

USER root

# use bash instead of sh
SHELL ["/bin/bash", "-c"]

# args - software versions
ARG CONDA_VERSION="4.9.2"
ARG MINIFORGE_ARCH="x86_64"
ARG MINIFORGE_SHA256="91d5aa5f732b5e02002a371196a2607f839bab166970ea06e6ecc602cb446848"
ARG MINIFORGE_VERSION="${CONDA_VERSION}-7"
ARG PIP_VERSION="21.0.1"
ARG PYTHON_VERSION="3.8.8"
ARG RSTUDIO_ARCH="amd64"
ARG RSTUDIO_SHA256="a46bbfbcb468e7af6aa12280adb830056f4a10e3457fd2f5969bb31d4d476939"
ARG RSTUDIO_VERSION="1.4.1106"
ARG R_BASE_VERSION="4.0.3"
ARG R_RETICULATE_VERSION="1.18"
ARG R_PNG_VERSION="0.1_7"

# install - binary rstudio dependencies
RUN apt-get -yq update \
 && apt-get -yq install --no-install-recommends \
    libapparmor1 \
    libc6 \
    libclang-dev \
    libedit2 \
    libpq5 \
    psmisc \
    rrdtool \
    sudo \
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

# setup environment for R
ENV R_HOME ${CONDA_DIR}/lib/R

USER ${NB_UID}

# install - conda, pip, python, r-base
RUN curl -sL "https://github.com/conda-forge/miniforge/releases/download/${MINIFORGE_VERSION}/Miniforge3-${MINIFORGE_VERSION}-Linux-${MINIFORGE_ARCH}.sh" -o /tmp/Miniforge3.sh \
 && echo "${MINIFORGE_SHA256} /tmp/Miniforge3.sh" | sha256sum --check \
 && /bin/bash /tmp/Miniforge3.sh -b -f -p ${CONDA_DIR} \
 && rm /tmp/Miniforge3.sh \
 && conda config --system --set auto_update_conda false \
 && conda config --system --set show_channel_urls true \
 && echo "conda ${CONDA_VERSION}" >> ${CONDA_DIR}/conda-meta/pinned \
 && echo "python ${PYTHON_VERSION}" >> ${CONDA_DIR}/conda-meta/pinned \
 && echo "r-base ${R_BASE_VERSION}" >> ${CONDA_DIR}/conda-meta/pinned \
 && conda install -y -q \
    python=${PYTHON_VERSION} \
    conda=${CONDA_VERSION} \
    pip=${PIP_VERSION} \
    r-base=${R_BASE_VERSION} \
    r-reticulate=${R_RETICULATE_VERSION} \
    r-png=${R_PNG_VERSION} \
 && conda update -y -q --all \
 && conda clean -a -f -y \
 && chown -R ${NB_USER}:users ${CONDA_DIR} \
 && chown -R ${NB_USER}:users ${HOME}

# set default CRAN repo to RSPM (it has pre-compiled R packages, increasing user install speed)
RUN echo 'options(repos=c(CRAN="https://packagemanager.rstudio.com/all/__linux__/focal/latest"))' >> ${R_HOME}/etc/Rprofile.site \
 && echo 'options(HTTPUserAgent=sprintf("R/%s R (%s)", getRversion(), paste(getRversion(), R.version$platform, R.version$arch, R.version$os)))' >> ${R_HOME}/etc/Rprofile.site

# R needs TZ set
ENV TZ Etc/UTC
RUN echo "TZ=${TZ}" >> ${R_HOME}/etc/Renviron.site

USER root

# install - rstudio-server
RUN curl -sL "https://download2.rstudio.org/server/bionic/${RSTUDIO_ARCH}/rstudio-server-${RSTUDIO_VERSION}-${RSTUDIO_ARCH}.deb" -o /tmp/rstudio-server.deb \
 && echo "${RSTUDIO_SHA256} /tmp/rstudio-server.deb" | sha256sum --check \
 && dpkg -i /tmp/rstudio-server.deb \
 && rm -f /tmp/rstudio-server.deb \
    # our Kaniko build excludes `/var/run/*` but RStudio needs those files,
    # so we move them to `/run`, wich is actually the same place due to symbolic links
 && mv -n /var/run/rstudio-server* /run \
    # use advisory file-locks to improve PVC support
 && echo "lock-type=advisory" > /etc/rstudio/file-locks \
    # allows the non-root NB_USER to run rstudio
 && chown -R ${NB_USER}:users /etc/rstudio \
 && chown -R ${NB_USER}:users /run/rstudio-server* \
 && chown -R ${NB_USER}:users /usr/lib/rstudio-server \
 && chown -R ${NB_USER}:users /var/lib/rstudio-server

# tell rstudio to use conda python by setting `RETICULATE_PYTHON` with `--rsession-path=/opt/rsession.sh`
COPY --chown=jovyan:users rsession.sh /opt
RUN chmod +x /opt/rsession.sh

# s6 - copy scripts
COPY --chown=jovyan:users s6/ /etc

# s6 - 01-copy-tmp-home
RUN mkdir -p /tmp_home \
 && cp -r ${HOME} /tmp_home \
 && chown -R ${NB_USER}:users /tmp_home

USER ${NB_UID}

EXPOSE 8888

ENTRYPOINT ["/init"]