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
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Leave Tracker
              </h1>
              <p className="text-gray-300 text-sm">
                {role === 'manager' ? 'Manager Portal' : 'Employee Portal'}
              </p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {role === 'manager' && (
              <>
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="text-white/80 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push('/admin/users')}
                  className="text-white/80 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Manage Users
                </button>
              </>
            )}
            {role === 'employee' && (
              <button
                onClick={() => router.push('/user/dashboard')}
                className="text-white/80 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Dashboard
              </button>
            )}
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