# Build frontend and run backend (serves frontend static files)
FROM node:22-slim AS frontend-builder
WORKDIR /frontend
COPY switchbot-frontend/package.json switchbot-frontend/package-lock.json ./
RUN npm ci
COPY switchbot-frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

# Install poetry
RUN pip install poetry

# Copy and install backend dependencies
COPY switchbot-backend/pyproject.toml switchbot-backend/poetry.lock ./
RUN poetry config virtualenvs.create true && \
    poetry config virtualenvs.in-project true && \
    poetry install --only main --no-root --no-interaction --no-ansi

# Copy backend application code
COPY switchbot-backend/app/ ./app/

# Copy the Vite production bundle to the static root served at /
COPY --from=frontend-builder /frontend/dist/ ./static/

EXPOSE 8000

CMD [".venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
