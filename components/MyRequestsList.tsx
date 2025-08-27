'use client'

import { useState, useEffect } from 'react'
import { LeaveRequest, getUserLeaveRequests } from '../lib/supabaseService'

interface MyRequestsListProps {
  employeeId: string
}

export default function MyRequestsList({ employeeId }: MyRequestsListProps) {
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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <p className="text-gray-500 text-lg mb-2">No leave requests found</p>
          <p className="text-gray-400">Submit your first leave request to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="space-y-4">
        {userRequests.map((request) => (
          <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
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
              <span className="text-sm text-gray-500">
                {new Date(request.requested_at).toLocaleDateString()}
              </span>
            </div>
            
            <div className="mb-3">
              <h4 className="font-medium text-gray-900">
                {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
              </h4>
              <p className="text-sm text-gray-700 mt-1">{request.reason}</p>
            </div>

            {request.status !== 'pending' && (
              <div className="text-sm text-gray-600">
                <p>Processed by: {request.processed_by}</p>
                <p>Processed at: {new Date(request.processed_at!).toLocaleDateString()}</p>
                {request.comments && <p>Comments: {request.comments}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 