"""
Common helper functions for handling k8s objects information
"""
import datetime as dt
import logging
import os
import re

import yaml
from flask import current_app

log = logging.getLogger(__name__)


def get_prefixed_index_html():
    """
    The backend should modify the <base> element of the index.html file to
    align with the configured prefix the backend is listening
    """
    prefix = os.path.join("/", current_app.config["PREFIX"], "")
    static_dir = current_app.config["STATIC_DIR"]

    log.info("Setting the <base> to reflect the prefix: %s", prefix)
    with open(os.path.join(static_dir, "index.html"), "r") as f:
        index_html = f.read()
        index_prefixed = re.sub(
            r"\<base href=\".*\".*\>", '<base href="%s">' % prefix, index_html,
        )

        return index_prefixed


def load_yaml(f):
    """
    f: file path
    Load a yaml file and convert it to a python dict.
    """
    c = None
    try:
        with open(f, "r") as yaml_file:
            c = yaml_file.read()
    except IOError:
        log.error("Error opening: %s", f)
        return None

    try:
        contents = yaml.safe_load(c)
        if contents is None:
            # YAML exists but is empty
            return {}
        else:
            # YAML exists and is not empty
            return contents
    except yaml.YAMLError:
        return None


def load_param_yaml(f, **kwargs):
    """
    f: file path

    Load a yaml file and convert it to a python dict. The yaml might have some
    `{var}` values which the user will have to format. For this we first read
    the yaml file and replace these variables and then convert the generated
    string to a dict via the yaml module.
    """
    c = None
    try:
        with open(f, "r") as yaml_file:
            c = yaml_file.read().format(**kwargs)
    except IOError:
        log.error("Error opening: %s", f)
        return None

    try:
        contents = yaml.safe_load(c)
        if contents is None:
            # YAML exists but is empty
            return {}
        else:
            # YAML exists and is not empty
            return contents
    except yaml.YAMLError:
        return None


def get_uptime(then):
    """
    then: datetime instance | string

    Return a string that informs how much time has pasted from the provided
    timestamp.
    """
    if isinstance(then, str):
        then = dt.datetime.strptime(then, "%Y-%m-%dT%H:%M:%SZ")

    now = dt.datetime.now()
    diff = now - then.replace(tzinfo=None)

    days = diff.days
    hours = int(diff.seconds / 3600)
    mins = int((diff.seconds % 3600) / 60)

    age = ""
    if days > 0:
        if days == 1:
            age = str(days) + " day"
        else:
            age = str(days) + " days"
    else:
        if hours > 0:
            if hours == 1:
                age = str(hours) + " hour"
            else:
                age = str(hours) + " hours"
        else:
            if mins == 0:
                return "just now"
            if mins == 1:
                age = str(mins) + " min"
            else:
                age = str(mins) + " mins"

    return age + " ago"
