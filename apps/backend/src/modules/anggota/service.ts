import type { AnggotaDTO, Paginated } from '@perpustakaan/shared'
import { db } from '../../db/client'
import { ConflictError, NotFoundError } from '../../lib/errors'
import { formatNoAnggota } from '../../lib/member-number'
import { toAnggotaDTO } from './dto'
import { anggotaRepo, type AnggotaListOpts } from './repository'

export type AnggotaInput = {
  nama: string
  kelas: string
  telepon?: string | null
  aktif?: boolean
}

export const anggotaService = {
  async list(opts: AnggotaListOpts): Promise<Paginated<AnggotaDTO>> {
    const { items, total } = await anggotaRepo.list(opts)
    return { items: items.map(toAnggotaDTO), total, page: opts.page, limit: opts.limit }
  },

  async get(id: number): Promise<AnggotaDTO> {
    const row = await anggotaRepo.findById(id)
    if (!row) throw new NotFoundError('Anggota tidak ditemukan.')
    return toAnggotaDTO(row)
  },

  async create(input: AnggotaInput): Promise<AnggotaDTO> {
    // Member-number generation + insert run in one transaction to avoid races (MEMBER-02).
    const id = await db.transaction(async (tx) => {
      const next = (await anggotaRepo.maxNoAnggotaSeq(tx)) + 1
      return anggotaRepo.insert(tx, {
        nama: input.nama,
        noAnggota: formatNoAnggota(next),
        kelas: input.kelas,
        telepon: input.telepon ?? null,
        aktif: input.aktif ?? true,
      })
    })
    return this.get(id)
  },

  async update(id: number, input: AnggotaInput): Promise<AnggotaDTO> {
    const current = await anggotaRepo.findById(id)
    if (!current) throw new NotFoundError('Anggota tidak ditemukan.')
    // no_anggota is immutable (ignored if sent).
    await anggotaRepo.update(id, {
      nama: input.nama,
      kelas: input.kelas,
      telepon: input.telepon ?? null,
      aktif: input.aktif ?? current.aktif,
    })
    return this.get(id)
  },

  async remove(id: number): Promise<void> {
    const current = await anggotaRepo.findById(id)
    if (!current) throw new NotFoundError('Anggota tidak ditemukan.')
    if (await anggotaRepo.hasActiveLoan(id)) {
      throw new ConflictError('Anggota masih memiliki peminjaman aktif.')
    }
    await anggotaRepo.remove(id)
  },
}
