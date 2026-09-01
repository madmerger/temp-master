# フロントエンド (React + Vite) のビルド
FROM node:22-slim AS frontend-build
WORKDIR /frontend

COPY switchbot-frontend/package.json switchbot-frontend/package-lock.json ./
RUN npm ci

COPY switchbot-frontend/ ./
RUN npm run build

# バックエンド (FastAPI) の実行イメージ。フロントの静的ファイルも配信する
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

# ビルド済みフロントエンドを root に配置: served at /
COPY --from=frontend-build /frontend/dist/ ./static/

EXPOSE 8000

CMD [".venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
