import type { AnggotaDTO } from '@perpustakaan/shared'
import type { anggota } from '../../db/schema'

export type AnggotaRow = typeof anggota.$inferSelect

export function toAnggotaDTO(row: AnggotaRow): AnggotaDTO {
  return {
    id: row.id,
    nama: row.nama,
    noAnggota: row.noAnggota,
    kelas: row.kelas,
    telepon: row.telepon,
    aktif: row.aktif,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
