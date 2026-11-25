FROM node:24-bookworm-slim AS web
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN corepack enable && pnpm --filter @temp-master/web... install --frozen-lockfile

COPY apps/web/ ./apps/web/
COPY packages/shared/ ./packages/shared/
ARG VITE_API_URL=https://snakeroom.fly.dev
RUN pnpm build

# FastAPI serves the built dashboard at /
FROM python:3.12-slim
WORKDIR /app

# Install poetry
RUN pip install poetry

# Copy and install backend dependencies
COPY switchbot-dashboard/switchbot-backend/pyproject.toml switchbot-dashboard/switchbot-backend/poetry.lock ./
RUN poetry config virtualenvs.create true && \
    poetry config virtualenvs.in-project true && \
    poetry install --only main --no-root --no-interaction --no-ansi

# Copy backend application code
COPY switchbot-dashboard/switchbot-backend/app/ ./app/

# Copy frontend to root: served at /
COPY --from=web /workspace/apps/web/dist/ ./static/

EXPOSE 8000

CMD [".venv/bin/fastapi", "run", "app/main.py", "--host", "0.0.0.0", "--port", "8000"]
