import { create } from 'zustand'
import {
  fetchMe,
  loginAccount,
  logoutAccount,
  registerAccount,
  type CloudUser,
} from './cloudClient'

type AuthState = {
  user: CloudUser | null
  ready: boolean
  error: string | null
  refresh: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  error: null,

  refresh: async () => {
    try {
      const user = await fetchMe()
      set({ user, ready: true, error: null })
    } catch {
      set({ user: null, ready: true })
    }
  },

  login: async (username, password) => {
    const user = await loginAccount(username, password)
    set({ user, error: null })
  },

  register: async (username, password) => {
    const user = await registerAccount(username, password)
    set({ user, error: null })
  },

  logout: async () => {
    try {
      await logoutAccount()
    } finally {
      set({ user: null })
    }
  },
}))

export function getAuthUser() {
  return useAuthStore.getState().user
}
