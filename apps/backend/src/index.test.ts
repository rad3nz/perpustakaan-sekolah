import { afterAll, beforeAll, describe, expect, test } from 'bun:test'

// Integration tests hit real Elysia routes against a disposable MariaDB. Gated so the
// default `bun test` stays green where no DB is present. Run with:
//   RUN_DB_TESTS=true DATABASE_URL=mysql://... JWT_SECRET=... bun test src/index.test.ts
const RUN = process.env.RUN_DB_TESTS === 'true'

describe.skipIf(!RUN)('integration', () => {
  // biome-ignore lint/suspicious/noExplicitAny: dynamically imported test fixtures
  let app: any
  // biome-ignore lint/suspicious/noExplicitAny: dynamically imported test fixtures
  let pool: any
  let token = ''

  async function call(path: string, init?: RequestInit) {
    const res = await app.handle(new Request(`http://localhost${path}`, init))
    return { status: res.status, body: await res.json() }
  }

  function authed(extra?: RequestInit): RequestInit {
    return { ...extra, headers: { ...(extra?.headers ?? {}), authorization: `Bearer ${token}` } }
  }

  beforeAll(async () => {
    const { sql } = await import('drizzle-orm')
    const client = await import('./db/client')
    pool = client.pool
    const { migrate } = await import('drizzle-orm/mysql2/migrator')
    await migrate(client.db, { migrationsFolder: './drizzle' })

    await client.db.execute(sql`SET FOREIGN_KEY_CHECKS=0`)
    for (const t of ['peminjaman', 'buku', 'anggota', 'users']) {
      await client.db.execute(sql.raw(`TRUNCATE TABLE ${t}`))
    }
    await client.db.execute(sql`SET FOREIGN_KEY_CHECKS=1`)

    const { users } = await import('./db/schema')
    await client.db.insert(users).values({
      nama: 'Petugas',
      username: 'petugas',
      password: await Bun.password.hash('password'),
    })

    app = (await import('./index')).app
  })

  afterAll(async () => {
    await pool.end()
  })

  test('login valid → token + user tanpa password', async () => {
    const { status, body } = await call('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'petugas', password: 'password' }),
    })
    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(typeof body.data.token).toBe('string')
    expect(body.data.user.password).toBeUndefined()
    token = body.data.token
  })

  test('login salah → 401', async () => {
    const { status, body } = await call('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: 'petugas', password: 'salah' }),
    })
    expect(status).toBe(401)
    expect(body.success).toBe(false)
  })

  test('GET /api/buku tanpa token → 401; dengan token → 200', async () => {
    const anon = await call('/api/buku')
    expect(anon.status).toBe(401)
    const ok = await call('/api/buku', authed())
    expect(ok.status).toBe(200)
    expect(ok.body.success).toBe(true)
    expect(Array.isArray(ok.body.data.items)).toBe(true)
  })

  test('pinjam menurunkan stok, kembalikan memulihkan (transaksional)', async () => {
    const book = await call(
      '/api/buku',
      authed({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          judul: 'Buku Uji',
          pengarang: 'Penulis',
          kategori: 'Sains',
          stok: 2,
        }),
      }),
    )
    expect(book.status).toBe(201)
    const bukuId = book.body.data.id
    expect(book.body.data.stokTersedia).toBe(2)

    const member = await call(
      '/api/anggota',
      authed({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nama: 'Siswa Uji', kelas: '10 A' }),
      }),
    )
    expect(member.status).toBe(201)
    const anggotaId = member.body.data.id
    expect(member.body.data.noAnggota).toBe('LIB-0001')

    const loan = await call(
      '/api/peminjaman',
      authed({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ anggotaId, bukuId, tanggalKembaliRencana: '2099-01-01' }),
      }),
    )
    expect(loan.status).toBe(201)
    const loanId = loan.body.data.id

    const afterLoan = await call(`/api/buku/${bukuId}`, authed())
    expect(afterLoan.body.data.stokTersedia).toBe(1)

    const ret = await call(
      `/api/peminjaman/${loanId}/kembalikan`,
      authed({
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tanggalKembali: '2099-01-01' }),
      }),
    )
    expect(ret.status).toBe(200)
    expect(ret.body.data.statusEfektif).toBe('dikembalikan')

    const afterReturn = await call(`/api/buku/${bukuId}`, authed())
    expect(afterReturn.body.data.stokTersedia).toBe(2) // no drift
  })

  test('filter status=terlambat hanya mengembalikan yang lewat jatuh tempo', async () => {
    const book = await call(
      '/api/buku',
      authed({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ judul: 'Buku Telat', pengarang: 'P', kategori: 'Fiksi', stok: 1 }),
      }),
    )
    const member = await call(
      '/api/anggota',
      authed({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ nama: 'Anggota Telat', kelas: '11 B' }),
      }),
    )
    await call(
      '/api/peminjaman',
      authed({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          anggotaId: member.body.data.id,
          bukuId: book.body.data.id,
          tanggalPinjam: '2020-01-01',
          tanggalKembaliRencana: '2020-01-10',
        }),
      }),
    )

    const late = await call('/api/peminjaman?status=terlambat', authed())
    expect(late.status).toBe(200)
    expect(late.body.data.items.length).toBeGreaterThanOrEqual(1)
    for (const item of late.body.data.items) {
      expect(item.statusEfektif).toBe('terlambat')
    }
  })

  test('envelope shape pada setiap respons', async () => {
    const { body } = await call('/api/dashboard/stats', authed())
    expect(body).toHaveProperty('success')
    expect(body).toHaveProperty('data')
    expect(body).toHaveProperty('message')
  })
})
