import { expect, test } from 'bun:test'
import { statusEfektif } from './loan-status'

const base = { tanggalKembaliAktual: null as string | null }

test('dipinjam + jatuh tempo di masa depan → dipinjam', () => {
  expect(
    statusEfektif(
      { status: 'dipinjam', tanggalKembaliRencana: '2026-12-31', ...base },
      '2026-06-20',
    ),
  ).toBe('dipinjam')
})
test('dipinjam + jatuh tempo lewat → terlambat', () => {
  expect(
    statusEfektif(
      { status: 'dipinjam', tanggalKembaliRencana: '2026-06-10', ...base },
      '2026-06-20',
    ),
  ).toBe('terlambat')
})
test('dikembalikan selalu dikembalikan', () => {
  expect(
    statusEfektif(
      {
        status: 'dikembalikan',
        tanggalKembaliRencana: '2026-06-01',
        tanggalKembaliAktual: '2026-06-05',
      },
      '2026-06-20',
    ),
  ).toBe('dikembalikan')
})
