"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { API_BASE_URL, buildApiUrl, getAuthHeaders } from './api-config'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: 'admin' | 'manager' | 'agent' | 'inspector' | 'viewer'
  role_display: string
  phone: string | null
  region: string | null
  commune: string | null
  avatar: string | null
  is_field_agent: boolean
  is_active: boolean
  last_sync: string | null
  last_login: string | null
  created_at: string
  updated_at: string
}

interface AuthTokens {
  access: string
  refresh: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshToken: () => Promise<boolean>
  isSupervisorOrAdmin: boolean
  isAdmin: boolean
  canAccessUsers: boolean
  canAccessSettings: boolean
  hasRole: (roles: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = API_BASE_URL

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const getStoredTokens = (): AuthTokens | null => {
    if (typeof window === 'undefined') return null
    const tokens = localStorage.getItem('auth_tokens')
    return tokens ? JSON.parse(tokens) : null
  }

  const storeTokens = (tokens: AuthTokens) => {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens))
  }

  const clearTokens = () => {
    localStorage.removeItem('auth_tokens')
  }

  const fetchUser = useCallback(async (accessToken: string): Promise<User | null> => {
    try {
      const response = await fetch(buildApiUrl('/accounts/users/me/'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        return await response.json()
      }
      return null
    } catch {
      return null
    }
  }, [])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const tokens = getStoredTokens()
    if (!tokens?.refresh) return false

    try {
      const response = await fetch(buildApiUrl('/token/refresh/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: tokens.refresh }),
      })

      if (response.ok) {
        const data = await response.json()
        storeTokens({ ...tokens, access: data.access })
        const userData = await fetchUser(data.access)
        if (userData) {
          setUser(userData)
          return true
        }
      }
      clearTokens()
      setUser(null)
      return false
    } catch {
      clearTokens()
      setUser(null)
      return false
    }
  }, [fetchUser])

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(buildApiUrl('/token/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const tokens: AuthTokens = await response.json()
        storeTokens(tokens)
        
        const userData = await fetchUser(tokens.access)
        if (userData) {
          setUser(userData)
          return { success: true }
        }
        return { success: false, error: 'Impossible de récupérer les informations utilisateur' }
      }

      const errorData = await response.json().catch(() => ({}))
      return { 
        success: false, 
        error: errorData.detail || 'Identifiants incorrects' 
      }
    } catch {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  }

  const logout = useCallback(() => {
    const tokens = getStoredTokens()
    if (tokens?.access) {
      fetch(buildApiUrl('/logout/'), {
        method: 'POST',
        headers: getAuthHeaders(tokens.access),
      }).catch(() => {})
    }
    clearTokens()
    setUser(null)
    router.push('/login')
  }, [router])

  // Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const tokens = getStoredTokens()
      if (tokens?.access) {
        const userData = await fetchUser(tokens.access)
        if (userData) {
          setUser(userData)
        } else {
          // Try refresh
          await refreshToken()
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [fetchUser, refreshToken])

  // Auto refresh token before expiry
  useEffect(() => {
    const interval = setInterval(() => {
      const tokens = getStoredTokens()
      if (tokens?.access) {
        // Refresh every 10 hours (token expires in 12 hours)
        refreshToken()
      }
    }, 10 * 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [refreshToken])

  const isSupervisorOrAdmin = user?.role === 'admin' || user?.role === 'manager'
  const isAdmin = user?.role === 'admin'
  const canAccessUsers = user?.role === 'admin' || user?.role === 'manager'
  const canAccessSettings = user?.role === 'admin'
  
  const hasRole = useCallback((roles: string[]) => {
    return user ? roles.includes(user.role) : false
  }, [user])

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshToken,
      isSupervisorOrAdmin,
      isAdmin,
      canAccessUsers,
      canAccessSettings,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
