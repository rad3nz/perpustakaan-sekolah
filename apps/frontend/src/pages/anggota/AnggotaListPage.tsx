import { Button, Group, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import type { AnggotaDTO } from '@perpustakaan/shared'
import { useAnggotaList, useAnggotaMutations } from '../../api/hooks/useAnggota'
import { type Column, DataTable } from '../../components/DataTable'
import { Pagination } from '../../components/Pagination'
import { SearchInput } from '../../components/SearchInput'
import { cn } from '../../lib/cn'
import { getErrorMessage } from '../../lib/api-error'
import { AnggotaFormModal } from './AnggotaFormModal'

export function AnggotaListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AnggotaDTO | null>(null)

  const { data, isLoading } = useAnggotaList({ page, search })
  const { remove } = useAnggotaMutations()

  async function onDelete(a: AnggotaDTO) {
    if (!window.confirm(`Hapus anggota "${a.nama}"?`)) return
    try {
      await remove.mutateAsync(a.id)
      notifications.show({ message: 'Anggota berhasil dihapus.', color: 'green' })
    } catch (e) {
      notifications.show({ message: getErrorMessage(e), color: 'red' })
    }
  }

  const columns: Column<AnggotaDTO>[] = [
    { key: 'noAnggota', header: 'No. Anggota', render: (a) => a.noAnggota },
    { key: 'nama', header: 'Nama', render: (a) => a.nama },
    { key: 'kelas', header: 'Kelas', render: (a) => a.kelas },
    { key: 'telepon', header: 'Telepon', render: (a) => a.telepon ?? '-' },
    {
      key: 'status',
      header: 'Status',
      render: (a) => (
        <span
          className={cn(
            'inline-block rounded-full px-2 py-0.5 font-medium text-xs',
            a.aktif ? 'bg-green-100 text-green-800' : 'bg-navy-100 text-navy-700',
          )}
        >
          {a.aktif ? 'Aktif' : 'Non-aktif'}
        </span>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (a) => (
        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            onClick={() => {
              setEditing(a)
              setModalOpen(true)
            }}
          >
            Edit
          </Button>
          <Button
            size="xs"
            onClick={() => onDelete(a)}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Hapus
          </Button>
        </Group>
      ),
    },
  ]

  return (
    <div>
      <Group justify="space-between" className="mb-4">
        <Title order={2} className="text-navy-800">
          Anggota
        </Title>
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="bg-brand-600 text-white hover:bg-brand-700"
        >
          Tambah Anggota
        </Button>
      </Group>

      <Group className="mb-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Cari nama atau no. anggota…"
        />
      </Group>

      <DataTable columns={columns} rows={data?.items ?? []} loading={isLoading} />
      {data && (
        <Pagination page={page} limit={data.limit} total={data.total} onChange={setPage} />
      )}

      <AnggotaFormModal opened={modalOpen} onClose={() => setModalOpen(false)} anggota={editing} />
    </div>
  )
}
