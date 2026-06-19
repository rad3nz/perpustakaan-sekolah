# 06 — Frontend

Stack: **React + Vite + Mantine (behavior) + Tailwind CSS (styling)**. Data layer:
**Eden Treaty + TanStack React Query**. Routing: **React Router**. All UI text is
**Indonesian**. The app sits behind a **login screen**; once authenticated, the
default landing page is the dashboard.

## Mantine for behavior, Tailwind for styling

We keep Mantine for its **component behavior, accessibility, and hooks**
(`@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/dates`,
`@mantine/notifications`) and use **Tailwind utility classes for all visual
styling**:

- Wrap the app in `MantineProvider` with a minimal theme that mirrors the brand
  tokens (so Mantine internals like the primary color match), but author the look
  with Tailwind utilities via `className`. Full setup — including the crucial CSS
  **cascade-layer ordering** so Tailwind wins over Mantine's defaults — is in
  [12-style-guide.md](./12-style-guide.md).
- Use Mantine primitives (`Modal`, `Select`, `TextInput`, `NumberInput`,
  `DatePickerInput`, `Switch`, `AppShell`) for structure and a11y; style them with
  Tailwind classes (and Mantine's `classNames` API where inner elements need it).
- A `cn()` helper (`clsx` + `tailwind-merge`) composes conditional Tailwind classes
  predictably (later utilities override earlier ones).
- `@mantine/notifications` provides toasts (e.g. "Buku berhasil disimpan",
  validation errors). It is **not** realtime.

> **The one rule that makes this combo work:** Mantine emits its CSS into a
> `@layer mantine`; Tailwind utilities must sit in a *later* layer so a `className`
> like `bg-brand-600` actually overrides Mantine's default. Get the layer order
> wrong and your Tailwind classes silently lose. See [12](./12-style-guide.md).

## Project structure

```
apps/frontend/src/
├── main.tsx                  # MantineProvider + QueryClientProvider + RouterProvider
├── index.css                 # Tailwind entry + layered Mantine imports (layer order)
├── api/
│   ├── client.ts             # Eden treaty<App>() with bearer-token header hook
│   └── hooks/                # React Query hooks per resource (useBuku, useAnggota, usePeminjaman, useDashboard)
├── auth/
│   ├── auth-store.ts         # token + current user (Zustand); getToken() helper
│   └── useAuth.ts            # login()/logout()/me wrappers
├── routes/
│   ├── router.tsx            # route tree
│   └── ProtectedRoute.tsx    # requires a valid session; redirects to /login
├── layout/
│   ├── AppLayout.tsx         # AppShell: sidebar nav + header (with logout)
│   └── Sidebar.tsx           # Dashboard / Buku / Anggota / Peminjaman
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── buku/                 # BukuListPage, BukuFormModal
│   ├── anggota/              # AnggotaListPage, AnggotaFormModal
│   └── peminjaman/           # PeminjamanListPage, PeminjamanFormModal, KembalikanModal
├── components/               # DataTable, StatCard, StatusBadge, SearchInput, …
└── lib/
    ├── cn.ts                 # clsx + tailwind-merge helper
    ├── format.ts             # formatRupiah, formatTanggal
    └── labels.ts             # effective status → Indonesian label + tone
```

## Data layer

### Eden client

```ts
// api/client.ts
import { treaty } from '@elysiajs/eden'
import type { App } from '@perpustakaan/backend'
import { getToken } from '../auth/auth-store'

export const api = treaty<App>(import.meta.env.VITE_API_URL, {
  headers() {
    const token = getToken()
    return token ? { authorization: `Bearer ${token}` } : {}
  },
})
```

- **Token storage:** `localStorage` under key `perpustakaan_token`, mirrored into
  the auth store (Zustand) on load. Standard bearer pattern; the XSS trade-off is
  acknowledged in [04](./04-authentication.md).
- On any `401`, the response handler clears the token and redirects to `/login`.

### React Query conventions

- Query keys are arrays: `['buku', { page, search, kategori }]`,
  `['peminjaman', { page, status }]`, `['dashboard']`.
- Mutations (create/update/delete, **kembalikan**) call the Eden action, then
  `invalidateQueries` on the affected resource **and** `['dashboard']` (stats shift
  when stock/loans change).
- `staleTime` ~30s for lists.

## Routing & access control

A single `ProtectedRoute` gates the app; `/login` is the only public route.

```tsx
<Route path="/login" element={<LoginPage />} />
<Route element={<ProtectedRoute />}>            {/* must be logged in */}
  <Route element={<AppLayout />}>
    <Route index element={<DashboardPage />} />
    <Route path="/buku" element={<BukuListPage />} />
    <Route path="/anggota" element={<AnggotaListPage />} />
    <Route path="/peminjaman" element={<PeminjamanListPage />} />
  </Route>
</Route>
```

- `ProtectedRoute` redirects to `/login` when there is no valid session; after a
  successful login it sends the user to the dashboard.
- There is no `RoleRoute` — every authenticated user reaches every page (no roles).
- **UI access control never replaces the API** — the server requires the token on
  every call regardless of what the SPA renders.

## Pages

### Login (`/login`)
A centered card (Tailwind-styled) with username + password (`@mantine/form`),
calling `POST /api/auth/login`. On success it stores the token + user and redirects
to the dashboard; on 401 it shows `"Username atau password salah."` inline. Seed
credentials are listed in [09-seed-data.md](./09-seed-data.md).

### Dashboard (`/`)
Five stat cards from `GET /api/dashboard/stats` (DASH-03):
**Total Buku**, **Total Anggota**, **Sedang Dipinjam**, **Terlambat**,
**Total Denda** (the last formatted as Rupiah). Each card is a `StatCard`
component; the **Terlambat** card uses the red tone to draw the eye.

### Buku (`/buku`)
- **List** — `DataTable` with columns judul, pengarang, kategori, stok,
  stok_tersedia. A `stok_tersedia` of 0 renders a red **Habis** badge.
- **Search** by judul (`SearchInput`, debounced) + **filter** by kategori (`Select`)
  (BOOK-09, BOOK-10).
- **Add/Edit** — `BukuFormModal` (`@mantine/form`): judul, pengarang, penerbit,
  tahun_terbit (`NumberInput`), isbn, kategori, stok (`NumberInput`). On edit,
  `stok_tersedia` is shown read-only; client mirrors the BOOK-07 rule but the
  server is authoritative.

### Anggota (`/anggota`)
- **List** — columns no_anggota, nama, kelas, telepon, status (aktif/non-aktif
  badge). **Search** by nama or no_anggota (MEMBER-09).
- **Add/Edit** — `AnggotaFormModal`: nama, kelas, telepon, aktif (`Switch`).
  `no_anggota` is shown read-only on edit (auto-generated, immutable). A
  **Nonaktifkan** toggle implements MEMBER-06.

### Peminjaman (`/peminjaman`)
The richest page. Columns: anggota (nama), buku (judul), tanggal_pinjam,
tanggal_kembali_rencana, **status** (`StatusBadge` using `statusEfektif`), **denda**
(Rupiah). **Filters**: status (`dipinjam`/`dikembalikan`/`terlambat`), anggota, buku
(LIST-01).

- **Add loan** — `PeminjamanFormModal`: anggota (`Select`, searchable), buku
  (`Select`, searchable; options can be limited to `stok_tersedia > 0`),
  tanggal_pinjam + tanggal_kembali_rencana (`DatePickerInput`). Client mirrors the
  LOAN guards; server is authoritative (e.g. shows the 409 "Stok buku tidak
  tersedia." as a toast).
- **Inline "Kembalikan" action** — shown only on rows whose `statusEfektif` is
  `dipinjam` or `terlambat` (active loans). Opens the return modal.
- **Return modal** (`KembalikanModal`) — a `DatePickerInput` for the return date
  (defaults to today) and a **live denda preview**: as the staff picks a date, the
  preview recomputes `hitungDenda(rencana, picked)` client-side and shows e.g.
  `Denda: Rp 3.000` (FINE-04). On confirm, `PATCH …/kembalikan` runs; the server
  recomputes the fine authoritatively and the list + dashboard invalidate.

```tsx
// KembalikanModal — denda preview mirrors lib/fines.ts exactly
const denda = useMemo(
  () => Math.max(0, daysBetween(loan.tanggalKembaliRencana, tanggalKembali)) * 1000,
  [loan, tanggalKembali],
)
// render: <Text>Denda: {formatRupiah(denda)}</Text>
```

## Formatting (Indonesian locale)

```ts
// lib/format.ts
export const formatTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  // → "15 Jan 2025"

export const formatRupiah = (n: number) =>
  'Rp ' + n.toLocaleString('id-ID')   // → "Rp 1.000"  (dot thousands separator)
```

- Dates rendered as `DD MMM YYYY`. Date **inputs** submit ISO `YYYY-MM-DD`.
- Currency always via `formatRupiah` — never hand-format. `Rp 0` is shown as `Rp 0`,
  not blank, so "no fine" is explicit.
- Never render raw status enums — always via `labels.ts` (see [03](./03-business-rules.md)).

## Environment

`apps/frontend/.env`:
- `VITE_API_URL` — backend HTTP base (e.g. `http://localhost:3000`).
