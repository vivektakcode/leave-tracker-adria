'use client'

import { useState, useEffect } from 'react'
import { 
  LeaveRequest, 
  Employee,
  getAllLeaveRequests,
  getAllEmployees,
  processLeaveRequest
} from '../lib/vercelKVService'

interface AdminPanelProps {
  currentUser: Employee
  onBack?: () => void
}

export default function AdminPanel({ currentUser, onBack }: AdminPanelProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load data
    async function loadData() {
      try {
        const [requests, employees] = await Promise.all([
          getAllLeaveRequests(),
          getAllEmployees()
        ])
        setLeaveRequests(requests)
        setEmployees(employees)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    loadData()
  }, [])

  const handleProcessRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    setLoading(true)
    
    try {
      const success = await processLeaveRequest(requestId, status, currentUser.username, comments)
      if (success) {
        // Refresh data
        const [requests, employees] = await Promise.all([
          getAllLeaveRequests(),
          getAllEmployees()
        ])
        setLeaveRequests(requests)
        setEmployees(employees)
        setSelectedRequest(null)
        setComments('')
      }
    } catch (error) {
      console.error('Error processing request:', error)
    } finally {
      setLoading(false)
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
      case 'casual': return 'bg-blue-100 text-blue-800'
      case 'sick': return 'bg-red-100 text-red-800'
      case 'privilege': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-2">
                Manage leave requests and employee information
              </p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                ← Back to Dashboard
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leave Requests */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave Requests</h2>
              
              {leaveRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No leave requests found.</p>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLeaveTypeColor(request.leaveType)}`}>
                            {request.leaveType}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(request.requestedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900">{request.employeeName}</h4>
                        <p className="text-sm text-gray-600">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">{request.reason}</p>
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
                          >
                            Process
                          </button>
                        </div>
                      )}

                      {request.status !== 'pending' && (
                        <div className="text-sm text-gray-600">
                          <p>Processed by: {request.processedBy}</p>
                          <p>Processed at: {new Date(request.processedAt!).toLocaleDateString()}</p>
                          {request.comments && <p>Comments: {request.comments}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Employee List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Employees</h2>
              
              <div className="space-y-3">
                {employees.map((employee) => (
                  <div key={employee.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{employee.name}</h4>
                        <p className="text-sm text-gray-600">{employee.department}</p>
                        <p className="text-xs text-gray-500">{employee.role}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.leaveBalance.casual + employee.leaveBalance.sick + employee.leaveBalance.privilege}
                        </div>
                        <div className="text-xs text-gray-500">days left</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Process Request Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Process Leave Request
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{selectedRequest.employeeName}</strong> is requesting {selectedRequest.leaveType} leave
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-700 mt-2">{selectedRequest.reason}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add any comments..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleProcessRequest(selectedRequest.id, 'approved')}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleProcessRequest(selectedRequest.id, 'rejected')}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(null)
                    setComments('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 