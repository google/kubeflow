FROM public.ecr.aws/j1r0q0g6/notebooks/notebook-servers/base:master-4892c583

USER root

# args - software versions
ARG CODESERVER_VERSION=3.9.1

# install - code-server
RUN curl -sL "https://github.com/cdr/code-server/releases/download/v${CODESERVER_VERSION}/code-server_${CODESERVER_VERSION}_amd64.deb" -o /tmp/code-server.deb \
 && dpkg -i /tmp/code-server.deb \
 && rm -f /tmp/code-server.deb

# s6 - copy scripts
COPY --chown=jovyan:users s6/ /etc

# s6 - 01-copy-tmp-home
RUN mkdir -p /tmp_home \
 && cp -r ${HOME} /tmp_home \
 && chown -R ${NB_USER}:users /tmp_home

USER $NB_UID

EXPOSE 8888

ENTRYPOINT ["/init"]
