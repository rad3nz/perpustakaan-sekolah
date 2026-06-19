/** Extracts a human Indonesian message from an Eden/thrown error, with a fallback. */
export function getErrorMessage(error: unknown, fallback = 'Terjadi kesalahan.'): string {
  if (error && typeof error === 'object') {
    const value = (error as { value?: unknown }).value
    if (
      value &&
      typeof value === 'object' &&
      'message' in value &&
      typeof (value as { message: unknown }).message === 'string'
    ) {
      return (value as { message: string }).message
    }
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message
    }
  }
  return fallback
}
