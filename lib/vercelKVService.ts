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

// Key prefixes for Vercel KV
const KEYS = {
  EMPLOYEE: 'employee',
  LEAVE_REQUEST: 'leave_request',
  LEAVE_BALANCE: 'leave_balance'
} as const

/**
 * Initialize the database with sample data
 */
export async function initializeDatabase() {
  try {
    // Check if data already exists
    const existingEmployees = await kv.keys(`${KEYS.EMPLOYEE}:*`)
    if (existingEmployees.length > 0) {
      console.log('✅ Database already initialized')
      return
    }

    console.log('🚀 Initializing database with sample data...')

    // Sample employees data
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
      },
      {
        id: 'emp004',
        username: 'mike',
        password: 'mike123',
        name: 'Mike Johnson',
        email: 'mike@company.com',
        role: 'user',
        department: 'Sales',
        leaveBalance: { casual: 8, sick: 10, privilege: 15 },
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'emp005',
        username: 'emma',
        password: 'emma123',
        name: 'Emma Davis',
        email: 'emma@company.com',
        role: 'user',
        department: 'HR',
        leaveBalance: { casual: 11, sick: 14, privilege: 20 },
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'emp006',
        username: 'alex',
        password: 'alex123',
        name: 'Alex Brown',
        email: 'alex@company.com',
        role: 'user',
        department: 'Finance',
        leaveBalance: { casual: 9, sick: 11, privilege: 16 },
        createdAt: '2024-01-01T00:00:00Z'
      }
    ]

    // Store employees
    for (const employee of employees) {
      await kv.set(`${KEYS.EMPLOYEE}:${employee.id}`, employee)
      await kv.set(`${KEYS.LEAVE_BALANCE}:${employee.id}`, employee.leaveBalance)
    }

    // Sample leave requests
    const leaveRequests: LeaveRequest[] = [
      {
        id: 'req001',
        employeeId: 'emp002',
        employeeName: 'John Doe',
        leaveType: 'casual',
        startDate: '2024-01-15',
        endDate: '2024-01-17',
        reason: 'Personal work and family time',
        status: 'approved',
        requestedAt: '2024-01-10T10:00:00Z',
        processedAt: '2024-01-19T14:30:00Z',
        processedBy: 'admin',
        comments: 'Approved - Enjoy your time!'
      },
      {
        id: 'req002',
        employeeId: 'emp003',
        employeeName: 'Sarah Wilson',
        leaveType: 'sick',
        startDate: '2024-01-20',
        endDate: '2024-01-22',
        reason: 'Not feeling well, need rest',
        status: 'approved',
        requestedAt: '2024-01-18T09:00:00Z',
        processedAt: '2024-01-19T14:30:00Z',
        processedBy: 'admin',
        comments: 'Approved - Get well soon!'
      },
      {
        id: 'req003',
        employeeId: 'emp004',
        employeeName: 'Mike Johnson',
        leaveType: 'privilege',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        reason: 'Annual vacation with family',
        status: 'pending',
        requestedAt: '2024-01-25T11:00:00Z'
      }
    ]

    // Store leave requests
    for (const request of leaveRequests) {
      await kv.set(`${KEYS.LEAVE_REQUEST}:${request.id}`, request)
    }

    console.log('✅ Database initialized successfully!')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  }
}

/**
 * Authenticate user with username and password
 */
export async function authenticateUser(username: string, password: string): Promise<Employee | null> {
  try {
    const employeeKeys = await kv.keys(`${KEYS.EMPLOYEE}:*`)
    
    for (const key of employeeKeys) {
      const employee = await kv.get(key) as Employee
      if (employee.username === username && employee.password === password) {
        console.log('✅ User authenticated:', employee.name, 'Role:', employee.role)
        return employee
      }
    }
    
    console.log('❌ Authentication failed for username:', username)
    return null
  } catch (error) {
    console.error('❌ Error during authentication:', error)
    return null
  }
}

/**
 * Get employee by username
 */
export async function getEmployeeByUsername(username: string): Promise<Employee | null> {
  try {
    const employeeKeys = await kv.keys(`${KEYS.EMPLOYEE}:*`)
    
    for (const key of employeeKeys) {
      const employee = await kv.get(key) as Employee
      if (employee.username === username) {
        return employee
      }
    }
    
    return null
  } catch (error) {
    console.error('❌ Error getting employee by username:', error)
    return null
  }
}

/**
 * Get employee by ID
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  try {
    const employee = await kv.get(`${KEYS.EMPLOYEE}:${id}`) as Employee
    return employee || null
  } catch (error) {
    console.error('❌ Error getting employee by ID:', error)
    return null
  }
}

/**
 * Get all employees (admin only)
 */
export async function getAllEmployees(): Promise<Employee[]> {
  try {
    const employeeKeys = await kv.keys(`${KEYS.EMPLOYEE}:*`)
    const employees = await Promise.all(
      employeeKeys.map(key => kv.get(key))
    ) as Employee[]
    
    // Hide passwords
    return employees.map(emp => ({
      ...emp,
      password: '***'
    }))
  } catch (error) {
    console.error('❌ Error getting all employees:', error)
    return []
  }
}

