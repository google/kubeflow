import os
import sys

from apps import default, rok
from kubeflow.kubeflow.crud_backend import config, logging

log = logging.getLogger(__name__)


def get_config(mode):
    """Return a config based on the selected mode."""
    config_classes = {
        config.BackendMode.DEVELOPMENT.value: config.DevConfig,
        config.BackendMode.DEVELOPMENT_FULL.value: config.DevConfig,
        config.BackendMode.PRODUCTION.value: config.ProdConfig,
        config.BackendMode.PRODUCTION_FULL.value: config.ProdConfig,
    }
    cfg_class = config_classes.get(mode)
    if not cfg_class:
        raise RuntimeError("Backend mode '%s' is not implemented. Choose one"
                           " of %s" % (mode, list(config_classes.keys())))
    return cfg_class()


APP_NAME = os.environ.get("APP_NAME", "Volumes Web App")
BACKEND_MODE = os.environ.get("BACKEND_MODE",
                              config.BackendMode.PRODUCTION.value)
UI_FLAVOR = os.environ.get("UI_FLAVOR", "default")
PREFIX = os.environ.get("APP_PREFIX", "/")

cfg = get_config(BACKEND_MODE)
cfg.PREFIX = PREFIX

# Load the app based on UI_FLAVOR env var
if UI_FLAVOR == "default":
    app = default.create_app(APP_NAME, cfg)
elif UI_FLAVOR == "rok":
    app = rok.create_app(APP_NAME, cfg)
else:
    log.error("No UI flavor for '%s'", UI_FLAVOR)
    sys.exit(1)


if __name__ == "__main__":
    app.run()
