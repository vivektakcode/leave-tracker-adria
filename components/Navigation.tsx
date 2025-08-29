'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/SecureAuthContext'

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
    <nav className="bg-gradient-to-r from-slate-100 to-slate-200 shadow-lg border-b border-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 flex items-center justify-center">
              <img 
                src="/Adria_logo.png" 
                alt="Adria Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Leave Management System
              </h1>
            </div>
          </div>
          

          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-slate-800 font-semibold">
                Welcome back!
              </p>
              <p className="text-slate-600 text-sm">
                {userEmail}
              </p>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2"
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