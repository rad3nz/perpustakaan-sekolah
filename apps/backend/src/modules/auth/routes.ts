import { Elysia, t } from 'elysia'
import { envelope } from '../../lib/envelope'
import { authMacro } from '../../middleware/auth'
import { authService } from './service'

export const authModule = new Elysia({ prefix: '/api/auth' })
  .use(authMacro)
  .post(
    '/login',
    async ({ body, jwt }) => {
      const user = await authService.verifyCredentials(body.username, body.password)
      const token = await jwt.sign({ sub: String(user.id) })
      return envelope.ok({ token, user }, 'Berhasil masuk.')
    },
    {
      body: t.Object({
        username: t.String({ minLength: 1 }),
        password: t.String({ minLength: 1 }),
      }),
    },
  )
  .post('/logout', () => envelope.ok(null, 'Berhasil keluar.'), { auth: true })
  .get('/me', ({ user }) => envelope.ok(user), { auth: true })
