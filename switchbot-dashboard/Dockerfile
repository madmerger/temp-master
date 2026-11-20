FROM node:22-slim AS frontend
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM python:3.12-slim AS runtime
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    DB_PATH=/data/app.db \
    BACKUP_DIR=/data/backups
RUN pip install --no-cache-dir poetry==1.8.5
COPY switchbot-backend/pyproject.toml switchbot-backend/poetry.lock ./
RUN poetry install --only main --no-root --no-interaction --no-ansi && \
    groupadd --gid 10001 app && \
    useradd --uid 10001 --gid app --no-create-home app && \
    mkdir -p /data/backups && chown -R app:app /data
COPY switchbot-backend/app/ ./app/
COPY --from=frontend /frontend/dist/ ./static/
USER 10001:10001
EXPOSE 8000
CMD [".venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
