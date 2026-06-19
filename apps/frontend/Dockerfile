# Multi-stage: build with Bun, serve with nginx.
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/frontend apps/frontend

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app/apps/frontend

# Production build MUST be vite-only (no tsc). `import type { App }` is erased by esbuild,
# so backend SOURCE is not needed here. Type-checking happens in dev/CI. See 01-architecture.md.
RUN bun run build

FROM nginx:alpine AS serve
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
