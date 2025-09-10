'use client'

import { useState, useEffect } from 'react'
import { User, getLeaveBalance, getUserManager } from '../lib/supabaseService'
import { isDateDisabled, getMinEndDate, getNextBusinessDay, getWorkingDaysBetween } from '../utils/dateUtils'
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
  const [medicalDocument, setMedicalDocument] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [leaveBalance, setLeaveBalance] = useState({ casual_leave: 0, sick_leave: 0, privilege_leave: 0 })
  const [managerInfo, setManagerInfo] = useState<{ name: string; department: string } | null>(null)
  const [showBalancePopup, setShowBalancePopup] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])



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

  // Fetch leave balance when component mounts (with caching)
  useEffect(() => {
    const fetchData = async () => {
      console.log('⚡ Loading leave balance and manager info...')
      const startTime = Date.now()
      
      // Check if we already have cached data
      const cacheKey = `leave_data_${employee.id}`
      const cachedData = sessionStorage.getItem(cacheKey)
      
      if (cachedData) {
        try {
          const { balance, manager, timestamp } = JSON.parse(cachedData)
          // Use cached data if it's less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log('⚡ Using cached data')
            setLeaveBalance(balance)
            setManagerInfo(manager)
            return
          }
        } catch (e) {
          // Invalid cache, continue with fresh fetch
        }
      }
      
      const [balance, manager] = await Promise.all([
        getLeaveBalance(employee.id),
        getUserManager(employee.id)
      ])
      
      const endTime = Date.now()
      console.log(`⚡ Data loaded in ${endTime - startTime}ms`)
      
      if (balance) {
        setLeaveBalance(balance)
        console.log('✅ Leave balance loaded:', balance)
      }
      
      if (manager) {
        setManagerInfo({ name: manager.name, department: manager.department })
        console.log('✅ Manager found for employee:', manager.name, manager.department)
        
        // Cache the data for 5 minutes
        sessionStorage.setItem(cacheKey, JSON.stringify({
          balance,
          manager: { name: manager.name, department: manager.department },
          timestamp: Date.now()
        }))
      } else {
        console.warn('⚠️ No manager found for employee:', employee.name, employee.email)
        setError('No manager assigned. Please contact HR to assign a manager before submitting leave requests.')
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
      
      // For different dates, calculate working days (excluding weekends)
      const workingDays = getWorkingDaysBetween(startDate, endDate)
      
      // If it's a half day, reduce by 0.5
      const finalDays = isHalfDay ? Math.max(0.5, workingDays - 0.5) : workingDays
      console.log('Different days detected, calculated days:', finalDays)
      setNumberOfDays(finalDays)
    } else {
      setNumberOfDays(0)
    }
  }, [startDate, endDate, isHalfDay])

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // Get available leave balance for selected type
  const getAvailableBalance = () => {
    switch (leaveType) {
      case 'casual': return leaveBalance.casual_leave
      case 'sick': return leaveBalance.sick_leave
      case 'privilege': return leaveBalance.privilege_leave
      default: return 0
    }
  }

  // Comprehensive validation with specific error messages
  const validateRequest = () => {
    const errors: string[] = []
    const startDateObj = new Date(startDate + 'T00:00:00')
    const endDateObj = new Date(endDate + 'T00:00:00')
    
    // Check required fields
    if (!startDate) {
      errors.push('Start date is required')
    }
    if (!endDate) {
      errors.push('End date is required')
    }
    if (!reason.trim()) {
      errors.push('Reason for leave is required')
    }
    
    // If we don't have basic required fields, return early
    if (errors.length > 0) {
      setValidationErrors(errors)
      return false
    }
    
    // Check date validity
    if (startDateObj > endDateObj) {
      errors.push('End date cannot be before start date')
    }
    
    // Check for weekends or holidays
    if (isDateDisabled(startDate)) {
      errors.push('Start date falls on a weekend or holiday')
    }
    if (isDateDisabled(endDate)) {
      errors.push('End date falls on a weekend or holiday')
    }
    
    // Check leave balance
    const availableBalance = getAvailableBalance()
    if (numberOfDays > availableBalance) {
      errors.push(`Insufficient ${leaveType} leave balance. Available: ${availableBalance} days, Requested: ${numberOfDays} days`)
    }
    
    // Check medical document requirement
    if (leaveType === 'sick' && numberOfDays > 2 && !medicalDocument) {
      errors.push('Medical document is required for sick leave requests over 2 days')
    }
    
    // Check for manager assignment
    if (!managerInfo || !managerInfo.name) {
      errors.push('No manager assigned. Please contact HR to assign a manager')
    }
    
    setValidationErrors(errors)
    return errors.length === 0
  }

  // Check if request is valid (for backward compatibility)
  const isRequestValid = () => {
    return validateRequest()
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
    setValidationErrors([])

    // Validate the request and get specific error messages
    if (!validateRequest()) {
      // Check if the main issue is insufficient balance
      const hasBalanceError = validationErrors.some(error => error.includes('Insufficient'))
      if (hasBalanceError) {
        setShowBalancePopup(true)
      } else {
        setError(validationErrors.join('. ') + '.')
      }
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
      // Create leave request via API
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: employee.id,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
          is_half_day: isHalfDay
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit request')
      }

      const result = await response.json()
      
      // Log email status to console
              if (result.emailSent === 'pending') {
          console.log('📧 Email notification is being sent in the background')
          setSuccess(`Leave request submitted successfully! Request ID: ${result.id}. Manager will be notified shortly.`)
        } else if (result.emailSent === true) {
          console.log('✅ Email notification sent to manager successfully')
          setSuccess(`Leave request submitted successfully! Request ID: ${result.id}. Manager has been notified.`)
        } else {
          console.warn('⚠️ Leave request created but email notification failed')
          setSuccess(`Leave request submitted successfully! Request ID: ${result.id}. Note: Manager notification failed.`)
        }
      
      // Reset form
      setLeaveType('casual')
      setStartDate('')
      setEndDate('')
      setReason('')
      setNumberOfDays(0)
      setIsHalfDay(false)
      setMedicalDocument(null)

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
              
              {/* Balance Warning */}
              {numberOfDays > 0 && numberOfDays > getAvailableBalance() && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-red-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>
                      <strong>Warning:</strong> You're requesting {numberOfDays} days but only have {getAvailableBalance()} days of {leaveType} leave available.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Date Selection *
              </label>

              {/* Holiday Calendar Info */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-blue-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    <strong>Tip:</strong> Holidays are shown in light red and are automatically excluded from working day calculations.
                  </span>
                </div>
              </div>

              {/* Date Pickers with Holiday Support */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <BusinessDatePicker
                    value={startDate}
                    onChange={handleStartDateChange}
                    label="Start Date *"
                    placeholder="Select start date"
                    country={employee.country || 'India'}
                  />
                </div>

                <div>
                  <BusinessDatePicker
                    value={endDate}
                    onChange={handleEndDateChange}
                    label="End Date *"
                    placeholder="Select end date"
                    country={employee.country || 'India'}
                  />
                </div>
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

            {/* Information about duplicate prevention and holiday calendar */}
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
                    <li>• Use the Holiday Calendar to see holidays in red and plan your leave better</li>
                    <li>• Holidays are automatically excluded from working day calculations</li>
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

            {/* Medical Document Upload (for sick leave > 2 days) */}
            {leaveType === 'sick' && numberOfDays > 2 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Document *
                  <span className="text-red-500 ml-1">(Required for sick leave &gt; 2 days)</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                  <input
                    id="medicalDocument"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setMedicalDocument(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div 
                    onClick={() => document.getElementById('medicalDocument')?.click()}
                    className="cursor-pointer"
                  >
                    {medicalDocument ? (
                      <div className="text-green-600">
                        <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">Document uploaded: {medicalDocument.name}</p>
                        <p className="text-xs text-gray-500">Click to change</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium">Upload Medical Document</p>
                        <p className="text-xs">PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Medical certificate or doctor's note required for sick leave exceeding 2 days
                </p>
              </div>
            )}

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

        {/* Insufficient Balance Popup Modal */}
        {showBalancePopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Insufficient Leave Balance
                  </h3>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  You don't have enough {leaveType} leave balance for this request.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Available Balance:</span>
                    <span className="text-sm font-bold text-gray-900">{getAvailableBalance()} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Requested Days:</span>
                    <span className="text-sm font-bold text-red-600">{numberOfDays} days</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Shortfall:</span>
                      <span className="text-sm font-bold text-red-600">{numberOfDays - getAvailableBalance()} days</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBalancePopup(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBalancePopup(false)
                    // Optionally redirect to leave balance page or show balance info
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  View Leave Balance
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
} 