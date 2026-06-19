import type { UserDTO } from '@perpustakaan/shared'
import { create } from 'zustand'

const TOKEN_KEY = 'perpustakaan_token'
const USER_KEY = 'perpustakaan_user'

type AuthState = {
  token: string | null
  user: UserDTO | null
  setSession: (token: string, user: UserDTO) => void
  clear: () => void
}

function loadUser(): UserDTO | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserDTO) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: loadUser(),
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ token, user })
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ token: null, user: null })
  },
}))

/** Read the current token outside React (used by the Eden header hook). */
export function getToken(): string | null {
  return useAuthStore.getState().token
}

/** Clear the session outside React (used by the 401 handler). */
export function clearSession(): void {
  useAuthStore.getState().clear()
}
