import { z } from 'zod'

// User authentication schemas
export const loginSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8).max(128)
})

export const signupSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100).regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['manager', 'employee']),
  department: z.string().min(2).max(100),
  manager_id: z.string().uuid().optional()
})

// Leave request schemas
export const leaveRequestSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  leave_type: z.enum(['casual', 'sick', 'privilege']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  reason: z.string().min(10).max(500).regex(/^[a-zA-Z0-9\s.,!?-]+$/, 'Reason contains invalid characters'),
  is_half_day: z.boolean().optional()
})

export const processLeaveRequestSchema = z.object({
  requestId: z.string().uuid('Invalid request ID format'),
  status: z.enum(['approved', 'rejected']),
  managerId: z.string().uuid('Invalid manager ID format'),
  comments: z.string().max(500).optional()
})

// User management schemas
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string().email('Invalid email format'),
  department: z.string().min(2).max(100),
  manager_id: z.string().uuid().optional()
})

// Date validation helper
export function validateDateRange(startDate: string, endDate: string): { isValid: boolean; error?: string } {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  
  if (start < today) {
    return { isValid: false, error: 'Start date cannot be in the past' }
  }
  
  if (end < start) {
    return { isValid: false, error: 'End date cannot be before start date' }
  }
  
  // Check if dates are not more than 1 year in the future
  const oneYearFromNow = new Date()
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
  
  if (end > oneYearFromNow) {
    return { isValid: false, error: 'Cannot request leave more than 1 year in advance' }
  }
  
  return { isValid: true }
}
