import { MantineProvider } from '@mantine/core'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, test, vi } from 'vitest'
import type { PeminjamanDTO } from '@perpustakaan/shared'
import { KembalikanModal } from './KembalikanModal'

// Avoid loading the Eden client; the modal only needs the kembalikan mutation shape.
vi.mock('../../api/hooks/usePeminjaman', () => ({
  usePeminjamanMutations: () => ({
    kembalikan: { mutateAsync: vi.fn(), isPending: false },
  }),
}))

function wrap(ui: ReactNode) {
  return render(<MantineProvider>{ui}</MantineProvider>)
}

function loanWithDue(due: string): PeminjamanDTO {
  return {
    id: 1,
    anggota: { id: 1, nama: 'Budi', noAnggota: 'LIB-0001' },
    buku: { id: 1, judul: 'Sapiens' },
    tanggalPinjam: '2020-01-01',
    tanggalKembaliRencana: due,
    tanggalKembaliAktual: null,
    status: 'dipinjam',
    statusEfektif: 'dipinjam',
    denda: 0,
    dendaProyeksi: 0,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  }
}

test('preview Rp 0 untuk jatuh tempo di masa depan', () => {
  wrap(<KembalikanModal opened onClose={() => {}} loan={loanWithDue('2999-01-01')} />)
  expect(screen.getByText('Denda: Rp 0')).toBeInTheDocument()
})

test('preview denda > 0 saat sudah lewat jatuh tempo', () => {
  wrap(<KembalikanModal opened onClose={() => {}} loan={loanWithDue('2000-01-01')} />)
  const node = screen.getByText(/^Denda: Rp/)
  expect(node.textContent).not.toBe('Denda: Rp 0')
})
