# --- Stage 1: build the React frontend ---
FROM node:22-slim AS frontend
WORKDIR /frontend

# Install frontend dependencies (leverage layer caching)
COPY switchbot-frontend/package.json switchbot-frontend/package-lock.json ./
RUN npm ci

# Build the frontend
COPY switchbot-frontend/ ./
ARG VITE_API_URL=https://snakeroom.fly.dev
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Stage 2: backend (serves the built frontend static files) ---
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

# Copy built frontend to root: served at /
COPY --from=frontend /frontend/dist/ ./static/

EXPOSE 8000

CMD [".venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
