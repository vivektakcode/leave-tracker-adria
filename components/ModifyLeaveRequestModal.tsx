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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Modify Leave Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['casual', 'sick', 'privilege'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLeaveType(type)}
                  className={`p-3 border-2 rounded-lg text-center transition-all duration-200 ${
                    leaveType === type 
                      ? 'border-orange-500 bg-orange-50 text-orange-700' 
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-semibold capitalize">{type}</div>
                  <div className="text-xs text-gray-600">
                    {leaveBalance[`${type}_leave` as keyof typeof leaveBalance]} days available
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Selection *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <BusinessDatePicker
                  value={startDate}
                  onChange={setStartDate}
                  label="Start Date *"
                  placeholder="Select start date"
                  country="India"
                />
              </div>
              <div>
                <BusinessDatePicker
                  value={endDate}
                  onChange={setEndDate}
                  label="End Date *"
                  placeholder="Select end date"
                  country="India"
                />
              </div>
            </div>
          </div>

          {/* Half Day Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="halfDay"
              checked={isHalfDay}
              onChange={(e) => setIsHalfDay(e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="halfDay" className="text-sm text-gray-700">
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
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
