'use client'

import { useState, useEffect } from 'react'
import { LeaveRequest, getUserLeaveRequests, cancelLeaveRequest } from '../lib/supabaseService'

interface MyRequestsListProps {
  employeeId: string
  compact?: boolean
}

export default function MyRequestsList({ employeeId, compact = false }: MyRequestsListProps) {
  const [userRequests, setUserRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  // Function to calculate days requested
  const calculateDaysRequested = (request: LeaveRequest): string => {
    const start = new Date(request.start_date)
    const end = new Date(request.end_date)
    
    // If same day, it's 1 day (or 0.5 if half day)
    if (start.toDateString() === end.toDateString()) {
      return request.is_half_day ? '0.5 day' : '1 day'
    }
    
    // For different dates, calculate the difference
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const totalDays = diffDays + 1 // Include both start and end dates
    
    // If half day, reduce by 0.5
    if (request.is_half_day) {
      const finalDays = Math.max(0.5, totalDays - 0.5)
      return `${finalDays} day${finalDays === 1 ? '' : 's'}`
    }
    
    return `${totalDays} day${totalDays === 1 ? '' : 's'}`
  }

  // Function to handle cancel request
  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return
    }

    setCancelling(requestId)
    try {
      await cancelLeaveRequest(requestId)
      // Refresh the requests list
      const requests = await getUserLeaveRequests(employeeId)
      setUserRequests(requests)
    } catch (error) {
      console.error('Error cancelling request:', error)
      alert('Failed to cancel request. Please try again.')
    } finally {
      setCancelling(null)
    }
  }

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requests = await getUserLeaveRequests(employeeId)
        setUserRequests(requests)
      } catch (error) {
        console.error('Error fetching requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [employeeId])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading your requests...</p>
        </div>
      </div>
    )
  }

  if (userRequests.length === 0) {
    return (
      <div className={compact ? "text-center py-3" : "bg-white rounded-lg shadow-md p-4"}>
        <div className="text-center py-3">
          <div className="text-gray-400 text-3xl mb-2">📋</div>
          <p className="text-gray-500 text-sm">No leave requests found</p>
          {!compact && <p className="text-gray-400 text-xs">Submit your first leave request to get started!</p>}
        </div>
      </div>
    )
  }

  // Limit to 3 most recent requests in compact mode
  const displayRequests = compact ? userRequests.slice(0, 3) : userRequests

  return (
    <div className={compact ? "space-y-2" : "bg-white rounded-lg shadow-md p-4"}>
      {compact && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
          <span className="text-sm text-gray-500">{userRequests.length} total</span>
        </div>
      )}
      
      <div className="space-y-2">
        {displayRequests.map((request) => (
          <div key={request.id} className={`border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all duration-200 ${compact ? 'bg-gray-50' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                  request.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                  'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {request.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                  request.leave_type === 'casual' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                  request.leave_type === 'sick' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  'bg-purple-100 text-purple-800 border border-purple-200'
                }`}>
                  {request.leave_type}
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                  {calculateDaysRequested(request)}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(request.requested_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            
            <div className="mb-2">
              <p className="text-sm text-gray-700 leading-relaxed">{request.reason}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(request.start_date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })} - {new Date(request.end_date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Cancel button for pending requests */}
            {request.status === 'pending' && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <svg className="h-3 w-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Pending with: <span className="font-medium text-blue-600">
                      {request.manager_name || 'Manager'}
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => handleCancelRequest(request.id)}
                  disabled={cancelling === request.id}
                  className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  {cancelling === request.id ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            )}

            {/* Processed info for non-pending requests */}
            {request.status !== 'pending' && !compact && (
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Processed by: <span className="font-medium">{request.processed_by}</span></span>
                  <span>Processed: {new Date(request.processed_at!).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}</span>
                </div>
                {request.comments && (
                  <div className="mt-2 p-2 bg-gray-50 rounded border-l-2 border-gray-300">
                    <span className="text-xs text-gray-600 font-medium">Comments:</span>
                    <p className="text-xs text-gray-700 mt-1">{request.comments}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {compact && userRequests.length > 3 && (
        <div className="text-center pt-2">
          <button 
            onClick={() => window.location.href = '#my-requests'}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium hover:underline"
          >
            View all {userRequests.length} requests →
          </button>
        </div>
      )}
    </div>
  )
} 