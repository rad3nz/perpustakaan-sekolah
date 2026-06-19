# Perpustakaan Sekolah — Implementation Guidelines

This directory is the **canonical specification** for the *Sistem Perpustakaan
Sekolah* (school library system) project. It pins down architecture, schema,
contracts, and conventions so that implementation is mechanical: every name,
type, rule, and endpoint is decided here before any code is written.

> **Language rule (applies everywhere):** all **UI-facing text is Indonesian**
> (labels, buttons, errors); all **code identifiers are English** (variables,
> functions, routes, column names). Domain nouns (`buku`, `anggota`,
> `peminjaman`, status enum values) keep their Indonesian spelling because they
> are domain terms, not UI copy. See [08-conventions.md](./08-conventions.md).

## Locked stack

The stack mirrors the companion *Sistem Perizinan Santri* project for consistency
across the two-project submission.

| Layer | Decision |
|-------|----------|
| Runtime | **Bun** |
| Backend framework | **ElysiaJS** |
| Frontend | **React + Vite + Mantine (behavior) + Tailwind CSS (styling)** |
| Repo layout | **Bun workspace monorepo** (`apps/backend`, `apps/frontend`, `packages/shared`) + Eden Treaty |
| ORM | **Drizzle ORM** |
| Database | **MariaDB** (MySQL-compatible) |
| Auth | **JWT bearer token — login only, no roles** |

> **Mantine + Tailwind, together on purpose.** Mantine provides component
> *behavior and accessibility* (Modal, Select, the date picker, form hooks);
> **Tailwind provides the styling** via utility classes. The two are wired so
> Tailwind's utilities win the cascade over Mantine's defaults — see
> [12-style-guide.md](./12-style-guide.md).

## Reading order

| # | Doc | Purpose |
|---|-----|---------|
| 00 | [overview.md](./00-overview.md) | Purpose, glossary, monorepo layout, stack rationale, scope boundaries |
| 01 | [architecture.md](./01-architecture.md) | System diagram, request lifecycle, Eden type-sharing |
| 02 | [data-model.md](./02-data-model.md) | Drizzle schema, ER diagram, migrations |
| 03 | [business-rules.md](./03-business-rules.md) | Loan lifecycle, stock invariants, fine calculation, member-number generation |
| 04 | [authentication.md](./04-authentication.md) | JWT login flow, auth macro, token storage (no roles) |
| 05 | [api-spec.md](./05-api-spec.md) | Every endpoint: request/response, validation, envelope |
| 06 | [frontend.md](./06-frontend.md) | React structure, Mantine+Tailwind styling, routing, data layer, formatting |
| 07 | [docker-deployment.md](./07-docker-deployment.md) | docker-compose, Dockerfiles, env, one-command run |
| 08 | [conventions.md](./08-conventions.md) | Naming, envelope helper, error handling, currency/date formatting, lint |
| 09 | [seed-data.md](./09-seed-data.md) | Seed spec (staff login, ≥20 buku, ≥10 anggota, ≥12 peminjaman) |
| 10 | [testing.md](./10-testing.md) | Test strategy (bun:test, Vitest + RTL) |
| 11 | [dependencies.md](./11-dependencies.md) | Pinned dependency manifest (latest stable, verified 2026-06-19) |
| 12 | [style-guide.md](./12-style-guide.md) | Tailwind theme + brand palette, Mantine bridge, status badge tones |

## Pinned cross-cutting decisions

1. **`terlambat` is a derived status, not a stored one.** The persisted `status`
   column only ever holds `dipinjam` or `dikembalikan`. `terlambat` (overdue) is
   computed at read time from `tanggal_kembali_rencana < today AND
   tanggal_kembali_aktual IS NULL`. This avoids needing a background scheduler to
   flip rows. See [03-business-rules.md](./03-business-rules.md).
2. **Stock changes are transactional.** Creating a loan (`stok_tersedia -= 1`)
   and processing a return (`stok_tersedia += 1`) run inside a DB transaction
   with the loan write, so `stok_tersedia` can never drift or go negative.
3. **Fines are computed, never trusted from the client.** `denda` is calculated
   server-side as `max(0, days_late) × Rp 1.000` on return; the UI shows a
   *preview* but the server is authoritative. Null `tanggal_kembali_aktual` ⇒ no
   fine. See [03](./03-business-rules.md) FINE rules.
4. **Authentication, not authorization.** A JWT login gates the whole API (every
   `/api/*` except login requires a valid bearer token), but there are **no
   roles** — any authenticated staff user may do everything. See
   [04-authentication.md](./04-authentication.md).
5. **Mantine for behavior, Tailwind for looks.** Components come from Mantine;
   styling is Tailwind utilities, ordered to win over Mantine's CSS layer. See
   [12-style-guide.md](./12-style-guide.md).
