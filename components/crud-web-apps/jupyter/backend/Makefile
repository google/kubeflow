SHELL=bash

install-deps:
	pushd ../../common/backend && \
	pip install -e . && \
	popd
	pip install -r requirements.txt

run:
	APP_PREFIX=/jupyter \
	gunicorn -w 3 --bind 0.0.0.0:5000 --access-logfile - entrypoint:app

run-rok:
	UI_FLAVOR=rok \
	APP_PREFIX=/jupyter \
	gunicorn -w 3 --bind 0.0.0.0:5000 --access-logfile - entrypoint:app

run-dev:
	UI_FLAVOR=default \
	BACKEND_MODE=dev \
	APP_PREFIX=/ \
	APP_SECURE_COOKIES=False \
	gunicorn -w 3 --bind 0.0.0.0:5000 --access-logfile - entrypoint:app

run-dev-rok:
	UI_FLAVOR=rok \
	BACKEND_MODE=dev \
	ROK_URL=http://10.10.10.10:8080/rok \
	APP_PREFIX=/ \
	APP_SECURE_COOKIES=False \
	gunicorn -w 3 --bind 0.0.0.0:5000 --access-logfile - entrypoint:app
