import { Elysia, t } from 'elysia'
import { todayISO } from '../../lib/dates'
import { envelope } from '../../lib/envelope'
import { clampPaging, pageQuery } from '../../lib/http'
import { authMacro } from '../../middleware/auth'
import { peminjamanService } from './service'

const idParam = t.Object({ id: t.Numeric() })

const createBody = t.Object({
  anggotaId: t.Integer(),
  bukuId: t.Integer(),
  tanggalPinjam: t.Optional(t.String({ format: 'date' })),
  tanggalKembaliRencana: t.String({ format: 'date' }),
})

const updateBody = t.Object({
  anggotaId: t.Integer(),
  bukuId: t.Integer(),
  tanggalPinjam: t.String({ format: 'date' }),
  tanggalKembaliRencana: t.String({ format: 'date' }),
})

export const peminjamanModule = new Elysia({ prefix: '/api/peminjaman' })
  .use(authMacro)
  .get(
    '/',
    async ({ query }) => {
      const { page, limit } = clampPaging(query)
      return envelope.ok(
        await peminjamanService.list({
          page,
          limit,
          status: query.status,
          anggotaId: query.anggotaId,
          bukuId: query.bukuId,
          today: todayISO(),
        }),
      )
    },
    {
      auth: true,
      query: t.Object({
        ...pageQuery,
        status: t.Optional(
          t.Union([t.Literal('dipinjam'), t.Literal('dikembalikan'), t.Literal('terlambat')]),
        ),
        anggotaId: t.Optional(t.Numeric()),
        bukuId: t.Optional(t.Numeric()),
      }),
    },
  )
  .post(
    '/',
    async ({ body, set }) => {
      const id = await peminjamanService.createLoan(body)
      set.status = 201
      return envelope.ok(await peminjamanService.get(id), 'Peminjaman berhasil dibuat.')
    },
    { auth: true, body: createBody },
  )
  .get('/:id', async ({ params }) => envelope.ok(await peminjamanService.get(params.id)), {
    auth: true,
    params: idParam,
  })
  .put(
    '/:id',
    async ({ params, body }) => {
      await peminjamanService.updateEntry(params.id, body)
      return envelope.ok(await peminjamanService.get(params.id), 'Peminjaman berhasil disimpan.')
    },
    { auth: true, params: idParam, body: updateBody },
  )
  .delete(
    '/:id',
    async ({ params }) => {
      await peminjamanService.remove(params.id)
      return envelope.ok(null, 'Peminjaman berhasil dihapus.')
    },
    { auth: true, params: idParam },
  )
  .patch(
    '/:id/kembalikan',
    async ({ params, body }) => {
      await peminjamanService.kembalikan(params.id, body.tanggalKembali)
      return envelope.ok(await peminjamanService.get(params.id), 'Buku berhasil dikembalikan.')
    },
    {
      auth: true,
      params: idParam,
      body: t.Object({ tanggalKembali: t.Optional(t.String({ format: 'date' })) }),
    },
  )
