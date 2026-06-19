/** Whole-day diff `b − a` for ISO YYYY-MM-DD strings. Mirrors the backend exactly so
 *  the denda preview matches the server's authoritative computation. */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number) as [number, number, number]
  const [by, bm, bd] = b.split('-').map(Number) as [number, number, number]
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}

/** Today as ISO YYYY-MM-DD. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}
