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
    <div className="min-h-screen relative overflow-hidden">
      {/* Simple Gradient Background - Three.js temporarily disabled */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        }}
      />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center justify-center h-20 w-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl mb-8 shadow-2xl">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-4 tracking-tight">
              Leave Tracker
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Professional Leave Management System
            </p>
          </div>

          {/* Main Content Area */}
          <div className="max-w-2xl mx-auto">
            {!showSignup && !showLogin ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/20">
                <div className="text-center">
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                    Welcome to Your Leave Management
                  </h2>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Streamline your leave requests, approvals, and team management with our professional platform.
                  </p>
                  
                  <div className="space-y-6">
                    <button
                      onClick={() => setShowLogin(true)}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
                    >
                      Sign In to Your Account
                    </button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white/80 text-gray-500 font-medium">or</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowSignup(true)}
                      className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-lg"
                    >
                      Create New Account
                    </button>
                  </div>

                  {/* Features */}
                  <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="h-12 w-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Easy Approval</h3>
                      <p className="text-sm text-gray-600">Streamlined workflow for managers</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="h-12 w-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Real-time Updates</h3>
                      <p className="text-sm text-gray-600">Instant notifications and status</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 lg:p-12 shadow-2xl border border-white/20">
                <div className="text-center">
                  <button
                    onClick={() => {
                      setShowLogin(false)
                      setShowSignup(false)
                    }}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium mb-6 inline-flex items-center group"
                  >
                    <svg className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to options
                  </button>
                  
                  {showLogin ? (
                    <>
                      <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">Sign In</h2>
                      <p className="text-lg text-gray-600 mb-8">Access your leave management account</p>
                      <LoginForm />
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">Create Account</h2>
                      <p className="text-lg text-gray-600 mb-8">Join the leave management system</p>
                      <SignupForm />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 