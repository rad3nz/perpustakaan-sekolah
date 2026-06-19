# 11 — Dependencies (pinned, latest stable)

Versions verified against the npm registry on **2026-06-19**. Use caret ranges
anchored to these majors/minors; the committed `bun.lockb` is the reproducible
source of truth. Re-run `bun update --latest` only deliberately, then re-test.

> **Heads-up — several current majors:** React **19**, Vite **8**, Mantine **9**,
> Tailwind **4**, TypeScript **6**, React Router **7**, Vitest **4**, Biome **2**. The
> guideline docs assume these. Notable peer constraints: Mantine 9 requires **React
> ≥19.2**; `@mantine/dates` needs **dayjs**; Tailwind 4 installs via the
> **`@tailwindcss/vite`** plugin; Elysia pulls **@sinclair/typebox** and **@types/bun**.

> **Auth + styling additions vs. the first draft:** the backend gains
> `@elysiajs/jwt` (login); the frontend gains **Tailwind 4** (+ `@tailwindcss/vite`,
> `clsx`, `tailwind-merge`) for styling and **`zustand`** for the small auth store.
> Password hashing uses the built-in `Bun.password` — no bcrypt/argon2 package. The
> stack otherwise matches the companion Project 1.

## Runtimes / images

| Component | Version | Notes |
|-----------|---------|-------|
| Bun | `oven/bun:1` | Image tag tracks latest stable **1.x**. Optionally pin a minor (e.g. `oven/bun:1.3`) for byte-reproducible builds. |
| MariaDB | `mariadb:12.3` | MySQL-compatible; tag matches local dev (MariaDB 12.3.x). The `mysql2` driver and Drizzle `mysql` dialect target it unchanged. |
| nginx | `nginx:alpine` | Serves the built SPA. Optionally pin (e.g. `nginx:1.29-alpine`). |
| Node | n/a | Not used at runtime; Bun is the runtime. |

## Backend — `apps/backend/package.json`

```jsonc
{
  "name": "@perpustakaan/backend",
  "type": "module",
  "scripts": {
    "start": "bun run src/index.ts",
    "dev": "bun --watch src/index.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "bun run src/db/migrate.ts",
    "db:seed": "bun run src/db/seed.ts",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  },
  "dependencies": {
    "@perpustakaan/shared": "workspace:*",
    "elysia": "^1.4.29",
    "@elysiajs/cors": "^1.4.2",
    "@elysiajs/jwt": "^1.4.2",
    "drizzle-orm": "^0.45.2",
    "mysql2": "^3.22.5"
  },
  "devDependencies": {
    "@types/bun": "^1.2.0",
    "drizzle-kit": "^0.31.10",
    "typescript": "^6.0.3"
  }
}
```

- `@sinclair/typebox` arrives transitively via Elysia (used through Elysia's `t`); no
  need to depend on it directly.
- `@elysiajs/jwt` signs/verifies the bearer token; **password hashing is
  `Bun.password` (argon2id), built into the runtime** — no bcrypt/argon2 package.
- No `ws`/`socket.io` — there is no realtime channel.

## Frontend — `apps/frontend/package.json`

```jsonc
{
  "name": "@perpustakaan/frontend",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",            // vite-only; tsc is a separate step (see 01/06)
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@perpustakaan/shared": "workspace:*",
    "@elysiajs/eden": "^1.4.9",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.0",
    "@tanstack/react-query": "^5.101.0",
    "zustand": "^5.0.14",
    "@mantine/core": "^9.3.2",
    "@mantine/hooks": "^9.3.2",
    "@mantine/form": "^9.3.2",
    "@mantine/dates": "^9.3.2",
    "@mantine/notifications": "^9.3.2",
    "dayjs": "^1.11.21",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "vite": "^8.0.16",
    "@vitejs/plugin-react": "^6.0.2",
    "tailwindcss": "^4.1.18",
    "@tailwindcss/vite": "^4.1.18",
    "typescript": "^6.0.3",
    "vitest": "^4.1.9",
    "jsdom": "^29.1.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/user-event": "^14.6.1"
  }
}
```

- **Tailwind 4** is wired through the official `@tailwindcss/vite` plugin (no
  `postcss.config` needed). `clsx` + `tailwind-merge` back the `cn()` helper. CSS
  layer ordering with Mantine is covered in [12-style-guide.md](./12-style-guide.md).
- `zustand` holds the small auth store (token + current user). React Query still
  owns all server state.

- `@elysiajs/eden` is a **frontend** dependency (the typed client). It imports the
  backend `App` **type only** — erased at build (see [01](./01-architecture.md)).
- `dayjs` is required by `@mantine/dates` (the return-date picker) and reused for the
  fine/overdue date math on the client preview.
- `@mantine/notifications` is used for **toasts** only (save success, server errors)
  — not realtime.
- Mantine 9 ships CSS imported once at the app entry. To coexist with Tailwind,
  import the **layered** variants (`@mantine/core/styles.layer.css`, etc.) and
  declare the `@layer` order so Tailwind utilities win — see
  [12-style-guide.md](./12-style-guide.md).

## Shared — `packages/shared/package.json`

```jsonc
{
  "name": "@perpustakaan/shared",
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "devDependencies": { "typescript": "^6.0.3" }
}
```

Dependency-light by design: enums + shared DTO/`App` types only (see [08](./08-conventions.md)).

## Root — `package.json` (workspace)

```jsonc
{
  "name": "perpustakaan-sekolah",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "bun run --filter '*' typecheck",
    "test": "bun run --filter '*' test"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.5.0",
    "typescript": "^6.0.3"
  }
}
```

## Version table (single glance)

| Package | Version | Package | Version |
|---------|---------|---------|---------|
| elysia | 1.4.29 | react / react-dom | 19.2.7 |
| @elysiajs/cors | 1.4.2 | react-router-dom | 7.18.0 |
| @elysiajs/jwt | 1.4.2 | @tanstack/react-query | 5.101.0 |
| @elysiajs/eden | 1.4.9 | zustand | 5.0.14 |
| drizzle-orm | 0.45.2 | @mantine/* | 9.3.2 |
| drizzle-kit | 0.31.10 | dayjs | 1.11.21 |
| mysql2 | 3.22.5 | tailwindcss / @tailwindcss/vite | 4.1.18 |
| typescript | 6.0.3 | clsx | 2.1.1 |
| @biomejs/biome | 2.5.0 | tailwind-merge | 3.4.0 |
| @types/bun | ≥1.2.0 | vite | 8.0.16 |
|  |  | @vitejs/plugin-react | 6.0.2 |
|  |  | vitest | 4.1.9 |
|  |  | jsdom | 29.1.1 |
|  |  | @testing-library/react | 16.3.2 |
|  |  | @testing-library/user-event | 14.6.1 |
|  |  | @testing-library/jest-dom | 6.9.1 |

## Upgrade discipline

- Pin via `^` to the versions above and commit `bun.lockb`.
- `drizzle-orm` is pre-1.0 (0.x): treat **minor** bumps as potentially breaking —
  read its changelog before bumping and re-run migrations + tests.
- After any `bun update`, run `bun run typecheck && bun run test` across the
  workspace before committing.
