# 08 — Conventions

## Language rule (non-negotiable)

| Surface | Language | Examples |
|---------|----------|----------|
| UI text | **Indonesian** | "Tambah Buku", "Stok buku tidak tersedia.", "Buku berhasil dikembalikan." |
| Code identifiers | **English** | `createLoan`, `tanggalKembaliAktual` (column), `PeminjamanService` |
| Domain enum values | Indonesian (they are domain terms) | `dipinjam`, `dikembalikan`, `terlambat` |
| DB column names | English `snake_case` around Indonesian nouns | `tanggal_kembali_rencana`, `stok_tersedia`, `no_anggota` |
| TS identifiers | English `camelCase` / `PascalCase` | `stokTersedia`, `BukuDTO` |

`tanggal_kembali_rencana`, `stok_tersedia`, etc. are English *structure* around
Indonesian *domain nouns* — that's intentional and consistent.

## Response envelope helper

The single place envelopes are constructed. Every route returns through it.

```ts
// apps/backend/src/lib/envelope.ts
export const envelope = {
  ok<T>(data: T, message = 'Berhasil.') {
    return { success: true, data, message }
  },
  fail(message: string, errors?: Record<string, string[]>) {
    return { success: false, data: null, message, ...(errors ? { errors } : {}) }
  },
}
```

## Error handling

Domain errors are typed and carry an HTTP status; `onError` maps them to the
envelope so handlers never build error responses by hand.

```ts
// apps/backend/src/lib/errors.ts
export class AppError extends Error {
  constructor(public status: number, message: string,
              public errors?: Record<string, string[]>) { super(message) }
}
export class ValidationError extends AppError { constructor(m: string, e?: any) { super(422, m, e) } }
export class UnauthorizedError extends AppError { constructor(m = 'Tidak terautentikasi.') { super(401, m) } }
export class NotFoundError extends AppError { constructor(m = 'Data tidak ditemukan.') { super(404, m) } }
export class ConflictError extends AppError { constructor(m: string) { super(409, m) } }
```

```ts
// global handler (registered on the root app)
app.onError(({ code, error, set }) => {
  if (error instanceof AppError) {
    set.status = error.status
    return envelope.fail(error.message, error.errors)
  }
  if (code === 'VALIDATION') {        // Elysia/TypeBox validation failure
    set.status = 422
    return envelope.fail('Input tidak valid.', formatTypeBoxErrors(error))
  }
  if (code === 'NOT_FOUND') { set.status = 404; return envelope.fail('Rute tidak ditemukan.') }
  set.status = 500
  console.error(error)                // log details server-side
  return envelope.fail('Terjadi kesalahan pada server.')   // never leak internals
})
```

- **409** is the workhorse here: no stock, inactive member, duplicate active loan,
  delete-with-active-loan, already-returned. Each carries a specific Indonesian
  message (see [05-api-spec.md](./05-api-spec.md)).
- **422** is reserved for input validation and carries field-level `errors`.
- **401** comes from the auth macro (missing/invalid/expired token) — see
  [04-authentication.md](./04-authentication.md). There is no `ForbiddenError`/403:
  with no roles, an authenticated user is never *forbidden*, only *unauthenticated*.
- **500** messages are always generic Indonesian; the real error is logged, not sent.

## Currency & dates

The two locale concerns that this project (unlike the companion) actually exercises.

```ts
// frontend: apps/frontend/src/lib/format.ts
export const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID')   // "Rp 1.000"
export const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) // "15 Jan 2025"
```

- **Currency:** `Rp` + space + integer with **dot** as the thousands separator
  (Indonesian locale). `denda` is stored as a plain integer of Rupiah; never store a
  formatted string. Format only at the view layer.
- **Dates:** display `DD MMM YYYY`; transmit and store ISO `YYYY-MM-DD`. Date
  arithmetic for fines/overdue works on ISO dates in whole days (see
  [03-business-rules.md](./03-business-rules.md)).
- **Date math lives in one place** (`lib/fines.ts` backend, mirrored in the FE
  preview) so the fine number is identical on both sides.

## Styling (Tailwind + Mantine)

- **Tailwind owns appearance; Mantine owns behavior.** Style with utility classes
  on `className`; reach for Mantine's `classNames` prop only when an inner element
  needs it. Full theme + CSS-layer setup is in [12-style-guide.md](./12-style-guide.md).
- **Compose classes with `cn()`** (`clsx` + `tailwind-merge`), never string
  concatenation — `tailwind-merge` resolves conflicting utilities so the last one
  wins predictably.
- **Reference brand tokens, not raw hex** — use the Tailwind theme tokens
  (`bg-brand-600`, `text-navy-900`), defined once in the style guide. No arbitrary
  `bg-[#781118]` in components.
- **No inline styles** for anything Tailwind can express; no Mantine `sx`/`styles`
  for what a utility class can do. Keep one styling system per surface.

## Validation

- Request shape validation: Elysia **TypeBox** schemas on every route (`body`,
  `query`, `params`). These produce `VALIDATION` errors → 422.
- Cross-field / business validation (date ordering, stock, active-loan,
  ISBN-uniqueness): in the **service** layer, throwing `ValidationError` /
  `ConflictError`.
- Validation messages are Indonesian and specific (see [05](./05-api-spec.md)).

## Module structure (backend)

Each feature is a vertical slice and an Elysia plugin:

```
modules/<feature>/
  routes.ts        # Elysia instance: paths + TypeBox + delegates to service
  service.ts       # business rules, transactions, fine/stock logic
  repository.ts    # Drizzle queries only
  dto.ts           # toDTO() serializers (denormalize names, add statusEfektif/dendaProyeksi)
```

The root `index.ts` `.use()`s each module and exports `type App` for Eden.

## Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | `kebab-case.ts` | `member-number.ts`, `loan-status.ts` |
| Components (FE) | `PascalCase.tsx` | `KembalikanModal.tsx`, `StatusBadge.tsx` |
| React hooks | `useX` | `usePeminjaman` |
| DB tables | domain singular (`buku`, `anggota`, `peminjaman`) | — |
| DB columns | `snake_case` | `tanggal_kembali_aktual` |
| TS vars/fns | `camelCase` | `hitungDenda`, `statusEfektif` |
| Types/classes | `PascalCase` | `PeminjamanDTO`, `ConflictError` |
| Env vars | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `CORS_ORIGIN` |
| Routes | `kebab-case` nouns + the one action verb | `/api/peminjaman`, `/kembalikan` |

## Tooling

- **Lint/format:** Biome (single fast tool for both), config at repo root; run in CI
  and via `bun run lint` / `bun run format`.
- **TypeScript:** `strict: true` across all packages; shared `tsconfig.base.json`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- **Imports:** workspace packages via their names (`@perpustakaan/shared`,
  `@perpustakaan/backend`), not relative paths across package boundaries.

## Shared package boundary

`packages/shared` contains only things **both** apps need and that have no runtime
deps on a specific app: enums (`PEMINJAMAN_STATUS`, `KATEGORI_CONTOH`), shared DTO
types, and a re-export of the backend `App` type for Eden. Keep it dependency-light
so the frontend never pulls server-only code.
