import { expect, test } from 'vitest'
import { isActiveLoan } from './loan'

test('aksi Kembalikan hanya untuk loan aktif', () => {
  expect(isActiveLoan('dipinjam')).toBe(true)
  expect(isActiveLoan('terlambat')).toBe(true)
  expect(isActiveLoan('dikembalikan')).toBe(false)
})
