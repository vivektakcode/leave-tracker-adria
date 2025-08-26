import { kv } from '@vercel/kv'

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
    const employee = await kv.get(`employee:${username}`)
    return employee as Employee || null
  } catch (error) {
    console.error('Error getting employee by username:', error)
    return null
  }
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const employee = await kv.get(`employee:${id}`)
    return employee as Employee || null
  } catch (error) {
    console.error('Error getting employee by ID:', error)
    return null
  }
}

export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const employeeKeys = await kv.keys('employee:*')
    const employees = await Promise.all(
      employeeKeys.map(key => kv.get(key))
    )
    return employees.filter(Boolean) as Employee[]
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
    
    await kv.set(`leave_request:${newRequest.id}`, newRequest)
    
    // Add to employee's requests list
    const employeeRequests = await kv.get(`employee_requests:${request.employeeId}`) as string[] || []
    employeeRequests.push(newRequest.id)
    await kv.set(`employee_requests:${request.employeeId}`, employeeRequests)
    
    // Add to pending requests list
    const pendingRequests = await kv.get('pending_requests') as string[] || []
    pendingRequests.push(newRequest.id)
    await kv.set('pending_requests', pendingRequests)
    
    console.log('✅ Leave request saved to Vercel KV:', newRequest.id)
    return newRequest.id
  } catch (error) {
    console.error('Error creating leave request:', error)
    throw new Error('Failed to create leave request')
  }
}

export async function getEmployeeLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
  try {
    const requestIds = await kv.get(`employee_requests:${employeeId}`) as string[] || []
    const requests = await Promise.all(
      requestIds.map(id => kv.get(`leave_request:${id}`))
    )
    return requests.filter(Boolean) as LeaveRequest[]
  } catch (error) {
    console.error('Error getting employee leave requests:', error)
    return []
  }
}

export async function getPendingLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const requestIds = await kv.get('pending_requests') as string[] || []
    const requests = await Promise.all(
      requestIds.map(id => kv.get(`leave_request:${id}`))
    )
    return requests.filter(Boolean) as LeaveRequest[]
  } catch (error) {
    console.error('Error getting pending leave requests:', error)
    return []
  }
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const requestKeys = await kv.keys('leave_request:*')
    const requests = await Promise.all(
      requestKeys.map(key => kv.get(key))
    )
    return requests.filter(Boolean) as LeaveRequest[]
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
    const request = await kv.get(`leave_request:${requestId}`) as LeaveRequest
    if (!request) return false

    request.status = status
    request.processedAt = new Date().toISOString()
    request.processedBy = adminUsername
    if (comments) request.comments = comments

    // Update leave request in KV
    await kv.set(`leave_request:${requestId}`, request)

    // Update employee leave balance if approved
    if (status === 'approved') {
      const employee = await getEmployeeById(request.employeeId)
      if (employee) {
        const days = calculateDays(request.startDate, request.endDate)
        if (employee.leaveBalance[request.leaveType] >= days) {
          employee.leaveBalance[request.leaveType] -= days
          await kv.set(`employee:${employee.id}`, employee)
          console.log(`✅ Leave request approved: ${requestId}, balance updated`)
        } else {
          console.log(`❌ Insufficient leave balance for ${request.leaveType}`)
          return false
        }
      }
    }

    // Remove from pending requests if processed
    if (status === 'approved' || status === 'rejected') {
      const pendingRequests = await kv.get('pending_requests') as string[] || []
      const updatedPending = pendingRequests.filter(id => id !== requestId)
      await kv.set('pending_requests', updatedPending)
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
      employee.leaveBalance[leaveType] = Math.max(0, employee.leaveBalance[leaveType] + days)
      await kv.set(`employee:${employee.id}`, employee)
    }
  } catch (error) {
    console.error('Error updating leave balance:', error)
  }
}

// Initialize database function with sample data
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('🚀 Initializing Vercel KV database...')
    
    // Check if already initialized
    const isInitialized = await kv.get('db_initialized')
    if (isInitialized) {
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

    // Store employees
    for (const employee of employees) {
      await kv.set(`employee:${employee.username}`, employee)
      await kv.set(`employee:${employee.id}`, employee)
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

    await kv.set(`leave_request:${sampleRequest.id}`, sampleRequest)
    await kv.set(`employee_requests:${sampleRequest.employeeId}`, [sampleRequest.id])
    await kv.set('pending_requests', [])
    await kv.set('db_initialized', true)

    console.log('✅ Vercel KV database initialized with sample data')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  }
} 