import type { UserDTO } from '@perpustakaan/shared'
import type { UserRow } from './repository'

/** Maps a user row to its DTO. Never includes `password`. */
export function toUserDTO(row: UserRow): UserDTO {
  return {
    id: row.id,
    nama: row.nama,
    username: row.username,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