/**
 * Create a new leave request
 */
export async function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'requestedAt' | 'status'>): Promise<string> {
  try {
    const id = `req${Date.now()}`
    const newRequest: LeaveRequest = {
      ...request,
      id,
      status: 'pending',
      requestedAt: new Date().toISOString()
    }
    
    await kv.set(`${KEYS.LEAVE_REQUEST}:${id}`, newRequest)
    console.log('✅ Leave request created:', id)
    
    return id
  } catch (error) {
    console.error('❌ Error creating leave request:', error)
    throw error
  }
}

/**
 * Get leave requests for a specific employee
 */
export async function getEmployeeLeaveRequests(employeeId: string): Promise<LeaveRequest[]> {
  try {
    const requestKeys = await kv.keys(`${KEYS.LEAVE_REQUEST}:*`)
    const requests = await Promise.all(
      requestKeys.map(key => kv.get(key))
    ) as LeaveRequest[]
    
    return requests.filter(req => req.employeeId === employeeId)
  } catch (error) {
    console.error('❌ Error getting employee leave requests:', error)
    return []
  }
}

/**
 * Get all pending leave requests (admin only)
 */
export async function getPendingLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const requestKeys = await kv.keys(`${KEYS.LEAVE_REQUEST}:*`)
    const requests = await Promise.all(
      requestKeys.map(key => kv.get(key))
    ) as LeaveRequest[]
    
    return requests.filter(req => req.status === 'pending')
  } catch (error) {
    console.error('❌ Error getting pending leave requests:', error)
    return []
  }
}

/**
 * Get all leave requests (admin only)
 */
export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  try {
    const requestKeys = await kv.keys(`${KEYS.LEAVE_REQUEST}:*`)
    const requests = await Promise.all(
      requestKeys.map(key => kv.get(key))
    ) as LeaveRequest[]
    
    return requests
  } catch (error) {
    console.error('❌ Error getting all leave requests:', error)
    return []
  }
}

/**
 * Approve or reject a leave request (admin only)
 */
export async function processLeaveRequest(
  requestId: string, 
  status: 'approved' | 'rejected', 
  adminUsername: string,
  comments?: string
): Promise<boolean> {
  try {
    const request = await kv.get(`${KEYS.LEAVE_REQUEST}:${requestId}`) as LeaveRequest
    
    if (!request) {
      console.log('❌ Leave request not found:', requestId)
      return false
    }
    
    if (status === 'approved') {
      // Update leave balance
      const employee = await getEmployeeById(request.employeeId)
      if (employee) {
        const days = calculateDays(request.startDate, request.endDate)
        employee.leaveBalance[request.leaveType] -= days
        
        // Update employee leave balance
        await kv.set(`${KEYS.EMPLOYEE}:${employee.id}`, employee)
        await kv.set(`${KEYS.LEAVE_BALANCE}:${employee.id}`, employee.leaveBalance)
        
        console.log(`✅ Leave approved. ${request.leaveType} balance reduced by ${days} days`)
      }
    }
    
    // Update request status
    const updatedRequest: LeaveRequest = {
      ...request,
      status,
      processedAt: new Date().toISOString(),
      processedBy: adminUsername,
      comments: comments || undefined
    }
    
    await kv.set(`${KEYS.LEAVE_REQUEST}:${requestId}`, updatedRequest)
    console.log(`✅ Leave request ${status}:`, requestId)
    
    return true
  } catch (error) {
    console.error('❌ Error processing leave request:', error)
    return false
  }
}

/**
 * Calculate days between two dates
 */
function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Include both start and end dates
}

/**
 * Get leave balance for an employee
 */
export async function getLeaveBalance(employeeId: string) {
  try {
    const balance = await kv.get(`${KEYS.LEAVE_BALANCE}:${employeeId}`)
    return balance || { casual: 0, sick: 0, privilege: 0 }
  } catch (error) {
    console.error('❌ Error getting leave balance:', error)
    return { casual: 0, sick: 0, privilege: 0 }
  }
}

/**
 * Update leave balance (for testing or manual adjustments)
 */
export async function updateLeaveBalance(
  employeeId: string, 
  leaveType: keyof Employee['leaveBalance'], 
  newBalance: number
): Promise<boolean> {
  try {
    const employee = await getEmployeeById(employeeId)
    if (!employee) return false
    
    employee.leaveBalance[leaveType] = newBalance
    
    // Update both employee and leave balance
    await kv.set(`${KEYS.EMPLOYEE}:${employeeId}`, employee)
    await kv.set(`${KEYS.LEAVE_BALANCE}:${employeeId}`, employee.leaveBalance)
    
    console.log(`✅ Updated ${leaveType} balance for ${employee.name}: ${newBalance}`)
    return true
  } catch (error) {
    console.error('❌ Error updating leave balance:', error)
    return false
  }
} 