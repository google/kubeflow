from flask import Blueprint

bp = Blueprint("rok_routes", __name__)

from . import get, post, delete  # noqa: F401, E402
