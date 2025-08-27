'use client'

import { useState, useEffect } from 'react'
import { createUser, getAllUsers } from '../lib/supabaseService'

interface SignupFormProps {
  // Removed onSwitchToLogin requirement
}

export default function SignupForm({}: SignupFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    department: '',
    role: 'employee' as 'manager' | 'employee',
    manager_id: ''
  })
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
    'Marketing',
    'Sales',
    'HR',
    'Finance',
    'Operations',
    'Management',
    'Other'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!formData.username || !formData.password || !formData.name || !formData.email || !formData.department) {
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

    setLoading(true)

    try {
      // Create user (leave balance will be created automatically by trigger)
      await createUser({
        username: formData.username.trim(),
        password: formData.password,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        department: formData.department
      })

      setSuccess('Account created successfully! You can now login.')
      
      // Reset form
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        department: '',
        role: 'employee',
        manager_id: ''
      })

      // Auto-switch to login after 2 seconds
      setTimeout(() => {
        // onSwitchToLogin() // This line is removed as per the edit hint
      }, 2000)

    } catch (error: any) {
      if (error.message.includes('duplicate')) {
        setError('Username or email already exists. Please choose different ones.')
      } else {
        setError(`Failed to create account: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-floating border border-gray-100">
            <svg className="h-10 w-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-3">
            Join Leave Tracker
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            Create your professional account
          </p>
        </div>

        {/* Form Card */}
        <div className="card-professional shadow-floating">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                Full Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="input-professional focus-ring"
                placeholder="Enter your full name"
              />
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-3">
                Username *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="input-professional focus-ring"
                placeholder="Choose a username"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="input-professional focus-ring"
                placeholder="Enter your email"
              />
            </div>

            {/* Department and Role Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-3">
                  Department *
                </label>
                <select
                  id="department"
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleInputChange}
                  className="input-professional focus-ring"
                >
                  <option value="">Select department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Role *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['employee', 'manager'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({ ...formData, role })}
                      className={`p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                        formData.role === role 
                          ? 'border-orange-500 bg-orange-50 text-orange-700' 
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-sm font-semibold capitalize">{role}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manager Selection (only for employees) */}
              {formData.role === 'employee' && managers.length > 0 && (
                <div>
                  <label htmlFor="manager_id" className="block text-sm font-semibold text-gray-700 mb-3">
                    Manager *
                  </label>
                  <select
                    id="manager_id"
                    name="manager_id"
                    required
                    value={formData.manager_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select your manager</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Managers</span> can approve/reject leave requests and view team information.
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="input-professional focus-ring"
                placeholder="Create a password (min 6 characters)"
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Professional Account'
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-8 text-center pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                // onClick={onSwitchToLogin} // This line is removed as per the edit hint
                className="text-orange-600 hover:text-orange-700 font-semibold transition-colors duration-200"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p className="font-medium">🚀 Create your account and start managing leave requests</p>
          <p className="mt-1">📱 Works on all devices • 🔒 Secure registration • 💼 Professional interface</p>
        </div>
      </div>
    </div>
  )
} 