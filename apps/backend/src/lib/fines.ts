import { daysBetween } from './dates'

export const DENDA_PER_HARI = 1000 // Rp 1.000/day — fixed (FRD §8), not configurable

/** Days late × Rp 1.000, floored at 0. Safe on a null actual date (FINE-03). */
export function hitungDenda(
  tanggalRencana: string, // YYYY-MM-DD (due date)
  tanggalAktual: string | null, // YYYY-MM-DD or null if not yet returned
): number {
  if (!tanggalAktual) return 0 // FINE-03
  const hariTerlambat = daysBetween(tanggalRencana, tanggalAktual) // aktual − rencana
  return Math.max(0, hariTerlambat) * DENDA_PER_HARI // FINE-01, FINE-02
}
