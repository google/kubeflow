FROM ubuntu:20.04

# common environemnt variables
ENV NB_USER jovyan
ENV NB_UID 1000
ENV NB_PREFIX /
ENV HOME /home/$NB_USER
ENV SHELL /bin/bash

# args - software versions
ARG ARCH="amd64"
ARG FILEBROWSER_VERSION="2.15.0"

# install - usefull linux packages
RUN export DEBIAN_FRONTEND=noninteractive \
 && apt-get -yq update \
 && apt-get -yq install --no-install-recommends \
    ca-certificates \
    curl \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# create user and set required ownership
RUN useradd -M -s /bin/bash -N -u ${NB_UID} ${NB_USER} \
 && mkdir -p ${HOME} \
 && chown -R ${NB_USER}:users ${HOME} \
 && mkdir -p /filebrowser \
 && chown -R ${NB_USER}:users /filebrowser

# install - filebrowser
 RUN curl -fsSL https://github.com/filebrowser/filebrowser/releases/download/v${FILEBROWSER_VERSION}/linux-${ARCH}-filebrowser.tar.gz -o /tmp/filebrowser.tar.gz \
 && tar -xzf /tmp/filebrowser.tar.gz -C /usr/local/bin/ filebrowser \
 && chmod +x /usr/local/bin/filebrowser \
 && chown -R ${NB_USER}:users /usr/local/bin \
 && rm -rf /tmp/*

 USER ${NB_UID}

ENTRYPOINT [ "/usr/local/bin/filebrowser" ]
