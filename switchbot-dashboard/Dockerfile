FROM node:22-alpine AS frontend
WORKDIR /build
COPY switchbot-frontend/package.json switchbot-frontend/package-lock.json ./
RUN npm ci
COPY switchbot-frontend/ ./
ARG VITE_API_URL
RUN if [ -n "$VITE_API_URL" ]; then VITE_API_URL="$VITE_API_URL" npm run build; else npm run build; fi

FROM python:3.12-slim
WORKDIR /app/switchbot-backend

# Install poetry
RUN pip install poetry

# Copy and install backend dependencies
COPY switchbot-backend/pyproject.toml switchbot-backend/poetry.lock ./
RUN poetry config virtualenvs.create true && \
    poetry config virtualenvs.in-project true && \
    poetry install --only main --no-root --no-interaction --no-ansi

# Copy backend application code
COPY switchbot-backend/app/ ./app/

# Copy the production frontend bundle served at /
COPY --from=frontend /build/dist /app/switchbot-frontend/dist

EXPOSE 8000

CMD [".venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
