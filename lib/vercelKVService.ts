// This file was originally for Vercel KV, but is now temporarily a local JSON service
// for local development until Vercel KV is properly set up.

// Removed: import { kv } from '@vercel/kv'

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

// Sample data for local development
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
    username: 'lisa',
    password: 'lisa123',
    name: 'Lisa Brown',
    email: 'lisa@company.com',
    role: 'user',
    department: 'HR',
    leaveBalance: { casual: 14, sick: 16, privilege: 22 },
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'emp006',
    username: 'david',
    password: 'david123',
    name: 'David Lee',
    email: 'david@company.com',
    role: 'user',
    department: 'Finance',
    leaveBalance: { casual: 11, sick: 13, privilege: 19 },
    createdAt: '2024-01-01T00:00:00Z'
  }
]

// Sample leave requests
let leaveRequests: LeaveRequest[] = [
  {
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
]

// Authentication function
export function authenticateUser(username: string, password: string): Employee | null {
  const employee = employees.find(emp =>
    emp.username === username && emp.password === password
  )
  return employee || null
}

// Employee functions
export function getEmployeeByUsername(username: string): Employee | null {
  return employees.find(emp => emp.username === username) || null
}

export function getEmployeeById(id: string): Employee | null {
  return employees.find(emp => emp.id === id) || null
}

export function getAllEmployees(): Employee[] {
  return [...employees]
}

// Leave request functions
export function createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'requestedAt'>): LeaveRequest {
  const newRequest: LeaveRequest = {
    ...request,
    id: `req${Date.now()}`,
    requestedAt: new Date().toISOString()
  }
  leaveRequests.push(newRequest)
  console.log('✅ Leave request saved to file:', newRequest)
  return newRequest
}

export function getEmployeeLeaveRequests(employeeId: string): LeaveRequest[] {
  return leaveRequests.filter(req => req.employeeId === employeeId)
}

export function getPendingLeaveRequests(): LeaveRequest[] {
  return leaveRequests.filter(req => req.status === 'pending')
}

export function getAllLeaveRequests(): LeaveRequest[] {
  return [...leaveRequests]
}

export function processLeaveRequest(
  requestId: string, 
  status: 'approved' | 'rejected', 
  adminUsername: string, 
  comments?: string
): boolean {
  const request = leaveRequests.find(req => req.id === requestId)
  if (!request) return false

  request.status = status
  request.processedAt = new Date().toISOString()
  request.processedBy = adminUsername
  request.comments = comments

  // Update employee leave balance if approved
  if (status === 'approved') {
    const employee = getEmployeeById(request.employeeId)
    if (employee) {
      const days = calculateDays(request.startDate, request.endDate)
      if (employee.leaveBalance[request.leaveType] >= days) {
        employee.leaveBalance[request.leaveType] -= days
        console.log(`✅ Leave request updated: ${requestId} ${status}`)
        return true
      } else {
        console.log(`❌ Insufficient leave balance for ${request.leaveType}`)
        return false
      }
    }
  }

  console.log(`✅ Leave request updated: ${requestId} ${status}`)
  return true
}

// Helper functions
export function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // Include both start and end dates
}

export function getLeaveBalance(employeeId: string) {
  const employee = getEmployeeById(employeeId)
  return employee?.leaveBalance || { casual: 0, sick: 0, privilege: 0 }
}

export function updateLeaveBalance(employeeId: string, leaveType: keyof Employee['leaveBalance'], days: number) {
  const employee = getEmployeeById(employeeId)
  if (employee) {
    employee.leaveBalance[leaveType] = Math.max(0, employee.leaveBalance[leaveType] + days)
  }
}

// Initialize database function (for compatibility with API routes)
export function initializeDatabase() {
  console.log('✅ Database initialized with sample data')
  return Promise.resolve()
} 