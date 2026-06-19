import type { DashboardStats } from '@perpustakaan/shared'
import { and, count, eq, lt, sql } from 'drizzle-orm'
import { db } from '../../db/client'
import { anggota, buku, peminjaman } from '../../db/schema'

export const dashboardRepo = {
  async stats(today: string): Promise<DashboardStats> {
    const [bukuC] = await db.select({ v: count() }).from(buku)
    const [anggotaC] = await db.select({ v: count() }).from(anggota)
    const [aktifC] = await db
      .select({ v: count() })
      .from(peminjaman)
      .where(eq(peminjaman.status, 'dipinjam'))
    const [terlambatC] = await db
      .select({ v: count() })
      .from(peminjaman)
      .where(and(eq(peminjaman.status, 'dipinjam'), lt(peminjaman.tanggalKembaliRencana, today)))
    const [dendaSum] = await db
      .select({ v: sql<string>`COALESCE(SUM(${peminjaman.denda}), 0)` })
      .from(peminjaman)

    return {
      totalBuku: bukuC?.v ?? 0,
      totalAnggota: anggotaC?.v ?? 0,
      peminjamanAktif: aktifC?.v ?? 0,
      terlambat: terlambatC?.v ?? 0,
      totalDenda: Number(dendaSum?.v ?? 0),
    }
  },
}
