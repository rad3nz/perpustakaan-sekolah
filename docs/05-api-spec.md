# 05 — API Specification

Base path: `/api`. All responses use the envelope below. Validation via Elysia
**TypeBox** (`t`). Business rules per [03-business-rules.md](./03-business-rules.md).
**Every endpoint except `POST /api/auth/login` requires a valid JWT bearer token**
(`Authorization: Bearer <token>`); a missing/invalid token returns **401**. There
are no roles — any authenticated staff user may call any endpoint. See
[04-authentication.md](./04-authentication.md).

## Response envelope

Every response — success or error — is:

```ts
type Envelope<T> = {
  success: boolean
  data: T | null
  message: string          // Indonesian, human-readable
  errors?: Record<string, string[]>   // present only on 422 validation failures
}
```

Helpers (see [08-conventions.md](./08-conventions.md)):

```ts
envelope.ok(data, message?)                 // { success:true, data, message }
envelope.fail(message, errors?)             // { success:false, data:null, message, errors }
```

## HTTP status codes

| Code | When |
|------|------|
| 200 | Successful GET / PUT / PATCH / DELETE |
| 201 | Resource created (POST) |
| 400 | Malformed request (bad JSON, bad param type) |
| 401 | Missing/invalid/expired token (any endpoint except login) |
| 404 | Resource not found |
| 409 | Business conflict (no stock, inactive member, duplicate active loan, delete with active loan, already returned) |
| 422 | Input validation failed (field-level `errors` populated) |
| 500 | Unhandled error (generic Indonesian message; details logged, never leaked) |

## Pagination & filtering (list endpoints)

List endpoints accept optional query params (CRUD-03):

- `page` (default 1), `limit` (default 20, max 100)
- resource-specific filters (documented per endpoint)

List `data` shape:

```ts
type Paginated<T> = { items: T[]; total: number; page: number; limit: number }
```

---

## Auth

### `POST /api/auth/login` — public
```ts
body: t.Object({ username: t.String({ minLength: 1 }), password: t.String({ minLength: 1 }) })
```
- 200 → `data: { token: string, user: UserDTO }`
- 401 → `"Username atau password salah."`

### `POST /api/auth/logout` — authenticated
- 200 → `message: "Berhasil keluar."` (stateless; client discards the token)

### `GET /api/auth/me` — authenticated
- 200 → `data: UserDTO` (the current user; never includes `password`)

---

## Buku (Books)

### `GET /api/buku`
- query: `page`, `limit`, `search?` (matches `judul`), `kategori?`
- 200 → `Paginated<BukuDTO>`

### `POST /api/buku`
```ts
body: t.Object({
  judul: t.String({ minLength: 1, maxLength: 255 }),
  pengarang: t.String({ minLength: 1, maxLength: 150 }),
  penerbit: t.Optional(t.Nullable(t.String({ maxLength: 150 }))),
  tahunTerbit: t.Optional(t.Nullable(t.Integer({ minimum: 0, maximum: 9999 }))),
  isbn: t.Optional(t.Nullable(t.String({ maxLength: 20 }))),
  kategori: t.String({ minLength: 1, maxLength: 100 }),
  stok: t.Integer({ minimum: 0 }),
})
```
Service validation:
- `stok` non-negative integer (BOOK-03).
- `isbn` unique when provided (422 `"ISBN sudah digunakan."`) (BOOK-04).
- On create, `stok_tersedia = stok` (BOOK-02).
- 201 → `BukuDTO`

### `GET /api/buku/:id` → `BukuDTO` | 404
### `PUT /api/buku/:id`
- body as POST (all fields required as in create).
- If `stok` increases, `stok_tersedia` increases by the same delta (BOOK-06).
- `stok` may not be set below copies on loan (`stok − stok_tersedia`) → 422
  `"Stok tidak boleh kurang dari jumlah buku yang sedang dipinjam."` (BOOK-07).
- 200 → `BukuDTO` | 404
### `DELETE /api/buku/:id`
- 200 → `"Buku berhasil dihapus."`
- 409 if the book has an active loan (`"Buku masih memiliki peminjaman aktif."`) (BOOK-08).

---

## Anggota (Members)

### `GET /api/anggota`
- query: `page`, `limit`, `search?` (matches `nama` or `no_anggota`), `aktif?` (boolean)
- 200 → `Paginated<AnggotaDTO>`

