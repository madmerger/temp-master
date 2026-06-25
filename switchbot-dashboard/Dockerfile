# --- Frontend build stage: compile the React/Vite SPA ---
FROM node:22-slim AS frontend
WORKDIR /frontend

# Install dependencies using the lockfile for reproducible builds
COPY switchbot-frontend/package.json switchbot-frontend/package-lock.json ./
RUN npm ci

# Build the production bundle into /frontend/dist
COPY switchbot-frontend/ ./
RUN npm run build

# --- Backend stage: serves API and the built frontend static files ---
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

# Copy the built frontend to root: served at /
COPY --from=frontend /frontend/dist/ ./static/

EXPOSE 8000

CMD [".venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
