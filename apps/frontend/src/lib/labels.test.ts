import { expect, test } from 'vitest'
import { labelStatus, statusBadgeClasses, stockBadge } from './labels'

test('label status Indonesia', () => {
  expect(labelStatus('dipinjam')).toBe('Dipinjam')
  expect(labelStatus('terlambat')).toBe('Terlambat')
  expect(labelStatus('dikembalikan')).toBe('Dikembalikan')
})

test('tone badge status (terlambat = merah)', () => {
  expect(statusBadgeClasses('terlambat')).toContain('red')
  expect(statusBadgeClasses('dipinjam')).toContain('blue')
  expect(statusBadgeClasses('dikembalikan')).toContain('green')
})

test('stock badge: Habis / sebagian / tersedia', () => {
  expect(stockBadge(0, 3).label).toBe('Habis')
  expect(stockBadge(1, 3).label).toBe('Tersedia (sebagian)')
  expect(stockBadge(3, 3).label).toBe('Tersedia')
})
