import { createClient } from '@supabase/supabase-js'
import { getWorkingDaysBetween } from '../utils/dateUtils'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface User {
  id: string
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
  last_reminder_sent?: string
  reminder_count?: number
  // Derived fields (from view)
  username?: string
  manager_name?: string | null
  manager_department?: string | null
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
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase().trim()
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalizedEmail)
      .single()

    if (error) {
      console.error('Error getting user by email:', error)
      return null
    }

    return data as User
  } catch (error) {
    console.error('Error getting user by email:', error)
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

    // Then get the manager details
    const { data: managerData, error: managerError } = await supabase
      .from('users')
      .select('id, name, email, department, role, country, created_at')
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
    // Normalize email to lowercase for case-insensitive storage and comparison
    const normalizedEmail = userData.email.toLowerCase().trim()
    
    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', normalizedEmail)
      .limit(1)

    if (checkError) {
      console.error('Error checking existing user:', checkError)
      throw new Error('Failed to check existing user')
    }

    if (existingUser && existingUser.length > 0) {
      throw new Error('Email already exists')
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

      if (managerData.role !== 'manager' && managerData.role !== 'hr') {
        throw new Error('Manager ID must reference a user with manager or HR role')
      }
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        email: normalizedEmail, // Use normalized email
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      }])
      .select('id')
      .single()

    if (error) {
      console.error('Error creating user:', error)
      
      // Provide more specific error messages based on the error type
      if (error.code === '22P02') {
        throw new Error(`Invalid data format: ${error.message}. Please check that all fields are properly formatted.`)
      } else if (error.code === '23505') {
        throw new Error('Email already exists. Please use a different email address.')
      } else if (error.code === '23503') {
        throw new Error('Invalid manager reference. Please select a valid manager.')
      } else {
        throw new Error(`Database error: ${error.message || 'Failed to create user'}`)
      }
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
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const user = await getUserByEmail(email)
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
    // Ultra-optimized query: minimal fields, indexed lookup, single result
    const { data, error } = await supabase
      .from('leave_balances')
      .select('casual_leave, sick_leave, privilege_leave')
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
    // Optimized query: Only fetch requests that could potentially overlap
    // Use date range to limit results instead of fetching all user requests
    const { data, error } = await supabase
      .from('leave_requests')
      .select('id, start_date, end_date, leave_type, status')
      .eq('user_id', userId)
      .gte('end_date', startDate) // Only get requests that end on or after our start date
      .lte('start_date', endDate) // Only get requests that start on or before our end date
      .in('status', ['pending', 'approved']) // Only check active requests

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
        
        // Check for exact duplicate first (most common case)
        if (leaveType && existingRequest.leave_type === leaveType && 
            startDate === existingRequest.start_date && endDate === existingRequest.end_date) {
          console.log(`🚫 Exact duplicate leave request detected for user ${userId} on dates ${startDate} to ${endDate}`)
          return true
        }
        
        // Check for overlapping dates
        if (requestedStart <= existingEnd && requestedEnd >= existingStart) {
          console.log(`⚠️ Overlapping dates detected for user ${userId} on dates ${startDate} to ${endDate}`)
          return true
        }
      }
    }

    return false
  } catch (error) {
    console.error('Error checking duplicate leave request:', error)
    return false
  }
}

