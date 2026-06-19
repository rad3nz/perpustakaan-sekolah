import { Button, Group, Modal, Text } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { useEffect, useMemo, useState } from 'react'
import type { PeminjamanDTO } from '@perpustakaan/shared'
import { usePeminjamanMutations } from '../../api/hooks/usePeminjaman'
import { getErrorMessage } from '../../lib/api-error'
import { todayISO } from '../../lib/dates'
import { hitungDendaPreview } from '../../lib/fines'
import { formatRupiah, formatTanggal } from '../../lib/format'

export function KembalikanModal({
  opened,
  onClose,
  loan,
}: {
  opened: boolean
  onClose: () => void
  loan: PeminjamanDTO | null
}) {
  const { kembalikan } = usePeminjamanMutations()
  const [tanggal, setTanggal] = useState<string>(todayISO())

  useEffect(() => {
    if (opened) setTanggal(todayISO())
  }, [opened])

  // Mirrors backend lib/fines.ts exactly (FINE-04): preview = max(0, days late) × 1000.
  const denda = useMemo(() => {
    if (!loan) return 0
    return hitungDendaPreview(loan.tanggalKembaliRencana, tanggal)
  }, [loan, tanggal])

  async function onConfirm() {
    if (!loan) return
    try {
      await kembalikan.mutateAsync({ id: loan.id, tanggalKembali: tanggal })
      notifications.show({ message: 'Buku berhasil dikembalikan.', color: 'green' })
      onClose()
    } catch (e) {
      notifications.show({ message: getErrorMessage(e), color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Kembalikan Buku" centered>
      {loan && (
        <div className="flex flex-col gap-3">
          <Text size="sm" className="font-medium text-navy-800">
            {loan.buku.judul} — {loan.anggota.nama}
          </Text>
          <Text size="sm" className="text-navy-600">
            Jatuh tempo: {formatTanggal(loan.tanggalKembaliRencana)}
          </Text>
          <DatePickerInput
            label="Tanggal Pengembalian"
            value={tanggal}
            onChange={(v) => setTanggal(v ?? todayISO())}
          />
          <Text className={denda > 0 ? 'font-semibold text-red-600' : 'text-navy-700'}>
            Denda: {formatRupiah(denda)}
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose} className="text-navy-700 hover:bg-navy-50">
              Batal
            </Button>
            <Button
              onClick={onConfirm}
              loading={kembalikan.isPending}
              className="bg-brand-50 text-brand-700 hover:bg-brand-100"
            >
              Kembalikan
            </Button>
          </Group>
        </div>
      )}
    </Modal>
  )
}
