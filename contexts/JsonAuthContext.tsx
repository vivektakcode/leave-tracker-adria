'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { User, authenticateUser } from '../lib/supabaseService'

interface AuthContextType {
  currentUser: User | null
  login: (username: string, password: string) => Promise<User | null>
  logout: () => void
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Check localStorage for existing session on app load
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('leaveTrackerUser')
      if (savedUser) {
        try {
          return JSON.parse(savedUser)
        } catch (error) {
          console.error('Error parsing saved user:', error)
          localStorage.removeItem('leaveTrackerUser')
        }
      }
    }
    return null
  })

  async function login(username: string, password: string): Promise<User | null> {
    const user = await authenticateUser(username, password)
    if (user) {
      setCurrentUser(user)
      // Save user to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('leaveTrackerUser', JSON.stringify(user))
      }
    }
    return user
  }

  function logout() {
    setCurrentUser(null)
    // Remove user from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('leaveTrackerUser')
    }
  }

  const value = {
    currentUser,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 