export async function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'username' | 'status' | 'requested_at'>): Promise<string> {
  try {
    console.log('🔍 Creating leave request for user:', request.user_id)
    
    // Optimized: Run duplicate check, user lookup, and manager lookup in parallel
    const [isDuplicate, userData, managerData] = await Promise.all([
      checkDuplicateLeaveRequest(request.user_id, request.start_date, request.end_date, request.leave_type),
      getUserById(request.user_id),
      getUserManager(request.user_id)
    ])
    
    if (isDuplicate) {
      throw new Error('You already have a leave request for these dates. Please check your existing requests.')
    }

    if (!userData) {
      throw new Error('User not found')
    }
    
    console.log('🔍 Manager lookup result:', managerData ? { name: managerData.name, email: managerData.email, role: managerData.role } : 'No manager found')

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
      
      // Provide more specific error messages
      if (error.code === '22P02') {
        throw new Error(`Invalid data format: ${error.message}. Please check that all fields are properly formatted.`)
      } else if (error.code === '23505') {
        throw new Error('Duplicate leave request detected. Please check your existing requests.')
      } else if (error.code === '23503') {
        throw new Error('Invalid user or manager reference. Please contact support.')
      } else {
        throw new Error(`Database error: ${error.message || 'Failed to create leave request'}`)
      }
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
    // Use the view that includes derived manager information
    const { data, error } = await supabase
      .from('leave_requests_with_details')
      .select('id, user_id, leave_type, start_date, end_date, reason, status, requested_at, is_half_day, manager_name, manager_department')
      .eq('user_id', userId)
      .order('requested_at', { ascending: false })
      .limit(10) // Reduced limit for dashboard - only show recent requests

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
      .from('leave_requests_with_details')
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
      .from('leave_requests_with_details')
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

export async function getLeaveRequestsByManager(managerId: string): Promise<any[]> {
  try {
    const managedUsers = await getUsersByManager(managerId)
    const managedUserIds = managedUsers.map(user => user.id)

    if (managedUserIds.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        users!leave_requests_user_id_fkey (
          name,
          email,
          department
        )
      `)
      .in('user_id', managedUserIds)
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Error getting leave requests by manager:', error)
      return []
    }

    return data || []
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
    // Direct delete with status check in one query
    const { error: deleteError } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', requestId)
      .eq('status', 'pending') // Only delete pending requests

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

export async function updateLeaveRequest(requestId: string, updateData: Partial<LeaveRequest>): Promise<boolean> {
  try {
    console.log('🔍 Updating leave request:', requestId)
    
    const { data: existingRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('id, status, user_id')
      .eq('id', requestId)
      .single()

    if (fetchError || !existingRequest) {
      throw new Error('Leave request not found')
    }

    if (existingRequest.status !== 'pending') {
      throw new Error('Only pending leave requests can be modified')
    }

    const { error } = await supabase
      .from('leave_requests')
      .update({
        leave_type: updateData.leave_type,
        start_date: updateData.start_date,
        end_date: updateData.end_date,
        reason: updateData.reason,
        is_half_day: updateData.is_half_day,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) {
      console.error('Error updating leave request:', error)
      throw new Error(`Database error: ${error.message || 'Failed to update leave request'}`)
    }

    console.log('✅ Leave request updated successfully:', requestId)
    return true
  } catch (error) {
    console.error('Error updating leave request:', error)
    throw new Error('Failed to update leave request')
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

export async function deleteHolidayCalendar(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('holiday_calendars')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting holiday calendar:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting holiday calendar:', error)
    return false
  }
}

export async function getAllHolidayCalendars(): Promise<HolidayCalendar[]> {
  try {
    const { data, error } = await supabase
      .from('holiday_calendars')
      .select('*')
      .order('country', { ascending: true })
      .order('year', { ascending: false })

    if (error) {
      console.error('Error getting all holiday calendars:', error)
      return []
    }

    return data as HolidayCalendar[]
  } catch (error) {
    console.error('Error getting all holiday calendars:', error)
    return []
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<boolean> {
  try {
    // Normalize email if it's being updated
    const normalizedUpdates = {
      ...updates,
      ...(updates.email && { email: updates.email.toLowerCase().trim() })
    }
    
    const { error } = await supabase
      .from('users')
      .update(normalizedUpdates)
      .eq('id', userId)

    if (error) {
      console.error('Error updating user:', error)
      
      // Provide more specific error messages
      if (error.code === '22P02') {
        throw new Error(`Invalid data format: ${error.message}. Please check that all fields are properly formatted.`)
      } else if (error.code === '23505') {
        throw new Error('Email already exists. Please use a different email address.')
      } else if (error.code === '23503') {
        throw new Error('Invalid manager reference. Please select a valid manager.')
      } else {
        throw new Error(`Database error: ${error.message || 'Failed to update user'}`)
      }
    }

    return true
  } catch (error) {
    console.error('Error updating user:', error)
    return false
  }
}

// Reassign pending leave requests when manager changes
export async function reassignLeaveRequestsToNewManager(
  userId: string, 
  newManagerId: string | undefined, 
  oldManagerId: string | undefined
): Promise<number> {
  try {
    // Get pending leave requests for this user
    const { data: pendingRequests, error: fetchError } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (fetchError) {
      console.error('Error fetching pending leave requests:', fetchError)
      return 0
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return 0
    }

    // Get new manager info if provided
    let newManagerInfo = null
    if (newManagerId) {
      const { data: managerData, error: managerError } = await supabase
        .from('users')
        .select('name, department')
        .eq('id', newManagerId)
        .single()

      if (managerError) {
        console.error('Error fetching new manager info:', managerError)
      } else {
        newManagerInfo = managerData
      }
    }

    // Update all pending requests with new manager info
    const { error: updateError } = await supabase
      .from('leave_requests')
      .update({
        manager_name: newManagerInfo?.name || null,
        manager_department: newManagerInfo?.department || null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (updateError) {
      console.error('Error updating leave requests:', updateError)
      return 0
    }

    // Send notification to user about manager change
    if (newManagerId && newManagerInfo) {
      try {
        const { sendManagerChangeNotification } = await import('./emailService')
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', userId)
          .single()

        if (userData) {
          await sendManagerChangeNotification(
            userData.email,
            userData.name,
            newManagerInfo.name,
            newManagerInfo.department
          )
        }
      } catch (emailError) {
        console.error('Error sending manager change notification:', emailError)
        // Don't fail the reassignment if email fails
      }
    }

    console.log(`✅ Reassigned ${pendingRequests.length} pending leave requests for user ${userId}`)
    return pendingRequests.length
  } catch (error) {
    console.error('Error reassigning leave requests:', error)
    return 0
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
  
  // For different dates, calculate working days (excluding weekends)
  const workingDays = getWorkingDaysBetween(startDate, endDate)
  
  if (isHalfDay) {
    return Math.max(0.5, workingDays - 0.5)
  }
  
  return workingDays
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
        password: 'manager123',
        name: 'John Manager',
        email: 'manager@company.com',
        role: 'manager' as const,
        department: 'Management',
        country: ''
      },
      {
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

// Ultra-fast dashboard data loading with optimized queries
export async function getDashboardData(userId: string): Promise<{
  leaveBalance: LeaveBalance | null;
  leaveRequests: LeaveRequest[];
  balanceExists: boolean;
}> {
  try {
    console.log('⚡ Loading dashboard data in parallel...')
    const startTime = Date.now()
    
    // Optimized: Load leave balance and requests in parallel, skip balance check if balance exists
    const [leaveBalance, leaveRequests] = await Promise.all([
      getLeaveBalance(userId),
      getUserLeaveRequests(userId)
    ])
    
    // Only check balance existence if no balance found (avoid unnecessary query)
    const balanceExists = leaveBalance ? true : await ensureLeaveBalanceExists(userId)
    
    const endTime = Date.now()
    console.log(`⚡ Dashboard data loaded in ${endTime - startTime}ms`)
    
    return {
      leaveBalance,
      leaveRequests,
      balanceExists
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    return {
      leaveBalance: null,
      leaveRequests: [],
      balanceExists: false
    }
  }
} 

// Auto-approval logic for leave requests
export function shouldAutoApproveLeave(
  startDate: string, 
  endDate: string, 
  leaveType: string, 
  numberOfDays: number
): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // ONLY auto-approve if dates are in the past
  if (start < today) {
    // Auto-approve casual and privilege leave for past dates
    if (leaveType === 'casual' || leaveType === 'privilege') {
      return true
    }
    
    // Sick leave ALWAYS requires manager approval regardless of number of days
    // This ensures proper verification of medical documentation and sick leave policies
    if (leaveType === 'sick') {
      return false // Manager must review and verify medical document
    }
  }
  
  // For future dates, NEVER auto-approve - manager must review
  return false
}

// Get pending leave requests that need reminders
export async function getPendingLeaveRequestsForReminders(): Promise<any[]> {
  try {
    const now = new Date()
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    // Get requests that need reminders:
    // 1. Status is pending
    // 2. Requested more than 3 days ago
    // 3. Either no reminder sent yet, or last reminder was more than 3 days ago
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        users!leave_requests_user_id_fkey (
          name,
          email,
          manager_id
        ),
        managers:users!leave_requests_processed_by_fkey (
          name,
          email
        )
      `)
      .eq('status', 'pending')
      .lt('requested_at', threeDaysAgo.toISOString())
      .is('processed_at', null)
      .or(`last_reminder_sent.is.null,last_reminder_sent.lt.${threeDaysAgo.toISOString()}`)

    if (error) {
      console.error('Error getting pending leave requests for reminders:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error getting pending leave requests for reminders:', error)
    return []
  }
}

// Send leave reminders to managers
export async function sendLeaveReminders(): Promise<void> {
  try {
    const pendingRequests = await getPendingLeaveRequestsForReminders()
    
    for (const request of pendingRequests) {
      if (request.users?.manager_id) {
        const manager = await getUserById(request.users.manager_id)
        if (manager) {
          const daysPending = Math.floor(
            (new Date().getTime() - new Date(request.requested_at).getTime()) / (1000 * 60 * 60 * 24)
          )
          
          // Import email service dynamically to avoid circular dependencies
          const { sendLeaveReminderEmail } = await import('./emailService')
          
          const emailSent = await sendLeaveReminderEmail(
            manager.email,
            manager.name,
            request.users.name,
            request.start_date,
            request.end_date,
            daysPending
          )
          
          // Update reminder tracking if email was sent successfully
          if (emailSent) {
            const newReminderCount = (request.reminder_count || 0) + 1
            
            await supabase
              .from('leave_requests')
              .update({
                last_reminder_sent: new Date().toISOString(),
                reminder_count: newReminderCount
              })
              .eq('id', request.id)
              
            console.log(`📧 Sent reminder #${newReminderCount} for request ${request.id}`)
          }
        }
      }
    }
    
    console.log(`✅ Sent ${pendingRequests.length} leave reminders`)
  } catch (error) {
    console.error('Error sending leave reminders:', error)
  }
}

// Auto-approve eligible leave requests
export async function autoApproveEligibleLeaves(): Promise<void> {
  try {
    const { data: pendingRequests, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        users!leave_requests_user_id_fkey (
          name,
          email
        )
      `)
      .eq('status', 'pending')
      .is('processed_at', null)

    if (error) {
      console.error('Error getting pending leave requests for auto-approval:', error)
      return
    }

    for (const request of pendingRequests) {
      const numberOfDays = calculateDays(request.start_date, request.end_date, request.is_half_day)
      
      if (shouldAutoApproveLeave(request.start_date, request.end_date, request.leave_type, numberOfDays)) {
        // Auto-approve the request
        const { error: updateError } = await supabase
          .from('leave_requests')
          .update({
            status: 'approved',
            processed_at: new Date().toISOString(),
            processed_by: request.user_id, // Self-approved
            comments: 'Auto-approved based on system rules'
          })
          .eq('id', request.id)

        if (updateError) {
          console.error('Error auto-approving leave request:', updateError)
        } else {
          console.log(`✅ Auto-approved leave request ${request.id} for ${request.users.name}`)
          
          // Update leave balance
          await updateLeaveBalanceAfterApproval(request.user_id, request.leave_type, numberOfDays)
        }
      }
    }
  } catch (error) {
    console.error('Error auto-approving eligible leaves:', error)
  }
}

// Update leave balance after approval
async function updateLeaveBalanceAfterApproval(userId: string, leaveType: string, numberOfDays: number): Promise<void> {
  try {
    const { data: balance, error: fetchError } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError || !balance) {
      console.error('Error fetching leave balance for auto-approval:', fetchError)
      return
    }

    const fieldMap = {
      casual: 'casual_leave',
      sick: 'sick_leave',
      privilege: 'privilege_leave'
    }

    const field = fieldMap[leaveType as keyof typeof fieldMap]
    if (!field) return

    const newBalance = Math.max(0, balance[field] - numberOfDays)

    const { error: updateError } = await supabase
      .from('leave_balances')
      .update({
        [field]: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating leave balance after auto-approval:', updateError)
    }
  } catch (error) {
    console.error('Error updating leave balance after auto-approval:', error)
  }
} 