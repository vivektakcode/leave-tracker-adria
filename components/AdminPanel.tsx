'use client'

import { useState, useEffect } from 'react'
import {
  User,
  getAllUsersWithLeaveBalances,
  getAllLeaveRequestsWithUserDetails,
  processLeaveRequest
} from '../lib/supabaseService'

interface AdminPanelProps {
  currentUser: User
  onBack: () => void
}

export default function AdminPanel({ currentUser, onBack }: AdminPanelProps) {
  console.log('AdminPanel rendering with currentUser:', currentUser)
  
  const [users, setUsers] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<'approved' | 'rejected'>('approved')
  const [comments, setComments] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching admin data...')
        const [requestsData, usersData] = await Promise.all([
          getAllLeaveRequestsWithUserDetails(),
          getAllUsersWithLeaveBalances()
        ])
        console.log('Admin data fetched:', { requests: requestsData, users: usersData })
        setRequests(requestsData)
        setUsers(usersData)
        setError('')
      } catch (error) {
        console.error('Error fetching admin data:', error)
        setError(`Failed to fetch data: ${error}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const [requestsData, usersData] = await Promise.all([
        getAllLeaveRequestsWithUserDetails(),
        getAllUsersWithLeaveBalances()
      ])
      setRequests(requestsData)
      setUsers(usersData)
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessRequest = async () => {
    if (!selectedRequest) return

    try {
      const success = await processLeaveRequest(
        selectedRequest.id,
        approvalStatus,
        currentUser.id,
        comments
      )

      if (success) {
        setShowApprovalModal(false)
        setSelectedRequest(null)
        setComments('')
        // Refresh data
        handleRefresh()
      }
    } catch (error) {
      console.error('Error processing request:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'casual': return 'bg-orange-100 text-orange-800'
      case 'sick': return 'bg-gray-100 text-gray-800'
      case 'privilege': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading admin panel...</p>
          </div>
        </div>
      </div>
    )
  }

  try {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-2">
                Manage leave requests and user information
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                🔄 Refresh
              </button>
              <button
                onClick={onBack}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <strong>Admin Panel Error:</strong> {error}
          </div>
        )}

        {/* Leave Requests */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave Requests</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <h4 className="font-medium text-gray-900">{request.users?.name || 'Unknown User'}</h4>
                          <p className="text-sm text-gray-500">{request.users?.department || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeaveTypeColor(request.leave_type)}`}>
                          {request.leave_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.start_date} - {request.end_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowApprovalModal(true)
                            }}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            Process
                          </button>
                        )}
                        {request.status !== 'pending' && (
                          <span className="text-gray-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div key={user.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{user.name}</h4>
                    <p className="text-sm text-gray-600">{user.department}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {user.leave_balances ? (
                        <div>
                          <div className="font-semibold text-orange-500">
                            {user.leave_balances.casual_leave + user.leave_balances.sick_leave + user.leave_balances.privilege_leave}
                          </div>
                          <div className="text-xs text-gray-400">Total Days</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-400">N/A</div>
                          <div className="text-xs text-gray-400">Total Days</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {user.leave_balances && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium text-orange-500">{user.leave_balances.casual_leave}</div>
                        <div className="text-gray-500">Casual</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-500">{user.leave_balances.sick_leave}</div>
                        <div className="text-gray-500">Sick</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-orange-600">{user.leave_balances.privilege_leave}</div>
                        <div className="text-gray-500">Privilege</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Process Leave Request</h3>
              <p className="text-sm text-gray-600 mb-4">
                <strong>{selectedRequest.users?.name || 'Unknown User'}</strong> is requesting {selectedRequest.leave_type} leave
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value as 'approved' | 'rejected')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any comments..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessRequest}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    approvalStatus === 'approved' 
                      ? 'bg-orange-500 hover:bg-orange-600' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}
                >
                  {approvalStatus === 'approved' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  } catch (error) {
    console.error('Error rendering AdminPanel:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-red-600">Error Loading Admin Panel</h1>
            <p className="text-gray-600 mt-2">
              Failed to load the admin panel data. Please try again later.
            </p>
            <p className="text-gray-500 mt-4">Error details: {errorMessage}</p>
            <button
              onClick={handleRefresh}
              className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    )
  }
} 