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
  leave_type: 'casual' | 'sick' | 'privilege'
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  processed_at?: string
  processed_by?: string
  comments?: string
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting all users:', error)
      return []
    }

    return data as User[] || []
  } catch (error) {
    console.error('Error getting all users:', error)
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

    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select('id')
      .single()

    if (error) {
      console.error('Error creating user:', error)
      throw new Error('Failed to create user')
    }

    console.log('✅ User created:', data.id)
    return data.id
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
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
export async function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status' | 'requested_at'>): Promise<string> {
  try {
    const newRequest: LeaveRequest = {
      ...request,
      id: crypto.randomUUID(),
      status: 'pending',
      requested_at: new Date().toISOString()
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
      const days = calculateDays(request.start_date, request.end_date)
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
export function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
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