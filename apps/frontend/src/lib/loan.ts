import type { PeminjamanStatusEfektif } from '@perpustakaan/shared'

/** Whether a loan is still active (so the Kembalikan action is shown). */
export function isActiveLoan(status: PeminjamanStatusEfektif): boolean {
  return status === 'dipinjam' || status === 'terlambat'
}
