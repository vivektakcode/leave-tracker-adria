import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface User {
  id: string
  username: string
  password: string
  name: string
  email: string
  role: 'employee' | 'manager' | 'hr'
  department: string
  country: string
  manager_id?: string
  created_at: string
}

export interface LeaveBalance {
  id: string
  user_id: string
  casual_leave: number
  sick_leave: number
  privilege_leave: number
  created_at: string
  updated_at: string
}

export interface LeaveRequest {
  id: string
  user_id: string
  username?: string
  leave_type: 'casual' | 'sick' | 'privilege'
  start_date: string
  end_date: string
  reason: string
  is_half_day?: boolean
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  processed_at?: string
  processed_by?: string
  comments?: string
  manager_name?: string
  manager_department?: string
}

export interface HolidayCalendar {
  id: string
  country: string
  year: number
  holidays: Holiday[]
  created_by: string
  created_at: string
  updated_at: string
}

export interface Holiday {
  date: string
  name: string
  type: 'public' | 'company' | 'optional'
}

// User functions
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      console.error('Error getting user by username:', error)
      return null
    }

    return data as User
  } catch (error) {
    console.error('Error getting user by username:', error)
    return null
  }
}

export async function getUserManager(userId: string): Promise<User | null> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('manager_id')
      .eq('id', userId)
      .single()

    if (userError || !userData || !userData.manager_id) {
      return null
    }

    const { data: managerData, error: managerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userData.manager_id)
      .single()

    if (managerError || !managerData) {
      return null
    }

    return managerData as User
  } catch (error) {
    console.error('Error getting user manager:', error)
    return null
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error getting user by ID:', error)
      return null
    }

    return data as User
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error getting all users:', error)
      return []
    }

    return data as User[] || []
  } catch (error) {
    console.error('Error getting all users:', error)
    throw new Error('Failed to get users')
  }
}

export async function getUsersByManager(managerId: string): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('manager_id', managerId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error getting users by manager:', error)
      return []
    }

    return data as User[] || []
  } catch (error) {
    console.error('Error getting users by manager:', error)
    return []
  }
}

export async function createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<string> {
  try {
    // Check if username or email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username, email')
      .or(`username.eq.${userData.username},email.eq.${userData.email}`)
      .limit(1)

    if (checkError) {
      console.error('Error checking existing user:', checkError)
      throw new Error('Failed to check existing user')
    }

    if (existingUser && existingUser.length > 0) {
      if (existingUser[0].username === userData.username) {
        throw new Error('Username already exists')
      }
      if (existingUser[0].email === userData.email) {
        throw new Error('Email already exists')
      }
    }

    // Validate manager_id if provided
    if (userData.manager_id) {
      const { data: managerData, error: managerError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', userData.manager_id)
        .single()

      if (managerError || !managerData) {
        throw new Error('Invalid manager ID')
      }

      if (managerData.role !== 'manager') {
        throw new Error('Manager ID must reference a user with manager role')
      }
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      }])
      .select('id')
      .single()

    if (error) {
      console.error('Error creating user:', error)
      throw new Error('Failed to create user')
    }

    // Initialize leave balance for the new user
    const balanceInitSuccess = await initializeLeaveBalance(data.id)
    if (!balanceInitSuccess) {
      console.warn('⚠️ Failed to initialize leave balance for user:', data.id)
    }

    console.log('✅ User created:', data.id)
    return data.id
  } catch (error) {
    console.error('Error creating user:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to create user')
  }
}

// Authentication function
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  try {
    const user = await getUserByUsername(username)
    if (user && user.password === password) {
      return user
    }
    return null
  } catch (error) {
    console.error('Error authenticating user:', error)
    return null
  }
}

// Leave balance functions
export async function getLeaveBalance(userId: string): Promise<LeaveBalance | null> {
  try {
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error getting leave balance:', error)
      return null
    }

    return data as LeaveBalance
  } catch (error) {
    console.error('Error getting leave balance:', error)
    return null
  }
}

