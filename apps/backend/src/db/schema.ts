import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'
import { PEMINJAMAN_STATUS } from '@perpustakaan/shared'

// Library staff — backs authentication (login only, no roles). See 04-authentication.md.
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  nama: varchar('nama', { length: 150 }).notNull(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // argon2id hash
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
})

export const buku = mysqlTable(
  'buku',
  {
    id: int('id').autoincrement().primaryKey(),
    judul: varchar('judul', { length: 255 }).notNull(),
    pengarang: varchar('pengarang', { length: 150 }).notNull(),
    penerbit: varchar('penerbit', { length: 150 }),
    tahunTerbit: int('tahun_terbit'),
    isbn: varchar('isbn', { length: 20 }),
    kategori: varchar('kategori', { length: 100 }).notNull(),
    stok: int('stok').notNull().default(0),
    stokTersedia: int('stok_tersedia').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    index('buku_judul_idx').on(t.judul),
    index('buku_kategori_idx').on(t.kategori),
    // Unique ONLY when present: MySQL/MariaDB treats multiple NULLs as distinct,
    // so a plain unique index already permits many null ISBNs — exactly what we want.
    uniqueIndex('buku_isbn_idx').on(t.isbn),
  ],
)

export const anggota = mysqlTable(
  'anggota',
  {
    id: int('id').autoincrement().primaryKey(),
    nama: varchar('nama', { length: 150 }).notNull(),
    noAnggota: varchar('no_anggota', { length: 20 }).notNull().unique(),
    kelas: varchar('kelas', { length: 50 }).notNull(),
    telepon: varchar('telepon', { length: 30 }),
    aktif: boolean('aktif').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index('anggota_nama_idx').on(t.nama)],
)

export const peminjaman = mysqlTable(
  'peminjaman',
  {
    id: int('id').autoincrement().primaryKey(),
    anggotaId: int('anggota_id')
      .notNull()
      .references(() => anggota.id),
    bukuId: int('buku_id')
      .notNull()
      .references(() => buku.id),
    tanggalPinjam: date('tanggal_pinjam', { mode: 'string' }).notNull(),
    tanggalKembaliRencana: date('tanggal_kembali_rencana', { mode: 'string' }).notNull(),
    tanggalKembaliAktual: date('tanggal_kembali_aktual', { mode: 'string' }), // null until returned
    status: mysqlEnum('status', PEMINJAMAN_STATUS).notNull().default('dipinjam'),
    denda: int('denda').notNull().default(0), // IDR, computed on return
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    index('peminjaman_anggota_idx').on(t.anggotaId),
    index('peminjaman_buku_idx').on(t.bukuId),
    index('peminjaman_status_idx').on(t.status),
  ],
)

export const anggotaRelations = relations(anggota, ({ many }) => ({
  peminjaman: many(peminjaman),
}))

export const bukuRelations = relations(buku, ({ many }) => ({
  peminjaman: many(peminjaman),
}))

export const peminjamanRelations = relations(peminjaman, ({ one }) => ({
  anggota: one(anggota, { fields: [peminjaman.anggotaId], references: [anggota.id] }),
  buku: one(buku, { fields: [peminjaman.bukuId], references: [buku.id] }),
}))
