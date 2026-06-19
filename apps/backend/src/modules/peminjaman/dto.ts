import type { PeminjamanDTO } from '@perpustakaan/shared'
import { todayISO } from '../../lib/dates'
import { hitungDenda } from '../../lib/fines'
import { statusEfektif } from '../../lib/loan-status'
import type { PeminjamanJoinedRow } from './repository'

export function toPeminjamanDTO(row: PeminjamanJoinedRow, today = todayISO()): PeminjamanDTO {
  const efektif = statusEfektif(
    {
      status: row.status,
      tanggalKembaliRencana: row.tanggalKembaliRencana,
      tanggalKembaliAktual: row.tanggalKembaliAktual,
    },
    today,
  )
  // Display-only projected fine for active overdue loans; not persisted (FINE-03 note).
  const dendaProyeksi = efektif === 'terlambat' ? hitungDenda(row.tanggalKembaliRencana, today) : 0

  return {
    id: row.id,
    anggota: { id: row.anggotaId, nama: row.anggotaNama, noAnggota: row.anggotaNoAnggota },
    buku: { id: row.bukuId, judul: row.bukuJudul },
    tanggalPinjam: row.tanggalPinjam,
    tanggalKembaliRencana: row.tanggalKembaliRencana,
    tanggalKembaliAktual: row.tanggalKembaliAktual,
    status: row.status,
    statusEfektif: efektif,
    denda: row.denda,
    dendaProyeksi,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
