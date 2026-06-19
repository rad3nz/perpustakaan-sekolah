import { Elysia, t } from 'elysia'
import { envelope } from '../../lib/envelope'
import { clampPaging, pageQuery } from '../../lib/http'
import { authMacro } from '../../middleware/auth'
import { bukuService } from './service'

const bukuBody = t.Object({
  judul: t.String({ minLength: 1, maxLength: 255 }),
  pengarang: t.String({ minLength: 1, maxLength: 150 }),
  penerbit: t.Optional(t.Nullable(t.String({ maxLength: 150 }))),
  tahunTerbit: t.Optional(t.Nullable(t.Integer({ minimum: 0, maximum: 9999 }))),
  isbn: t.Optional(t.Nullable(t.String({ maxLength: 20 }))),
  kategori: t.String({ minLength: 1, maxLength: 100 }),
  stok: t.Integer({ minimum: 0 }),
})

const idParam = t.Object({ id: t.Numeric() })

export const bukuModule = new Elysia({ prefix: '/api/buku' })
  .use(authMacro)
  .get(
    '/',
    async ({ query }) => {
      const { page, limit } = clampPaging(query)
      return envelope.ok(
        await bukuService.list({ page, limit, search: query.search, kategori: query.kategori }),
      )
    },
    {
      auth: true,
      query: t.Object({
        ...pageQuery,
        search: t.Optional(t.String()),
        kategori: t.Optional(t.String()),
      }),
    },
  )
  .post(
    '/',
    async ({ body, set }) => {
      set.status = 201
      return envelope.ok(await bukuService.create(body), 'Buku berhasil disimpan.')
    },
    { auth: true, body: bukuBody },
  )
  .get('/:id', async ({ params }) => envelope.ok(await bukuService.get(params.id)), {
    auth: true,
    params: idParam,
  })
  .put(
    '/:id',
    async ({ params, body }) =>
      envelope.ok(await bukuService.update(params.id, body), 'Buku berhasil disimpan.'),
    { auth: true, params: idParam, body: bukuBody },
  )
  .delete(
    '/:id',
    async ({ params }) => {
      await bukuService.remove(params.id)
      return envelope.ok(null, 'Buku berhasil dihapus.')
    },
    { auth: true, params: idParam },
  )
