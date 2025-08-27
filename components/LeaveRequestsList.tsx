'use client'

interface LeaveRequest {
  id: string
  userId: string
  userEmail: string
  type: 'casual' | 'sick' | 'privilege'
  startDate: string
  endDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  // Manager information for pending requests
  manager_name?: string
  manager_department?: string
}

interface LeaveRequestsListProps {
  requests: LeaveRequest[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export default function LeaveRequestsList({ requests, onApprove, onReject }: LeaveRequestsListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-success-600 bg-success-50'
      case 'rejected': return 'text-danger-600 bg-danger-50'
      default: return 'text-warning-600 bg-warning-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved'
      case 'rejected': return 'Rejected'
      default: return 'Pending'
    }
  }

  if (requests.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No leave requests found</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Requests</h3>
      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{request.userEmail}</h4>
                <p className="text-sm text-gray-600">
                  {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Leave
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                {getStatusText(request.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <span className="text-gray-600">Start Date:</span>
                <span className="ml-2 text-gray-900">{new Date(request.startDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-600">End Date:</span>
                <span className="ml-2 text-gray-900">{new Date(request.endDate).toLocaleDateString()}</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-3">{request.reason}</p>
            
            {/* Show manager information for pending requests */}
            {request.status === 'pending' && request.manager_name && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 text-xs text-blue-700">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Pending with: <span className="font-medium">{request.manager_name}</span>
                    {request.manager_department && (
                      <span> ({request.manager_department})</span>
                    )}
                  </span>
                </div>
              </div>
            )}
            
            {request.status === 'pending' && (
              <div className="flex space-x-2">
                <button
                  onClick={() => onApprove(request.id)}
                  className="btn-success text-sm px-3 py-1"
                >
                  Approve
                </button>
                <button
                  onClick={() => onReject(request.id)}
                  className="btn-danger text-sm px-3 py-1"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 