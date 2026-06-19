import { Button, Group, Select, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import { type BukuDTO, KATEGORI_CONTOH } from '@perpustakaan/shared'
import { useBukuList, useBukuMutations } from '../../api/hooks/useBuku'
import { type Column, DataTable } from '../../components/DataTable'
import { Pagination } from '../../components/Pagination'
import { SearchInput } from '../../components/SearchInput'
import { StockBadge } from '../../components/StockBadge'
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
    { key: 'judul', header: 'Judul', render: (b) => b.judul },
    { key: 'pengarang', header: 'Pengarang', render: (b) => b.pengarang },
    { key: 'kategori', header: 'Kategori', render: (b) => b.kategori },
    { key: 'stok', header: 'Stok', render: (b) => b.stok },
    {
      key: 'stokTersedia',
      header: 'Tersedia',
      render: (b) => (
        <Group gap="xs">
          <span>{b.stokTersedia}</span>
          <StockBadge stok={b.stok} stokTersedia={b.stokTersedia} />
        </Group>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (b) => (
        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            onClick={() => {
              setEditing(b)
              setModalOpen(true)
            }}
          >
            Edit
          </Button>
          <Button
            size="xs"
            onClick={() => onDelete(b)}
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
          Buku
        </Title>
        <Button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="bg-brand-600 text-white hover:bg-brand-700"
        >
          Tambah Buku
        </Button>
      </Group>

      <Group className="mb-3">
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
        />
      </Group>

      <DataTable columns={columns} rows={data?.items ?? []} loading={isLoading} />
      {data && (
        <Pagination page={page} limit={data.limit} total={data.total} onChange={setPage} />
      )}

      <BukuFormModal opened={modalOpen} onClose={() => setModalOpen(false)} buku={editing} />
    </div>
  )
}
