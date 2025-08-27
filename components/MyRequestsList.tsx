'use client'

import { useState, useEffect } from 'react'
import { LeaveRequest, getUserLeaveRequests } from '../lib/supabaseService'

interface MyRequestsListProps {
  employeeId: string
  compact?: boolean
}

export default function MyRequestsList({ employeeId, compact = false }: MyRequestsListProps) {
  const [userRequests, setUserRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your requests...</p>
        </div>
      </div>
    )
  }

  if (userRequests.length === 0) {
    return (
      <div className={compact ? "text-center py-4" : "bg-white rounded-lg shadow-md p-6"}>
        <div className="text-center py-4">
          <div className="text-gray-400 text-4xl mb-2">📋</div>
          <p className="text-gray-500 text-sm mb-1">No leave requests found</p>
          {!compact && <p className="text-gray-400">Submit your first leave request to get started!</p>}
        </div>
      </div>
    )
  }

  // Limit to 3 most recent requests in compact mode
  const displayRequests = compact ? userRequests.slice(0, 3) : userRequests

  return (
    <div className={compact ? "space-y-3" : "bg-white rounded-lg shadow-md p-6"}>
      {compact && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
          <span className="text-sm text-gray-500">{userRequests.length} total</span>
        </div>
      )}
      
      <div className="space-y-3">
        {displayRequests.map((request) => (
          <div key={request.id} className={`border rounded-lg p-3 hover:shadow-md transition-shadow ${compact ? 'bg-gray-50' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {request.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  request.leave_type === 'casual' ? 'bg-orange-100 text-orange-800' :
                  request.leave_type === 'sick' ? 'bg-gray-100 text-gray-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {request.leave_type}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(request.requested_at).toLocaleDateString()}
              </span>
            </div>
            
            <div className="mb-2">
              <h4 className="font-medium text-gray-900 text-sm">
                {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
              </h4>
              <p className="text-xs text-gray-700 mt-1 line-clamp-2">{request.reason}</p>
            </div>

            {request.status !== 'pending' && !compact && (
              <div className="text-sm text-gray-600">
                <p>Processed by: {request.processed_by}</p>
                <p>Processed at: {new Date(request.processed_at!).toLocaleDateString()}</p>
                {request.comments && <p>Comments: {request.comments}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {compact && userRequests.length > 3 && (
        <div className="text-center pt-2">
          <button 
            onClick={() => window.location.href = '#my-requests'}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
          >
            View all {userRequests.length} requests →
          </button>
        </div>
      )}
    </div>
  )
} 