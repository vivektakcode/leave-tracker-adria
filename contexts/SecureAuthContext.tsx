'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../lib/supabaseService'

interface AuthContextType {
  currentUser: User | null
  token: string | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function SecureAuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if there's a valid token in memory
        const storedToken = sessionStorage.getItem('authToken')
        if (storedToken) {
          // Verify token validity with backend
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          })
          
          if (response.ok) {
            const { user } = await response.json()
            setCurrentUser(user)
            setToken(storedToken)
          } else {
            // Token is invalid, clear it
            sessionStorage.removeItem('authToken')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        sessionStorage.removeItem('authToken')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok && data.token) {
        setCurrentUser(data.user)
        setToken(data.token)
        // Store token in sessionStorage (cleared when browser closes)
        sessionStorage.setItem('authToken', data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error occurred' }
    } finally {
      setIsLoading(false)
    }
  }

  function logout() {
    setCurrentUser(null)
    setToken(null)
    sessionStorage.removeItem('authToken')
  }

  const value = {
    currentUser,
    token,
    login,
    logout,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
