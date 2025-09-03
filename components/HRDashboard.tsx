'use client'

import { useState, useEffect } from 'react'
import { 
  getAllUsers, 
  createUser, 
  getAllHolidayCalendars,
  updateUser,
  createHolidayCalendar,
  updateHolidayCalendar,
  deleteHolidayCalendar,
  getAllLeaveRequests,
  processLeaveRequest,
  User,
  HolidayCalendar,
  Holiday,
  LeaveRequest
} from '../lib/supabaseService'
import WeekendAwareDatePicker from './WeekendAwareDatePicker'
import { useAuth } from '../contexts/JsonAuthContext'

interface HRDashboardProps {
  currentUser: User
}

export default function HRDashboard({ currentUser }: HRDashboardProps) {
  const { logout } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [holidayCalendars, setHolidayCalendars] = useState<HolidayCalendar[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'holidays' | 'leave-requests'>('users')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Holiday filter state
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  // User management state
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    password: '',
    name: '',
    email: '',
    department: '',
    country: 'India',
    role: 'employee' as 'employee' | 'manager' | 'hr',
    manager_id: ''
  })

  // Holiday management state
  const [showCreateHoliday, setShowCreateHoliday] = useState(false)
  const [showEditHoliday, setShowEditHoliday] = useState(false)
  const [editingCalendar, setEditingCalendar] = useState<HolidayCalendar | null>(null)

  // Leave request management state
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<'approved' | 'rejected'>('approved')
  const [comments, setComments] = useState('')
  const [newHoliday, setNewHoliday] = useState({
    country: '',
    year: new Date().getFullYear(),
    holidays: [] as Holiday[]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersData, calendarsData, requestsData] = await Promise.all([
        getAllUsers(),
        getAllHolidayCalendars(),
        getAllLeaveRequests()
      ])
      
      setUsers(usersData)
      setHolidayCalendars(calendarsData)
      setLeaveRequests(requestsData)
    } catch (error) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate manager assignment for employees
      if (newUser.role === 'employee') {
        if (!newUser.manager_id) {
          setError('All employees must have a manager assigned')
          setLoading(false)
          return
        }
        
        const selectedManager = users.find(u => u.id === newUser.manager_id)
        if (selectedManager && selectedManager.role !== 'manager' && selectedManager.role !== 'hr') {
          setError('Selected manager must have manager or HR role')
          setLoading(false)
          return
        }
      }

      await createUser(newUser)
      setSuccess('User created successfully!')
      setShowCreateUser(false)
      setNewUser({
        password: '',
        name: '',
        email: '',
        department: '',
        country: 'India',
        role: 'employee',
        manager_id: ''
      })
      loadData()
    } catch (error: any) {
      setError(error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validate manager assignment for employees
      if (editingUser.role === 'employee' && editingUser.manager_id) {
        const selectedManager = users.find(u => u.id === editingUser.manager_id)
        if (selectedManager && selectedManager.role !== 'manager' && selectedManager.role !== 'hr') {
          setError('Selected manager must have manager or HR role')
          setLoading(false)
          return
        }
      }

      // Check if manager is changing
      const originalUser = users.find(u => u.id === editingUser.id)
      const managerChanged = originalUser?.manager_id !== editingUser.manager_id

      await updateUser(editingUser.id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        department: editingUser.department,
        country: editingUser.country,
        manager_id: editingUser.manager_id
      })

      // Handle manager change - reassign pending leave requests
      if (managerChanged && editingUser.role === 'employee') {
        await handleManagerChange(editingUser.id, editingUser.manager_id, originalUser?.manager_id)
      }

      setSuccess('User updated successfully!')
      setShowEditUser(false)
      setEditingUser(null)
      loadData()
    } catch (error: any) {
      setError(error.message || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const startEditUser = (user: User) => {
    setEditingUser({ ...user })
    setShowEditUser(true)
  }

  // Handle manager change - reassign pending leave requests
  const handleManagerChange = async (userId: string, newManagerId: string | undefined, oldManagerId: string | undefined) => {
    try {
      // Import the function to reassign leave requests
      const { reassignLeaveRequestsToNewManager } = await import('../lib/supabaseService')
      
      // Reassign pending leave requests to new manager
      const reassignedCount = await reassignLeaveRequestsToNewManager(userId, newManagerId, oldManagerId)
      
      if (reassignedCount > 0) {
        console.log(`✅ Reassigned ${reassignedCount} pending leave requests to new manager`)
      }
    } catch (error) {
      console.error('Error reassigning leave requests:', error)
      // Don't fail the user update if leave request reassignment fails
    }
  }

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await createHolidayCalendar({
        ...newHoliday,
        created_by: currentUser.id
      })
      setSuccess('Holiday calendar created successfully!')
      setShowCreateHoliday(false)
      setNewHoliday({
        country: '',
        year: new Date().getFullYear(),
        holidays: []
      })
      loadData()
    } catch (error: any) {
      setError(error.message || 'Failed to create holiday calendar')
    } finally {
      setLoading(false)
    }
  }

  const handleEditHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCalendar) return
    
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await updateHolidayCalendar(editingCalendar.id, {
        holidays: editingCalendar.holidays
      })
      setSuccess('Holiday calendar updated successfully!')
      setShowEditHoliday(false)
      setEditingCalendar(null)
      loadData()
    } catch (error: any) {
      setError(error.message || 'Failed to update holiday calendar')
    } finally {
      setLoading(false)
    }
  }

  const startEditHoliday = (calendar: HolidayCalendar) => {
    setEditingCalendar({ ...calendar })
    setShowEditHoliday(true)
  }

  const updateEditingHoliday = (index: number, field: keyof Holiday, value: string) => {
    if (!editingCalendar) return
    
    setEditingCalendar(prev => ({
      ...prev!,
      holidays: prev!.holidays.map((holiday, i) => 
        i === index ? { ...holiday, [field]: value } : holiday
      )
    }))
  }

  const addHolidayToEditing = () => {
    if (!editingCalendar) return
    
    setEditingCalendar(prev => ({
      ...prev!,
      holidays: [...prev!.holidays, {
        date: '',
        name: '',
        type: 'public'
      }]
    }))
  }

  const removeEditingHoliday = (index: number) => {
    if (!editingCalendar) return
    
    setEditingCalendar(prev => ({
      ...prev!,
      holidays: prev!.holidays.filter((_, i) => i !== index)
    }))
  }

  const handleDeleteHoliday = async (calendarId: string) => {
    if (!confirm('Are you sure you want to delete this holiday calendar? This action cannot be undone.')) {
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await deleteHolidayCalendar(calendarId)
      setSuccess('Holiday calendar deleted successfully!')
      loadData()
    } catch (error: any) {
      setError(error.message || 'Failed to delete holiday calendar')
    } finally {
      setLoading(false)
    }
  }

  const addHolidayToCalendar = () => {
    setNewHoliday(prev => ({
      ...prev,
      holidays: [...prev.holidays, {
        date: '',
        name: '',
        type: 'public'
      }]
    }))
  }

  const updateHoliday = (index: number, field: keyof Holiday, value: string) => {
    setNewHoliday(prev => ({
      ...prev,
      holidays: prev.holidays.map((holiday, i) => 
        i === index ? { ...holiday, [field]: value } : holiday
      )
    }))
  }

  const removeHoliday = (index: number) => {
    setNewHoliday(prev => ({
      ...prev,
      holidays: prev.holidays.filter((_, i) => i !== index)
    }))
  }

  const getManagerName = (managerId: string) => {
    const manager = users.find(u => u.id === managerId)
    return manager ? manager.name : 'No Manager'
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'hr': return 'bg-purple-100 text-purple-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'employee': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Leave request processing functions
  const handleProcessRequest = async () => {
    if (!selectedRequest) return
    
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await processLeaveRequest(selectedRequest.id, approvalStatus, comments, currentUser.id)
      setSuccess(`Leave request ${approvalStatus} successfully!`)
      setShowApprovalModal(false)
      setSelectedRequest(null)
      setComments('')
      await loadData() // Refresh data
    } catch (error: any) {
      setError(error.message || 'Failed to process request')
    } finally {
      setLoading(false)
    }
  }

  const openApprovalModal = (request: LeaveRequest) => {
    setSelectedRequest(request)
    setApprovalStatus('approved')
    setComments('')
    setShowApprovalModal(true)
  }

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'casual': return 'bg-blue-100 text-blue-800'
      case 'sick': return 'bg-red-100 text-red-800'
      case 'privilege': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate number of days between start and end date
  const calculateNumberOfDays = (startDate: string, endDate: string, isHalfDay?: boolean) => {
    if (!startDate || !endDate) return 0
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Handle same-day requests
    if (start.toDateString() === end.toDateString()) {
      return isHalfDay ? 0.5 : 1
    }
    
    // For different dates, calculate the difference
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const calculatedDays = diffDays + 1 // Include both start and end dates
    
    // If it's a half day, reduce by 0.5
    return isHalfDay ? Math.max(0.5, calculatedDays - 0.5) : calculatedDays
  }

  // Get filtered holiday calendars
  const filteredHolidayCalendars = holidayCalendars.filter(calendar => {
    const countryMatch = !selectedCountry || calendar.country === selectedCountry
    const yearMatch = !selectedYear || calendar.year.toString() === selectedYear
    return countryMatch && yearMatch
  })

  // Get unique countries and years for filters
  const uniqueCountries = Array.from(new Set(holidayCalendars.map(cal => cal.country))).sort()
  const uniqueYears = Array.from(new Set(holidayCalendars.map(cal => cal.year))).sort((a, b) => b - a)

  if (currentUser.role !== 'hr') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the HR Dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* Navigation Header */}
      <nav className="bg-gradient-to-r from-slate-100 to-slate-200 shadow-lg border-b border-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 flex items-center justify-center">
                <img 
                  src="/Adria_logo.png" 
                  alt="Adria Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  HR Dashboard
                </h1>
                <p className="text-slate-600 text-sm">
                  Manage users, roles, and holiday calendars
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-slate-800 font-semibold">
                  Welcome back!
                </p>
                <p className="text-slate-600 text-sm">
                  {currentUser.email}
                </p>
              </div>
              
              <button
                onClick={logout}
                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 font-semibold py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('holidays')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'holidays'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Holiday Calendars
            </button>
            <button
              onClick={() => setActiveTab('leave-requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'leave-requests'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Leave Requests
            </button>
          </nav>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <button
                onClick={() => setShowCreateUser(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Add New User
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manager
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.country}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.manager_id ? getManagerName(user.manager_id) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => startEditUser(user)}
                            className="text-orange-600 hover:text-orange-700 font-medium"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Holidays Tab */}
        {activeTab === 'holidays' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Holiday Calendars</h2>
              <button
                onClick={() => setShowCreateHoliday(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Add Holiday Calendar
              </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Country</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Countries</option>
                  {uniqueCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Years</option>
                  {uniqueYears.map(year => (
                    <option key={year} value={year.toString()}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredHolidayCalendars.map((calendar) => (
                <div key={calendar.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {calendar.country} - {calendar.year}
                    </h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">
                        {calendar.holidays.length} holidays
                      </span>
                      <button
                        onClick={() => startEditHoliday(calendar)}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(calendar.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {calendar.holidays.map((holiday, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{holiday.name}</div>
                          <div className="text-xs text-gray-500">{holiday.date}</div>
                        </div>
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${
                          holiday.type === 'public' ? 'bg-blue-100 text-blue-800' :
                          holiday.type === 'company' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {holiday.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
                <form onSubmit={handleCreateUser} className="space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password *</label>
                    <input
                      type="password"
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department *</label>
                    <select
                      required
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                                           <option value="">Select department</option>
                     <option value="Engineering">Engineering</option>
                     <option value="Sales">Sales</option>
                     <option value="Marketing">Marketing</option>
                     <option value="HR">HR</option>
                     <option value="Finance">Finance</option>
                     <option value="Operations">Operations</option>
                     <option value="Product">Product</option>
                     <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country *</label>
                    <select
                      required
                      value={newUser.country}
                      onChange={(e) => setNewUser({...newUser, country: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="India">India</option>
                      <option value="UAE">UAE</option>
                      <option value="Morocco">Morocco</option>
                      <option value="Tunisia">Tunisia</option>
                      <option value="Senegal">Senegal</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Qatar">Qatar</option>
                      <option value="Kuwait">Kuwait</option>
                      <option value="Oman">Oman</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role *</label>
                    <select
                      required
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as 'employee' | 'manager' | 'hr'})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR</option>
                    </select>
                  </div>
                  
                  {/* Manager Assignment - only show for employees */}
                  {newUser.role === 'employee' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manager *</label>
                      <select
                        required
                        value={newUser.manager_id}
                        onChange={(e) => setNewUser({...newUser, manager_id: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">Select a manager</option>
                        {users
                          .filter(user => user.role === 'manager' || user.role === 'hr')
                          .map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.name} ({manager.department}) - {manager.role === 'hr' ? 'HR' : 'Manager'}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        All employees must have a manager or HR user to approve their leave requests
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateUser(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Create Holiday Modal */}
        {showCreateHoliday && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Holiday Calendar</h3>
                <form onSubmit={handleCreateHoliday} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country *</label>
                    <select
                      required
                      value={newHoliday.country}
                      onChange={(e) => setNewHoliday({...newHoliday, country: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="Morocco">Morocco</option>
                      <option value="India">India</option>
                      <option value="Tunisia">Tunisia</option>
                      <option value="Senegal">Senegal</option>
                      <option value="UAE">UAE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year *</label>
                    <input
                      type="number"
                      required
                      value={newHoliday.year}
                      onChange={(e) => setNewHoliday({...newHoliday, year: parseInt(e.target.value)})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Holidays</label>
                      <button
                        type="button"
                        onClick={addHolidayToCalendar}
                        className="text-sm text-orange-600 hover:text-orange-700"
                      >
                        + Add Holiday
                      </button>
                    </div>
                    <div className="space-y-3">
                      {newHoliday.holidays.map((holiday, index) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <WeekendAwareDatePicker
                              value={holiday.date}
                              onChange={(date) => updateHoliday(index, 'date', date)}
                              placeholder="Select date"
                            />
                            <select
                              required
                              value={holiday.type}
                              onChange={(e) => updateHoliday(index, 'type', e.target.value)}
                              className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="public">Public</option>
                              <option value="company">Company</option>
                              <option value="optional">Optional</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              placeholder="Holiday name"
                              value={holiday.name}
                              onChange={(e) => updateHoliday(index, 'name', e.target.value)}
                              className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeHoliday(index)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateHoliday(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || newHoliday.holidays.length === 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Calendar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Holiday Modal */}
        {showEditHoliday && editingCalendar && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit Holiday Calendar - {editingCalendar.country} {editingCalendar.year}
                </h3>
                <form onSubmit={handleEditHoliday} className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">Holidays</label>
                      <button
                        type="button"
                        onClick={addHolidayToEditing}
                        className="text-sm text-orange-600 hover:text-orange-700"
                      >
                        + Add Holiday
                      </button>
                    </div>
                    <div className="space-y-3">
                      {editingCalendar.holidays.map((holiday, index) => (
                        <div key={index} className="p-3 border border-gray-200 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <WeekendAwareDatePicker
                              value={holiday.date}
                              onChange={(date) => updateEditingHoliday(index, 'date', date)}
                              placeholder="Select date"
                            />
                            <select
                              required
                              value={holiday.type}
                              onChange={(e) => updateEditingHoliday(index, 'type', e.target.value) as any}
                              className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            >
                              <option value="public">Public</option>
                              <option value="company">Company</option>
                              <option value="optional">Optional</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              placeholder="Holiday name"
                              value={holiday.name}
                              onChange={(e) => updateEditingHoliday(index, 'name', e.target.value)}
                              className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeEditingHoliday(index)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditHoliday(false)
                        setEditingCalendar(null)
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || editingCalendar.holidays.length === 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent hover:bg-orange-700 disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Update Calendar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUser && editingUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
                <form onSubmit={handleEditUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      required
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department *</label>
                    <select
                      required
                      value={editingUser.department}
                      onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                      <option value="Product">Product</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country *</label>
                    <select
                      required
                      value={editingUser.country}
                      onChange={(e) => setEditingUser({...editingUser, country: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="India">India</option>
                      <option value="UAE">UAE</option>
                      <option value="Morocco">Morocco</option>
                      <option value="Tunisia">Tunisia</option>
                      <option value="Senegal">Senegal</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Qatar">Qatar</option>
                      <option value="Kuwait">Kuwait</option>
                      <option value="Oman">Oman</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role *</label>
                    <select
                      required
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value as 'employee' | 'manager' | 'hr'})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR</option>
                    </select>
                  </div>
                  
                  {/* Manager Assignment - only show for employees */}
                  {editingUser.role === 'employee' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manager</label>
                      <select
                        value={editingUser.manager_id || ''}
                        onChange={(e) => setEditingUser({...editingUser, manager_id: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="">No Manager</option>
                        {users
                          .filter(user => user.role === 'manager' || user.role === 'hr')
                          .filter(user => user.id !== editingUser.id) // Can't be their own manager
                          .map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.name} ({manager.department}) - {manager.role === 'hr' ? 'HR' : 'Manager'}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Assign a manager or HR user to approve this employee's leave requests
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditUser(false)
                        setEditingUser(null)
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Update User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Leave Requests Tab */}
        {activeTab === 'leave-requests' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Leave Requests</h2>
              <button
                onClick={loadData}
                className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {leaveRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No leave requests found.</p>
                  </div>
                ) : (
                  (() => {
                    // Group leave requests by manager
                    const groupedRequests = leaveRequests.reduce((groups, request) => {
                      const user = users.find(u => u.id === request.user_id)
                      const manager = user?.manager_id ? users.find(u => u.id === user.manager_id) : null
                      const managerName = manager ? manager.name : 'No Manager'
                      
                      if (!groups[managerName]) {
                        groups[managerName] = []
                      }
                      groups[managerName].push(request)
                      return groups
                    }, {} as Record<string, LeaveRequest[]>)

                    return Object.entries(groupedRequests).map(([managerName, requests]) => (
                      <div key={managerName} className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900">
                            {managerName}
                            <span className="ml-2 text-sm font-normal text-gray-500">
                              ({requests.length} request{requests.length !== 1 ? 's' : ''})
                            </span>
                          </h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                          {requests.map((request) => (
                            <li key={request.id}>
                              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                        <span className="text-orange-600 font-medium text-sm">
                                          {request.user_id.substring(0, 2).toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="flex items-center">
                                        <h4 className="font-medium text-gray-900">
                                          {users.find(u => u.id === request.user_id)?.name || `User ${request.user_id}`}
                                        </h4>
                                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeaveTypeColor(request.leave_type)}`}>
                                          {request.leave_type}
                                        </span>
                                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                          {request.status}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-500">
                                        {request.start_date} to {request.end_date} ({calculateNumberOfDays(request.start_date, request.end_date, request.is_half_day)} days)
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                                      {(() => {
                                        const user = users.find(u => u.id === request.user_id)
                                        return user ? (
                                          <p className="text-xs text-gray-400 mt-1">
                                            {user.email} • {user.department}
                                          </p>
                                        ) : null
                                      })()}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {request.status === 'pending' && (
                                      <button
                                        onClick={() => openApprovalModal(request)}
                                        className="px-3 py-1 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100"
                                      >
                                        Process
                                      </button>
                                    )}
                                    <span className="text-xs text-gray-400">
                                      {new Date(request.requested_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  })()
                )}
              </div>
            )}
          </div>
        )}

        {/* Leave Request Approval Modal */}
        {showApprovalModal && selectedRequest && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Process Leave Request</h3>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>{users.find(u => u.id === selectedRequest.user_id)?.name || `User ${selectedRequest.user_id}`}</strong> is requesting {selectedRequest.leave_type} leave
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={approvalStatus}
                    onChange={(e) => setApprovalStatus(e.target.value as 'approved' | 'rejected')}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="approved">Approve</option>
                    <option value="rejected">Reject</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Add comments (optional)"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowApprovalModal(false)
                      setSelectedRequest(null)
                      setComments('')
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessRequest}
                    disabled={loading}
                    className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 ${
                      approvalStatus === 'approved'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {loading ? 'Processing...' : `${approvalStatus === 'approved' ? 'Approve' : 'Reject'} Request`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

