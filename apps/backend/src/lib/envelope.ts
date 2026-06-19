// The single place envelopes are constructed. Every route returns through it.
export const envelope = {
  ok<T>(data: T, message = 'Berhasil.') {
    return { success: true as const, data, message }
  },
  fail(message: string, errors?: Record<string, string[]>) {
    return { success: false as const, data: null, message, ...(errors ? { errors } : {}) }
  },
}
