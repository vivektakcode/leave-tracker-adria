'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/JsonAuthContext'
import SignupForm from '../components/SignupForm'
import LoginForm from '../components/LoginForm'
import LeaveBalanceDashboard from '../components/LeaveBalanceDashboard'

export default function Home() {
  const { currentUser } = useAuth()
  const [showSignup, setShowSignup] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  if (currentUser) {
    return <LeaveBalanceDashboard employee={currentUser} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Leave Tracker</h1>
          <p className="text-xl text-gray-600">Professional Leave Management</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          {!showSignup && !showLogin ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h2>
                <p className="text-gray-600">Choose an option to continue</p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={() => setShowLogin(true)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  Sign In
                </button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowSignup(true)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  Create New Account
                </button>
              </div>
            </div>
          ) : showLogin ? (
            <div>
              <div className="text-center mb-6">
                <button
                  onClick={() => setShowLogin(false)}
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium mb-4 inline-block"
                >
                  ← Back to options
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                <p className="text-gray-600">Access your leave management account</p>
              </div>
              <LoginForm />
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <button
                  onClick={() => setShowSignup(false)}
                  className="text-orange-600 hover:text-orange-700 text-sm font-medium mb-4 inline-block"
                >
                  ← Back to options
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                <p className="text-gray-600">Join the leave management system</p>
              </div>
              <SignupForm />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 