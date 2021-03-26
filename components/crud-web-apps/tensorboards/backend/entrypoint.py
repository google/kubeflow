import os

import app
from kubeflow.kubeflow.crud_backend import config, logging

log = logging.getLogger(__name__)

APP_NAME = os.environ.get("APP_NAME", "Tensorboards Web App")
PREFIX = os.environ.get("APP_PREFIX", "/")
BACKEND_MODE = os.environ.get("BACKEND_MODE",
                              config.BackendMode.PRODUCTION.value)

cfg = config.get_config(BACKEND_MODE)
cfg.PREFIX = PREFIX

app = app.create_app(APP_NAME, cfg)

if __name__ == "__main__":
    app.run()
