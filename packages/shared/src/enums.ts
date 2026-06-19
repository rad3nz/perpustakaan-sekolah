// Persisted values only. `terlambat` is NOT stored — it is computed (see 03-business-rules.md).
export const PEMINJAMAN_STATUS = ['dipinjam', 'dikembalikan'] as const
export type PeminjamanStatus = (typeof PEMINJAMAN_STATUS)[number]

// Effective status as exposed to the client (adds the derived `terlambat`).
export const PEMINJAMAN_STATUS_EFEKTIF = ['dipinjam', 'dikembalikan', 'terlambat'] as const
export type PeminjamanStatusEfektif = (typeof PEMINJAMAN_STATUS_EFEKTIF)[number]

// Suggested seed categories; `kategori` is a free string, not a DB enum,
// so staff can add new categories without a migration.
export const KATEGORI_CONTOH = [
  'Fiksi',
  'Non-Fiksi',
  'Sains',
  'Agama',
  'Sejarah',
  'Teknologi',
] as const