### `POST /api/anggota`
```ts
body: t.Object({
  nama: t.String({ minLength: 1, maxLength: 150 }),
  kelas: t.String({ minLength: 1, maxLength: 50 }),
  telepon: t.Optional(t.Nullable(t.String({ maxLength: 30 }))),
  aktif: t.Optional(t.Boolean()),    // defaults true (MEMBER-04)
})
```
- `nama`, `kelas` required (MEMBER-03).
- `no_anggota` auto-generated (MEMBER-02), see [03](./03-business-rules.md#member-number-generation).
- 201 → `AnggotaDTO` (includes the generated `noAnggota`)

### `GET /api/anggota/:id` → `AnggotaDTO` | 404
### `PUT /api/anggota/:id`
- body as POST; `no_anggota` is **not** editable (ignored if sent).
- deactivation = `aktif:false` (MEMBER-06).
- 200 → `AnggotaDTO` | 404
### `DELETE /api/anggota/:id`
- 200 → `"Anggota berhasil dihapus."`
- 409 if the member has an active loan (`"Anggota masih memiliki peminjaman aktif."`) (MEMBER-08).

---

## Peminjaman (Loans)

### `GET /api/peminjaman`
- query: `page`, `limit`, `status?` (`dipinjam` | `dikembalikan` | `terlambat`),
  `anggotaId?`, `buku_id?` → `bukuId?` (LIST-01).
- `status=terlambat` resolves to `status='dipinjam' AND tanggal_kembali_rencana < today`.
- 200 → `Paginated<PeminjamanDTO>` (each row denormalizes member name + book title,
  exposes `statusEfektif` and a `dendaProyeksi` for active overdue loans) (LIST-03).

### `POST /api/peminjaman`
```ts
body: t.Object({
  anggotaId: t.Integer(),
  bukuId: t.Integer(),
  tanggalPinjam: t.Optional(t.String({ format: 'date' })),      // defaults today (LOAN-08)
  tanggalKembaliRencana: t.String({ format: 'date' }),
})
```
Service guards (see [03](./03-business-rules.md#creating-a-loan-loan-01--loan-08)):
- book/member exist (404); `stok_tersedia > 0` (409); member `aktif` (409);
  no existing active loan for same book (409);
  `tanggalKembaliRencana >= tanggalPinjam` (422).
- On success: status `dipinjam`, `stok_tersedia -= 1` (atomic).
- 201 → `PeminjamanDTO`

### `GET /api/peminjaman/:id` → `PeminjamanDTO` | 404
### `PUT /api/peminjaman/:id`
- Corrects entry data (dates, refs) while status `dipinjam`. Not the return path.
- 200 → `PeminjamanDTO` | 404 | 409 if already `dikembalikan`
### `DELETE /api/peminjaman/:id`
- 200 → `"Peminjaman berhasil dihapus."`
- If the loan was still `dipinjam`, restores `stok_tersedia += 1` in the same transaction.

### `PATCH /api/peminjaman/:id/kembalikan` — process return
```ts
body: t.Object({
  tanggalKembali: t.Optional(t.String({ format: 'date' })),     // defaults today
})
```
Guards (see [03](./03-business-rules.md#returning-a-book-ret-01--ret-06)):
- 409 if already `dikembalikan` (`"Peminjaman ini sudah dikembalikan."`).
- 422 if `tanggalKembali < tanggalPinjam`.
- On success: `tanggal_kembali_aktual` set, `denda` computed, status
  `dikembalikan`, `stok_tersedia += 1` (atomic).
- 200 → `PeminjamanDTO` (with final `denda`), `message: "Buku berhasil dikembalikan."`

---

## Dashboard

### `GET /api/dashboard/stats` (DASH-01, DASH-02)
Returns aggregated figures (all integers; `totalDenda` in IDR):

```ts
type DashboardStats = {
  totalBuku: number          // count of buku
  totalAnggota: number       // count of anggota
  peminjamanAktif: number    // loans with status = dipinjam
  terlambat: number          // dipinjam AND tanggal_kembali_rencana < today
  totalDenda: number         // SUM(denda) over all loans (outstanding/collected)
}
```
- 200 → `DashboardStats`

> `totalDenda` sums the persisted `denda` (fines recorded on returned loans). The
> running projection for still-overdue loans is a display concern, not part of this
> total, keeping the figure deterministic and matching what was actually charged.

---

## DTO shapes (serialized to the client)

`PeminjamanDTO` denormalizes the names the UI needs so the frontend avoids N+1
lookups, and exposes the **derived** `statusEfektif` plus a display-only
`dendaProyeksi`.

```ts
type UserDTO = {              // library staff; never contains `password`
  id: number; nama: string; username: string
  createdAt: string; updatedAt: string
}

type BukuDTO = {
  id: number; judul: string; pengarang: string
  penerbit: string | null; tahunTerbit: number | null; isbn: string | null
  kategori: string; stok: number; stokTersedia: number
  createdAt: string; updatedAt: string
}

type AnggotaDTO = {
  id: number; nama: string; noAnggota: string; kelas: string
  telepon: string | null; aktif: boolean
  createdAt: string; updatedAt: string
}

type PeminjamanDTO = {
  id: number
  anggota: { id: number; nama: string; noAnggota: string }
  buku: { id: number; judul: string }
  tanggalPinjam: string
  tanggalKembaliRencana: string
  tanggalKembaliAktual: string | null
  status: 'dipinjam' | 'dikembalikan'        // persisted value
  statusEfektif: 'dipinjam' | 'dikembalikan' | 'terlambat'  // derived (see 03)
  denda: number              // persisted fine (0 until returned)
  dendaProyeksi: number      // display-only projected fine for active overdue loans
  createdAt: string; updatedAt: string
}
```
