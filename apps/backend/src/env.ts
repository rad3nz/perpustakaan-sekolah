/** Parse and validate process environment once at startup. */
function required(name: string): string {
  const value = process.env[name]
  if (!value || value.length === 0) {
    throw new Error(`Environment variable ${name} wajib diisi.`)
  }
  return value
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  PORT: Number(process.env.PORT ?? 3000),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  SEED_ON_START: process.env.SEED_ON_START === 'true',
}
