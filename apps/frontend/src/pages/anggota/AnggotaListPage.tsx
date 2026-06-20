import { Button, Group } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { AnggotaDTO } from '@perpustakaan/shared'
import { useState } from 'react'
import { useAnggotaList, useAnggotaMutations } from '../../api/hooks/useAnggota'
import { type Column, DataTable } from '../../components/DataTable'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { SearchInput } from '../../components/SearchInput'
import { Surface } from '../../components/Surface'
import { getErrorMessage } from '../../lib/api-error'
import { cn } from '../../lib/cn'
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
    {
      key: 'noAnggota',
      header: 'No. Anggota',
      render: (a) => <span className="font-medium tabular-nums">{a.noAnggota}</span>,
    },
    { key: 'nama', header: 'Nama', render: (a) => a.nama },
    { key: 'kelas', header: 'Kelas', render: (a) => a.kelas },
    { key: 'telepon', header: 'Telepon', render: (a) => a.telepon ?? '—' },
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
      align: 'right',
      render: (a) => (
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <Button
            size="xs"
            variant="default"
            onClick={() => {
              setEditing(a)
              setModalOpen(true)
            }}
          >
            Edit
          </Button>
          <Button size="xs" variant="light" color="red" onClick={() => onDelete(a)}>
            Hapus
          </Button>
        </Group>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Anggota" description="Kelola data anggota perpustakaan.">
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          Tambah Anggota
        </Button>
      </PageHeader>

      <Surface p={false}>
        <div className="flex flex-wrap items-center gap-3 border-navy-100 border-b p-4">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            placeholder="Cari nama atau no. anggota…"
          />
        </div>

        <DataTable columns={columns} rows={data?.items ?? []} loading={isLoading} />

        {data && (
          <div className="border-navy-100 border-t p-3">
            <Pagination page={page} limit={data.limit} total={data.total} onChange={setPage} />
          </div>
        )}
      </Surface>

      <AnggotaFormModal opened={modalOpen} onClose={() => setModalOpen(false)} anggota={editing} />
    </div>
  )
}
