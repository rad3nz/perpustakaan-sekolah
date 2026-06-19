import { jwt } from '@elysiajs/jwt'
import { Elysia } from 'elysia'
import { env } from '../env'
import { envelope } from '../lib/envelope'
import { toUserDTO } from '../modules/auth/dto'
import { usersRepo } from '../modules/auth/repository'

// A single reusable guard. Because there are no roles it takes no arguments — it only
// asserts *authenticated*. Routes opt in with `{ auth: true }`. See 04-authentication.md.
export const authMacro = new Elysia({ name: 'auth' })
  .use(jwt({ name: 'jwt', secret: env.JWT_SECRET, exp: env.JWT_EXPIRES_IN }))
  .macro({
    auth: {
      async resolve({ jwt, headers, status }) {
        const token = headers.authorization?.replace('Bearer ', '')
        const payload = token ? await jwt.verify(token) : false
        if (!payload || payload.sub === undefined) {
          return status(401, envelope.fail('Token tidak valid atau sudah kedaluwarsa.'))
        }
        const user = await usersRepo.findById(Number(payload.sub))
        if (!user) {
          return status(401, envelope.fail('Pengguna tidak ditemukan.'))
        }
        return { user: toUserDTO(user) }
      },
    },
  })
