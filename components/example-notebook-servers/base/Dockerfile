FROM ubuntu:20.04

# common environemnt variables
ENV NB_USER jovyan
ENV NB_UID 1000
ENV NB_PREFIX /
ENV HOME /home/$NB_USER
ENV SHELL /bin/bash

# args - software versions
ARG ARCH="amd64"
ARG S6_VERSION="v2.2.0.3"
ARG KUBECTL_VERSION="v1.20.5"

# install - usefull linux packages
RUN export DEBIAN_FRONTEND=noninteractive \
 && apt-get -yq update \
 && apt-get -yq install --no-install-recommends \
    apt-transport-https \
    bash \
    bzip2 \
    ca-certificates \
    curl \
    git \
    gnupg \
    gnupg2 \
    locales \
    lsb-release \
    nano \
    software-properties-common \
    tzdata \
    unzip \
    vim \
    wget \
    zip \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# install - s6 overlay
RUN export GNUPGHOME=/tmp/ \
 && curl -sL "https://github.com/just-containers/s6-overlay/releases/download/${S6_VERSION}/s6-overlay-${ARCH}-installer" -o /tmp/s6-overlay-${ARCH}-installer \
 && curl -sL "https://github.com/just-containers/s6-overlay/releases/download/${S6_VERSION}/s6-overlay-${ARCH}-installer.sig" -o /tmp/s6-overlay-${ARCH}-installer.sig \
 && curl -sL "https://keybase.io/justcontainers/key.asc" | gpg -q --import \
 && gpg -q --verify /tmp/s6-overlay-${ARCH}-installer.sig /tmp/s6-overlay-${ARCH}-installer \
 && chmod +x /tmp/s6-overlay-${ARCH}-installer \
 && /tmp/s6-overlay-${ARCH}-installer / \
 && rm /tmp/s6-overlay-${ARCH}-installer.sig /tmp/s6-overlay-${ARCH}-installer

# install - kubectl
RUN curl -sL "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${ARCH}/kubectl" -o /usr/local/bin/kubectl \
 && curl -sL "https://dl.k8s.io/${KUBECTL_VERSION}/bin/linux/${ARCH}/kubectl.sha256" -o /tmp/kubectl.sha256 \
 && echo "$(cat /tmp/kubectl.sha256) /usr/local/bin/kubectl" | sha256sum --check \
 && rm /tmp/kubectl.sha256 \
 && chmod +x /usr/local/bin/kubectl

# create user and set required ownership
RUN useradd -M -s /bin/bash -N -u ${NB_UID} ${NB_USER} \
 && mkdir -p ${HOME} \
 && chown -R ${NB_USER}:users ${HOME} \
 && chown -R ${NB_USER}:users /usr/local/bin \
 && chown -R ${NB_USER}:users /etc/s6

# set locale configs
RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen \
 && locale-gen
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8
ENV LC_ALL en_US.UTF-8

USER $NB_UID
