'use client'

import { useState, useEffect } from 'react'
import { LeaveRequest, getLeaveBalance, getUserManager } from '../lib/supabaseService'
import { isDateDisabled, getWorkingDaysBetween } from '../utils/dateUtils'
import BusinessDatePicker from './BusinessDatePicker'

interface ModifyLeaveRequestModalProps {
  request: LeaveRequest
  onClose: () => void
  onSuccess: () => void
}

export default function ModifyLeaveRequestModal({ request, onClose, onSuccess }: ModifyLeaveRequestModalProps) {
  const [leaveType, setLeaveType] = useState<'casual' | 'sick' | 'privilege'>(request.leave_type as 'casual' | 'sick' | 'privilege')
  const [startDate, setStartDate] = useState(request.start_date)
  const [endDate, setEndDate] = useState(request.end_date)
  const [reason, setReason] = useState(request.reason || '')
  const [isHalfDay, setIsHalfDay] = useState(request.is_half_day || false)
  const [numberOfDays, setNumberOfDays] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [leaveBalance, setLeaveBalance] = useState({ casual_leave: 0, sick_leave: 0, privilege_leave: 0 })

  // Fetch leave balance
  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        const response = await fetch(`/api/leave-balance?userId=${request.user_id}`)
        if (response.ok) {
          const data = await response.json()
          setLeaveBalance(data)
        }
      } catch (error) {
        console.error('Error fetching leave balance:', error)
      }
    }
    fetchLeaveBalance()
  }, [request.user_id])

  // Calculate number of days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate + 'T00:00:00')
      const end = new Date(endDate + 'T00:00:00')
      
      if (start.toDateString() === end.toDateString()) {
        const finalDays = isHalfDay ? 0.5 : 1
        setNumberOfDays(finalDays)
        return
      }
      
      const workingDays = getWorkingDaysBetween(startDate, endDate)
      const finalDays = isHalfDay ? Math.max(0.5, workingDays - 0.5) : workingDays
      setNumberOfDays(finalDays)
    } else {
      setNumberOfDays(0)
    }
  }, [startDate, endDate, isHalfDay])

  const getAvailableBalance = () => {
    switch (leaveType) {
      case 'casual': return leaveBalance.casual_leave
      case 'sick': return leaveBalance.sick_leave
      case 'privilege': return leaveBalance.privilege_leave
      default: return 0
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/leave-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.id,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
          is_half_day: isHalfDay
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update request')
      }

      onSuccess()
    } catch (error: any) {
      console.error('Error updating request:', error)
      setError(error.message || 'Failed to update request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Modify Leave Request</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-orange-200 transition-colors duration-200 p-1 rounded-lg hover:bg-white hover:bg-opacity-20"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Leave Type *
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(['casual', 'sick', 'privilege'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLeaveType(type)}
                  className={`p-4 border-2 rounded-xl text-center transition-all duration-200 transform hover:scale-105 ${
                    leaveType === type 
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md' 
                      : 'border-gray-300 text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  <div className="text-sm font-semibold capitalize mb-1">{type}</div>
                  <div className="text-xs text-gray-600">
                    {leaveBalance[`${type}_leave` as keyof typeof leaveBalance]} days available
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Date Selection *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">Start Date</label>
                <BusinessDatePicker
                  value={startDate}
                  onChange={setStartDate}
                  label=""
                  placeholder="Select start date"
                  country="India"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">End Date</label>
                <BusinessDatePicker
                  value={endDate}
                  onChange={setEndDate}
                  label=""
                  placeholder="Select end date"
                  country="India"
                />
              </div>
            </div>
          </div>

          {/* Half Day Option */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="halfDay"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="halfDay" className="text-sm font-medium text-gray-700">
              Half Day Leave
            </label>
          </div>

          {/* Number of Days Display */}
          {numberOfDays > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-800">
                  {isHalfDay ? 'Leave Duration:' : 'Number of Days:'}
                </span>
                <span className="text-sm font-bold text-orange-600">
                  {numberOfDays} {isHalfDay && numberOfDays === 0.5 ? 'half day' : numberOfDays === 1 ? 'day' : 'days'}
                </span>
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
              value={reason || ''}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Please provide a detailed reason for your leave request..."
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Update Request
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}
