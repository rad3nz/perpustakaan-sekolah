import { migrate } from 'drizzle-orm/mysql2/migrator'
import { db, pool } from './client'

// Apply generated, version-controlled migrations. Idempotent: already-applied
// migrations are skipped. Runs on backend container start (see 07-docker-deployment.md).
async function main() {
  console.log('Menjalankan migrasi database…')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Migrasi selesai.')
  await pool.end()
  process.exit(0)
}

main().catch((err) => {
  console.error('Migrasi gagal:', err)
  process.exit(1)
})
