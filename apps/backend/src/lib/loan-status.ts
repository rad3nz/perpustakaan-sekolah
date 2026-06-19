import type { PeminjamanStatus, PeminjamanStatusEfektif } from '@perpustakaan/shared'
import { todayISO } from './dates'

/**
 * Effective status as exposed to the client. `terlambat` is derived at read time
 * (never stored): a `dipinjam` loan past its due date is overdue. See 03-business-rules.md.
 */
export function statusEfektif(
  p: {
    status: PeminjamanStatus
    tanggalKembaliRencana: string // YYYY-MM-DD
    tanggalKembaliAktual: string | null
  },
  today = todayISO(),
): PeminjamanStatusEfektif {
  if (p.status === 'dikembalikan') return 'dikembalikan'
  return p.tanggalKembaliRencana < today ? 'terlambat' : 'dipinjam'
}
