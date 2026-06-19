import { expect, test } from 'vitest'
import { hitungDendaPreview } from './fines'

test('preview denda cocok dengan backend', () => {
  expect(hitungDendaPreview('2026-06-10', '2026-06-10')).toBe(0) // tepat waktu
  expect(hitungDendaPreview('2026-06-10', '2026-06-08')).toBe(0) // lebih awal
  expect(hitungDendaPreview('2026-06-10', '2026-06-13')).toBe(3000) // 3 hari telat
})
