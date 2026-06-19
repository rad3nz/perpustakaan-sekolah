import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

export type BukuQuery = { page: number; search?: string; kategori?: string }

export type BukuFormValues = {
  judul: string
  pengarang: string
  penerbit: string | null
  tahunTerbit: number | null
  isbn: string | null
  kategori: string
  stok: number
}

export function useBukuList(q: BukuQuery) {
  return useQuery({
    queryKey: ['buku', q],
    queryFn: async () => {
      const { data, error } = await api.api.buku.get({
        query: {
          page: q.page,
          limit: 20,
          search: q.search || undefined,
          kategori: q.kategori || undefined,
        },
      })
      if (error) throw error
      return data.data
    },
    staleTime: 30_000,
  })
}

export function useBukuMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['buku'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const create = useMutation({
    mutationFn: async (body: BukuFormValues) => {
      const { data, error } = await api.api.buku.post(body)
      if (error) throw error
      return data.data
    },
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: BukuFormValues }) => {
      const { data, error } = await api.api.buku({ id }).put(body)
      if (error) throw error
      return data.data
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await api.api.buku({ id }).delete()
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
