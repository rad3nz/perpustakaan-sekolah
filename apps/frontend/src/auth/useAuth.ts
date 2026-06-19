import { api } from '../api/client'
import { useAuthStore } from './auth-store'

export function useAuth() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const setSession = useAuthStore((s) => s.setSession)
  const clear = useAuthStore((s) => s.clear)

  async function login(username: string, password: string) {
    const { data, error } = await api.api.auth.login.post({ username, password })
    if (error) throw error
    setSession(data.data.token, data.data.user)
    return data
  }

  async function logout() {
    try {
      await api.api.auth.logout.post()
    } catch {
      // logout is best-effort; the token is stateless, the client just discards it
    }
    clear()
  }

  return { token, user, isAuthenticated: !!token, login, logout }
}
