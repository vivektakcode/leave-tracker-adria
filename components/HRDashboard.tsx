'use client'

import { useState, useEffect } from 'react'
import { 
  getAllUsers, 
  createUser, 
  getHolidayCalendar, 
  createHolidayCalendar,
  updateHolidayCalendar,
  User,
  HolidayCalendar,
  Holiday
} from '../lib/supabaseService'

interface HRDashboardProps {
  currentUser: User
}

export default function HRDashboard({ currentUser }: HRDashboardProps) {
  const [users, setUsers] = useState<User[]>([])
  const [holidayCalendars, setHolidayCalendars] = useState<HolidayCalendar[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'holidays'>('users')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // User management state
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    department: '',
    country: 'UAE',
    role: 'employee' as 'employee' | 'manager' | 'hr',
    manager_id: ''
  })

  // Holiday management state
  const [showCreateHoliday, setShowCreateHoliday] = useState(false)
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
      const [usersData, calendarsData] = await Promise.all([
        getAllUsers(),
        getHolidayCalendar('UAE', new Date().getFullYear())
      ])
      
      setUsers(usersData)
      if (calendarsData) {
        setHolidayCalendars([calendarsData])
      }
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
      await createUser(newUser)
      setSuccess('User created successfully!')
      setShowCreateUser(false)
      setNewUser({
        username: '',
        password: '',
        name: '',
        email: '',
        department: '',
        country: 'UAE',
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage users, roles, and holiday calendars</p>
        </div>

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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">@{user.username}</div>
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

            {/* Holiday Calendars */}
            <div className="grid gap-6">
              {holidayCalendars.map((calendar) => (
                <div key={calendar.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {calendar.country} - {calendar.year}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {calendar.holidays.length} holidays
                    </span>
                  </div>
                  
                  <div className="grid gap-3">
                    {calendar.holidays.map((holiday, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{holiday.name}</div>
                          <div className="text-sm text-gray-500">{holiday.date}</div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                    <label className="block text-sm font-medium text-gray-700">Username *</label>
                    <input
                      type="text"
                      required
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
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
                      <option value="UAE">UAE</option>
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
                            <input
                              type="date"
                              required
                              value={holiday.date}
                              onChange={(e) => updateHoliday(index, 'date', e.target.value)}
                              className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
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
      </div>
    </div>
  )
}
