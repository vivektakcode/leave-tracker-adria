'use client'

import { useState, useEffect } from 'react'
import { createUser, getAllUsers } from '../lib/supabaseService'

interface SignupFormProps {
  onSignupSuccess?: () => void
}

export default function SignupForm({ onSignupSuccess }: SignupFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    department: '',
    country: '',
    role: 'employee' as 'employee' | 'manager' | 'hr',
    manager_id: ''
  })
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [managers, setManagers] = useState<any[]>([])

  // Fetch managers when component mounts
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const allUsers = await getAllUsers()
        const managerUsers = allUsers.filter(user => user.role === 'manager')
        setManagers(managerUsers)
      } catch (error) {
        console.error('Error fetching managers:', error)
      }
    }
    fetchManagers()
  }, [])

  const departments = [
    'Engineering',
    'Sales',
    'Marketing',
    'HR',
    'Finance',
    'Operations',
    'Customer Support',
    'Product',
    'Design',
    'Other'
  ]

  const countries = [
    'Morocco',
    'India',
    'Tunisia',
    'Senegal',
    'UAE'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.username || !formData.password || !formData.name || !formData.email || !formData.department || !formData.country) {
      setError('Please fill in all required fields')
      return false
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }

    // Require manager_id for employees
    if (formData.role === 'employee' && !formData.manager_id) {
      setError('Please select a manager')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    // Prevent @adria-bt.com users from being created as HR
    if (formData.email.includes('@adria-bt.com') && formData.role === 'hr') {
      setError('HR role cannot be assigned during signup for @adria-bt.com users. Please contact an existing HR user.')
      return
    }

    setLoading(true)

    try {
      const userId = await createUser(formData)
      
      // Send verification email if user was created
      if (userId) {
        try {
          const { sendVerificationEmail } = await import('../lib/emailService')
          // Generate a simple verification token (in production, use crypto.randomUUID())
          const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
          await sendVerificationEmail(formData.email, formData.name, verificationToken)
          setVerificationSent(true)
          setVerificationEmail(formData.email)
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError)
          // Continue with signup even if email fails
        }
      }
      
      setSuccess('Account created successfully! Please check your email to verify your account before logging in.')
      
      // Reset form
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        department: '',
        country: '',
        role: 'employee',
        manager_id: ''
      })
      
      // Redirect to login page after a longer delay for email verification
      setTimeout(() => {
        onSignupSuccess?.()
      }, 5000)
    } catch (error: any) {
      setError(error.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto h-12 w-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Join Leave Tracker</h1>
        <p className="text-sm text-gray-600">Create your professional account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Name and Username Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username *
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              placeholder="Choose a username"
            />
          </div>
        </div>

        {/* Email and Department Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-2">
              Department *
            </label>
            <select
              id="department"
              name="department"
              required
              value={formData.department}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Country and Role Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
              Country *
            </label>
            <select
              id="country"
              name="country"
              required
              value={formData.country}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
            >
              {countries.map((country) => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Role *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['employee', 'manager', 'hr'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData({ ...formData, role, manager_id: role === 'employee' ? formData.manager_id : '' })}
                  className={`p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                    formData.role === role 
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md' 
                      : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-base font-semibold capitalize mb-1">{role}</div>
                  <div className="text-xs text-gray-600">
                    {role === 'hr' ? 'Full system access' : role === 'manager' ? 'Can approve requests' : 'Can submit requests'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Manager Selection (only for employees) */}
        {formData.role === 'employee' && managers.length > 0 && (
          <div>
            <label htmlFor="manager_id" className="block text-sm font-semibold text-gray-700 mb-2">
              Manager *
            </label>
            <select
              id="manager_id"
              name="manager_id"
              required
              value={formData.manager_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 bg-white"
            >
              <option value="">Select your manager</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} ({manager.department})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Your manager will review and approve your leave requests
            </p>
          </div>
        )}

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
            Password *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
            placeholder="Create a password (min 6 characters)"
          />
          <p className="text-xs text-gray-500 mt-1">
            Password must be at least 6 characters long
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm font-medium">
            {success}
            {verificationSent && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    <strong>Verification email sent!</strong> Please check your inbox at <strong>{verificationEmail}</strong> and click the verification link to activate your account.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating Account...</span>
            </div>
          ) : (
            'Create Professional Account'
          )}
        </button>
      </form>
    </div>
  )
} 