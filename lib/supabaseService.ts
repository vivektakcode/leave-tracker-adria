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
  role: 'manager' | 'employee'
  department: string
  manager_id?: string  // Added manager relationship
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
  username?: string  // Added username field
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
  // Manager information
  manager_name?: string
  manager_department?: string
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
    // First get the user to find their manager_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('manager_id')
      .eq('id', userId)
      .single()

    if (userError || !userData || !userData.manager_id) {
      return null
    }

    // Then get the manager's details
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
      // Don't fail the user creation, just log a warning
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
    // Check if there are any existing leave requests (pending or approved) 
    // that overlap with the requested date range
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'approved'])

    if (error) {
      console.error('Error checking duplicate leave request:', error)
      return false
    }

    // Check for overlapping dates manually since Supabase OR syntax can be tricky
    if (data && data.length > 0) {
      const requestedStart = new Date(startDate)
      const requestedEnd = new Date(endDate)
      
      for (const existingRequest of data) {
        const existingStart = new Date(existingRequest.start_date)
        const existingEnd = new Date(existingRequest.end_date)
        
        // Check if dates overlap: 
        // (requestedStart <= existingEnd) AND (requestedEnd >= existingStart)
        if (requestedStart <= existingEnd && requestedEnd >= existingStart) {
          // If it's the same leave type on the same day, it's definitely a duplicate
          if (leaveType && existingRequest.leave_type === leaveType && 
              startDate === existingRequest.start_date && endDate === existingRequest.end_date) {
            console.log(`🚫 Exact duplicate leave request detected for user ${userId} on dates ${startDate} to ${endDate}`)
            console.log('Existing overlapping request:', existingRequest)
            return true
          }
          
          // For overlapping dates with different leave types, we'll allow it but log a warning
          console.log(`⚠️ Overlapping dates detected for user ${userId} on dates ${startDate} to ${endDate}`)
          console.log('Existing overlapping request:', existingRequest)
          console.log('This might be intentional (e.g., different leave types on same day)')
          // Don't block the request, just warn
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
    // Check for duplicate leave requests first
    const isDuplicate = await checkDuplicateLeaveRequest(request.user_id, request.start_date, request.end_date, request.leave_type)
    if (isDuplicate) {
      throw new Error('You already have a leave request for these dates. Please check your existing requests.')
    }

    // Get user and manager information
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
      // Add manager information
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
    // First get all users managed by this manager
    const managedUsers = await getUsersByManager(managerId)
    const managedUserIds = managedUsers.map(user => user.id)

    if (managedUserIds.length === 0) {
      return []
    }

    // Then get leave requests for those users
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
    // Get the current request
    const { data: request, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      console.error('Error fetching leave request:', fetchError)
      return false
    }

    // Update the request
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

    // Update user leave balance if approved
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

// Helper functions
export function calculateDays(startDate: string, endDate: string, isHalfDay: boolean = false): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // If same day, it's 1 day (or 0.5 if half day)
  if (start.toDateString() === end.toDateString()) {
    return isHalfDay ? 0.5 : 1
  }
  
  // For different dates, calculate the difference
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // If half day, reduce by 0.5
  if (isHalfDay) {
    return Math.max(0.5, diffDays - 0.5)
  }
  
  return diffDays + 1 // Include both start and end dates
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
        department: 'Management'
      },
      {
        username: 'employee1',
        password: 'emp123',
        name: 'Jane Employee',
        email: 'employee@company.com',
        role: 'employee' as const,
        department: 'Engineering'
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
    // Check if leave balance already exists
    const existingBalance = await getLeaveBalance(userId)
    if (existingBalance) {
      console.log('✅ Leave balance already exists for user:', userId)
      return true
    }

    // Create new leave balance with default values
    const { error } = await supabase
      .from('leave_balances')
      .insert([{
        id: crypto.randomUUID(),
        user_id: userId,
        casual_leave: 6,      // Default 6 days
        sick_leave: 6,        // Default 6 days
        privilege_leave: 18,  // Default 18 days
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
    
    // If no balance exists, create one with default values
    return await initializeLeaveBalance(userId)
  } catch (error) {
    console.error('Error ensuring leave balance exists:', error)
    return false
  }
}

export function getTotalAllocatedLeave(): { casual: number; sick: number; privilege: number } {
  return {
    casual: 6,      // Default 6 days
    sick: 6,        // Default 6 days
    privilege: 18   // Default 18 days
  }
} 