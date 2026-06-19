import { Button, Group, Select, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import type { PeminjamanDTO, PeminjamanStatusEfektif } from '@perpustakaan/shared'
import {
  useAnggotaOptions,
  useBukuOptions,
  usePeminjamanList,
  usePeminjamanMutations,
} from '../../api/hooks/usePeminjaman'
import { type Column, DataTable } from '../../components/DataTable'
import { Pagination } from '../../components/Pagination'
import { StatusBadge } from '../../components/StatusBadge'
import { getErrorMessage } from '../../lib/api-error'
import { formatRupiah, formatTanggal } from '../../lib/format'
import { isActiveLoan } from '../../lib/loan'
import { KembalikanModal } from './KembalikanModal'
import { PeminjamanFormModal } from './PeminjamanFormModal'

const STATUS_OPTIONS = [
  { value: 'dipinjam', label: 'Dipinjam' },
  { value: 'terlambat', label: 'Terlambat' },
  { value: 'dikembalikan', label: 'Dikembalikan' },
]

export function PeminjamanListPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<PeminjamanStatusEfektif | null>(null)
  const [anggotaId, setAnggotaId] = useState<string | null>(null)
  const [bukuId, setBukuId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [returning, setReturning] = useState<PeminjamanDTO | null>(null)

  const { data, isLoading } = usePeminjamanList({
    page,
    status: status ?? undefined,
    anggotaId: anggotaId ? Number(anggotaId) : undefined,
    bukuId: bukuId ? Number(bukuId) : undefined,
  })
  const { remove } = usePeminjamanMutations()
  const { data: anggotaOpts } = useAnggotaOptions()
  const { data: bukuOpts } = useBukuOptions()

  async function onDelete(p: PeminjamanDTO) {
    if (!window.confirm('Hapus peminjaman ini?')) return
    try {
      await remove.mutateAsync(p.id)
      notifications.show({ message: 'Peminjaman berhasil dihapus.', color: 'green' })
    } catch (e) {
      notifications.show({ message: getErrorMessage(e), color: 'red' })
    }
  }

  const columns: Column<PeminjamanDTO>[] = [
    { key: 'anggota', header: 'Anggota', render: (p) => p.anggota.nama },
    { key: 'buku', header: 'Buku', render: (p) => p.buku.judul },
    { key: 'pinjam', header: 'Tgl Pinjam', render: (p) => formatTanggal(p.tanggalPinjam) },
    {
      key: 'rencana',
      header: 'Jatuh Tempo',
      render: (p) => formatTanggal(p.tanggalKembaliRencana),
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.statusEfektif} /> },
    {
      key: 'denda',
      header: 'Denda',
      render: (p) =>
        p.statusEfektif === 'terlambat'
          ? `${formatRupiah(p.dendaProyeksi)} (proyeksi)`
          : formatRupiah(p.denda),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (p) => (
        <Group gap="xs">
          {isActiveLoan(p.statusEfektif) && (
            <Button
              size="xs"
              onClick={() => setReturning(p)}
              className="bg-brand-50 text-brand-700 hover:bg-brand-100"
            >
              Kembalikan
            </Button>
          )}
          <Button
            size="xs"
            onClick={() => onDelete(p)}
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
          Peminjaman
        </Title>
        <Button
          onClick={() => setFormOpen(true)}
          className="bg-brand-600 text-white hover:bg-brand-700"
        >
          Tambah Peminjaman
        </Button>
      </Group>

      <Group className="mb-3">
        <Select
          placeholder="Semua status"
          data={STATUS_OPTIONS}
          value={status}
          onChange={(v) => {
            setStatus(v as PeminjamanStatusEfektif | null)
            setPage(1)
          }}
          clearable
        />
        <Select
          placeholder="Semua anggota"
          data={(anggotaOpts ?? []).map((a) => ({ value: String(a.id), label: a.nama }))}
          value={anggotaId}
          onChange={(v) => {
            setAnggotaId(v)
            setPage(1)
          }}
          searchable
          clearable
        />
        <Select
          placeholder="Semua buku"
          data={(bukuOpts ?? []).map((b) => ({ value: String(b.id), label: b.judul }))}
          value={bukuId}
          onChange={(v) => {
            setBukuId(v)
            setPage(1)
          }}
          searchable
          clearable
        />
      </Group>

      <DataTable columns={columns} rows={data?.items ?? []} loading={isLoading} />
      {data && (
        <Pagination page={page} limit={data.limit} total={data.total} onChange={setPage} />
      )}

      <PeminjamanFormModal opened={formOpen} onClose={() => setFormOpen(false)} />
      <KembalikanModal
        opened={returning !== null}
        onClose={() => setReturning(null)}
        loan={returning}
      />
    </div>
  )
}
