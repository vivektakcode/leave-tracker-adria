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
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  async function login(username: string, password: string): Promise<User | null> {
    const user = await authenticateUser(username, password)
    if (user) {
      setCurrentUser(user)
    }
    return user
  }

  function logout() {
    setCurrentUser(null)
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