export async function updateLeaveBalance(
  userId: string, 
  leaveType: 'casual_leave' | 'sick_leave' | 'privilege_leave', 
  days: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('leave_balances')
      .update({ 
        [leaveType]: days,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating leave balance:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating leave balance:', error)
    return false
  }
}

// Leave request functions
export async function checkDuplicateLeaveRequest(
  userId: string, 
  startDate: string, 
  endDate: string,
  leaveType?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'approved'])

    if (error) {
      console.error('Error checking duplicate leave request:', error)
      return false
    }

    if (data && data.length > 0) {
      const requestedStart = new Date(startDate)
      const requestedEnd = new Date(endDate)
      
      for (const existingRequest of data) {
        const existingStart = new Date(existingRequest.start_date)
        const existingEnd = new Date(existingRequest.end_date)
        
        if (requestedStart <= existingEnd && requestedEnd >= existingStart) {
          if (leaveType && existingRequest.leave_type === leaveType && 
              startDate === existingRequest.start_date && endDate === existingRequest.end_date) {
            console.log(`🚫 Exact duplicate leave request detected for user ${userId} on dates ${startDate} to ${endDate}`)
            return true
          }
          
          console.log(`⚠️ Overlapping dates detected for user ${userId} on dates ${startDate} to ${endDate}`)
        }
      }
    }

    return false
  } catch (error) {
    console.error('Error checking duplicate leave request:', error)
    return false
  }
}

export async function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status' | 'requested_at'>): Promise<string> {
  try {
    const isDuplicate = await checkDuplicateLeaveRequest(request.user_id, request.start_date, request.end_date, request.leave_type)
    if (isDuplicate) {
      throw new Error('You already have a leave request for these dates. Please check your existing requests.')
    }

    const [userData, managerData] = await Promise.all([
      supabase.from('users').select('username').eq('id', request.user_id).single(),
      getUserManager(request.user_id)
    ])

    if (userData.error || !userData.data) {
      console.error('Error fetching user data:', userData.error)
      throw new Error('Failed to fetch user data')
    }

    const newRequest: LeaveRequest = {
      ...request,
      username: userData.data.username,
      id: crypto.randomUUID(),
      status: 'pending',
      requested_at: new Date().toISOString(),
      manager_name: managerData?.name,
      manager_department: managerData?.department
    }
    
    const { error } = await supabase
      .from('leave_requests')
      .insert([newRequest])

    if (error) {
      console.error('Error creating leave request:', error)
      throw new Error('Failed to create leave request')
    }

    console.log('✅ Leave request saved to Supabase:', newRequest.id)
    return newRequest.id
  } catch (error) {
    console.error('Error creating leave request:', error)
    throw new Error('Failed to create leave request')
  }
}

export async function getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Error getting user leave requests:', error)
      return []
    }

    return data as LeaveRequest[] || []
  } catch (error) {
    console.error('Error getting user leave requests:', error)
    return []
  }
}

export async function getPendingLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Error getting pending leave requests:', error)
      return []
    }

    return data as LeaveRequest[] || []
  } catch (error) {
    console.error('Error getting pending leave requests:', error)
    return []
  }
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Error getting all leave requests:', error)
      return []
    }

    return data as LeaveRequest[] || []
  } catch (error) {
    console.error('Error getting all leave requests:', error)
    return []
  }
}

export async function getLeaveRequestsByManager(managerId: string): Promise<LeaveRequest[]> {
  try {
    const managedUsers = await getUsersByManager(managerId)
    const managedUserIds = managedUsers.map(user => user.id)

    if (managedUserIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .in('user_id', managedUserIds)
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Error getting leave requests by manager:', error)
      return []
    }

    return data as LeaveRequest[] || []
  } catch (error) {
    console.error('Error getting leave requests by manager:', error)
    return []
  }
}

export async function processLeaveRequest(
  requestId: string, 
  status: 'approved' | 'rejected', 
  managerId: string, 
  comments?: string
): Promise<boolean> {
  try {
    const { data: request, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      console.error('Error fetching leave request:', fetchError)
      return false
    }

    const updateData: Partial<LeaveRequest> = {
      status,
      processed_at: new Date().toISOString(),
      processed_by: managerId
    }
    
    if (comments) {
      updateData.comments = comments
    }

    const { error: updateError } = await supabase
      .from('leave_requests')
      .update(updateData)
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating leave request:', updateError)
      return false
    }

    if (status === 'approved') {
      const days = calculateDays(request.start_date, request.end_date, request.is_half_day)
      const leaveBalance = await getLeaveBalance(request.user_id)
      
      if (leaveBalance) {
        const leaveTypeKey = `${request.leave_type}_leave` as 'casual_leave' | 'sick_leave' | 'privilege_leave'
        const currentBalance = leaveBalance[leaveTypeKey]
        
        if (currentBalance >= days) {
          const newBalance = currentBalance - days
          await updateLeaveBalance(request.user_id, leaveTypeKey, newBalance)
          console.log(`✅ Leave request approved: ${requestId}, balance updated`)
        } else {
          console.log(`❌ Insufficient leave balance for ${request.leave_type}`)
          return false
        }
      }
    }

    console.log(`✅ Leave request processed: ${requestId} ${status}`)
    return true
  } catch (error) {
    console.error('Error processing leave request:', error)
    return false
  }
}

