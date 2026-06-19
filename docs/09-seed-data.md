# 09 — Seed Data

A separate, **idempotent** script (`apps/backend/src/db/seed.ts`, run via
`bun run db:seed`). Never part of migrations. Re-running must not duplicate rows —
guard with an "if table empty" check or upserts on natural keys (`isbn`,
`no_anggota`).

## Required volume (from the brief / NFR-07)

| Entity | Count | Detail |
|--------|------:|--------|
| Users (staff) | **≥ 1** | at least one login so the app is reachable; password argon2id-hashed |
| Buku | **≥ 20** | spread across several `kategori`; a few with `stok_tersedia < stok` (copies out on loan); at least one with `stok_tersedia = 0` (fully borrowed) |
| Anggota | **≥ 10** | mostly `aktif = true`; include 1–2 inactive to exercise LOAN-03 |
| Peminjaman | **≥ 12** | mixed statuses: active, overdue, returned-on-time, returned-late |

## Staff login (users)

Seed **at least one** staff account so a reviewer can sign in immediately. Hash the
password with `Bun.password.hash` (argon2id); the plaintext below is for **demo
only** and must be listed in the root `README.md` login section.

| username | password | nama |
|----------|----------|------|
| `petugas` | `password` | Petugas Perpustakaan |

> A second account (e.g. `admin` / `password`) is fine but carries no extra
> privilege — there are no roles ([04-authentication.md](./04-authentication.md)).

## Buku

20+ realistic Indonesian titles across categories (Fiksi, Non-Fiksi, Sains, Agama,
Sejarah, Teknologi). Vary `stok` (e.g. 1–6) and give each a unique `isbn` (or leave
some null to exercise the "unique-if-present" path). Set `stok_tersedia` **consistent
with the active loans you seed** — i.e. `stok_tersedia = stok − (active dipinjam
copies of that book)`. At least:

- one book with `stok_tersedia = 0` (so the UI shows the **Habis** badge and a new
  loan against it returns 409 `"Stok buku tidak tersedia."`);
- a few with `stok_tersedia < stok` (visible "some out on loan");
- the rest fully available (`stok_tersedia = stok`).

## Anggota

10+ members with realistic Indonesian `nama`, `kelas` (e.g. `10 A`, `11 IPA 2`),
`telepon` (e.g. `081234567801`). `no_anggota` follows the generator: `LIB-0001` …
`LIB-00NN` in insertion order (see
[03-business-rules.md](./03-business-rules.md#member-number-generation)). Mark 1–2
as `aktif = false` so a reviewer can confirm an inactive member is rejected on loan
creation.

## Peminjaman — 12+ across all statuses

Distribute so **every** effective status is represented and the dashboard shows
non-trivial numbers at first load:

| count | effective status | how to seed it | purpose for the demo |
|------:|------------------|----------------|----------------------|
| 4 | `dipinjam` (on time) | `status='dipinjam'`, `tanggal_kembali_rencana` in the future, `aktual=null`, `denda=0` | active loans; show **Kembalikan** action |
| 3 | `terlambat` | `status='dipinjam'`, `tanggal_kembali_rencana` in the **past**, `aktual=null`, `denda=0` | overdue (derived); list shows red badge + projected denda |
| 3 | `dikembalikan` (on time) | `status='dikembalikan'`, `aktual ≤ rencana`, `denda=0` | clean returns |
| 2 | `dikembalikan` (late) | `status='dikembalikan'`, `aktual > rencana`, `denda = days_late × 1000` | non-zero `denda`; feeds `totalDenda` |

Total: 12+. For each row keep the data **consistent with the invariants** in
[03](./03-business-rules.md):

- Every active (`dipinjam`) loan must correspond to a `stok_tersedia` that is
  reduced by exactly that many copies on the referenced book.
- `terlambat` rows are just `dipinjam` rows whose due date is already past — do **not**
  store a `terlambat` status; the system derives it (and `dendaProyeksi`) from the
  dates. Pick due dates a few days back so the projected fine is a clean figure
  (e.g. 3 days → `Rp 3.000`).
- `dikembalikan` rows have a non-null `tanggal_kembali_aktual`; the late ones have a
  `denda` that equals `(aktual − rencana) × 1000` exactly, so the stored value
  matches what `hitungDenda` would produce.
- No member has two active (`dipinjam`) loans for the **same** book (LOAN-04).
- Vary `tanggal_pinjam` / `tanggal_kembali_rencana` around the seed date so the
  dashboard `terlambat` count and `totalDenda` are both non-zero.

## Idempotency pattern

```ts
// pseudocode
if ((await db.select().from(buku)).length > 0) {
  console.log('Seed sudah ada, dilewati.')
  process.exit(0)
}
// else insert users (hash passwords) → buku → anggota (generate no_anggota) → peminjaman,
// adjusting each book's stok_tersedia to match the active loans created.
```

This makes `SEED_ON_START=true` (see [07-docker-deployment.md](./07-docker-deployment.md))
safe on every container restart.

> **Tip:** seed the books first with `stok_tersedia = stok`, then create the active
> loans through the *same* `createLoan` service path (or a helper that mirrors it) so
> the stock decrement and consistency are guaranteed by the real code, not by
> hand-entered numbers that can drift.
