import { expect, test } from 'vitest'
import { formatRupiah, formatTanggal } from './format'

test('formatRupiah memakai titik sebagai pemisah ribuan', () => {
  expect(formatRupiah(1000)).toBe('Rp 1.000')
  expect(formatRupiah(0)).toBe('Rp 0')
  expect(formatRupiah(3000)).toBe('Rp 3.000')
})

test('formatTanggal menampilkan DD MMM YYYY (id-ID)', () => {
  const out = formatTanggal('2025-01-15')
  expect(out).toMatch(/15/)
  expect(out).toMatch(/2025/)
})
