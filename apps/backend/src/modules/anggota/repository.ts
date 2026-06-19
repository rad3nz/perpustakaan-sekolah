import { and, count, desc, eq, like, or, sql, type SQL } from 'drizzle-orm'
import { db } from '../../db/client'
import { anggota, peminjaman } from '../../db/schema'
import type { Tx } from '../../db/tx'
import type { AnggotaRow } from './dto'

export type AnggotaInsert = typeof anggota.$inferInsert

export type AnggotaListOpts = {
  page: number
  limit: number
  search?: string
  aktif?: boolean
}

export const anggotaRepo = {
  async list(opts: AnggotaListOpts): Promise<{ items: AnggotaRow[]; total: number }> {
    const conds: SQL[] = []
    if (opts.search) {
      const term = `%${opts.search}%`
      const match = or(like(anggota.nama, term), like(anggota.noAnggota, term))
      if (match) conds.push(match)
    }
    if (opts.aktif !== undefined) conds.push(eq(anggota.aktif, opts.aktif))
    const where = conds.length ? and(...conds) : undefined

    const items = await db
      .select()
      .from(anggota)
      .where(where)
      .orderBy(desc(anggota.id))
      .limit(opts.limit)
      .offset((opts.page - 1) * opts.limit)
    const [agg] = await db.select({ value: count() }).from(anggota).where(where)
    return { items, total: agg?.value ?? 0 }
  },

  async findById(id: number): Promise<AnggotaRow | null> {
    const rows = await db.select().from(anggota).where(eq(anggota.id, id)).limit(1)
    return rows[0] ?? null
  },

  /** Highest existing member-number sequence (numeric part), 0 if none. Tx-bound to avoid races. */
  async maxNoAnggotaSeq(tx: Tx): Promise<number> {
    const [row] = await tx
      .select({
        max: sql<number | null>`MAX(CAST(SUBSTRING(${anggota.noAnggota}, 5) AS UNSIGNED))`,
      })
      .from(anggota)
    return row?.max ?? 0
  },

  async insert(tx: Tx, values: AnggotaInsert): Promise<number> {
    const [res] = await tx.insert(anggota).values(values).$returningId()
    if (!res) throw new Error('Gagal membuat anggota.')
    return res.id
  },

  async update(id: number, values: Partial<AnggotaInsert>): Promise<void> {
    await db.update(anggota).set(values).where(eq(anggota.id, id))
  },

  async remove(id: number): Promise<void> {
    await db.delete(anggota).where(eq(anggota.id, id))
  },

  async hasActiveLoan(anggotaId: number): Promise<boolean> {
    const rows = await db
      .select({ id: peminjaman.id })
      .from(peminjaman)
      .where(and(eq(peminjaman.anggotaId, anggotaId), eq(peminjaman.status, 'dipinjam')))
      .limit(1)
    return rows.length > 0
  },
}
