import { hitungDenda } from '../lib/fines'
import { formatNoAnggota } from '../lib/member-number'
import { peminjamanService } from '../modules/peminjaman/service'
import { db, pool } from './client'
import { anggota, buku, peminjaman, users } from './schema'

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}
/** Asserts a seeded id exists (the seed arrays are populated above in order). */
function req<T>(v: T | undefined): T {
  if (v === undefined) throw new Error('Seed: indeks data tidak ditemukan.')
  return v
}

const TODAY = new Date()

// 24 realistic Indonesian titles across the six categories. `stok` varies; book[0]
// has stok=1 so its single active loan leaves it Habis (stok_tersedia=0).
const BUKU_SEED: Array<{
  judul: string
  pengarang: string
  penerbit: string | null
  tahunTerbit: number | null
  isbn: string | null
  kategori: string
  stok: number
}> = [
  {
    judul: 'Laskar Pelangi',
    pengarang: 'Andrea Hirata',
    penerbit: 'Bentang Pustaka',
    tahunTerbit: 2005,
    isbn: '9789793062792',
    kategori: 'Fiksi',
    stok: 1,
  },
  {
    judul: 'Bumi Manusia',
    pengarang: 'Pramoedya Ananta Toer',
    penerbit: 'Lentera Dipantara',
    tahunTerbit: 1980,
    isbn: '9789799731234',
    kategori: 'Fiksi',
    stok: 4,
  },
  {
    judul: 'Negeri 5 Menara',
    pengarang: 'Ahmad Fuadi',
    penerbit: 'Gramedia',
    tahunTerbit: 2009,
    isbn: '9789792248616',
    kategori: 'Fiksi',
    stok: 3,
  },
  {
    judul: 'Sang Pemimpi',
    pengarang: 'Andrea Hirata',
    penerbit: 'Bentang Pustaka',
    tahunTerbit: 2006,
    isbn: '9789793062808',
    kategori: 'Fiksi',
    stok: 2,
  },
  {
    judul: 'Ayat-Ayat Cinta',
    pengarang: 'Habiburrahman El Shirazy',
    penerbit: 'Republika',
    tahunTerbit: 2004,
    isbn: '9789793210247',
    kategori: 'Fiksi',
    stok: 2,
  },
  {
    judul: 'Filosofi Teras',
    pengarang: 'Henry Manampiring',
    penerbit: 'Kompas',
    tahunTerbit: 2018,
    isbn: '9786024125189',
    kategori: 'Non-Fiksi',
    stok: 5,
  },
  {
    judul: 'Atomic Habits (Edisi Indonesia)',
    pengarang: 'James Clear',
    penerbit: 'Gramedia',
    tahunTerbit: 2019,
    isbn: '9786020633176',
    kategori: 'Non-Fiksi',
    stok: 6,
  },
  {
    judul: 'Berani Tidak Disukai',
    pengarang: 'Ichiro Kishimi',
    penerbit: 'Gramedia',
    tahunTerbit: 2019,
    isbn: '9786020512673',
    kategori: 'Non-Fiksi',
    stok: 3,
  },
  {
    judul: 'Sapiens',
    pengarang: 'Yuval Noah Harari',
    penerbit: 'Kepustakaan Populer Gramedia',
    tahunTerbit: 2017,
    isbn: '9786024246945',
    kategori: 'Sains',
    stok: 4,
  },
  {
    judul: 'A Brief History of Time',
    pengarang: 'Stephen Hawking',
    penerbit: 'Gramedia',
    tahunTerbit: 2016,
    isbn: '9786020332215',
    kategori: 'Sains',
    stok: 2,
  },
  {
    judul: 'Kosmos',
    pengarang: 'Carl Sagan',
    penerbit: 'Gramedia',
    tahunTerbit: 2015,
    isbn: null,
    kategori: 'Sains',
    stok: 3,
  },
  {
    judul: 'Fisika Dasar SMA',
    pengarang: 'Marthen Kanginan',
    penerbit: 'Erlangga',
    tahunTerbit: 2016,
    isbn: '9786022983451',
    kategori: 'Sains',
    stok: 5,
  },
  {
    judul: 'Tafsir Al-Misbah Jilid 1',
    pengarang: 'M. Quraish Shihab',
    penerbit: 'Lentera Hati',
    tahunTerbit: 2002,
    isbn: '9789791480017',
    kategori: 'Agama',
    stok: 2,
  },
  {
    judul: 'Sirah Nabawiyah',
    pengarang: 'Syaikh Shafiyyurrahman',
    penerbit: 'Pustaka Al-Kautsar',
    tahunTerbit: 2010,
    isbn: '9789795925217',
    kategori: 'Agama',
    stok: 3,
  },
  {
    judul: 'Riyadhus Shalihin',
    pengarang: 'Imam An-Nawawi',
    penerbit: 'Pustaka Amani',
    tahunTerbit: 2008,
    isbn: null,
    kategori: 'Agama',
    stok: 4,
  },
  {
    judul: 'Sejarah Indonesia Modern',
    pengarang: 'M.C. Ricklefs',
    penerbit: 'Serambi',
    tahunTerbit: 2008,
    isbn: '9789791112116',
    kategori: 'Sejarah',
    stok: 3,
  },
  {
    judul: 'Gajah Mada',
    pengarang: 'Langit Kresna Hariadi',
    penerbit: 'Tiga Serangkai',
    tahunTerbit: 2006,
    isbn: '9789796684892',
    kategori: 'Sejarah',
    stok: 2,
  },
  {
    judul: 'Tan Malaka: Dari Penjara ke Penjara',
    pengarang: 'Tan Malaka',
    penerbit: 'Narasi',
    tahunTerbit: 2014,
    isbn: '9789791685108',
    kategori: 'Sejarah',
    stok: 2,
  },
  {
    judul: 'Api Sejarah',
    pengarang: 'Ahmad Mansur Suryanegara',
    penerbit: 'Salamadani',
    tahunTerbit: 2010,
    isbn: null,
    kategori: 'Sejarah',
    stok: 3,
  },
  {
    judul: 'Pemrograman Web Modern',
    pengarang: 'Budi Raharjo',
    penerbit: 'Informatika',
    tahunTerbit: 2020,
    isbn: '9786237131089',
    kategori: 'Teknologi',
    stok: 5,
  },
  {
    judul: 'Belajar Pemrograman Python',
    pengarang: 'Eric Matthes',
    penerbit: 'Andi',
    tahunTerbit: 2019,
    isbn: '9786230108372',
    kategori: 'Teknologi',
    stok: 4,
  },
  {
    judul: 'Jaringan Komputer',
    pengarang: 'Andrew Tanenbaum',
    penerbit: 'Prenhallindo',
    tahunTerbit: 2017,
    isbn: '9789794581223',
    kategori: 'Teknologi',
    stok: 2,
  },
  {
    judul: 'Kecerdasan Buatan',
    pengarang: 'Stuart Russell',
    penerbit: 'Andi',
    tahunTerbit: 2021,
    isbn: '9786230112348',
    kategori: 'Teknologi',
    stok: 3,
  },
  {
    judul: 'Algoritma dan Struktur Data',
    pengarang: 'Rinaldi Munir',
    penerbit: 'Informatika',
    tahunTerbit: 2016,
    isbn: '9789791409513',
    kategori: 'Teknologi',
    stok: 4,
  },
]

