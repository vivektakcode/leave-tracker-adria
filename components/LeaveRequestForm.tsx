'use client'

import { useState, useEffect } from 'react'
import { Employee, createLeaveRequest } from '../lib/jsonAuthService'

interface LeaveRequestFormProps {
  employee: Employee
  onBack: () => void
}

export default function LeaveRequestForm({ employee, onBack }: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState<'casual' | 'sick' | 'privilege'>('casual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [numberOfDays, setNumberOfDays] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Calculate number of days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setNumberOfDays(diffDays + 1) // Include both start and end dates
    } else {
      setNumberOfDays(0)
    }
  }, [startDate, endDate])

  // Get available leave balance for selected type
  const getAvailableBalance = () => {
    return employee.leaveBalance[leaveType]
  }

  // Check if request is valid
  const isRequestValid = () => {
    if (!startDate || !endDate || !reason.trim()) return false
    if (new Date(startDate) > new Date(endDate)) return false
    if (numberOfDays > getAvailableBalance()) return false
    if (new Date(startDate) < new Date()) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!isRequestValid()) {
      setError('Please check your input. Make sure dates are valid and you have sufficient leave balance.')
      return
    }

    setLoading(true)

    try {
      // Create leave request
      const requestId = createLeaveRequest({
        employeeId: employee.id,
        employeeName: employee.name,
        leaveType,
        startDate,
        endDate,
        reason: reason.trim()
      })

      setSuccess(`Leave request submitted successfully! Request ID: ${requestId}`)
      
      // Reset form
      setLeaveType('casual')
      setStartDate('')
      setEndDate('')
      setReason('')
      setNumberOfDays(0)

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        onBack()
      }, 2000)

    } catch (error: any) {
      setError(`Failed to submit request: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'casual': return 'border-blue-500 text-blue-700'
      case 'sick': return 'border-red-500 text-red-700'
      case 'privilege': return 'border-green-500 text-green-700'
      default: return 'border-gray-300 text-gray-700'
    }
  }

  const getLeaveTypeBg = (type: string) => {
    switch (type) {
      case 'casual': return 'bg-blue-50'
      case 'sick': return 'bg-red-50'
      case 'privilege': return 'bg-green-50'
      default: return 'bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Request Leave</h1>
              <p className="text-gray-600 mt-2">Submit a new leave request</p>
            </div>
            <button
              onClick={onBack}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Leave Type *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['casual', 'sick', 'privilege'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLeaveType(type)}
                    className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
                      leaveType === type 
                        ? `${getLeaveTypeColor(type)} ${getLeaveTypeBg(type)}` 
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-lg font-semibold capitalize">{type}</div>
                    <div className="text-sm text-gray-600">
                      {employee.leaveBalance[type]} days available
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  id="startDate"
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  id="endDate"
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Number of Days Display */}
            {numberOfDays > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">Number of Days:</span>
                  <span className="text-lg font-bold text-blue-600">{numberOfDays} days</span>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  {numberOfDays > getAvailableBalance() ? (
                    <span className="text-red-600">
                      ⚠️ Insufficient leave balance. You need {numberOfDays - getAvailableBalance()} more days.
                    </span>
                  ) : (
                    <span className="text-green-600">
                      ✅ Sufficient leave balance available
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Leave *
              </label>
              <textarea
                id="reason"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Please provide a detailed reason for your leave request..."
              />
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading || !isRequestValid()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Leave Request'
                )}
              </button>
              
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Leave Balance Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Leave Balance</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{employee.leaveBalance.casual}</div>
              <div className="text-sm text-gray-500">Casual Leave</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{employee.leaveBalance.sick}</div>
              <div className="text-sm text-gray-500">Sick Leave</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{employee.leaveBalance.privilege}</div>
              <div className="text-sm text-gray-500">Privilege Leave</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 