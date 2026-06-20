import { Autocomplete, Button, Group, Modal, NumberInput, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { type BukuDTO, KATEGORI_CONTOH } from '@perpustakaan/shared'
import { useEffect } from 'react'
import { type BukuFormValues, useBukuMutations } from '../../api/hooks/useBuku'
import { getErrorMessage } from '../../lib/api-error'

type FormShape = {
  judul: string
  pengarang: string
  penerbit: string
  tahunTerbit: number | string
  isbn: string
  kategori: string
  stok: number | string
}

const EMPTY: FormShape = {
  judul: '',
  pengarang: '',
  penerbit: '',
  tahunTerbit: '',
  isbn: '',
  kategori: '',
  stok: 1,
}

export function BukuFormModal({
  opened,
  onClose,
  buku,
}: {
  opened: boolean
  onClose: () => void
  buku: BukuDTO | null
}) {
  const { create, update } = useBukuMutations()
  const form = useForm<FormShape>({
    initialValues: EMPTY,
    validate: {
      judul: (v) => (String(v).trim() ? null : 'Judul wajib diisi.'),
      pengarang: (v) => (String(v).trim() ? null : 'Pengarang wajib diisi.'),
      kategori: (v) => (String(v).trim() ? null : 'Kategori wajib diisi.'),
      stok: (v) => (Number(v) >= 0 ? null : 'Stok tidak boleh negatif.'),
    },
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset only when modal (re)opens
  useEffect(() => {
    if (opened) {
      form.setValues(
        buku
          ? {
              judul: buku.judul,
              pengarang: buku.pengarang,
              penerbit: buku.penerbit ?? '',
              tahunTerbit: buku.tahunTerbit ?? '',
              isbn: buku.isbn ?? '',
              kategori: buku.kategori,
              stok: buku.stok,
            }
          : EMPTY,
      )
    }
  }, [opened, buku])

  async function onSubmit(values: FormShape) {
    const body: BukuFormValues = {
      judul: values.judul.trim(),
      pengarang: values.pengarang.trim(),
      penerbit: values.penerbit.trim() || null,
      tahunTerbit: values.tahunTerbit === '' ? null : Number(values.tahunTerbit),
      isbn: values.isbn.trim() || null,
      kategori: values.kategori.trim(),
      stok: Number(values.stok),
    }
    try {
      if (buku) await update.mutateAsync({ id: buku.id, body })
      else await create.mutateAsync(body)
      notifications.show({ message: 'Buku berhasil disimpan.', color: 'green' })
      onClose()
    } catch (e) {
      notifications.show({ message: getErrorMessage(e), color: 'red' })
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title={buku ? 'Edit Buku' : 'Tambah Buku'} centered>
      <form onSubmit={form.onSubmit(onSubmit)} className="flex flex-col gap-3">
        <TextInput label="Judul" {...form.getInputProps('judul')} />
        <TextInput label="Pengarang" {...form.getInputProps('pengarang')} />
        <TextInput label="Penerbit" {...form.getInputProps('penerbit')} />
        <NumberInput
          label="Tahun Terbit"
          min={0}
          max={9999}
          {...form.getInputProps('tahunTerbit')}
        />
        <TextInput label="ISBN" {...form.getInputProps('isbn')} />
        <Autocomplete
          label="Kategori"
          data={[...KATEGORI_CONTOH]}
          {...form.getInputProps('kategori')}
        />
        <NumberInput label="Stok" min={0} {...form.getInputProps('stok')} />
        {buku && <NumberInput label="Stok Tersedia" value={buku.stokTersedia} readOnly disabled />}
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
