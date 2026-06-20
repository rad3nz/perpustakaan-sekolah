import { Button, Group, Select } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import type { PeminjamanDTO, PeminjamanStatusEfektif } from '@perpustakaan/shared'
import { useState } from 'react'
import {
  useAnggotaOptions,
  useBukuOptions,
  usePeminjamanList,
  usePeminjamanMutations,
} from '../../api/hooks/usePeminjaman'
import { type Column, DataTable } from '../../components/DataTable'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { StatusBadge } from '../../components/StatusBadge'
import { Surface } from '../../components/Surface'
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
      align: 'right',
      render: (p) =>
        p.statusEfektif === 'terlambat' ? (
          <span className="tabular-nums text-red-600">
            {formatRupiah(p.dendaProyeksi)}{' '}
            <span className="text-navy-400 text-xs">(proyeksi)</span>
          </span>
        ) : (
          <span className="tabular-nums">{formatRupiah(p.denda)}</span>
        ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      align: 'right',
      render: (p) => (
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          {isActiveLoan(p.statusEfektif) && (
            <Button size="xs" variant="light" onClick={() => setReturning(p)}>
              Kembalikan
            </Button>
          )}
          <Button size="xs" variant="light" color="red" onClick={() => onDelete(p)}>
            Hapus
          </Button>
        </Group>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Peminjaman" description="Catat peminjaman dan proses pengembalian buku.">
        <Button onClick={() => setFormOpen(true)}>Tambah Peminjaman</Button>
      </PageHeader>

      <Surface p={false}>
        <div className="flex flex-wrap items-center gap-3 border-navy-100 border-b p-4">
          <Select
            placeholder="Semua status"
            data={STATUS_OPTIONS}
            value={status}
            onChange={(v) => {
              setStatus(v as PeminjamanStatusEfektif | null)
              setPage(1)
            }}
            clearable
            className="w-44"
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
            className="w-56"
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
            className="w-56"
          />
        </div>

        <DataTable columns={columns} rows={data?.items ?? []} loading={isLoading} />

        {data && (
          <div className="border-navy-100 border-t p-3">
            <Pagination page={page} limit={data.limit} total={data.total} onChange={setPage} />
          </div>
        )}
      </Surface>

      <PeminjamanFormModal opened={formOpen} onClose={() => setFormOpen(false)} />
      <KembalikanModal
        opened={returning !== null}
        onClose={() => setReturning(null)}
        loan={returning}
      />
    </div>
  )
}
