import type { PeminjamanStatus, PeminjamanStatusEfektif } from './enums'

/** Consistent response envelope on every API response. */
export type Envelope<T> = {
  success: boolean
  data: T | null
  message: string // Indonesian, human-readable
  errors?: Record<string, string[]> // present only on 422 validation failures
}

/** List `data` shape for paginated endpoints. */
export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

/** Library staff; never contains `password`. */
export type UserDTO = {
  id: number
  nama: string
  username: string
  createdAt: string
  updatedAt: string
}

export type BukuDTO = {
  id: number
  judul: string
  pengarang: string
  penerbit: string | null
  tahunTerbit: number | null
  isbn: string | null
  kategori: string
  stok: number
  stokTersedia: number
  createdAt: string
  updatedAt: string
}

export type AnggotaDTO = {
  id: number
  nama: string
  noAnggota: string
  kelas: string
  telepon: string | null
  aktif: boolean
  createdAt: string
  updatedAt: string
}

export type PeminjamanDTO = {
  id: number
  anggota: { id: number; nama: string; noAnggota: string }
  buku: { id: number; judul: string }
  tanggalPinjam: string
  tanggalKembaliRencana: string
  tanggalKembaliAktual: string | null
  status: PeminjamanStatus // persisted value
  statusEfektif: PeminjamanStatusEfektif // derived (see 03)
  denda: number // persisted fine (0 until returned)
  dendaProyeksi: number // display-only projected fine for active overdue loans
  createdAt: string
  updatedAt: string
}

export type DashboardStats = {
  totalBuku: number // count of buku
  totalAnggota: number // count of anggota
  peminjamanAktif: number // loans with status = dipinjam
  terlambat: number // dipinjam AND tanggal_kembali_rencana < today
  totalDenda: number // SUM(denda) over all loans (outstanding/collected)
}
