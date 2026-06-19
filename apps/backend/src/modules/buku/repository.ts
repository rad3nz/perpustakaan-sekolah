import { and, count, desc, eq, like, ne, type SQL } from 'drizzle-orm'
import { db } from '../../db/client'
import { buku, peminjaman } from '../../db/schema'
import type { BukuRow } from './dto'

export type BukuInsert = typeof buku.$inferInsert

export type BukuListOpts = {
  page: number
  limit: number
  search?: string
  kategori?: string
}

export const bukuRepo = {
  async list(opts: BukuListOpts): Promise<{ items: BukuRow[]; total: number }> {
    const conds: SQL[] = []
    if (opts.search) conds.push(like(buku.judul, `%${opts.search}%`))
    if (opts.kategori) conds.push(eq(buku.kategori, opts.kategori))
    const where = conds.length ? and(...conds) : undefined

    const items = await db
      .select()
      .from(buku)
      .where(where)
      .orderBy(desc(buku.id))
      .limit(opts.limit)
      .offset((opts.page - 1) * opts.limit)
    const [agg] = await db.select({ value: count() }).from(buku).where(where)
    return { items, total: agg?.value ?? 0 }
  },

  async findById(id: number): Promise<BukuRow | null> {
    const rows = await db.select().from(buku).where(eq(buku.id, id)).limit(1)
    return rows[0] ?? null
  },

  async insert(values: BukuInsert): Promise<BukuRow> {
    const [res] = await db.insert(buku).values(values).$returningId()
    const created = res ? await this.findById(res.id) : null
    if (!created) throw new Error('Gagal membuat buku.')
    return created
  },

  async update(id: number, values: Partial<BukuInsert>): Promise<void> {
    await db.update(buku).set(values).where(eq(buku.id, id))
  },

  async remove(id: number): Promise<void> {
    await db.delete(buku).where(eq(buku.id, id))
  },

  async isbnExists(isbn: string, exceptId?: number): Promise<boolean> {
    const conds: SQL[] = [eq(buku.isbn, isbn)]
    if (exceptId !== undefined) conds.push(ne(buku.id, exceptId))
    const rows = await db
      .select({ id: buku.id })
      .from(buku)
      .where(and(...conds))
      .limit(1)
    return rows.length > 0
  },

  async hasActiveLoan(bukuId: number): Promise<boolean> {
    const rows = await db
      .select({ id: peminjaman.id })
      .from(peminjaman)
      .where(and(eq(peminjaman.bukuId, bukuId), eq(peminjaman.status, 'dipinjam')))
      .limit(1)
    return rows.length > 0
  },
}
