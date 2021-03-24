import os

SECURE_COOKIES = os.getenv("APP_SECURE_COOKIES", "true").lower() == "true"
DISABLE_AUTH = os.getenv("APP_DISABLE_AUTH", "false").lower() == "true"
USER_HEADER = os.getenv("USERID_HEADER", "kubeflow-userid")
USER_PREFIX = os.getenv("USERID_PREFIX", ":")
