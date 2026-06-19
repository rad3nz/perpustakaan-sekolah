/** Today as an ISO `YYYY-MM-DD` string (backend container clock). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Whole-day integer difference `b − a` for two `YYYY-MM-DD` strings.
 * Parsed via Date.UTC so DST / timezone never shifts the day count.
 */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number) as [number, number, number]
  const [by, bm, bd] = b.split('-').map(Number) as [number, number, number]
  const msA = Date.UTC(ay, am - 1, ad)
  const msB = Date.UTC(by, bm - 1, bd)
  return Math.round((msB - msA) / 86_400_000)
}
