import { expect, test } from 'bun:test'
import { hitungDenda } from './fines'

test('denda: 3 hari terlambat = Rp 3.000', () => {
  expect(hitungDenda('2026-06-10', '2026-06-13')).toBe(3000)
})
test('denda: dikembalikan tepat waktu = 0', () => {
  expect(hitungDenda('2026-06-10', '2026-06-10')).toBe(0)
})
test('denda: kembali sebelum jatuh tempo = 0', () => {
  expect(hitungDenda('2026-06-10', '2026-06-08')).toBe(0)
})
test('denda: belum dikembalikan (null) = 0', () => {
  expect(hitungDenda('2026-06-10', null)).toBe(0)
})
