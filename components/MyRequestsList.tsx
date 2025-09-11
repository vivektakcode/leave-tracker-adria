'use client'

import { useState, useEffect } from 'react'
import { LeaveRequest, getUserLeaveRequests, cancelLeaveRequest } from '../lib/supabaseService'
import { getWorkingDaysBetween } from '../utils/dateUtils'
import ModifyLeaveRequestModal from './ModifyLeaveRequestModal'

interface MyRequestsListProps {
  employeeId: string
  compact?: boolean
  preloadedRequests?: LeaveRequest[]
}

export default function MyRequestsList({ employeeId, compact = false, preloadedRequests }: MyRequestsListProps) {
  const [userRequests, setUserRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [showAllRequests, setShowAllRequests] = useState(false)
  const [showModifyModal, setShowModifyModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  // Function to calculate days requested (excluding weekends)
  const calculateDaysRequested = (request: LeaveRequest): string => {
    const start = new Date(request.start_date)
    const end = new Date(request.end_date)
    
    // If same day, it's 1 day (or 0.5 if half day)
    if (start.toDateString() === end.toDateString()) {
      return request.is_half_day ? '0.5 day' : '1 day'
    }
    
    // For different dates, calculate working days (excluding weekends)
    const workingDays = getWorkingDaysBetween(request.start_date, request.end_date)
    
    // If half day, reduce by 0.5
    if (request.is_half_day) {
      const finalDays = Math.max(0.5, workingDays - 0.5)
      return `${finalDays} day${finalDays === 1 ? '' : 's'}`
    }
    
    return `${workingDays} day${workingDays === 1 ? '' : 's'}`
  }

  // Function to handle cancel request
  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return
    }

    setCancelling(requestId)
    try {
      const success = await cancelLeaveRequest(requestId)
      if (success) {
        // Optimistically update the UI instead of refetching all data
        setUserRequests(prev => prev.filter(req => req.id !== requestId))
        console.log('✔ Leave request cancelled')
      } else {
        alert('Failed to cancel request. Please try again.')
      }
    } catch (error) {
      console.error('Error cancelling request:', error)
      alert('Failed to cancel request. Please try again.')
    } finally {
      setCancelling(null)
    }
  }

  // Function to handle modify request
  const handleModifyRequest = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setShowModifyModal(true)
  }

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Use preloaded data if available, otherwise fetch from API
        if (preloadedRequests && preloadedRequests.length >= 0) {
          console.log('⚡ Using preloaded requests data')
          setUserRequests(preloadedRequests)
          setLoading(false)
        } else {
          console.log('⚡ Fetching requests from API')
          const requests = await getUserLeaveRequests(employeeId)
          setUserRequests(requests)
        }
      } catch (error) {
        console.error('Error fetching requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [employeeId, preloadedRequests])

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

  // Limit to 3 most recent requests in compact mode unless showAllRequests is true
  const displayRequests = compact && !showAllRequests ? userRequests.slice(0, 3) : userRequests

  return (
    <div className={compact ? "space-y-2" : "bg-white rounded-lg shadow-md p-4"}>
      {compact && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
          <span className="text-sm text-gray-500">{userRequests.length} total</span>
        </div>
      )}
      
      {compact ? (
        // Compact view - use table format but limit to 3 rows
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      request.leave_type === 'casual' ? 'bg-orange-100 text-orange-800' :
                      request.leave_type === 'sick' ? 'bg-orange-100 text-orange-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {request.leave_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{new Date(request.start_date).toLocaleDateString()}</div>
                    <div className="text-gray-500 text-xs">to {new Date(request.end_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {calculateDaysRequested(request)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={request.reason}>
                      {request.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.status === 'pending' ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleModifyRequest(request)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors duration-200"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Modify
                        </button>
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={cancelling === request.id}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {cancelling === request.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Full view - use table format
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      request.leave_type === 'casual' ? 'bg-orange-100 text-orange-800' :
                      request.leave_type === 'sick' ? 'bg-orange-100 text-orange-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {request.leave_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{new Date(request.start_date).toLocaleDateString()}</div>
                    <div className="text-gray-500">to {new Date(request.end_date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {calculateDaysRequested(request)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="truncate" title={request.reason}>
                      {request.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.status === 'pending' ? (
                      <div>
                        <div className="font-medium text-blue-600">
                          {request.manager_name || 'No Manager Assigned'}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-gray-600">Processed by:</div>
                        <div className="font-medium">{request.processed_by}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(request.processed_at!).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.requested_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.status === 'pending' ? (
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleModifyRequest(request)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors duration-200"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Modify
                        </button>
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={cancelling === request.id}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {cancelling === request.id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {compact && userRequests.length > 3 && !showAllRequests && (
        <div className="text-center pt-2">
          <button 
            onClick={() => setShowAllRequests(true)}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium hover:underline"
          >
            View all {userRequests.length} requests →
          </button>
        </div>
      )}
      
      {compact && showAllRequests && userRequests.length > 3 && (
        <div className="text-center pt-2">
          <button 
            onClick={() => setShowAllRequests(false)}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium hover:underline"
          >
            Show less ←
          </button>
        </div>
      )}

      {/* Modify Leave Request Modal */}
      {showModifyModal && selectedRequest && (
        <ModifyLeaveRequestModal
          request={selectedRequest}
          onClose={() => {
            setShowModifyModal(false)
            setSelectedRequest(null)
          }}
          onSuccess={() => {
            setShowModifyModal(false)
            setSelectedRequest(null)
            // Refresh the requests list
            window.location.reload()
          }}
        />
      )}
    </div>
  )
} 