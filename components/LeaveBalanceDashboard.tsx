'use client'

import { useState } from 'react'
import { Employee, getEmployeeLeaveRequests } from '../lib/vercelKVService'
import AdminPanel from './AdminPanel'
import LeaveRequestForm from './LeaveRequestForm'
import MyRequestsList from './MyRequestsList'

interface LeaveBalanceDashboardProps {
  employee: Employee
}

export default function LeaveBalanceDashboard({ employee }: LeaveBalanceDashboardProps) {
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showLeaveRequestForm, setShowLeaveRequestForm] = useState(false)
  const [showMyRequests, setShowMyRequests] = useState(false)
  const { leaveBalance, name, department, role } = employee

  // Calculate total allocated days for each leave type
  const totalAllocated = {
    casual: 12,
    sick: 15,
    privilege: 21
  }

  // Calculate used days
  const usedDays = {
    casual: totalAllocated.casual - leaveBalance.casual,
    sick: totalAllocated.sick - leaveBalance.sick,
    privilege: totalAllocated.privilege - leaveBalance.privilege
  }

  if (showAdminPanel) {
    return (
      <AdminPanel 
        currentUser={employee} 
        onBack={() => setShowAdminPanel(false)}
      />
    )
  }

  if (showLeaveRequestForm) {
    return (
      <LeaveRequestForm 
        employee={employee}
        onBack={() => setShowLeaveRequestForm(false)}
      />
    )
  }

  if (showMyRequests) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Leave Requests</h1>
                <p className="text-gray-600 mt-2">View your leave request history</p>
              </div>
              <button
                onClick={() => setShowMyRequests(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
          
          <MyRequestsList employeeId={employee.id} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {name}!</h1>
          <p className="text-gray-600 mt-2">
            {department} • {role === 'admin' ? 'Administrator' : 'Employee'}
          </p>
        </div>

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Casual Leave */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Casual Leave</h3>
                <p className="text-sm text-gray-600">Personal and casual time off</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{leaveBalance.casual}</div>
                <div className="text-sm text-gray-500">days remaining</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(usedDays.casual / totalAllocated.casual) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {usedDays.casual} of {totalAllocated.casual} days used
              </p>
            </div>
          </div>

          {/* Sick Leave */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sick Leave</h3>
                <p className="text-sm text-gray-600">Medical and health-related leave</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-600">{leaveBalance.sick}</div>
                <div className="text-sm text-gray-500">days remaining</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(usedDays.sick / totalAllocated.sick) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {usedDays.sick} of {totalAllocated.sick} days used
              </p>
            </div>
          </div>

          {/* Privilege Leave */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Privilege Leave</h3>
                <p className="text-sm text-gray-600">Annual and earned leave</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">{leaveBalance.privilege}</div>
                <div className="text-sm text-gray-500">days remaining</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(usedDays.privilege / totalAllocated.privilege) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {usedDays.privilege} of {totalAllocated.privilege} days used
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Request Leave */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setShowLeaveRequestForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                📝 Request Leave
              </button>
              <button 
                onClick={() => setShowMyRequests(true)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
              >
                📋 View My Requests
              </button>
              {role === 'admin' && (
                <button 
                  onClick={() => setShowAdminPanel(true)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
                >
                  ⚡ Admin Panel
                </button>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>Last login: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span>Leave balance updated</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                <span>No pending requests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{leaveBalance.casual + leaveBalance.sick + leaveBalance.privilege}</div>
              <div className="text-sm text-gray-500">Total Days Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{leaveBalance.casual}</div>
              <div className="text-sm text-gray-500">Casual Leave</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{leaveBalance.sick}</div>
              <div className="text-sm text-gray-500">Sick Leave</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{leaveBalance.privilege}</div>
              <div className="text-sm text-gray-500">Privilege Leave</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 