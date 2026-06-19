// Dummy env so importing modules that touch `env`/the DB client doesn't throw during
// unit tests. The mysql2 pool is created lazily and never connects unless a query runs,
// so pure guard/logic tests stay DB-free. Integration tests (see RUN_DB_TESTS) override
// DATABASE_URL with a real MariaDB.
process.env.DATABASE_URL ??= 'mysql://test:test@localhost:3306/perpustakaan_test'
process.env.JWT_SECRET ??= 'test-secret-please-change'
process.env.CORS_ORIGIN ??= 'http://localhost:5173'
