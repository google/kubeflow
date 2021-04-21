FROM public.ecr.aws/j1r0q0g6/notebooks/notebook-servers/jupyter-tensorflow:master-3dbc352f

# install - requirements.txt
COPY --chown=jovyan:users requirements.txt /tmp/requirements.txt
RUN python3 -m pip install -r /tmp/requirements.txt --quiet --no-cache-dir \
 && rm -f /tmp/requirements.txt
