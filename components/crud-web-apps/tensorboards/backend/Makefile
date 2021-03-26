install-deps:
	cd ../../common/backend && pip install -e .

run:
	gunicorn -w 3 --bind 0.0.0.0:5000 --access-logfile - entrypoint:_app

run-dev:
	BACKEND_MODE=dev \
	APP_SECURE_COOKIES=False \
	python entrypoint.py
