import type { BukuDTO, Paginated } from '@perpustakaan/shared'
import { ConflictError, NotFoundError, ValidationError } from '../../lib/errors'
import { toBukuDTO } from './dto'
import { type BukuListOpts, bukuRepo } from './repository'

export type BukuInput = {
  judul: string
  pengarang: string
  penerbit?: string | null
  tahunTerbit?: number | null
  isbn?: string | null
  kategori: string
  stok: number
}

export const bukuService = {
  async list(opts: BukuListOpts): Promise<Paginated<BukuDTO>> {
    const { items, total } = await bukuRepo.list(opts)
    return { items: items.map(toBukuDTO), total, page: opts.page, limit: opts.limit }
  },

  async get(id: number): Promise<BukuDTO> {
    const row = await bukuRepo.findById(id)
    if (!row) throw new NotFoundError('Buku tidak ditemukan.')
    return toBukuDTO(row)
  },

  async create(input: BukuInput): Promise<BukuDTO> {
    if (input.isbn && (await bukuRepo.isbnExists(input.isbn))) {
      throw new ValidationError('Input tidak valid.', { isbn: ['ISBN sudah digunakan.'] })
    }
    const row = await bukuRepo.insert({
      judul: input.judul,
      pengarang: input.pengarang,
      penerbit: input.penerbit ?? null,
      tahunTerbit: input.tahunTerbit ?? null,
      isbn: input.isbn ?? null,
      kategori: input.kategori,
      stok: input.stok,
      stokTersedia: input.stok, // BOOK-02: stok_tersedia defaults to stok on create
    })
    return toBukuDTO(row)
  },

  async update(id: number, input: BukuInput): Promise<BukuDTO> {
    const current = await bukuRepo.findById(id)
    if (!current) throw new NotFoundError('Buku tidak ditemukan.')

    if (input.isbn && (await bukuRepo.isbnExists(input.isbn, id))) {
      throw new ValidationError('Input tidak valid.', { isbn: ['ISBN sudah digunakan.'] })
    }

    // BOOK-06/07: stok may not drop below copies currently on loan; stok_tersedia
    // moves by the same delta as stok.
    const copiesOnLoan = current.stok - current.stokTersedia
    if (input.stok < copiesOnLoan) {
      throw new ValidationError('Input tidak valid.', {
        stok: ['Stok tidak boleh kurang dari jumlah buku yang sedang dipinjam.'],
      })
    }
    const stokTersedia = input.stok - copiesOnLoan

    await bukuRepo.update(id, {
      judul: input.judul,
      pengarang: input.pengarang,
      penerbit: input.penerbit ?? null,
      tahunTerbit: input.tahunTerbit ?? null,
      isbn: input.isbn ?? null,
      kategori: input.kategori,
      stok: input.stok,
      stokTersedia,
    })
    return this.get(id)
  },

  async remove(id: number): Promise<void> {
    const current = await bukuRepo.findById(id)
    if (!current) throw new NotFoundError('Buku tidak ditemukan.')
    if (await bukuRepo.hasActiveLoan(id)) {
      throw new ConflictError('Buku masih memiliki peminjaman aktif.')
    }
    await bukuRepo.remove(id)
  },
}
