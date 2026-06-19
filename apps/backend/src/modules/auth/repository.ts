import { eq } from 'drizzle-orm'
import { db } from '../../db/client'
import { users } from '../../db/schema'

export type UserRow = typeof users.$inferSelect

// Returns the raw row including the password hash; DTO mapping (which strips the
// password) happens in dto.ts — the hash never leaves the service layer.
export const usersRepo = {
  async findByUsername(username: string): Promise<UserRow | null> {
    const rows = await db.select().from(users).where(eq(users.username, username)).limit(1)
    return rows[0] ?? null
  },
  async findById(id: number): Promise<UserRow | null> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
    return rows[0] ?? null
  },
}
