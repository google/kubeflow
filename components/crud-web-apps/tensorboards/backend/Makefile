install-deps:
	cd ../../common/backend && pip install -e .

run:
	gunicorn -w 3 --bind 0.0.0.0:5000 --access-logfile - entrypoint:_app

run-dev:
	UI_FLAVOR=default \
	BACKEND_MODE=dev \
	APP_PREFIX=/ \
	APP_SECURE_COOKIES=False \
	gunicorn -w 3 --bind 0.0.0.0:5000 --access-logfile - entrypoint:app
