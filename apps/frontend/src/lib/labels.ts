import type { PeminjamanStatusEfektif } from '@perpustakaan/shared'

// Status uses semantic colors — intentionally separate from brand tokens. Must match
// 03-business-rules.md and 12-style-guide.md. The status shown is the *effective* one.
const STATUS_LABEL: Record<PeminjamanStatusEfektif, string> = {
  dipinjam: 'Dipinjam',
  dikembalikan: 'Dikembalikan',
  terlambat: 'Terlambat',
}

const STATUS_BADGE_CLASS: Record<PeminjamanStatusEfektif, string> = {
  dipinjam: 'bg-blue-100 text-blue-800',
  terlambat: 'bg-red-100 text-red-800',
  dikembalikan: 'bg-green-100 text-green-800',
}

export function labelStatus(s: PeminjamanStatusEfektif): string {
  return STATUS_LABEL[s]
}

export function statusBadgeClasses(s: PeminjamanStatusEfektif): string {
  return STATUS_BADGE_CLASS[s]
}

/** Stock badge per 12-style-guide.md. */
export function stockBadge(
  stokTersedia: number,
  stok: number,
): { label: string; className: string } {
  if (stokTersedia === 0) return { label: 'Habis', className: 'bg-red-100 text-red-800' }
  if (stokTersedia < stok)
    return { label: 'Tersedia (sebagian)', className: 'bg-yellow-100 text-yellow-800' }
  return { label: 'Tersedia', className: 'bg-green-100 text-green-800' }
}
