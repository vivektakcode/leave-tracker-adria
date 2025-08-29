'use client'

import { useState, useEffect } from 'react'
import { User } from '../lib/supabaseService'
import { apiClient } from '../lib/apiClient'
import { isDateDisabled, getMinEndDate, getNextBusinessDay } from '../utils/dateUtils'
import BusinessDatePicker from './BusinessDatePicker'

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
  const [managerInfo, setManagerInfo] = useState<{ name: string; department: string } | null>(null)



  // Function to handle start date change and validate
  const handleStartDateChange = (dateString: string) => {
    if (isDateDisabled(dateString)) {
      // Find the next business day
      const nextBusinessDay = getNextBusinessDay(new Date(dateString))
      const nextBusinessDayString = nextBusinessDay.toISOString().split('T')[0]
      setStartDate(nextBusinessDayString)
    } else {
      setStartDate(dateString)
    }
    
    // Reset end date if it's now before start date
    if (endDate && endDate < dateString) {
      setEndDate('')
    }
    
    // If start and end dates are the same, ensure end date is also updated
    if (endDate === dateString) {
      setEndDate(dateString)
    }
  }

  // Function to handle end date change and validate
  const handleEndDateChange = (dateString: string) => {
    if (isDateDisabled(dateString)) {
      // Find the next business day
      const nextBusinessDay = getNextBusinessDay(new Date(dateString))
      const nextBusinessDayString = nextBusinessDay.toISOString().split('T')[0]
      setEndDate(nextBusinessDayString)
    } else {
      setEndDate(dateString)
    }
  }

  // Fetch leave balance when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceResponse, managerResponse] = await Promise.all([
          apiClient.getUserBalance(employee.id),
          apiClient.getUserManager(employee.id)
        ])
        
        if (balanceResponse?.balance) {
          setLeaveBalance(balanceResponse.balance)
        }
        
        if (managerResponse?.manager) {
          setManagerInfo({ 
            name: managerResponse.manager.name, 
            department: managerResponse.manager.department 
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    
    fetchData()
  }, [employee.id])

  // Calculate number of days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate + 'T00:00:00')
      const end = new Date(endDate + 'T00:00:00')
      
      // Debug logging
      console.log('Date calculation debug:')
      console.log('startDate:', startDate, 'endDate:', endDate)
      console.log('start.toDateString():', start.toDateString())
      console.log('end.toDateString():', end.toDateString())
      console.log('start.toDateString() === end.toDateString():', start.toDateString() === end.toDateString())
      
      // Handle same-day requests using toDateString() for more reliable comparison
      if (start.toDateString() === end.toDateString()) {
        const finalDays = isHalfDay ? 0.5 : 1
        console.log('Same day detected, setting days to:', finalDays)
        setNumberOfDays(finalDays)
        return
      }
      
      // For different dates, calculate the difference
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const calculatedDays = diffDays + 1 // Include both start and end dates
      
      // If it's a half day, reduce by 0.5
      const finalDays = isHalfDay ? Math.max(0.5, calculatedDays - 0.5) : calculatedDays
      console.log('Different days detected, calculated days:', finalDays)
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
    const startDateObj = new Date(startDate + 'T00:00:00') // Set to start of day
    const endDateObj = new Date(endDate + 'T00:00:00') // Set to start of day
    
    // Check each validation step individually
    if (!startDate || !endDate || !reason.trim()) {
      return false
    }
    
    if (startDateObj > endDateObj) {
      return false
    }
    
    if (numberOfDays > getAvailableBalance()) {
      return false
    }
    
    // Check if any dates are weekends or holidays
    if (isDateDisabled(startDate) || isDateDisabled(endDate)) {
      return false
    }
    
    // Allow previous dates - removed the date restriction
    // if (startDateObj < currentDateStart) {
    //   return false
    // }
    
    return true
  }

  // Check for potential conflicts with existing leave requests
  const checkForConflicts = async () => {
    if (!startDate || !endDate) return null
    
    try {
      // This would ideally call a backend endpoint to check for conflicts
      // For now, we'll show a general warning about checking existing requests
      return null
    } catch (error) {
      console.error('Error checking for conflicts:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!isRequestValid()) {
      setError('Please check your input. Make sure dates are valid and you have sufficient leave balance.')
      return
    }

    // Additional validation for past dates
    const startDateObj = new Date(startDate + 'T00:00:00')
    const currentDate = new Date()
    const currentDateStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
    
    if (startDateObj < currentDateStart) {
      const confirmPastDate = window.confirm(
        'You are requesting leave for a past date. This is allowed, but please ensure this is correct. Do you want to continue?'
      )
      if (!confirmPastDate) {
        return
      }
    }

    setLoading(true)

    try {
      // Create leave request
      const response = await apiClient.createLeaveRequest({
        user_id: employee.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        is_half_day: isHalfDay
      })
      
      const requestId = response.id

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
      if (error.message.includes('already have a leave request')) {
        setError('Duplicate Request: You already have a leave request for these dates. Please check your existing requests or choose different dates.')
      } else {
        setError(`Failed to submit request: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'casual': return 'border-orange-500 text-orange-700'
      case 'sick': return 'border-orange-500 text-orange-700'
      case 'privilege': return 'border-orange-500 text-orange-700'
      default: return 'border-gray-300 text-gray-700'
    }
  }

  const getLeaveTypeBg = (type: string) => {
    switch (type) {
      case 'casual': return 'bg-orange-50'
      case 'sick': return 'bg-orange-50'
      case 'privilege': return 'bg-orange-50'
      default: return 'bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen relative py-8">
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

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

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
                <BusinessDatePicker
                  value={startDate}
                  onChange={handleStartDateChange}
                  label="Start Date *"
                  placeholder="Select start date"
                />

              </div>

              <div>
                <BusinessDatePicker
                  value={endDate}
                  onChange={handleEndDateChange}
                  label="End Date *"
                  placeholder="Select end date"
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

            {/* Information about duplicate prevention */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a0 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-orange-700">
                  <p className="font-medium">Leave Request Rules:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• You can apply for leave on any date (including past dates)</li>
                    <li>• Duplicate leave requests for the same dates are not allowed</li>
                    <li>• Half-day leaves count as 0.5 days</li>
                    <li>• Make sure you have sufficient leave balance</li>
                    <li>• Check your existing requests to avoid conflicts</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Manager Information */}
            {managerInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium text-gray-900">Leave Request Recipient:</p>
                    <div className="mt-2 p-3 bg-white border border-gray-100 rounded-md">
                      <p className="font-semibold text-gray-900">{managerInfo.name}</p>
                      <p className="text-xs text-gray-600 font-medium">{managerInfo.department}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Your request will be reviewed by this manager</p>
                  </div>
                </div>
              </div>
            )}

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

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading || !(startDate && endDate && reason.trim() && isRequestValid())}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          </form>
        </div>


      </div>
    </div>
  )
} 