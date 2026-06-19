import type { PeminjamanStatusEfektif } from '@perpustakaan/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

export type PeminjamanQuery = {
  page: number
  status?: PeminjamanStatusEfektif
  anggotaId?: number
  bukuId?: number
}

export type LoanFormValues = {
  anggotaId: number
  bukuId: number
  tanggalPinjam: string
  tanggalKembaliRencana: string
}

export function usePeminjamanList(q: PeminjamanQuery) {
  return useQuery({
    queryKey: ['peminjaman', q],
    queryFn: async () => {
      const { data, error } = await api.api.peminjaman.get({
        query: {
          page: q.page,
          limit: 20,
          status: q.status,
          anggotaId: q.anggotaId,
          bukuId: q.bukuId,
        },
      })
      if (error) throw error
      return data.data
    },
    staleTime: 30_000,
  })
}

export function usePeminjamanMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['peminjaman'] })
    qc.invalidateQueries({ queryKey: ['buku'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const create = useMutation({
    mutationFn: async (body: LoanFormValues) => {
      const { data, error } = await api.api.peminjaman.post(body)
      if (error) throw error
      return data.data
    },
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await api.api.peminjaman({ id }).delete()
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const kembalikan = useMutation({
    mutationFn: async ({ id, tanggalKembali }: { id: number; tanggalKembali: string }) => {
      const { data, error } = await api.api.peminjaman({ id }).kembalikan.patch({ tanggalKembali })
      if (error) throw error
      return data.data
    },
    onSuccess: invalidate,
  })

  return { create, remove, kembalikan }
}

/** Lightweight option lists for the loan form selects (first 100 rows). */
export function useAnggotaOptions() {
  return useQuery({
    queryKey: ['anggota-options'],
    queryFn: async () => {
      const { data, error } = await api.api.anggota.get({ query: { page: 1, limit: 100, aktif: true } })
      if (error) throw error
      return data.data.items
    },
    staleTime: 60_000,
  })
}

export function useBukuOptions() {
  return useQuery({
    queryKey: ['buku-options'],
    queryFn: async () => {
      const { data, error } = await api.api.buku.get({ query: { page: 1, limit: 100 } })
      if (error) throw error
      return data.data.items
    },
    staleTime: 60_000,
  })
}
