import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { env } from '../env'
import * as schema from './schema'

// MariaDB speaks the MySQL wire protocol, so the mysql2 driver + Drizzle `mysql`
// dialect target it unchanged.
export const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  // Decode DATE columns as 'YYYY-MM-DD' strings (paired with `mode: 'string'` in the
  // schema) so domain date math (fines/overdue) works on ISO strings consistently.
  // TIMESTAMP columns are intentionally left as Date objects (Drizzle maps them).
  dateStrings: ['DATE'],
})

export const db = drizzle(pool, { schema, mode: 'default' })

export type DB = typeof db
