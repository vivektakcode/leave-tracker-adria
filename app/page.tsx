'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/JsonAuthContext'
import LeaveBalanceDashboard from '../components/LeaveBalanceDashboard'
import SignupForm from '../components/SignupForm'

export default function LoginPage() {
  const [showSignup, setShowSignup] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, logout, currentUser } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const user = await login(username, password)
      if (!user) {
        setError('Invalid username or password. Please try again.')
      }
    } catch (error: any) {
      setError('Login failed. Please try again.')
    }
  }

  const handleLogout = () => {
    logout()
    setUsername('')
    setPassword('')
    setError('')
  }

  // If user is logged in, show dashboard
  if (currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Professional Navigation Header */}
        <nav className="hero-gradient shadow-floating border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                  <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Leave Tracker</h1>
                  <p className="text-white/80 text-sm">Professional Leave Management</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-white font-semibold text-lg">
                    Welcome back, {currentUser.name}!
                  </p>
                  <p className="text-white/80 text-sm capitalize">
                    {currentUser.role} • {currentUser.department}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center space-x-2"
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

        {/* Dashboard */}
        <LeaveBalanceDashboard employee={currentUser} />
      </div>
    )
  }

  // Show signup form first
  if (showSignup) {
    return <SignupForm onSwitchToLogin={() => setShowSignup(false)} />
  }

  // Show login form
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-floating border border-gray-100">
            <svg className="h-10 w-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-3">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            Sign in to your Leave Tracker account
          </p>
        </div>

        {/* Login Form Card */}
        <div className="card-professional shadow-floating">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-3">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-professional focus-ring"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-professional focus-ring"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full text-lg py-4"
            >
              Sign In
            </button>
          </form>

          {/* Switch to Signup */}
          <div className="mt-8 text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => setShowSignup(true)}
                className="text-orange-600 hover:text-orange-700 font-semibold transition-colors duration-200"
              >
                Create one here
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p className="font-medium">🔐 Secure login to your Leave Tracker account</p>
          <p className="mt-1">📱 Works on all devices • 🚀 Fast and reliable • 💼 Professional interface</p>
        </div>
      </div>
    </div>
  )
} 