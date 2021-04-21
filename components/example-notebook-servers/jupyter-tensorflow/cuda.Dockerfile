FROM public.ecr.aws/j1r0q0g6/notebooks/notebook-servers/jupyter:master-ebc0c4f0

USER root

# args - software versions
ARG CUDA_VERSION=11.1
ARG CUDA_COMPART_VERSION=455.45.01-1
ARG CUDA_CUDART_VERSION=11.1.74-1
ARG CUDNN_VERSION=8.0.5.39-1
ARG LIBNVINFER_VERSION=7.2.2-1

# we need bash's env var character substitution
SHELL ["/bin/bash", "-c"]

# install - cuda
# for `cuda-compat-*`: https://docs.nvidia.com/cuda/eula/index.html#attachment-a
RUN curl -sL "https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/7fa2af80.pub" | apt-key add - \
 && echo "deb https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/ /" > /etc/apt/sources.list.d/cuda.list \
 && apt-get -yq update \
 && apt-get -yq install --no-install-recommends \
    cuda-compat-${CUDA_VERSION/./-}=${CUDA_COMPART_VERSION} \
    cuda-cudart-${CUDA_VERSION/./-}=${CUDA_CUDART_VERSION} \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* \
 && ln -s /usr/local/cuda-${CUDA_VERSION} /usr/local/cuda

# envs - cuda
ENV PATH /usr/local/nvidia/bin:/usr/local/cuda/bin:${PATH}
ENV LD_LIBRARY_PATH /usr/local/nvidia/lib:/usr/local/nvidia/lib64
ENV NVIDIA_VISIBLE_DEVICES all
ENV NVIDIA_DRIVER_CAPABILITIES compute,utility
ENV NVIDIA_REQUIRE_CUDA "cuda>=${CUDA_VERSION}"

# install - other nvidia stuff
RUN curl -sL "https://developer.download.nvidia.com/compute/machine-learning/repos/ubuntu2004/x86_64/7fa2af80.pub" | apt-key add - \
 && echo "deb https://developer.download.nvidia.com/compute/machine-learning/repos/ubuntu2004/x86_64 /" > /etc/apt/sources.list.d/nvidia-ml.list \
 && echo "deb https://developer.download.nvidia.com/compute/machine-learning/repos/ubuntu1804/x86_64 /" > /etc/apt/sources.list.d/nvidia-ml.list \
 && apt-get -yq update \
 && apt-get -yq install --no-install-recommends \
    cm-super \
    cuda-command-line-tools-${CUDA_VERSION/./-} \
    cuda-nvrtc-${CUDA_VERSION/./-} \
    libcublas-${CUDA_VERSION/./-} \
    libcudnn8=${CUDNN_VERSION}+cuda${CUDA_VERSION} \
    libcufft-${CUDA_VERSION/./-} \
    libcurand-${CUDA_VERSION/./-} \
    libcusolver-${CUDA_VERSION/./-} \
    libcusparse-${CUDA_VERSION/./-} \
    libfreetype6-dev \
    libhdf5-serial-dev \
    libnvinfer7=${LIBNVINFER_VERSION}+cuda${CUDA_VERSION} \
    libnvinfer-plugin7=${LIBNVINFER_VERSION}+cuda${CUDA_VERSION} \
    libzmq3-dev \
    pkg-config \
    # can't be used until NVIDIA updates (requires python < 3.7)
    # pthon3-libnvinfer=${LIBNVINFER_VERSION}+cuda${CUDA_VERSION} \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# tensorflow fix - CUDA profiling, tensorflow requires CUPTI
ENV LD_LIBRARY_PATH /usr/local/cuda/extras/CUPTI/lib64:/usr/local/cuda/lib64:${LD_LIBRARY_PATH}

# tensorflow fix - wrong libcuda lib path (+ reconfigure dynamic linker run-time bindings)
RUN ln -s /usr/local/cuda/lib64/stubs/libcuda.so /usr/local/cuda/lib64/stubs/libcuda.so.1 \
 && echo "/usr/local/cuda/lib64/stubs" > /etc/ld.so.conf.d/z-cuda-stubs.conf \
 && ldconfig

# tensorflow fix - wrong libcusolver lib path
# https://github.com/tensorflow/tensorflow/issues/43947#issuecomment-748273679
RUN ln -s /usr/local/cuda-${CUDA_VERSION}/targets/x86_64-linux/lib/libcusolver.so.11 /usr/local/cuda-${CUDA_VERSION}/targets/x86_64-linux/lib/libcusolver.so.10

# tensorflow fix - some tensorflow tools expect a `python` binary
RUN ln -s $(which python3) /usr/local/bin/python

USER $NB_UID

# install - requirements.txt
COPY --chown=jovyan:users requirements-cuda.txt /tmp/requirements.txt
RUN python3 -m pip install -r /tmp/requirements.txt --quiet --no-cache-dir \
 && rm -f /tmp/requirements.txt
