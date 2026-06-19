# 10 — Testing Strategy

Pragmatic, not exhaustive. Cover the rules most likely to break and most painful if
wrong: **stock integrity**, **fine calculation**, the **derived `terlambat` status**,
and the **loan/return guards**. Skip trivial CRUD glue.

## Backend — `bun:test`

Bun's built-in test runner; no extra framework. Run with `bun test`.

### What to test (priority order)

1. **Fine calculation** (`lib/fines.ts`) — pure and high-value:
   - on-time return → `0` (FINE-02);
   - 3 days late → `3000` (FINE-01);
   - null actual date → `0`, no throw (FINE-03);
   - same-day return → `0` (boundary).
2. **Derived status** (`lib/loan-status.ts`):
   - `dipinjam` + due date in the future → `dipinjam`;
   - `dipinjam` + due date in the past → `terlambat`;
   - `dikembalikan` → always `dikembalikan` regardless of dates.
3. **Loan creation guards** (`modules/peminjaman/service.ts`):
   - `stok_tersedia = 0` → `ConflictError` (LOAN-02);
   - inactive member → `ConflictError` (LOAN-03);
   - duplicate active loan for the same book → `ConflictError` (LOAN-04);
   - `tanggalKembaliRencana < tanggalPinjam` → `ValidationError` (LOAN-07);
   - happy path → status `dipinjam` **and** book `stok_tersedia` decremented by 1.
4. **Return guards**:
   - returning an already-`dikembalikan` loan → `ConflictError` (RET-05);
   - happy path → status `dikembalikan`, `stok_tersedia` incremented, `denda` set.
5. **Stock invariant** — after a create-then-return cycle, `stok_tersedia` equals the
   original value (no drift); never goes below 0 or above `stok`.
6. **Delete guards** — deleting a book/member with an active loan → 409
   (BOOK-08 / MEMBER-08).
7. **Auth** — `POST /api/auth/login` with valid credentials returns a token +
   `UserDTO` (no `password`); wrong credentials → 401. A protected route
   (e.g. `GET /api/buku`) without a bearer token → 401, with a valid token → 200.
8. **Envelope shape** — a couple of integration tests asserting every response has
   `{ success, data, message }`.

### Approach

- Unit-test `hitungDenda` and `statusEfektif` directly — they're pure functions, the
  cheapest and highest-leverage tests in the suite.
- Unit-test services with a **repository test double** (in-memory) so guard logic is
  tested without a DB.
- A small set of **integration tests** hit real Elysia routes against a disposable
  MariaDB (or `mariadb` test container) to verify the **transactional** stock
  changes, validation (422 shape), and the `status=terlambat` WHERE clause
  end-to-end. Use `app.handle(new Request(...))` to drive routes in-process.

```ts
// example — fine calculation
test('denda: 3 hari terlambat = Rp 3.000', () => {
  expect(hitungDenda('2026-06-10', '2026-06-13')).toBe(3000)
})
test('denda: dikembalikan tepat waktu = 0', () => {
  expect(hitungDenda('2026-06-10', '2026-06-10')).toBe(0)
})
test('denda: belum dikembalikan = 0 (aman pada null)', () => {
  expect(hitungDenda('2026-06-10', null)).toBe(0)
})

// example — loan guard
test('pinjam ditolak saat stok habis', async () => {
  const svc = new PeminjamanService(fakeRepo({ buku: { stokTersedia: 0 } }))
  await expect(svc.createLoan({ anggotaId: 1, bukuId: 1, /* … */ }))
    .rejects.toThrow(ConflictError)
})
```

## Frontend — Vitest + React Testing Library

Run with `bun run test` (Vitest). Focus on behavior users depend on, not snapshots.

### What to test

1. **Denda preview** — `KembalikanModal` shows `Rp 0` for an on-time date and the
   correct `Rp N.000` as the picked return date moves past the due date (mirrors
   FINE-04). The preview must match the backend `hitungDenda`.
2. **Kembalikan action enablement** — the inline action appears only for rows whose
   `statusEfektif` is `dipinjam` / `terlambat`, never for `dikembalikan`.
3. **Formatting** — `formatRupiah(1000)` → `"Rp 1.000"`; `formatTanggal` renders
   `DD MMM YYYY`; status labels map correctly (`terlambat` → "Terlambat", red).
4. **Filters** — selecting status `terlambat` re-queries with the right key; search
   by judul / nama updates the query.
5. **Form validation** — the loan form blocks submit when the due date precedes the
   loan date; surfaces server 409s (e.g. "Stok buku tidak tersedia.") as a toast.
6. **Auth guard** — `ProtectedRoute` redirects to `/login` with no session; after a
   successful login the user lands on the dashboard. A simulated `401` clears the
   token and redirects to `/login`.

Mock the Eden `api` client; assert on rendered output and calls.

## What we deliberately **don't** test

- Mantine internals / styling.
- Drizzle/MariaDB itself (trust the ORM) — but **do** integration-test our
  transactional stock logic, since that's our code, not the ORM's.
- Every CRUD permutation — one representative create/read/update/delete per resource
  is enough; the value is in fines, stock, and the derived status, already covered.

## CI hook (optional)

A single `bun run test` at the repo root that runs both packages' suites. Keep it
fast (<30s) so it's actually run. Lint (`bun run lint`, Biome) runs alongside.
