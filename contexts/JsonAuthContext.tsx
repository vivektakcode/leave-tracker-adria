'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Employee, authenticateUser } from '../lib/jsonAuthService'

interface JsonAuthContextType {
  currentUser: Employee | null
  login: (username: string, password: string) => Employee | null
  logout: () => void
  loading: boolean
}

const JsonAuthContext = createContext<JsonAuthContextType | undefined>(undefined)

export function useJsonAuth() {
  const context = useContext(JsonAuthContext)
  if (context === undefined) {
    throw new Error('useJsonAuth must be used within a JsonAuthProvider')
  }
  return context
}

export function JsonAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(false)

  function login(username: string, password: string): Employee | null {
    setLoading(true)
    
    try {
      const user = authenticateUser(username, password)
      setCurrentUser(user)
      return user
    } catch (error) {
      console.error('Login error:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    setCurrentUser(null)
    // Clear any stored data
    localStorage.removeItem('currentUser')
  }

  const value = {
    currentUser,
    login,
    logout,
    loading
  }

  return (
    <JsonAuthContext.Provider value={value}>
      {children}
    </JsonAuthContext.Provider>
  )
} 