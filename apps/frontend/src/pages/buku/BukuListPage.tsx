import { Button, Group, Select } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { type BukuDTO, KATEGORI_CONTOH } from '@perpustakaan/shared'
import { useState } from 'react'
import { useBukuList, useBukuMutations } from '../../api/hooks/useBuku'
import { type Column, DataTable } from '../../components/DataTable'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { SearchInput } from '../../components/SearchInput'
import { StockBadge } from '../../components/StockBadge'
import { Surface } from '../../components/Surface'
import { getErrorMessage } from '../../lib/api-error'
import { BukuFormModal } from './BukuFormModal'

export function BukuListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BukuDTO | null>(null)

  const { data, isLoading } = useBukuList({ page, search, kategori: kategori ?? undefined })
  const { remove } = useBukuMutations()

  async function onDelete(b: BukuDTO) {
    if (!window.confirm(`Hapus buku "${b.judul}"?`)) return
    try {
      await remove.mutateAsync(b.id)
      notifications.show({ message: 'Buku berhasil dihapus.', color: 'green' })
    } catch (e) {
      notifications.show({ message: getErrorMessage(e), color: 'red' })
    }
  }

  const columns: Column<BukuDTO>[] = [
    {
      key: 'judul',
      header: 'Judul',
      render: (b) => <span className="font-medium">{b.judul}</span>,
    },
    { key: 'pengarang', header: 'Pengarang', render: (b) => b.pengarang },
    { key: 'kategori', header: 'Kategori', render: (b) => b.kategori },
    {
      key: 'stok',
      header: 'Stok',
      align: 'right',
      render: (b) => <span className="tabular-nums">{b.stok}</span>,
    },
    {
      key: 'stokTersedia',
      header: 'Tersedia',
      render: (b) => (
        <Group gap="xs" wrap="nowrap">
          <span className="tabular-nums">{b.stokTersedia}</span>
          <StockBadge stok={b.stok} stokTersedia={b.stokTersedia} />
        </Group>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'right',
      render: (b) => (
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <Button
            size="xs"
            variant="default"
            onClick={() => {
              setEditing(b)
              setModalOpen(true)
            }}
          >
            Edit
          </Button>
          <Button size="xs" variant="light" color="red" onClick={() => onDelete(b)}>
            Hapus
          </Button>
        </Group>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Buku" description="Kelola koleksi dan stok buku perpustakaan.">
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
        >
          Tambah Buku
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
            placeholder="Cari judul…"
          />
          <Select
            placeholder="Semua kategori"
            data={[...KATEGORI_CONTOH]}
            value={kategori}
            onChange={(v) => {
              setKategori(v)
              setPage(1)
            }}
            clearable
            className="w-48"
          />
        </div>

        <DataTable columns={columns} rows={data?.items ?? []} loading={isLoading} />

        {data && (
          <div className="border-navy-100 border-t p-3">
            <Pagination page={page} limit={data.limit} total={data.total} onChange={setPage} />
          </div>
        )}
      </Surface>

      <BukuFormModal opened={modalOpen} onClose={() => setModalOpen(false)} buku={editing} />
    </div>
  )
}
