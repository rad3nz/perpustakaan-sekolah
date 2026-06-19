import type { Paginated, PeminjamanDTO } from '@perpustakaan/shared'
import { todayISO } from '../../lib/dates'
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors'
import { hitungDenda } from '../../lib/fines'
import { toPeminjamanDTO } from './dto'
import {
  peminjamanRepo,
  type PeminjamanListOpts,
  type PeminjamanRepo,
} from './repository'

export type CreateLoanInput = {
  anggotaId: number
  bukuId: number
  tanggalPinjam?: string
  tanggalKembaliRencana: string
}

export type UpdateLoanInput = {
  anggotaId: number
  bukuId: number
  tanggalPinjam: string
  tanggalKembaliRencana: string
}

export class PeminjamanService {
  constructor(private repo: PeminjamanRepo) {}

  async list(opts: PeminjamanListOpts): Promise<Paginated<PeminjamanDTO>> {
    const { items, total } = await this.repo.list(opts)
    return {
      items: items.map((r) => toPeminjamanDTO(r, opts.today)),
      total,
      page: opts.page,
      limit: opts.limit,
    }
  }

  async get(id: number): Promise<PeminjamanDTO> {
    const row = await this.repo.findByIdJoined(id)
    if (!row) throw new NotFoundError('Peminjaman tidak ditemukan.')
    return toPeminjamanDTO(row)
  }

  /** LOAN-01…08: guards then stock decrement + insert in one transaction. Returns new id. */
  async createLoan(input: CreateLoanInput): Promise<number> {
    return this.repo.transaction(async (tx) => {
      const book = await this.repo.findBuku(tx, input.bukuId)
      if (!book) throw new NotFoundError('Buku tidak ditemukan.')
      const member = await this.repo.findAnggota(tx, input.anggotaId)
      if (!member) throw new NotFoundError('Anggota tidak ditemukan.')
      if (book.stokTersedia <= 0) throw new ConflictError('Stok buku tidak tersedia.')
      if (!member.aktif) throw new ConflictError('Anggota tidak aktif dan tidak dapat meminjam.')
      if (await this.repo.hasActiveLoanForPair(tx, member.id, book.id)) {
        throw new ConflictError('Anggota masih meminjam buku ini.')
      }
      const tanggalPinjam = input.tanggalPinjam ?? todayISO()
      if (input.tanggalKembaliRencana < tanggalPinjam) {
        throw new ValidationError('Input tidak valid.', {
          tanggalKembaliRencana: ['Tanggal kembali harus pada atau setelah tanggal pinjam.'],
        })
      }
      await this.repo.decrementStok(tx, book.id)
      return this.repo.insertLoan(tx, {
        anggotaId: input.anggotaId,
        bukuId: input.bukuId,
        tanggalPinjam,
        tanggalKembaliRencana: input.tanggalKembaliRencana,
      })
    })
  }

  /** RET-01…06: guards, fine computation, status + stock restore, all atomic. */
  async kembalikan(id: number, tanggalKembali?: string): Promise<void> {
    await this.repo.transaction(async (tx) => {
      const loan = await this.repo.findLoanForUpdate(tx, id)
      if (!loan) throw new NotFoundError('Peminjaman tidak ditemukan.')
      if (loan.status === 'dikembalikan') {
        throw new ConflictError('Peminjaman ini sudah dikembalikan.')
      }
      const tgl = tanggalKembali ?? todayISO()
      if (tgl < loan.tanggalPinjam) {
        throw new ValidationError('Input tidak valid.', {
          tanggalKembali: ['Tanggal pengembalian tidak boleh sebelum tanggal pinjam.'],
        })
      }
      const denda = hitungDenda(loan.tanggalKembaliRencana, tgl)
      await this.repo.incrementStok(tx, loan.bukuId)
      await this.repo.updateLoanReturn(tx, id, { tanggalKembaliAktual: tgl, denda })
    })
  }

  /** Corrects entry data while status dipinjam. Rebalances stock if the book ref changes. */
  async updateEntry(id: number, input: UpdateLoanInput): Promise<void> {
    await this.repo.transaction(async (tx) => {
      const loan = await this.repo.findLoanForUpdate(tx, id)
      if (!loan) throw new NotFoundError('Peminjaman tidak ditemukan.')
      if (loan.status === 'dikembalikan') {
        throw new ConflictError('Peminjaman ini sudah dikembalikan.')
      }
      if (input.tanggalKembaliRencana < input.tanggalPinjam) {
        throw new ValidationError('Input tidak valid.', {
          tanggalKembaliRencana: ['Tanggal kembali harus pada atau setelah tanggal pinjam.'],
        })
      }
      if (input.bukuId !== loan.bukuId) {
        const newBook = await this.repo.findBuku(tx, input.bukuId)
        if (!newBook) throw new NotFoundError('Buku tidak ditemukan.')
        if (newBook.stokTersedia <= 0) throw new ConflictError('Stok buku tidak tersedia.')
        await this.repo.incrementStok(tx, loan.bukuId) // restore the old book
        await this.repo.decrementStok(tx, input.bukuId) // take from the new one
      }
      await this.repo.updateEntry(tx, id, {
        anggotaId: input.anggotaId,
        bukuId: input.bukuId,
        tanggalPinjam: input.tanggalPinjam,
        tanggalKembaliRencana: input.tanggalKembaliRencana,
      })
    })
  }

  /** Deletes a loan; restores stock if it was still active. */
  async remove(id: number): Promise<void> {
    await this.repo.transaction(async (tx) => {
      const loan = await this.repo.findLoanForUpdate(tx, id)
      if (!loan) throw new NotFoundError('Peminjaman tidak ditemukan.')
      if (loan.status === 'dipinjam') {
        await this.repo.incrementStok(tx, loan.bukuId)
      }
      await this.repo.deleteLoan(tx, id)
    })
  }
}

export const peminjamanService = new PeminjamanService(peminjamanRepo)
