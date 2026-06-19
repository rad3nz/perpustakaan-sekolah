import type { DashboardStats } from '@perpustakaan/shared'
import { todayISO } from '../../lib/dates'
import { dashboardRepo } from './repository'

export const dashboardService = {
  async stats(): Promise<DashboardStats> {
    return dashboardRepo.stats(todayISO())
  },
}
