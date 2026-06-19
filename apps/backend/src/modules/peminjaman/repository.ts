import type { PeminjamanStatusEfektif } from '@perpustakaan/shared'
import { and, count, desc, eq, lt, type SQL, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { anggota, buku, peminjaman } from '../../db/schema'
import type { Tx } from '../../db/tx'

export type LoanRow = typeof peminjaman.$inferSelect

/** A loan row joined with the member + book names the DTO needs. */
export type PeminjamanJoinedRow = {
  id: number
  anggotaId: number
  anggotaNama: string
  anggotaNoAnggota: string
  bukuId: number
  bukuJudul: string
  tanggalPinjam: string
  tanggalKembaliRencana: string
  tanggalKembaliAktual: string | null
  status: 'dipinjam' | 'dikembalikan'
  denda: number
  createdAt: Date
  updatedAt: Date
}

export type CreateLoanValues = {
  anggotaId: number
  bukuId: number
  tanggalPinjam: string
  tanggalKembaliRencana: string
}

export type PeminjamanListOpts = {
  page: number
  limit: number
  status?: PeminjamanStatusEfektif
  anggotaId?: number
  bukuId?: number
  today: string
}

/** The repository surface the service depends on (so tests can inject a double). */
export interface PeminjamanRepo {
  transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T>
  findBuku(tx: Tx, id: number): Promise<{ id: number; stok: number; stokTersedia: number } | null>
  findAnggota(tx: Tx, id: number): Promise<{ id: number; aktif: boolean } | null>
  hasActiveLoanForPair(tx: Tx, anggotaId: number, bukuId: number): Promise<boolean>
  decrementStok(tx: Tx, bukuId: number): Promise<void>
  incrementStok(tx: Tx, bukuId: number): Promise<void>
  insertLoan(tx: Tx, values: CreateLoanValues): Promise<number>
  findLoanForUpdate(tx: Tx, id: number): Promise<LoanRow | null>
  updateLoanReturn(
    tx: Tx,
    id: number,
    values: { tanggalKembaliAktual: string; denda: number },
  ): Promise<void>
  updateEntry(
    tx: Tx,
    id: number,
    values: {
      anggotaId: number
      bukuId: number
      tanggalPinjam: string
      tanggalKembaliRencana: string
    },
  ): Promise<void>
  deleteLoan(tx: Tx, id: number): Promise<void>
  list(opts: PeminjamanListOpts): Promise<{ items: PeminjamanJoinedRow[]; total: number }>
  findByIdJoined(id: number): Promise<PeminjamanJoinedRow | null>
}

const joinedColumns = {
  id: peminjaman.id,
  anggotaId: peminjaman.anggotaId,
  anggotaNama: anggota.nama,
  anggotaNoAnggota: anggota.noAnggota,
  bukuId: peminjaman.bukuId,
  bukuJudul: buku.judul,
  tanggalPinjam: peminjaman.tanggalPinjam,
  tanggalKembaliRencana: peminjaman.tanggalKembaliRencana,
  tanggalKembaliAktual: peminjaman.tanggalKembaliAktual,
  status: peminjaman.status,
  denda: peminjaman.denda,
  createdAt: peminjaman.createdAt,
  updatedAt: peminjaman.updatedAt,
}

export const peminjamanRepo: PeminjamanRepo = {
  transaction(fn) {
    return db.transaction(fn)
  },

  async findBuku(tx, id) {
    const rows = await tx
      .select({ id: buku.id, stok: buku.stok, stokTersedia: buku.stokTersedia })
      .from(buku)
      .where(eq(buku.id, id))
      .for('update')
      .limit(1)
    return rows[0] ?? null
  },

  async findAnggota(tx, id) {
    const rows = await tx
      .select({ id: anggota.id, aktif: anggota.aktif })
      .from(anggota)
      .where(eq(anggota.id, id))
      .limit(1)
    return rows[0] ?? null
  },

  async hasActiveLoanForPair(tx, anggotaId, bukuId) {
    const rows = await tx
      .select({ id: peminjaman.id })
      .from(peminjaman)
      .where(
        and(
          eq(peminjaman.anggotaId, anggotaId),
          eq(peminjaman.bukuId, bukuId),
          eq(peminjaman.status, 'dipinjam'),
        ),
      )
      .limit(1)
    return rows.length > 0
  },

  async decrementStok(tx, bukuId) {
    await tx
      .update(buku)
      .set({ stokTersedia: sql`${buku.stokTersedia} - 1` })
      .where(eq(buku.id, bukuId))
  },

  async incrementStok(tx, bukuId) {
    // Capped so it never exceeds stok.
    await tx
      .update(buku)
      .set({ stokTersedia: sql`LEAST(${buku.stok}, ${buku.stokTersedia} + 1)` })
      .where(eq(buku.id, bukuId))
  },

  async insertLoan(tx, values) {
    const [res] = await tx
      .insert(peminjaman)
      .values({ ...values, status: 'dipinjam', denda: 0 })
      .$returningId()
    if (!res) throw new Error('Gagal membuat peminjaman.')
    return res.id
  },

  async findLoanForUpdate(tx, id) {
    const rows = await tx
      .select()
      .from(peminjaman)
      .where(eq(peminjaman.id, id))
      .for('update')
      .limit(1)
    return rows[0] ?? null
  },

  async updateLoanReturn(tx, id, values) {
    await tx
      .update(peminjaman)
      .set({
        status: 'dikembalikan',
        tanggalKembaliAktual: values.tanggalKembaliAktual,
        denda: values.denda,
      })
      .where(eq(peminjaman.id, id))
  },

  async updateEntry(tx, id, values) {
    await tx.update(peminjaman).set(values).where(eq(peminjaman.id, id))
  },

  async deleteLoan(tx, id) {
    await tx.delete(peminjaman).where(eq(peminjaman.id, id))
  },

  async list(opts) {
    const conds: SQL[] = []
    if (opts.status === 'dikembalikan') {
      conds.push(eq(peminjaman.status, 'dikembalikan'))
    } else if (opts.status === 'terlambat') {
      conds.push(eq(peminjaman.status, 'dipinjam'))
      conds.push(lt(peminjaman.tanggalKembaliRencana, opts.today))
    } else if (opts.status === 'dipinjam') {
      conds.push(eq(peminjaman.status, 'dipinjam'))
    }
    if (opts.anggotaId !== undefined) conds.push(eq(peminjaman.anggotaId, opts.anggotaId))
    if (opts.bukuId !== undefined) conds.push(eq(peminjaman.bukuId, opts.bukuId))
    const where = conds.length ? and(...conds) : undefined

    const items = await db
      .select(joinedColumns)
      .from(peminjaman)
      .innerJoin(anggota, eq(peminjaman.anggotaId, anggota.id))
      .innerJoin(buku, eq(peminjaman.bukuId, buku.id))
      .where(where)
      .orderBy(desc(peminjaman.id))
      .limit(opts.limit)
      .offset((opts.page - 1) * opts.limit)
    const [agg] = await db.select({ value: count() }).from(peminjaman).where(where)
    return { items, total: agg?.value ?? 0 }
  },

  async findByIdJoined(id) {
    const rows = await db
      .select(joinedColumns)
      .from(peminjaman)
      .innerJoin(anggota, eq(peminjaman.anggotaId, anggota.id))
      .innerJoin(buku, eq(peminjaman.bukuId, buku.id))
      .where(eq(peminjaman.id, id))
      .limit(1)
    return rows[0] ?? null
  },
}
