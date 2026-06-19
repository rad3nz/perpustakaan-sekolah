import { cors } from '@elysiajs/cors'
import { Elysia } from 'elysia'
import { env } from './env'
import { envelope } from './lib/envelope'
import { AppError, formatTypeBoxErrors } from './lib/errors'
import { anggotaModule } from './modules/anggota/routes'
import { authModule } from './modules/auth/routes'
import { bukuModule } from './modules/buku/routes'
import { dashboardModule } from './modules/dashboard/routes'
import { peminjamanModule } from './modules/peminjaman/routes'

export const app = new Elysia()
  .use(cors({ origin: env.CORS_ORIGIN }))
  .onError(({ code, error, set }) => {
    if (error instanceof AppError) {
      set.status = error.status
      return envelope.fail(error.message, error.errors)
    }
    if (code === 'VALIDATION') {
      set.status = 422
      return envelope.fail('Input tidak valid.', formatTypeBoxErrors(error))
    }
    if (code === 'NOT_FOUND') {
      set.status = 404
      return envelope.fail('Rute tidak ditemukan.')
    }
    set.status = 500
    console.error(error) // log details server-side; never leak internals
    return envelope.fail('Terjadi kesalahan pada server.')
  })
  .use(authModule)
  .use(bukuModule)
  .use(anggotaModule)
  .use(peminjamanModule)
  .use(dashboardModule)

export type App = typeof app

// Listen only when run as the entrypoint (not when imported by tests).
if (import.meta.main) {
  app.listen(env.PORT)
  console.log(`Server perpustakaan berjalan di port ${env.PORT}`)
}
