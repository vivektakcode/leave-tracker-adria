'use client'

import { useState, useEffect } from 'react'
import { User, LeaveRequest, getDashboardData, getTotalAllocatedLeave } from '../lib/supabaseService'
import AdminPanel from './AdminPanel'
import LeaveRequestForm from './LeaveRequestForm'
import MyRequestsList from './MyRequestsList'
import Navigation from './Navigation'

interface LeaveBalanceDashboardProps {
  employee: User
}

export default function LeaveBalanceDashboard({ employee }: LeaveBalanceDashboardProps) {
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showLeaveRequestForm, setShowLeaveRequestForm] = useState(false)
  const [showMyRequests, setShowMyRequests] = useState(false)
  const [leaveBalance, setLeaveBalance] = useState({ casual_leave: 0, sick_leave: 0, privilege_leave: 0 })
  const [usedDays, setUsedDays] = useState({ casual: 0, sick: 0, privilege: 0 })
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const { name, department, role } = employee

  // Ultra-fast dashboard data loading - everything in parallel
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Load all dashboard data in a single optimized call
        const { leaveBalance, leaveRequests } = await getDashboardData(employee.id)
        
        if (leaveBalance) {
          setLeaveBalance(leaveBalance)
          setLeaveRequests(leaveRequests)
          
          // Get total allocated leave (this is synchronous, no API call)
          const totalAllocated = getTotalAllocatedLeave()
          
          // Calculate used days based on remaining balance
          const calculatedUsedDays = {
            casual: totalAllocated.casual - leaveBalance.casual_leave,
            sick: totalAllocated.sick - leaveBalance.sick_leave,
            privilege: totalAllocated.privilege - leaveBalance.privilege_leave
          }
          
          console.log('📊 Current Leave Balance:', leaveBalance)
          console.log('📊 Total Allocated:', totalAllocated)
          console.log('📊 Calculated Used Days:', calculatedUsedDays)
          console.log('📊 Leave Requests:', leaveRequests.length)

          setUsedDays(calculatedUsedDays)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [employee.id])



  if (showAdminPanel) {
    return (
      <div className="min-h-screen relative">
        <Navigation userEmail={employee.email} role={employee.role} />
        <AdminPanel 
          currentUser={employee} 
          onBack={() => setShowAdminPanel(false)}
        />
      </div>
    )
  }

  if (showLeaveRequestForm) {
    return (
      <div className="min-h-screen relative">
        <Navigation userEmail={employee.email} role={employee.role} />
        <LeaveRequestForm 
          employee={employee}
          onBack={() => setShowLeaveRequestForm(false)}
        />
      </div>
    )
  }

  if (showMyRequests) {
    return (
      <div className="min-h-screen relative">
        <Navigation userEmail={employee.email} role={employee.role} />
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">My Leave Requests</h1>
                  <p className="text-gray-600 mt-2">View your leave request history</p>
                </div>
                <button
                  onClick={() => setShowMyRequests(false)}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
            <MyRequestsList employeeId={employee.id} preloadedRequests={leaveRequests} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <Navigation userEmail={employee.email} role={employee.role} />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {name}!</h1>
            <p className="text-gray-600 mt-2">
              {department} • {role === 'manager' ? 'Manager' : 'Employee'}
            </p>
          </div>

          {/* Leave Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Days */}
            <div className="card-professional shadow-elevated border-l-4 border-orange-400 hover:border-orange-500 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Total Days</h3>
                  <p className="text-sm text-gray-600">All leave types combined</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-orange-400">30</div>
                  <div className="text-sm text-gray-500">days allocated</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((6 - leaveBalance.casual_leave) + (6 - leaveBalance.sick_leave) + (18 - leaveBalance.privilege_leave)) / 30 * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(6 - leaveBalance.casual_leave) + (6 - leaveBalance.sick_leave) + (18 - leaveBalance.privilege_leave)} of 30 days used
                </p>
              </div>
            </div>

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
                    style={{ width: `${getTotalAllocatedLeave().casual > 0 ? (usedDays.casual / getTotalAllocatedLeave().casual) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {usedDays.casual} of {getTotalAllocatedLeave().casual} days used
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
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getTotalAllocatedLeave().sick > 0 ? (usedDays.sick / getTotalAllocatedLeave().sick) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {usedDays.sick} of {getTotalAllocatedLeave().sick} days used
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
                    style={{ width: `${getTotalAllocatedLeave().privilege > 0 ? (usedDays.privilege / getTotalAllocatedLeave().privilege) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {usedDays.privilege} of {getTotalAllocatedLeave().privilege} days used
                </p>
              </div>
            </div>
          </div>

          {/* Debug Section - Remove this in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔍 Debug Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>User ID:</strong> {employee.id}</p>
                  <p><strong>Email:</strong> {employee.email}</p>
                  <p><strong>Current Balance:</strong> Casual: {leaveBalance.casual_leave}, Sick: {leaveBalance.sick_leave}, Privilege: {leaveBalance.privilege_leave}</p>
                </div>
                <div>
                  <p><strong>Used Days:</strong> Casual: {usedDays.casual}, Sick: {usedDays.sick}, Privilege: {usedDays.privilege}</p>
                  <p><strong>Total Used:</strong> {usedDays.casual + usedDays.sick + usedDays.privilege} of 30</p>
                  <p><strong>Expected Balance:</strong> Casual: {6 - usedDays.casual}, Sick: {6 - usedDays.sick}, Privilege: {18 - usedDays.privilege}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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

          {/* Recent Requests Preview */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Leave Requests</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <MyRequestsList employeeId={employee.id} compact={true} preloadedRequests={leaveRequests} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 