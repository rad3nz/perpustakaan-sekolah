# Perpustakaan Sekolah

Sistem manajemen perpustakaan sekolah: katalog **buku**, **anggota**, dan
**peminjaman** dengan alur pinjam → kembali (stok transaksional, denda dihitung
server, status `terlambat` turunan), di balik login JWT. Antarmuka berbahasa
Indonesia.

**Stack:** Bun · ElysiaJS · Drizzle ORM · MariaDB · React + Vite · Mantine +
Tailwind · Eden Treaty · TanStack Query. Monorepo workspace Bun (`apps/backend`,
`apps/frontend`, `packages/shared`).

> Spesifikasi lengkap ada di [`docs/`](./docs).

## Menjalankan dengan Docker (disarankan)

Satu perintah menjalankan seluruh stack (MariaDB → backend bermigrasi + seed →
frontend):

```bash
cp .env.example .env        # lalu sunting secret bila perlu
docker compose up --build   # mariadb → backend (migrate+seed) → frontend
# buka http://localhost:5173
```

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3000>
- MariaDB: port `3306`

Reset total (hapus volume database):

```bash
docker compose down -v
```

### Akun login (seed)

| Username  | Password   |
| --------- | ---------- |
| `petugas` | `password` |
| `admin`   | `password` |

> Tidak ada peran (role): setiap pengguna terautentikasi memiliki akses penuh.

## Menjalankan manual (tanpa Docker)

Butuh **Bun** dan sebuah server **MariaDB** lokal.

```bash
bun install

# Backend (apps/backend) — set env dulu:
#   DATABASE_URL=mysql://user:pass@localhost:3306/perpustakaan_sekolah
#   JWT_SECRET=...   CORS_ORIGIN=http://localhost:5173
cd apps/backend
bun run db:migrate
bun run db:seed
bun run dev          # Elysia di :3000

# Frontend (apps/frontend), terminal lain:
cd apps/frontend
bun run dev          # Vite di :5173  (VITE_API_URL di apps/frontend/.env)
```

## Pengembangan

```bash
bun run typecheck    # semua paket (tsc)
bun run lint         # Biome
bun run test         # semua suite (lihat catatan tes integrasi di bawah)
```

### Tes

- **Backend** (`apps/backend`, `bun test`): unit murni (denda, status turunan,
  no_anggota) + guard service peminjaman dengan repo tiruan. Tes **integrasi**
  butuh MariaDB nyata dan dijalankan terpisah:

  ```bash
  RUN_DB_TESTS=true DATABASE_URL=mysql://user:pass@127.0.0.1:3306/perpustakaan_test \
    JWT_SECRET=test bun test src/index.test.ts
  ```

  Tanpa `RUN_DB_TESTS=true` tes integrasi dilewati sehingga `bun test` tetap hijau
  tanpa database.

- **Frontend** (`apps/frontend`, `bun run test`, Vitest + RTL): preview denda,
  enablement aksi Kembalikan, formatting, dan guard rute.

## Catatan operasional

- "Hari ini" untuk logika `terlambat`/denda memakai **jam kontainer backend** —
  setel `TZ` bila zona waktu host menyimpang.
- `VITE_API_URL` di-*inline* saat build frontend (build arg), bukan env runtime.
- Migrasi berjalan idempoten setiap start backend; seed idempoten (dilewati bila
  data sudah ada).
