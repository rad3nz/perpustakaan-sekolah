import { expect, test } from 'bun:test'
import { ConflictError, ValidationError } from '../../lib/errors'
import type { LoanRow, PeminjamanRepo } from './repository'
import { PeminjamanService } from './service'

type FakeState = {
  buku?: { id: number; stok: number; stokTersedia: number }
  anggota?: { id: number; aktif: boolean }
  loans?: LoanRow[]
  activeLoanForPair?: boolean
}

/** In-memory repo double: runs guard logic without a DB. Tx is irrelevant, cast as any. */
function fakeRepo(state: FakeState): { repo: PeminjamanRepo; state: Required<FakeState> } {
  const s: Required<FakeState> = {
    buku: state.buku ?? { id: 1, stok: 3, stokTersedia: 3 },
    anggota: state.anggota ?? { id: 1, aktif: true },
    loans: state.loans ?? [],
    activeLoanForPair: state.activeLoanForPair ?? false,
  }
  let nextId = (s.loans.at(-1)?.id ?? 0) + 1
  // biome-ignore lint/suspicious/noExplicitAny: tx is unused by the fake
  const tx = {} as any
  const repo: PeminjamanRepo = {
    async transaction(fn) {
      return fn(tx)
    },
    async findBuku() {
      return { id: s.buku.id, stok: s.buku.stok, stokTersedia: s.buku.stokTersedia }
    },
    async findAnggota() {
      return { id: s.anggota.id, aktif: s.anggota.aktif }
    },
    async hasActiveLoanForPair() {
      return s.activeLoanForPair
    },
    async decrementStok() {
      s.buku.stokTersedia -= 1
    },
    async incrementStok() {
      s.buku.stokTersedia = Math.min(s.buku.stok, s.buku.stokTersedia + 1)
    },
    async insertLoan(_tx, values) {
      const row: LoanRow = {
        id: nextId++,
        anggotaId: values.anggotaId,
        bukuId: values.bukuId,
        tanggalPinjam: values.tanggalPinjam,
        tanggalKembaliRencana: values.tanggalKembaliRencana,
        tanggalKembaliAktual: null,
        status: 'dipinjam',
        denda: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      s.loans.push(row)
      return row.id
    },
    async findLoanForUpdate(_tx, id) {
      return s.loans.find((l) => l.id === id) ?? null
    },
    async updateLoanReturn(_tx, id, values) {
      const loan = s.loans.find((l) => l.id === id)
      if (loan) {
        loan.status = 'dikembalikan'
        loan.tanggalKembaliAktual = values.tanggalKembaliAktual
        loan.denda = values.denda
      }
    },
    async updateEntry() {},
    async deleteLoan() {},
    async list() {
      return { items: [], total: 0 }
    },
    async findByIdJoined() {
      return null
    },
  }
  return { repo, state: s }
}

const baseInput = { anggotaId: 1, bukuId: 1, tanggalKembaliRencana: '2026-07-01' }

test('LOAN-02: pinjam ditolak saat stok habis', async () => {
  const { repo } = fakeRepo({ buku: { id: 1, stok: 1, stokTersedia: 0 } })
  const svc = new PeminjamanService(repo)
  await expect(svc.createLoan(baseInput)).rejects.toBeInstanceOf(ConflictError)
})

test('LOAN-03: pinjam ditolak saat anggota nonaktif', async () => {
  const { repo } = fakeRepo({ anggota: { id: 1, aktif: false } })
  const svc = new PeminjamanService(repo)
  await expect(svc.createLoan(baseInput)).rejects.toBeInstanceOf(ConflictError)
})

test('LOAN-04: pinjam ditolak saat sudah meminjam buku yang sama', async () => {
  const { repo } = fakeRepo({ activeLoanForPair: true })
  const svc = new PeminjamanService(repo)
  await expect(svc.createLoan(baseInput)).rejects.toBeInstanceOf(ConflictError)
})

test('LOAN-07: tanggal kembali sebelum tanggal pinjam → ValidationError', async () => {
  const { repo } = fakeRepo({})
  const svc = new PeminjamanService(repo)
  await expect(
    svc.createLoan({ ...baseInput, tanggalPinjam: '2026-07-10', tanggalKembaliRencana: '2026-07-01' }),
  ).rejects.toBeInstanceOf(ValidationError)
})

test('happy path: status dipinjam + stok_tersedia berkurang 1', async () => {
  const { repo, state } = fakeRepo({ buku: { id: 1, stok: 3, stokTersedia: 3 } })
  const svc = new PeminjamanService(repo)
  const id = await svc.createLoan(baseInput)
  expect(state.buku.stokTersedia).toBe(2)
  expect(state.loans.find((l) => l.id === id)?.status).toBe('dipinjam')
})

test('RET-05: kembalikan yang sudah dikembalikan → ConflictError', async () => {
  const returned: LoanRow = {
    id: 5,
    anggotaId: 1,
    bukuId: 1,
    tanggalPinjam: '2026-06-01',
    tanggalKembaliRencana: '2026-06-10',
    tanggalKembaliAktual: '2026-06-09',
    status: 'dikembalikan',
    denda: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const { repo } = fakeRepo({ loans: [returned] })
  const svc = new PeminjamanService(repo)
  await expect(svc.kembalikan(5, '2026-06-12')).rejects.toBeInstanceOf(ConflictError)
})

test('happy return: status dikembalikan, stok +1, denda dihitung', async () => {
  const active: LoanRow = {
    id: 7,
    anggotaId: 1,
    bukuId: 1,
    tanggalPinjam: '2026-06-01',
    tanggalKembaliRencana: '2026-06-10',
    tanggalKembaliAktual: null,
    status: 'dipinjam',
    denda: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const { repo, state } = fakeRepo({ buku: { id: 1, stok: 3, stokTersedia: 2 }, loans: [active] })
  const svc = new PeminjamanService(repo)
  await svc.kembalikan(7, '2026-06-13') // 3 hari terlambat
  const loan = state.loans.find((l) => l.id === 7)
  expect(loan?.status).toBe('dikembalikan')
  expect(loan?.denda).toBe(3000)
  expect(state.buku.stokTersedia).toBe(3)
})

test('no drift: pinjam lalu kembalikan mengembalikan stok_tersedia semula', async () => {
  const { repo, state } = fakeRepo({ buku: { id: 1, stok: 3, stokTersedia: 3 } })
  const svc = new PeminjamanService(repo)
  const id = await svc.createLoan(baseInput)
  expect(state.buku.stokTersedia).toBe(2)
  await svc.kembalikan(id, '2026-07-01')
  expect(state.buku.stokTersedia).toBe(3)
})
