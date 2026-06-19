# Built from the monorepo ROOT context so workspace packages resolve.
FROM oven/bun:1 AS base
WORKDIR /app

# Install with all workspace manifests so the lockfile resolves (frozen, reproducible).
COPY package.json bun.lock tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile

# Source (frontend source is NOT needed by the backend runtime).
COPY packages/shared packages/shared
COPY apps/backend apps/backend

WORKDIR /app/apps/backend

# Entrypoint: apply migrations, optionally seed (idempotent), then start Elysia (HTTP).
CMD ["sh", "-c", "bun run db:migrate && ([ \"$SEED_ON_START\" = \"true\" ] && bun run db:seed || true) && bun run start"]
