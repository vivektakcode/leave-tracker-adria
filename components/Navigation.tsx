'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/JsonAuthContext'

interface NavigationProps {
  userEmail: string
  role: 'manager' | 'employee'
}

export default function Navigation({ userEmail, role }: NavigationProps) {
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = () => {
    // Use the auth context logout function
    logout()
    
    // Redirect to home page
    router.push('/')
  }

  return (
    <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Adria
              </h1>
              <p className="text-gray-300 text-sm">
                Leave Management System
              </p>
            </div>
          </div>
          

          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-white font-semibold">
                Welcome back!
              </p>
              <p className="text-gray-300 text-sm">
                {userEmail}
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
} 