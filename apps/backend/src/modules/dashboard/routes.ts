import { Elysia } from 'elysia'
import { envelope } from '../../lib/envelope'
import { authMacro } from '../../middleware/auth'
import { dashboardService } from './service'

export const dashboardModule = new Elysia({ prefix: '/api/dashboard' })
  .use(authMacro)
  .get('/stats', async () => envelope.ok(await dashboardService.stats()), { auth: true })
