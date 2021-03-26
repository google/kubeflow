from flask import Blueprint

bp = Blueprint("default_routes", __name__)

from . import delete, get, post  # noqa: F401, E402
