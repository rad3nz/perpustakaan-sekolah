import type { db } from './client'

/** The transaction handle Drizzle passes to `db.transaction(async (tx) => …)`. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
