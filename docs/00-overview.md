# 00 — Overview

## What we are building

A **school library management system**. Library staff maintain a **book
catalogue** (inventory and per-title stock), register **members** permitted to
borrow, and record **loans** — tracking returns and computing **overdue fines**.
A dashboard summarises the library at a glance. The whole thing is operated by
**library staff** who sign in with a username and password; there is a single kind
of user (no role hierarchy) — see [Scope](#scope--non-goals).

The core workflow is the **loan**: a member borrows a copy of a book, which
decrements that book's available stock; later the copy is returned, which
restores stock and — if the return is late — charges a fine of **Rp 1.000 per day
overdue**.

## Domain glossary

These Indonesian terms are used verbatim as code identifiers (table/column names,
enum values) and appear in the UI. Learn them once.

| Term | Meaning | Used as |
|------|---------|---------|
| **petugas** | Library staff — the system's only user kind (logs in) | concept / `users` table |
| **buku** | A book title in the catalogue | table |
| **anggota** | A registered library member (student/staff) | table |
| **peminjaman** | A loan record linking one member to one book copy | table |
| **judul** | Book title | field |
| **pengarang** | Author | field |
| **penerbit** | Publisher | field |
| **tahun_terbit** | Publication year | field |
| **kategori** | Book category (e.g. Fiksi, Sains, Agama, Sejarah) | field |
| **stok** | Total physical copies the library owns | field |
| **stok_tersedia** | Copies currently available to borrow | field |
| **no_anggota** | Auto-generated member number, e.g. `LIB-0001` | field |
| **kelas** | Class / grade of the member | field |
| **aktif** | Whether a member may currently borrow | field |
| **tanggal_pinjam** | Loan (checkout) date | field |
| **tanggal_kembali_rencana** | Planned return date / due date | field |
| **tanggal_kembali_aktual** | Actual return date (null until returned) | field |
| **dipinjam** | "borrowed" — copy is on loan, not yet returned | status |
| **dikembalikan** | "returned" — copy has been returned | status |
| **terlambat** | "overdue" — past due date, not yet returned (**derived**) | status |
| **denda** | Fine charged for a late return (IDR) | field |
| **kembalikan** | "return it" — the action that processes a return | action |

## Scope & non-goals

In scope:

- **Authentication** — staff log in; every `/api/*` route (except login) requires
  a valid JWT bearer token. See [04-authentication.md](./04-authentication.md).
- Full CRUD for **buku**, **anggota**, **peminjaman**.
- The **borrow → return** workflow with stock adjustment and fine calculation.
- A **dashboard stats** endpoint and summary-card UI.
- Indonesian UI, Rupiah/date formatting, seed data, Docker one-command run.

**Out of scope (explicit decisions, not omissions):**

- **Role-based authorization (RBAC).** There is exactly one kind of user (staff);
  any authenticated user may do everything. Authentication is in scope;
  *authorization* beyond "are you logged in" is not (FRD §8).
- Multi-branch / inter-library loans, online reservations, payment processing.
- Configurable fine rate (fixed at Rp 1.000/day) and multi-copy-per-loan (one
  loan = one copy of one book).

## Monorepo layout

A single **Bun workspace** lives under `perpustakaan-sekolah/`. The two apps each
have their own `Dockerfile` and run independently, but share types through
`packages/shared` and Elysia's Eden Treaty.

```
perpustakaan-sekolah/
├── package.json            # workspace root: { "workspaces": ["apps/*", "packages/*"] }
├── bun.lockb
├── docker-compose.yml
├── .env.example
├── README.md               # Docker-first run instructions
├── docs/                   # ← this specification
├── apps/
│   ├── backend/            # ElysiaJS + Bun + Drizzle
│   │   ├── Dockerfile
│   │   ├── drizzle.config.ts
│   │   └── src/
│   │       ├── index.ts            # app entry, exports `type App`
│   │       ├── db/                 # drizzle schema, client, migrations, seed
│   │       ├── modules/            # feature modules (auth, buku, anggota, peminjaman, dashboard)
│   │       ├── lib/                # envelope, errors, fines, member-number, jwt
│   │       └── middleware/         # cors, auth macro, error handler
│   └── frontend/           # React + Vite + Mantine (behavior) + Tailwind (styling)
│       ├── Dockerfile
│       ├── nginx.conf              # serve built static assets
│       ├── tailwind.config.ts      # or CSS @theme (Tailwind v4) — see 12-style-guide.md
│       └── src/
│           ├── main.tsx
│           ├── index.css           # Tailwind + layered Mantine imports
│           ├── api/                # Eden Treaty client (+ auth header) + React Query hooks
│           ├── auth/               # auth store (Zustand) + useAuth
│           ├── routes/             # route definitions + ProtectedRoute
│           ├── pages/              # login, dashboard, buku, anggota, peminjaman
│           ├── components/         # shared UI (DataTable, StatCard, StatusBadge, …)
│           └── lib/                # formatting (rupiah, dates), labels, cn() helper
└── packages/
    └── shared/             # types/enums shared by both apps (status, DTOs)
```

## Why this stack (rationale, briefly)

- **Bun + ElysiaJS** — one fast TypeScript runtime; Elysia's TypeBox validation
  and Eden Treaty give end-to-end type safety with almost no boilerplate.
- **Drizzle + MariaDB** — SQL-first, lightweight, excellent type inference; MariaDB
  is a proper multi-container DB server (SQLite is explicitly disallowed). MariaDB
  is MySQL-compatible, so the `mysql2` driver and Drizzle's `mysql` dialect apply
  unchanged. Crucially, transactions let us keep `stok_tersedia` correct under the
  borrow/return flow (see [03](./03-business-rules.md)).
- **React + Vite + Mantine + Tailwind** — fast SPA dev loop; Mantine supplies
  accessible component *behavior* and hooks (including `@mantine/dates` for the
  return date picker), while **Tailwind** supplies the *styling* via utility
  classes. See [12-style-guide.md](./12-style-guide.md) for how the two are wired.
- **JWT auth (login only)** — `@elysiajs/jwt` + `Bun.password` (argon2id). Gates
  the API behind a staff login; no roles. See [04-authentication.md](./04-authentication.md).

> **Authentication, not authorization.** Staff log in and receive a bearer token
> that every `/api/*` route requires, but there is exactly one user kind — no role
> matrix. This keeps the security model honest (the terminal isn't world-open)
> without inventing permissions the FRD doesn't call for.

## Non-functional requirements (must all hold)

- Consistent JSON envelope `{ success, data, message }` on every response.
- Proper HTTP status codes (200/201/401/404/409/422/500).
- All `/api/*` routes except login require a valid JWT bearer token (401 otherwise).
- Input validation with meaningful, Indonesian error messages.
- CORS enabled.
- `stok_tersedia` must never go below 0 or exceed `stok`.
- Fine calculation must handle a null `tanggal_kembali_aktual` safely.
- Currency as `Rp 1.000` (dot thousands separator); dates as `DD MMM YYYY`.
- Seed data present (see [09-seed-data.md](./09-seed-data.md)).
- Entire stack runnable with a single `docker compose up` (see [07](./07-docker-deployment.md)).
