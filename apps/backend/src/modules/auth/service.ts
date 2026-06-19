import { UnauthorizedError } from '../../lib/errors'
import { toUserDTO } from './dto'
import { usersRepo } from './repository'

export const authService = {
  /** Verify username + password (argon2id via Bun.password). Throws 401 on mismatch. */
  async verifyCredentials(username: string, password: string) {
    const user = await usersRepo.findByUsername(username)
    if (!user) throw new UnauthorizedError('Username atau password salah.')
    const ok = await Bun.password.verify(password, user.password)
    if (!ok) throw new UnauthorizedError('Username atau password salah.')
    return toUserDTO(user)
  },
}