const ANGGOTA_SEED: Array<{ nama: string; kelas: string; telepon: string | null; aktif: boolean }> =
  [
    { nama: 'Ahmad Fauzi', kelas: '10 A', telepon: '081234567801', aktif: true },
    { nama: 'Siti Nurhaliza', kelas: '10 B', telepon: '081234567802', aktif: true },
    { nama: 'Budi Santoso', kelas: '11 IPA 1', telepon: '081234567803', aktif: true },
    { nama: 'Dewi Lestari', kelas: '11 IPA 2', telepon: '081234567804', aktif: true },
    { nama: 'Eko Prasetyo', kelas: '12 IPS 1', telepon: '081234567805', aktif: true },
    { nama: 'Fitri Handayani', kelas: '10 C', telepon: '081234567806', aktif: true },
    { nama: 'Gunawan Wibowo', kelas: '11 IPA 3', telepon: '081234567807', aktif: true },
    { nama: 'Hana Permata', kelas: '12 IPA 1', telepon: '081234567808', aktif: true },
    { nama: 'Indra Kurniawan', kelas: '10 A', telepon: '081234567809', aktif: true },
    { nama: 'Joko Susilo', kelas: '11 IPS 2', telepon: '081234567810', aktif: true },
    { nama: 'Kartika Sari', kelas: '12 IPS 2', telepon: null, aktif: false },
    { nama: 'Lukman Hakim', kelas: '10 B', telepon: '081234567812', aktif: false },
  ]

