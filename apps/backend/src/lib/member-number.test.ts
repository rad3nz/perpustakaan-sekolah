import { expect, test } from 'bun:test'
import { formatNoAnggota } from './member-number'

test('format no_anggota', () => {
  expect(formatNoAnggota(1)).toBe('LIB-0001')
  expect(formatNoAnggota(42)).toBe('LIB-0042')
  expect(formatNoAnggota(10000)).toBe('LIB-10000')
})
