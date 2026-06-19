import { daysBetween } from './dates'

/** Client-side denda preview. Mirrors backend lib/fines.ts exactly (FINE-04); the server
 *  recomputes authoritatively on submit. */
export function hitungDendaPreview(tanggalRencana: string, tanggalKembali: string): number {
  return Math.max(0, daysBetween(tanggalRencana, tanggalKembali)) * 1000
}
