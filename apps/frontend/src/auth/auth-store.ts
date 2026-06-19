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

const storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null =
  typeof localStorage !== 'undefined' ? localStorage : null

function loadUser(): UserDTO | null {
  try {
    const raw = storage?.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as UserDTO) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: storage?.getItem(TOKEN_KEY) ?? null,
  user: loadUser(),
  setSession: (token, user) => {
    storage?.setItem(TOKEN_KEY, token)
    storage?.setItem(USER_KEY, JSON.stringify(user))
    set({ token, user })
  },
  clear: () => {
    storage?.removeItem(TOKEN_KEY)
    storage?.removeItem(USER_KEY)
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
