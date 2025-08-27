'use client'

import { useState, useEffect } from 'react'
import { User, createLeaveRequest, getLeaveBalance } from '../lib/supabaseService'

interface LeaveRequestFormProps {
  employee: User
  onBack: () => void
}

export default function LeaveRequestForm({ employee, onBack }: LeaveRequestFormProps) {
  const [leaveType, setLeaveType] = useState<'casual' | 'sick' | 'privilege'>('casual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [numberOfDays, setNumberOfDays] = useState(0)
  const [isHalfDay, setIsHalfDay] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [leaveBalance, setLeaveBalance] = useState({ casual_leave: 0, sick_leave: 0, privilege_leave: 0 })

  // Fetch leave balance when component mounts
  useEffect(() => {
    const fetchLeaveBalance = async () => {
      const balance = await getLeaveBalance(employee.id)
      if (balance) {
        setLeaveBalance(balance)
      }
    }
    fetchLeaveBalance()
  }, [employee.id])

  // Calculate number of days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const calculatedDays = diffDays + 1 // Include both start and end dates
      
      // If it's a half day, reduce by 0.5
      const finalDays = isHalfDay ? Math.max(0.5, calculatedDays - 0.5) : calculatedDays
      setNumberOfDays(finalDays)
    } else {
      setNumberOfDays(0)
    }
  }, [startDate, endDate, isHalfDay])

  // Get available leave balance for selected type
  const getAvailableBalance = () => {
    switch (leaveType) {
      case 'casual': return leaveBalance.casual_leave
      case 'sick': return leaveBalance.sick_leave
      case 'privilege': return leaveBalance.privilege_leave
      default: return 0
    }
  }

  // Check if request is valid
  const isRequestValid = () => {
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    const currentDate = new Date()
    
    console.log('Validation check:', {
      startDate,
      endDate,
      reason: reason.trim(),
      numberOfDays,
      availableBalance: getAvailableBalance(),
      startDateObj: startDateObj.toISOString(),
      endDateObj: endDateObj.toISOString(),
      currentDate: currentDate.toISOString(),
      dateValid: startDateObj <= endDateObj,
      futureDate: startDateObj >= currentDate,
      balanceValid: numberOfDays <= getAvailableBalance(),
      reasonValid: reason.trim().length > 0
    })
    
    // Check each validation step individually
    if (!startDate || !endDate || !reason.trim()) {
      console.log('❌ Basic fields missing')
      return false
    }
    
    if (startDateObj > endDateObj) {
      console.log('❌ Start date is after end date')
      return false
    }
    
    if (numberOfDays > getAvailableBalance()) {
      console.log('❌ Insufficient leave balance')
      return false
    }
    
    if (startDateObj < currentDate) {
      console.log('❌ Start date is in the past')
      return false
    }
    
    console.log('✅ All validations passed')
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
      const requestId = await createLeaveRequest({
        user_id: employee.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        is_half_day: isHalfDay
      })

      setSuccess(`Leave request submitted successfully! Request ID: ${requestId}`)
      
      // Reset form
      setLeaveType('casual')
      setStartDate('')
      setEndDate('')
      setReason('')
      setNumberOfDays(0)
      setIsHalfDay(false)

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
      case 'casual': return 'border-orange-500 text-orange-700'
      case 'sick': return 'border-gray-500 text-gray-700'
      case 'privilege': return 'border-orange-600 text-orange-700'
      default: return 'border-gray-300 text-gray-700'
    }
  }

  const getLeaveTypeBg = (type: string) => {
    switch (type) {
      case 'casual': return 'bg-orange-50'
      case 'sick': return 'bg-gray-50'
      case 'privilege': return 'bg-orange-50'
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
                      {leaveBalance[`${type}_leave` as keyof typeof leaveBalance]} days available
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Half Day Option */}
            <div className="flex items-center space-x-3">
              <input
                id="isHalfDay"
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="isHalfDay" className="text-sm font-medium text-gray-700">
                This is a half-day leave request
              </label>
            </div>

            {/* Number of Days Display */}
            {numberOfDays > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-orange-800">
                    {isHalfDay ? 'Leave Duration:' : 'Number of Days:'}
                  </span>
                  <span className="text-lg font-bold text-orange-600">
                    {numberOfDays} {isHalfDay && numberOfDays === 0.5 ? 'half day' : numberOfDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-orange-600">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
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

            {/* Debug Info */}
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-xs">
              <div className="font-semibold text-gray-700 mb-2">Debug Info:</div>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <div>Start Date: {startDate || 'Not set'}</div>
                <div>End Date: {endDate || 'Not set'}</div>
                <div>Reason: {reason.trim() || 'Not set'}</div>
                <div>Days: {numberOfDays}</div>
                <div>Available: {getAvailableBalance()}</div>
                <div>Valid: {isRequestValid() ? 'Yes' : 'No'}</div>
                <div>Start Date Obj: {startDate ? new Date(startDate).toISOString() : 'N/A'}</div>
                <div>Current Date: {new Date().toISOString()}</div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading || !isRequestValid()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="text-2xl font-bold text-orange-500">{leaveBalance.casual_leave}</div>
                <div className="text-sm text-gray-500">Casual Leave</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{leaveBalance.sick_leave}</div>
                <div className="text-sm text-gray-500">Sick Leave</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{leaveBalance.privilege_leave}</div>
                <div className="text-sm text-gray-500">Privilege Leave</div>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
} 