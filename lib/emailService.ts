// Import SendGrid service
import { 
  sendLeaveRequestEmail as sendGridLeaveRequestEmail,
  sendLeaveReminderEmail as sendGridLeaveReminderEmail,
  sendPasswordResetEmail as sendGridPasswordResetEmail,
  sendManagerChangeNotification as sendGridManagerChangeNotification
} from './sendgridService'

// Email sending functions - using SendGrid
export async function sendLeaveRequestEmail(managerEmail: string, managerName: string, employeeName: string, startDate: string, endDate: string, leaveType: string): Promise<boolean> {
  console.log('📧 Using SendGrid for email delivery')
  return await sendGridLeaveRequestEmail(managerEmail, managerName, employeeName, startDate, endDate, leaveType)
}

export async function sendLeaveReminderEmail(managerEmail: string, managerName: string, employeeName: string, startDate: string, endDate: string, daysPending: number): Promise<boolean> {
  return await sendGridLeaveReminderEmail(managerEmail, managerName, employeeName, startDate, endDate, daysPending)
}

export async function sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string): Promise<boolean> {
  return await sendGridPasswordResetEmail(userEmail, userName, resetToken)
}

export async function sendManagerChangeNotification(userEmail: string, userName: string, managerName: string, managerDepartment: string): Promise<boolean> {
  return await sendGridManagerChangeNotification(userEmail, userName, managerName, managerDepartment)
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  console.log('📧 Testing SendGrid configuration...')
  return await sendGridLeaveRequestEmail(
    'test@example.com',
    'Test Manager',
    'Test Employee',
    '2025-01-15',
    '2025-01-15',
    'casual'
  )
}