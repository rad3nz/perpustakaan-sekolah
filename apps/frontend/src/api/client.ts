import { treaty } from '@elysiajs/eden'
import type { App } from '@perpustakaan/shared'
import { clearSession, getToken } from '../auth/auth-store'

// Typed client built from the backend's App type. The headers() hook attaches the bearer
// token at runtime; onResponse clears the session + redirects on any 401.
export const api = treaty<App>(import.meta.env.VITE_API_URL, {
  headers() {
    const token = getToken()
    return token ? { authorization: `Bearer ${token}` } : {}
  },
  onResponse(response) {
    if (response.status === 401) {
      clearSession()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
  },
})
