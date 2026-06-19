import { Button, Group, Modal, Select, Text } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { useEffect, useState } from 'react'
import {
  useAnggotaOptions,
  useBukuOptions,
  usePeminjamanMutations,
} from '../../api/hooks/usePeminjaman'
import { getErrorMessage } from '../../lib/api-error'
import { addDaysISO, todayISO } from '../../lib/dates'

export function PeminjamanFormModal({
  opened,
  onClose,
}: {
  opened: boolean
  onClose: () => void
}) {
  const { create } = usePeminjamanMutations()
  const { data: anggotaOpts } = useAnggotaOptions()
  const { data: bukuOpts } = useBukuOptions()

  const [anggotaId, setAnggotaId] = useState<string | null>(null)
  const [bukuId, setBukuId] = useState<string | null>(null)
  const [pinjam, setPinjam] = useState<string>(todayISO())
  const [rencana, setRencana] = useState<string>(addDaysISO(7))
  const [error, setError] = useState('')

  useEffect(() => {
    if (opened) {
      setAnggotaId(null)
      setBukuId(null)
      setPinjam(todayISO())
      setRencana(addDaysISO(7))
      setError('')
    }
  }, [opened])

  async function onSubmit() {
    setError('')
    if (!anggotaId || !bukuId) {
      setError('Anggota dan buku wajib dipilih.')
      return
    }
    if (rencana < pinjam) {
      setError('Tanggal kembali harus pada atau setelah tanggal pinjam.')
      return
    }
    try {
      await create.mutateAsync({
        anggotaId: Number(anggotaId),
        bukuId: Number(bukuId),
        tanggalPinjam: pinjam,
        tanggalKembaliRencana: rencana,
      })
      notifications.show({ message: 'Peminjaman berhasil dibuat.', color: 'green' })
      onClose()
    } catch (e) {
      notifications.show({ message: getErrorMessage(e), color: 'red' })
    }
  }

  const anggotaData = (anggotaOpts ?? []).map((a) => ({
    value: String(a.id),
    label: `${a.noAnggota} — ${a.nama}`,
  }))
  const bukuData = (bukuOpts ?? [])
    .filter((b) => b.stokTersedia > 0)
    .map((b) => ({ value: String(b.id), label: `${b.judul} (sisa ${b.stokTersedia})` }))

  return (
    <Modal opened={opened} onClose={onClose} title="Tambah Peminjaman" centered>
      <div className="flex flex-col gap-3">
        <Select
          label="Anggota"
          placeholder="Pilih anggota"
          data={anggotaData}
          value={anggotaId}
          onChange={setAnggotaId}
          searchable
        />
        <Select
          label="Buku"
          placeholder="Pilih buku (stok tersedia)"
          data={bukuData}
          value={bukuId}
          onChange={setBukuId}
          searchable
        />
        <DatePickerInput
          label="Tanggal Pinjam"
          value={pinjam}
          onChange={(v) => setPinjam(v ?? todayISO())}
        />
        <DatePickerInput
          label="Tanggal Kembali (Rencana)"
          value={rencana}
          onChange={(v) => setRencana(v ?? addDaysISO(7))}
        />
        {error && (
          <Text size="sm" className="text-red-600">
            {error}
          </Text>
        )}
        <Group justify="flex-end" className="mt-2">
          <Button variant="subtle" onClick={onClose} className="text-navy-700 hover:bg-navy-50">
            Batal
          </Button>
          <Button
            onClick={onSubmit}
            loading={create.isPending}
            disabled={rencana < pinjam}
            className="bg-brand-600 text-white hover:bg-brand-700"
          >
            Pinjam
          </Button>
        </Group>
      </div>
    </Modal>
  )
}
