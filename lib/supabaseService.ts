import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface Employee {
  id: string
  username: string
  password: string
  name: string
  email: string
  role: 'admin' | 'user'
  department: string
  leaveBalance: {
    casual: number
    sick: number
    privilege: number
  }
  createdAt: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  leaveType: 'casual' | 'sick' | 'privilege'
  startDate: string
  endDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  processedAt?: string
  processedBy?: string
  comments?: string
}

// Employee functions
export async function getEmployeeByUsername(username: string): Promise<Employee | null> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('username', username)
      .single()

    if (error) {
      console.error('Error getting employee by username:', error)
      return null
    }

    return data as Employee
  } catch (error) {
    console.error('Error getting employee by username:', error)
    return null
  }
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error getting employee by ID:', error)
      return null
    }

    return data as Employee
  } catch (error) {
    console.error('Error getting employee by ID:', error)
    return null
  }
}

export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error getting all employees:', error)
      return []
    }

    return data as Employee[] || []
  } catch (error) {
    console.error('Error getting all employees:', error)
    return []
  }
}

// Authentication function
export async function authenticateUser(username: string, password: string): Promise<Employee | null> {
  try {
    const employee = await getEmployeeByUsername(username)
    if (employee && employee.password === password) {
      return employee
    }
    return null
  } catch (error) {
    console.error('Error authenticating user:', error)
    return null
  }
}

// Leave request functions
export async function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status' | 'requestedAt'>): Promise<string> {
  try {
    const newRequest: LeaveRequest = {
      ...request,
      id: `req${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString()
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

export async function getEmployeeLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('employeeId', employeeId)
      .order('requestedAt', { ascending: false })

    if (error) {
      console.error('Error getting employee leave requests:', error)
      return []
    }

    return data as LeaveRequest[] || []
  } catch (error) {
    console.error('Error getting employee leave requests:', error)
    return []
  }
}

export async function getPendingLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requestedAt', { ascending: false })

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
      .order('requestedAt', { ascending: false })

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
  adminUsername: string, 
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
      processedAt: new Date().toISOString(),
      processedBy: adminUsername
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

    // Update employee leave balance if approved
    if (status === 'approved') {
      const employee = await getEmployeeById(request.employeeId)
      if (employee) {
        const days = calculateDays(request.startDate, request.endDate)
        if (employee.leaveBalance[request.leaveType as keyof typeof employee.leaveBalance] >= days) {
          const newBalance = {
            ...employee.leaveBalance,
            [request.leaveType as keyof typeof employee.leaveBalance]: employee.leaveBalance[request.leaveType as keyof typeof employee.leaveBalance] - days
          }

          const { error: balanceError } = await supabase
            .from('employees')
            .update({ leaveBalance: newBalance })
            .eq('id', employee.id)

          if (balanceError) {
            console.error('Error updating leave balance:', balanceError)
            return false
          }

          console.log(`✅ Leave request approved: ${requestId}, balance updated`)
        } else {
          console.log(`❌ Insufficient leave balance for ${request.leaveType}`)
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

export async function getLeaveBalance(employeeId: string) {
  try {
    const employee = await getEmployeeById(employeeId)
    return employee?.leaveBalance || { casual: 0, sick: 0, privilege: 0 }
  } catch (error) {
    console.error('Error getting leave balance:', error)
    return { casual: 0, sick: 0, privilege: 0 }
  }
}

export async function updateLeaveBalance(employeeId: string, leaveType: keyof Employee['leaveBalance'], days: number) {
  try {
    const employee = await getEmployeeById(employeeId)
    if (employee) {
      const newBalance = {
        ...employee.leaveBalance,
        [leaveType]: Math.max(0, employee.leaveBalance[leaveType] + days)
      }

      const { error } = await supabase
        .from('employees')
        .update({ leaveBalance: newBalance })
        .eq('id', employeeId)

      if (error) {
        console.error('Error updating leave balance:', error)
      }
    }
  } catch (error) {
    console.error('Error updating leave balance:', error)
  }
}

// Initialize database function with sample data
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🚀 Initializing Supabase database...')
    
    // Check if already initialized
    const { data: existingEmployees } = await supabase
      .from('employees')
      .select('count')
      .limit(1)

    if (existingEmployees && existingEmployees.length > 0) {
      console.log('✅ Database already initialized')
      return
    }

    // Sample employees
    const employees: Employee[] = [
      {
        id: 'emp001',
        username: 'admin',
        password: 'admin123',
        name: 'Admin User',
        email: 'admin@company.com',
        role: 'admin',
        department: 'Management',
        leaveBalance: { casual: 15, sick: 20, privilege: 25 },
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'emp002',
        username: 'john',
        password: 'john123',
        name: 'John Doe',
        email: 'john@company.com',
        role: 'user',
        department: 'Engineering',
        leaveBalance: { casual: 12, sick: 15, privilege: 21 },
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'emp003',
        username: 'sarah',
        password: 'sarah123',
        name: 'Sarah Wilson',
        email: 'sarah@company.com',
        role: 'user',
        department: 'Marketing',
        leaveBalance: { casual: 10, sick: 12, privilege: 18 },
        createdAt: '2024-01-01T00:00:00Z'
      }
    ]

    // Insert employees
    const { error: employeeError } = await supabase
      .from('employees')
      .insert(employees)

    if (employeeError) {
      console.error('Error inserting employees:', employeeError)
      throw employeeError
    }

    // Sample leave request
    const sampleRequest: LeaveRequest = {
      id: 'req001',
      employeeId: 'emp002',
      employeeName: 'John Doe',
      leaveType: 'casual',
      startDate: '2024-08-27',
      endDate: '2024-08-28',
      reason: 'Personal appointment',
      status: 'approved',
      requestedAt: '2024-08-20T10:00:00Z',
      processedAt: '2024-08-21T14:30:00Z',
      processedBy: 'admin',
      comments: 'Approved - within policy'
    }

    const { error: requestError } = await supabase
      .from('leave_requests')
      .insert([sampleRequest])

    if (requestError) {
      console.error('Error inserting sample request:', requestError)
      throw requestError
    }

    console.log('✅ Supabase database initialized with sample data')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  }
} 