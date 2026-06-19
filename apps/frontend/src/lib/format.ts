/** "Rp 1.000" — Rp + space + integer with dot thousands separator (Indonesian locale). */
export const formatRupiah = (n: number): string => `Rp ${n.toLocaleString('id-ID')}`

/** "15 Jan 2025" — display format. Inputs are stored/transmitted as ISO YYYY-MM-DD. */
export const formatTanggal = (iso: string): string =>
  new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