async function main() {
  const existing = await db.select({ id: buku.id }).from(buku).limit(1)
  if (existing.length > 0) {
    console.log('Seed sudah ada, dilewati.')
    await pool.end()
    process.exit(0)
  }

  console.log('Menjalankan seed…')

  // 1) Staff (argon2id-hashed). Demo creds listed in README.
  await db.insert(users).values([
    {
      nama: 'Petugas Perpustakaan',
      username: 'petugas',
      password: await Bun.password.hash('password'),
    },
    { nama: 'Administrator', username: 'admin', password: await Bun.password.hash('password') },
  ])

  // 2) Buku (stok_tersedia starts equal to stok; active loans below decrement it).
  const bukuIds: number[] = []
  for (const b of BUKU_SEED) {
    const [res] = await db
      .insert(buku)
      .values({ ...b, stokTersedia: b.stok })
      .$returningId()
    if (res) bukuIds.push(res.id)
  }

  // 3) Anggota with generated no_anggota in insertion order.
  const anggotaIds: number[] = []
  for (let i = 0; i < ANGGOTA_SEED.length; i++) {
    const a = ANGGOTA_SEED[i]
    if (!a) continue
    const [res] = await db
      .insert(anggota)
      .values({ ...a, noAnggota: formatNoAnggota(i + 1) })
      .$returningId()
    if (res) anggotaIds.push(res.id)
  }

  // 4a) Active loans via the REAL createLoan path so stock decrements through actual code.
  //     4 on-time (dipinjam) + 3 overdue (terlambat = past due date, still active).
  const activePinjam = iso(addDays(TODAY, -2))
  const activeRencana = iso(addDays(TODAY, 12))
  for (let k = 0; k < 4; k++) {
    await peminjamanService.createLoan({
      anggotaId: req(anggotaIds[k]),
      bukuId: req(bukuIds[k]),
      tanggalPinjam: activePinjam,
      tanggalKembaliRencana: activeRencana,
    })
  }
  // overdue: due 3 days ago → projected denda Rp 3.000
  const overduePinjam = iso(addDays(TODAY, -20))
  const overdueRencana = iso(addDays(TODAY, -3))
  for (let k = 4; k < 7; k++) {
    await peminjamanService.createLoan({
      anggotaId: req(anggotaIds[k]),
      bukuId: req(bukuIds[k]),
      tanggalPinjam: overduePinjam,
      tanggalKembaliRencana: overdueRencana,
    })
  }

  // 4b) Returned loans inserted directly (net-zero current stock).
  const retPinjam = iso(addDays(TODAY, -30))
  const retRencana = iso(addDays(TODAY, -20))
  const onTimeActual = iso(addDays(TODAY, -22)) // ≤ rencana → denda 0
  const lateActual = iso(addDays(TODAY, -15)) // rencana + 5 → denda 5.000

  const returnedRows: Array<typeof peminjaman.$inferInsert> = []
  // 3 returned on-time
  for (let k = 0; k < 3; k++) {
    returnedRows.push({
      anggotaId: req(anggotaIds[k]),
      bukuId: req(bukuIds[14 + k]),
      tanggalPinjam: retPinjam,
      tanggalKembaliRencana: retRencana,
      tanggalKembaliAktual: onTimeActual,
      status: 'dikembalikan',
      denda: hitungDenda(retRencana, onTimeActual),
    })
  }
  // 2 returned late (denda = (aktual − rencana) × 1000)
  for (let k = 0; k < 2; k++) {
    returnedRows.push({
      anggotaId: req(anggotaIds[3 + k]),
      bukuId: req(bukuIds[17 + k]),
      tanggalPinjam: retPinjam,
      tanggalKembaliRencana: retRencana,
      tanggalKembaliAktual: lateActual,
      status: 'dikembalikan',
      denda: hitungDenda(retRencana, lateActual),
    })
  }
  await db.insert(peminjaman).values(returnedRows)

  console.log(
    `Seed selesai: ${BUKU_SEED.length} buku, ${ANGGOTA_SEED.length} anggota, ${7 + returnedRows.length} peminjaman.`,
  )
  await pool.end()
  process.exit(0)
}

main().catch(async (err) => {
  console.error('Seed gagal:', err)
  await pool.end()
  process.exit(1)
})
