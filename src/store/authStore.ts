import { create } from 'zustand'

export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  public_repos: number
  followers: number
}

interface AuthState {
  user: GitHubUser | null
  token: string | null
  isLoading: boolean
  error: string | null

  login: (token: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

const TOKEN_KEY = 'brixci-github-token'

async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })
  if (!res.ok) {
    throw new Error(
      res.status === 401
        ? 'Invalid token. Please check your GitHub Personal Access Token.'
        : `GitHub API error: ${res.status}`,
    )
  }
  return (await res.json()) as GitHubUser
}

// Rehydrate from localStorage on module load
const savedToken = localStorage.getItem(TOKEN_KEY)

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: savedToken,
  isLoading: false,
  error: null,

  login: async (token) => {
    set({ isLoading: true, error: null })
    try {
      const user = await fetchGitHubUser(token)
      localStorage.setItem(TOKEN_KEY, token)
      set({ user, token, isLoading: false })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      set({ isLoading: false, error: message, user: null, token: null })
      localStorage.removeItem(TOKEN_KEY)
      return false
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null, token: null, error: null })
  },

  clearError: () => set({ error: null }),
}))

// Auto-login on app start if a saved token exists
if (savedToken) {
  fetchGitHubUser(savedToken)
    .then((user) => {
      useAuthStore.setState({ user, isLoading: false })
    })
    .catch(() => {
      localStorage.removeItem(TOKEN_KEY)
      useAuthStore.setState({ token: null, isLoading: false })
    })
}
