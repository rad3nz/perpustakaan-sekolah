import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { env } from '../env'
import * as schema from './schema'

// MariaDB speaks the MySQL wire protocol, so the mysql2 driver + Drizzle `mysql`
// dialect target it unchanged.
export const pool = mysql.createPool({
  uri: env.DATABASE_URL,
  // Decode DATE columns as 'YYYY-MM-DD' strings rather than JS Date objects so the
  // domain date math (fines/overdue) works on ISO strings consistently.
  dateStrings: true,
})

export const db = drizzle(pool, { schema, mode: 'default' })

export type DB = typeof db
