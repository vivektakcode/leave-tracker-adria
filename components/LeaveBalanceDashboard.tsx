'use client'

import { useState, useEffect } from 'react'
import { User, getLeaveBalance, getUserLeaveRequests } from '../lib/supabaseService'
import AdminPanel from './AdminPanel'
import LeaveRequestForm from './LeaveRequestForm'
import MyRequestsList from './MyRequestsList'

interface LeaveBalanceDashboardProps {
  employee: User
}

export default function LeaveBalanceDashboard({ employee }: LeaveBalanceDashboardProps) {
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showLeaveRequestForm, setShowLeaveRequestForm] = useState(false)
  const [showMyRequests, setShowMyRequests] = useState(false)
  const [leaveBalance, setLeaveBalance] = useState({ casual_leave: 0, sick_leave: 0, privilege_leave: 0 })
  const { name, department, role } = employee

  // Fetch leave balance when component mounts
  useEffect(() => {
    const fetchLeaveBalance = async () => {
      const balance = await getLeaveBalance(employee.id)
      if (balance) {
        setLeaveBalance(balance)
      }
    }
    fetchLeaveBalance()
  }, [employee.id])

  // Calculate total allocated days for each leave type
  const totalAllocated = {
    casual: 20,
    sick: 10,
    privilege: 15
  }

  // Calculate used days
  const usedDays = {
    casual: totalAllocated.casual - leaveBalance.casual_leave,
    sick: totalAllocated.sick - leaveBalance.sick_leave,
    privilege: totalAllocated.privilege - leaveBalance.privilege_leave
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
            {department} • {role === 'manager' ? 'Manager' : 'Employee'}
          </p>
        </div>

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Casual Leave */}
          <div className="card-professional shadow-elevated border-l-4 border-orange-500 hover:border-orange-600 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Casual Leave</h3>
                <p className="text-sm text-gray-600">Personal and casual time off</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-500">{leaveBalance.casual_leave}</div>
                <div className="text-sm text-gray-500">days remaining</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(usedDays.casual / totalAllocated.casual) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {usedDays.casual} of {totalAllocated.casual} days used
              </p>
            </div>
          </div>

          {/* Sick Leave */}
          <div className="card-professional shadow-elevated border-l-4 border-gray-500 hover:border-gray-600 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sick Leave</h3>
                <p className="text-sm text-gray-600">Medical and health-related leave</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-500">{leaveBalance.sick_leave}</div>
                <div className="text-sm text-gray-500">days remaining</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(usedDays.sick / totalAllocated.sick) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {usedDays.sick} of {totalAllocated.sick} days used
              </p>
            </div>
          </div>

          {/* Privilege Leave */}
          <div className="card-professional shadow-elevated border-l-4 border-orange-600 hover:border-orange-700 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Privilege Leave</h3>
                <p className="text-sm text-gray-600">Annual and special leave</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-600">{leaveBalance.privilege_leave}</div>
                <div className="text-sm text-gray-500">days remaining</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(usedDays.privilege / totalAllocated.privilege) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {usedDays.privilege} of {totalAllocated.privilege} days used
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setShowLeaveRequestForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-elevated hover:shadow-floating transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-lg">Request Leave</span>
            </div>
          </button>

          <button
            onClick={() => setShowMyRequests(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-elevated hover:shadow-floating transform hover:-translate-y-1"
          >
            <div className="flex items-center justify-center space-x-3">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-lg">View My Requests</span>
            </div>
          </button>

          {role === 'manager' && (
            <button 
              onClick={() => setShowAdminPanel(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-elevated hover:shadow-floating transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-lg">Admin Panel</span>
              </div>
            </button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card-professional shadow-elevated text-center">
            <div className="text-2xl font-bold text-orange-500">{leaveBalance.casual_leave + leaveBalance.sick_leave + leaveBalance.privilege_leave}</div>
            <div className="text-sm text-gray-500">Total Days Available</div>
          </div>
          <div className="card-professional shadow-elevated text-center">
            <div className="text-2xl font-bold text-orange-500">{leaveBalance.casual_leave}</div>
            <div className="text-sm text-gray-500">Casual Leave</div>
          </div>
          <div className="card-professional shadow-elevated text-center">
            <div className="text-2xl font-bold text-gray-500">{leaveBalance.sick_leave}</div>
            <div className="text-sm text-gray-500">Sick Leave</div>
          </div>
          <div className="card-professional shadow-elevated text-center">
            <div className="text-2xl font-bold text-orange-600">{leaveBalance.privilege_leave}</div>
            <div className="text-sm text-gray-500">Privilege Leave</div>
          </div>
        </div>
      </div>
    </div>
  )
} 