export async function cancelLeaveRequest(requestId: string): Promise<boolean> {
  try {
    const { data: request, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      console.error('Error fetching leave request:', fetchError)
      return false
    }

    if (request.status !== 'pending') {
      console.error('Cannot cancel non-pending request')
      return false
    }

    const { error: deleteError } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('Error cancelling leave request:', deleteError)
      return false
    }

    console.log(`✅ Leave request cancelled: ${requestId}`)
    return true
  } catch (error) {
    console.error('Error cancelling leave request:', error)
    return false
  }
}

// Holiday Calendar functions
export async function getHolidayCalendar(country: string, year: number): Promise<HolidayCalendar | null> {
  try {
    const { data, error } = await supabase
      .from('holiday_calendars')
      .select('*')
      .eq('country', country)
      .eq('year', year)
      .single()

    if (error) {
      console.error('Error getting holiday calendar:', error)
      return null
    }

    return data as HolidayCalendar
  } catch (error) {
    console.error('Error getting holiday calendar:', error)
    return null
  }
}

export async function createHolidayCalendar(calendar: Omit<HolidayCalendar, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('holiday_calendars')
      .insert([{
        ...calendar,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id')
      .single()

    if (error) {
      console.error('Error creating holiday calendar:', error)
      return null
    }

    return data.id
  } catch (error) {
    console.error('Error creating holiday calendar:', error)
    return null
  }
}

export async function updateHolidayCalendar(id: string, updates: Partial<HolidayCalendar>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('holiday_calendars')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating holiday calendar:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating holiday calendar:', error)
    return false
  }
}

export async function getHolidaysForPeriod(country: string, startDate: string, endDate: string): Promise<Holiday[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_holidays_for_period', {
        country_param: country,
        start_date: startDate,
        end_date: endDate
      })

    if (error) {
      console.error('Error getting holidays for period:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting holidays for period:', error)
    return []
  }
}

export async function calculateWorkingDays(startDate: string, endDate: string, country: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('calculate_working_days', {
        start_date: startDate,
        end_date: endDate,
        country_param: country
      })

    if (error) {
      console.error('Error calculating working days:', error)
      // Fallback to simple calculation
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }

    return data || 0
  } catch (error) {
    console.error('Error calculating working days:', error)
    // Fallback to simple calculation
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }
}

// Helper functions
export function calculateDays(startDate: string, endDate: string, isHalfDay: boolean = false): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (start.toDateString() === end.toDateString()) {
    return isHalfDay ? 0.5 : 1
  }
  
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (isHalfDay) {
    return Math.max(0.5, diffDays - 0.5)
  }
  
  return diffDays + 1
}

// Initialize database function with sample data
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🚀 Initializing Supabase database...')
    
    // Check if already initialized
    const { data: existingUsers } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Database already initialized')
      return
    }

    // Sample users
    const users = [
      {
        username: 'manager1',
        password: 'manager123',
        name: 'John Manager',
        email: 'manager@company.com',
        role: 'manager' as const,
        department: 'Management',
        country: ''
      },
      {
        username: 'employee1',
        password: 'emp123',
        name: 'Jane Employee',
        email: 'employee@company.com',
        role: 'employee' as const,
        department: 'Engineering',
        country: ''
      }
    ]

    // Insert users (leave balances will be created automatically by trigger)
    for (const userData of users) {
      await createUser(userData)
    }

    console.log('✅ Supabase database initialized with sample data')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  }
} 

export async function initializeLeaveBalance(userId: string): Promise<boolean> {
  try {
    const existingBalance = await getLeaveBalance(userId)
    if (existingBalance) {
      console.log('✅ Leave balance already exists for user:', userId)
      return true
    }

    const { error } = await supabase
      .from('leave_balances')
      .insert([{
        id: crypto.randomUUID(),
        user_id: userId,
        casual_leave: 6,
        sick_leave: 6,
        privilege_leave: 18,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])

    if (error) {
      console.error('Error initializing leave balance:', error)
      return false
    }

    console.log('✅ Leave balance initialized for user:', userId)
    return true
  } catch (error) {
    console.error('Error initializing leave balance:', error)
    return false
  }
}

export async function ensureLeaveBalanceExists(userId: string): Promise<boolean> {
  try {
    const balance = await getLeaveBalance(userId)
    if (balance) {
      return true
    }
    
    return await initializeLeaveBalance(userId)
  } catch (error) {
    console.error('Error ensuring leave balance exists:', error)
    return false
  }
}

export function getTotalAllocatedLeave(): { casual: number; sick: number; privilege: number } {
  return {
    casual: 6,
    sick: 6,
    privilege: 18
  }
} 