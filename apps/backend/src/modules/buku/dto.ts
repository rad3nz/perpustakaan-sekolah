import type { BukuDTO } from '@perpustakaan/shared'
import type { buku } from '../../db/schema'

export type BukuRow = typeof buku.$inferSelect

export function toBukuDTO(row: BukuRow): BukuDTO {
  return {
    id: row.id,
    judul: row.judul,
    pengarang: row.pengarang,
    penerbit: row.penerbit,
    tahunTerbit: row.tahunTerbit,
    isbn: row.isbn,
    kategori: row.kategori,
    stok: row.stok,
    stokTersedia: row.stokTersedia,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
