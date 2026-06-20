import { Button, Group, Modal, Switch, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import type { AnggotaDTO } from '@perpustakaan/shared'
import { useEffect } from 'react'
import { type AnggotaFormValues, useAnggotaMutations } from '../../api/hooks/useAnggota'
import { getErrorMessage } from '../../lib/api-error'

type FormShape = { nama: string; kelas: string; telepon: string; aktif: boolean }

const EMPTY: FormShape = { nama: '', kelas: '', telepon: '', aktif: true }

export function AnggotaFormModal({
  opened,
  onClose,
  anggota,
}: {
  opened: boolean
  onClose: () => void
  anggota: AnggotaDTO | null
}) {
  const { create, update } = useAnggotaMutations()
  const form = useForm<FormShape>({
    initialValues: EMPTY,
    validate: {
      nama: (v) => (v.trim() ? null : 'Nama wajib diisi.'),
      kelas: (v) => (v.trim() ? null : 'Kelas wajib diisi.'),
    },
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only when modal (re)opens
  useEffect(() => {
    if (opened) {
      form.setValues(
        anggota
          ? {
              nama: anggota.nama,
              kelas: anggota.kelas,
              telepon: anggota.telepon ?? '',
              aktif: anggota.aktif,
            }
          : EMPTY,
      )
    }
  }, [opened, anggota])

  async function onSubmit(values: FormShape) {
    const body: AnggotaFormValues = {
      nama: values.nama.trim(),
      kelas: values.kelas.trim(),
      telepon: values.telepon.trim() || null,
      aktif: values.aktif,
    }
    try {
      if (anggota) await update.mutateAsync({ id: anggota.id, body })
      else await create.mutateAsync(body)
      notifications.show({ message: 'Anggota berhasil disimpan.', color: 'green' })
      onClose()
    } catch (e) {
      notifications.show({ message: getErrorMessage(e), color: 'red' })
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={anggota ? 'Edit Anggota' : 'Tambah Anggota'}
      centered
    >
      <form onSubmit={form.onSubmit(onSubmit)} className="flex flex-col gap-3">
        {anggota && <TextInput label="No. Anggota" value={anggota.noAnggota} readOnly disabled />}
        <TextInput label="Nama" {...form.getInputProps('nama')} />
        <TextInput label="Kelas" placeholder="mis. 10 A" {...form.getInputProps('kelas')} />
        <TextInput label="Telepon" {...form.getInputProps('telepon')} />
        <Switch
          label="Aktif"
          checked={form.values.aktif}
          onChange={(e) => form.setFieldValue('aktif', e.currentTarget.checked)}
        />
        <Group justify="flex-end" className="mt-2">
          <Button variant="default" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={create.isPending || update.isPending}>
            Simpan
          </Button>
        </Group>
      </form>
    </Modal>
  )
}
