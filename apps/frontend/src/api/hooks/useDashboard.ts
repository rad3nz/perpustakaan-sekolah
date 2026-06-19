import { useQuery } from '@tanstack/react-query'
import { api } from '../client'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data, error } = await api.api.dashboard.stats.get()
      if (error) throw error
      return data.data
    },
    staleTime: 30_000,
  })
}
