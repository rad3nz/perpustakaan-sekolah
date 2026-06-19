/**
 * Formats a member-number sequence as `LIB-####`. The padStart is a *minimum*
 * width, not a cap: past 9999 the number simply grows (`LIB-10000`).
 */
export function formatNoAnggota(seq: number): string {
  return `LIB-${String(seq).padStart(4, '0')}`
}
