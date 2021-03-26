import os

from kubeflow.kubeflow.crud_backend import config, logging, rok

from ..common import create_app as create_default_app
from .routes import bp as routes_bp

log = logging.getLogger(__name__)


def create_app(name=__name__, cfg: config.Config = None):
    cfg = config.Config() if cfg is None else cfg

    # Properly set the static serving directory
    static_dir = os.path.join(
        os.path.abspath(os.path.dirname(__file__)), "static"
    )

    app = create_default_app(name, static_dir, cfg)

    log.info("Setting STATIC_DIR to: " + static_dir)
    app.config["STATIC_DIR"] = static_dir

    # Register the app's blueprints
    app.register_blueprint(rok.bp)
    app.register_blueprint(routes_bp)

    return app
