import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

export type AnggotaQuery = { page: number; search?: string; aktif?: boolean }

export type AnggotaFormValues = {
  nama: string
  kelas: string
  telepon: string | null
  aktif: boolean
}

export function useAnggotaList(q: AnggotaQuery) {
  return useQuery({
    queryKey: ['anggota', q],
    queryFn: async () => {
      const { data, error } = await api.api.anggota.get({
        query: {
          page: q.page,
          limit: 20,
          search: q.search || undefined,
          aktif: q.aktif,
        },
      })
      if (error) throw error
      return data.data
    },
    staleTime: 30_000,
  })
}

export function useAnggotaMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['anggota'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const create = useMutation({
    mutationFn: async (body: AnggotaFormValues) => {
      const { data, error } = await api.api.anggota.post(body)
      if (error) throw error
      return data.data
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: AnggotaFormValues }) => {
      const { data, error } = await api.api.anggota({ id }).put(body)
      if (error) throw error
      return data.data
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await api.api.anggota({ id }).delete()
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
