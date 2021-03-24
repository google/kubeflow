"""
Cross Site Request Forgery Blueprint.

This module provides a Flask blueprint that implements protection against
request forgeries from other sites. Currently, it is only meant to be used with
an AJAX frontend, not with server-side rendered forms.

The module implements the following protecting measures against CSRF:
- Double Submit Cookie.
- Custom HTTP Headers.
- SameSite cookie attribute.

To elaborate, the `Double Submit Cookie` procedure looks like the following:
1. Browser requests `index.html`, which contains the compiled Javascript.
2. Backend sets the `CSRF_COOKIE` by calling `set_cookie`. If the cookie
   already exists, `set_cookie` overrides it with a new one. The cookie
   contains a random value.
3. Frontend (`index.html`) is loaded and starts making requests to the backend.
   For every request, the frontend reads the `CSRF_COOKIE` value and adds a
   `CSRF_HEADER` with the same value.
4. Backend checks that the value of `CSRF_COOKIE` matches the value of
   `CSRF_HEADER`. All endpoints are checked, except the index endpoint and
   endpoints with safe methods (GET, HEAD, OPTIONS, TRACE).

Custom Headers (`CSRF_HEADER`) provide an extra layer of protection, as
cross-origin requests cannot include custom headers (assuming CORS is not
misconfigured) because of the Same-Origin policy.

The SameSite cookie attribute provides another layer of protection, but may
impede usability so it is configurable. This attribute controls whether a
cookie is sent by the browser when a cross-site request is made. It defaults to
"Strict".

References:
-  OWASP CSRF Mitigation: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
"""

import logging
import os
import secrets

from flask import Blueprint, current_app, request
from werkzeug.exceptions import Forbidden

from . import settings

bp = Blueprint("csrf", __name__)
log = logging.getLogger(__name__)

# NOTE: We can't make these configurable until we have a way to pass settings
# to the frontend in Kubeflow Web Apps (e.g., a `/settings` endpoint).
CSRF_COOKIE = "XSRF-TOKEN"
CSRF_HEADER = "X-" + CSRF_COOKIE
SAMESITE_VALUES = ["Strict", "Lax", "None"]


def set_cookie(resp):
    """
    Sets a new CSRF protection cookie to the response. The backend should call
    this function every time it serves the index endpoint (`index.html`), in
    order to refresh the cookie.
    - The frontend should be able to read this cookie: HttpOnly=False
    - The cookie should only be sent with HTTPS: Secure=True
    - The cookie should only live in the app's path and not in the entire
      domain. Path={app.prefix}

    Finally, disable caching for the endpoint that calls this function, which
    should be the index endpoint.
    """
    cookie = secrets.token_urlsafe(32)

    secure = settings.SECURE_COOKIES
    if not secure:
        log.info("Not setting Secure in CSRF cookie.")

    samesite = os.getenv("CSRF_SAMESITE", "Strict")
    if samesite not in SAMESITE_VALUES:
        samesite = "Strict"

    resp.set_cookie(key=CSRF_COOKIE, value=cookie, samesite=samesite,
                    httponly=False, secure=secure,
                    path=current_app.config["PREFIX"])

    # Don't cache a response that sets a CSRF cookie
    no_cache = "no-cache, no-store, must-revalidate, max-age=0"
    resp.headers["Cache-Control"] = no_cache


@bp.before_app_request
def check_endpoint():
    safe_methods = ["GET", "HEAD", "OPTIONS", "TRACE"]
    if request.method in safe_methods:
        log.info("Skipping CSRF check for safe method: %s", request.method)
        return

    log.debug("Ensuring endpoint is CSRF protected: %s", request.path)
    if CSRF_COOKIE not in request.cookies:
        raise Forbidden("Could not find CSRF cookie %s in the request."
                        % CSRF_COOKIE)

    if CSRF_HEADER not in request.headers:
        raise Forbidden("Could not detect CSRF protection header %s."
                        % CSRF_HEADER)

    header_token = request.headers[CSRF_HEADER]
    cookie_token = request.cookies[CSRF_COOKIE]
    if header_token != cookie_token:
        raise Forbidden("CSRF check failed. Token in cookie %s doesn't match "
                        "token in header %s." % (CSRF_COOKIE, CSRF_HEADER))

    return
