# ステージ1: フロントエンド（Vite + React）をビルドする
FROM node:22-alpine AS frontend-build
WORKDIR /frontend

# API のベース URL はビルド時に埋め込まれる（既定は本番と同じ snakeroom バックエンド）
ARG VITE_API_URL=https://snakeroom.fly.dev
ENV VITE_API_URL=${VITE_API_URL}

COPY switchbot-frontend/package.json switchbot-frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY switchbot-frontend/ ./
RUN npm run build

# ステージ2: バックエンドを起動し、ビルド済みフロントエンドを静的配信する
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

# ビルド成果物（dist/）を ./static/ に配置し、FastAPI が "/" で配信する
COPY --from=frontend-build /frontend/dist/ ./static/

EXPOSE 8000

CMD [".venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
