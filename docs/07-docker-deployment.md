# 07 — Docker & Deployment

Goal: the **entire stack** runs with a single `docker compose up`. Three services:
**backend** (Bun + Elysia, HTTP), **frontend** (nginx serving the built SPA),
**mariadb**.

> **MariaDB, not MySQL.** The database is **MariaDB** (a MySQL-compatible fork). It
> speaks the MySQL wire protocol, so the `mysql2` driver, Drizzle's `mysql` dialect,
> and `mysql://` connection URLs all work unchanged — only the Docker image, env-var
> prefix, and healthcheck differ. See [11-dependencies.md](./11-dependencies.md).

## Topology

```mermaid
flowchart TB
    subgraph compose["docker compose"]
        fe["frontend\nnginx :80 → host :5173"]
        be["backend\nBun + Elysia :3000"]
        db[("mariadb:12.3 :3306\nnamed volume")]
    end
    user((Browser)) --> fe
    user -- "REST" --> be
    be -- "mysql2 driver" --> db
    be -. waits for healthy .-> db
```

> The browser talks to the backend directly via `VITE_API_URL` (baked at build
> time). nginx only serves static assets + SPA fallback. There is no WS upgrade and
> no realtime service — a strictly simpler topology than Project 1.

## docker-compose.yml (shape)

```yaml
services:
  mariadb:
    image: mariadb:12.3   # matches local dev (MariaDB 12.3.x) — see 11-dependencies.md
    environment:
      MARIADB_ROOT_PASSWORD: ${MARIADB_ROOT_PASSWORD}
      MARIADB_DATABASE: ${MARIADB_DATABASE}
      MARIADB_USER: ${MARIADB_USER}
      MARIADB_PASSWORD: ${MARIADB_PASSWORD}
    ports: ["${MARIADB_PORT:-3306}:3306"]
    volumes: ["mariadb_data:/var/lib/mysql"]
    healthcheck:
      # MariaDB ships healthcheck.sh; --connect verifies the server accepts connections
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 5s
      retries: 20

  backend:
    build: { context: ., dockerfile: apps/backend/Dockerfile }
    environment:
      DATABASE_URL: mysql://${MARIADB_USER}:${MARIADB_PASSWORD}@mariadb:3306/${MARIADB_DATABASE}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      PORT: 3000
      CORS_ORIGIN: ${CORS_ORIGIN}
      SEED_ON_START: ${SEED_ON_START:-true}
    ports: ["${BACKEND_PORT:-3000}:3000"]
    depends_on:
      mariadb: { condition: service_healthy }

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL}
    ports: ["${FRONTEND_PORT:-5173}:80"]
    depends_on: [backend]

volumes:
  mariadb_data:
```

> `VITE_API_URL` is a **build arg** (Vite inlines env at build time), not runtime
> env. Backend config (incl. `JWT_SECRET`) is **runtime** env — use a long random
> secret in any real deployment (see [04-authentication.md](./04-authentication.md)).

## Backend Dockerfile (`apps/backend/Dockerfile`)

Built from the **monorepo root** context so workspace packages (`packages/shared`)
resolve.

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app
# install with workspace manifests for cached deps
COPY package.json bun.lockb ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile
# source
COPY packages/shared packages/shared
COPY apps/backend apps/backend
WORKDIR /app/apps/backend
# entrypoint runs migrations (+ optional seed) then starts
CMD ["sh", "-c", "bun run db:migrate && ([ \"$SEED_ON_START\" = \"true\" ] && bun run db:seed || true) && bun run start"]
```

- `db:migrate` applies generated Drizzle migrations (idempotent).
- `db:seed` runs only when `SEED_ON_START=true` and is itself idempotent
  (see [09-seed-data.md](./09-seed-data.md)) — safe to re-run.
- `start` = `bun run src/index.ts` (Elysia listens on `PORT`, HTTP only).

## Frontend Dockerfile (`apps/frontend/Dockerfile`)

Multi-stage: build with Bun, serve with nginx.

```dockerfile
FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lockb ./
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend
ARG VITE_API_URL
WORKDIR /app/apps/frontend
# Production build MUST be vite-only (no tsc). `import type { App }` from the backend
# is erased by esbuild, so backend source is NOT copied here. Type-checking against
# the Eden App type happens in dev/CI, not in this container. See 01-architecture.md.
RUN bun run build         # package.json "build": "vite build"  (NOT "tsc && vite build")

FROM nginx:alpine AS serve
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
```

`nginx.conf` must include SPA history fallback:

```nginx
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;   # client-side routing
  }
}
```

## Environment variables — `.env.example`

Every variable documented; copy to `.env` before running.

```dotenv
# --- MariaDB ---
MARIADB_ROOT_PASSWORD=changeme_root
MARIADB_DATABASE=perpustakaan_sekolah
MARIADB_USER=perpustakaan
MARIADB_PASSWORD=changeme
MARIADB_PORT=3306

# --- Backend ---
BACKEND_PORT=3000
# scheme stays mysql:// — the mysql2 driver speaks MariaDB's (MySQL-compatible) wire protocol
DATABASE_URL=mysql://perpustakaan:changeme@mariadb:3306/perpustakaan_sekolah
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
SEED_ON_START=true

# --- Frontend (build-time, inlined by Vite) ---
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:3000
```

## Run

```bash
cp .env.example .env        # then edit secrets
docker compose up --build   # mariadb → backend (migrate+seed) → frontend
# open http://localhost:5173
```

The root `README.md` documents this Docker path **first**, with a manual
(`bun install` + local MariaDB) fallback as secondary.

## Operational notes

- CORS: backend allows `CORS_ORIGIN` (the frontend URL). No cookies, no tokens.
- Migrations run on every backend start and are idempotent; the DB volume persists
  data across `up`/`down` (use `docker compose down -v` to reset).
- "Today" for overdue/fine logic is the **backend container clock** — keep the host
  timezone sane (or set `TZ`) so `terlambat` and `denda` match expectations
  (FRD §8 assumption). See [03-business-rules.md](./03-business-rules.md).
