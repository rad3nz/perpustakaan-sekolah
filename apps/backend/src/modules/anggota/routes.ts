import { Elysia, t } from 'elysia'
import { envelope } from '../../lib/envelope'
import { clampPaging, pageQuery } from '../../lib/http'
import { authMacro } from '../../middleware/auth'
import { anggotaService } from './service'

const anggotaBody = t.Object({
  nama: t.String({ minLength: 1, maxLength: 150 }),
  kelas: t.String({ minLength: 1, maxLength: 50 }),
  telepon: t.Optional(t.Nullable(t.String({ maxLength: 30 }))),
  aktif: t.Optional(t.Boolean()),
})

const idParam = t.Object({ id: t.Numeric() })

export const anggotaModule = new Elysia({ prefix: '/api/anggota' })
  .use(authMacro)
  .get(
    '/',
    async ({ query }) => {
      const { page, limit } = clampPaging(query)
      return envelope.ok(
        await anggotaService.list({ page, limit, search: query.search, aktif: query.aktif }),
      )
    },
    {
      auth: true,
      query: t.Object({
        ...pageQuery,
        search: t.Optional(t.String()),
        aktif: t.Optional(t.BooleanString()),
      }),
    },
  )
  .post(
    '/',
    async ({ body, set }) => {
      set.status = 201
      return envelope.ok(await anggotaService.create(body), 'Anggota berhasil disimpan.')
    },
    { auth: true, body: anggotaBody },
  )
  .get('/:id', async ({ params }) => envelope.ok(await anggotaService.get(params.id)), {
    auth: true,
    params: idParam,
  })
  .put(
    '/:id',
    async ({ params, body }) =>
      envelope.ok(await anggotaService.update(params.id, body), 'Anggota berhasil disimpan.'),
    { auth: true, params: idParam, body: anggotaBody },
  )
  .delete(
    '/:id',
    async ({ params }) => {
      await anggotaService.remove(params.id)
      return envelope.ok(null, 'Anggota berhasil dihapus.')
    },
    { auth: true, params: idParam },
  )
