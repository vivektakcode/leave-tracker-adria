import sgMail from '@sendgrid/mail'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

// Email templates
const emailTemplates = {
  leaveRequest: (managerName: string, employeeName: string, startDate: string, endDate: string, leaveType: string) => ({
    subject: `Leave Request from ${employeeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Leave Request Notification</h2>
        <p>Hello ${managerName},</p>
        <p>You have received a leave request from <strong>${employeeName}</strong>:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Leave Type:</strong> ${leaveType}</p>
          <p><strong>Start Date:</strong> ${startDate}</p>
          <p><strong>End Date:</strong> ${endDate}</p>
        </div>
        <p>Please review and approve/reject this request.</p>
        <p>Best regards,<br>Adria Leave Management System</p>
      </div>
    `
  }),

  leaveReminder: (managerName: string, employeeName: string, startDate: string, endDate: string, daysPending: number) => ({
    subject: `REMINDER: Pending Leave Request from ${employeeName} (${daysPending} days pending)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Leave Request Reminder</h2>
        <p>Hello ${managerName},</p>
        <p><strong>This is a reminder</strong> that you have a pending leave request that needs your attention:</p>
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p><strong>Employee:</strong> ${employeeName}</p>
          <p><strong>Start Date:</strong> ${startDate}</p>
          <p><strong>End Date:</strong> ${endDate}</p>
          <p><strong>Days Pending:</strong> ${daysPending} days</p>
        </div>
        <p style="color: #dc2626; font-weight: bold;">Please review and take action on this request.</p>
        <p>Best regards,<br>Adria Leave Management System</p>
      </div>
    `
  }),

  passwordReset: (userName: string, resetToken: string) => ({
    subject: `Password Reset Request - Adria Leave Management`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>You requested to reset your password for your Adria Leave Management System account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}" 
             style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">
          ${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}
        </p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>Adria Leave Management System</p>
      </div>
    `
  }),

  managerChange: (userName: string, managerName: string, managerDepartment: string) => ({
    subject: `Manager Assignment Update - Adria Leave Management`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Manager Assignment Update</h2>
        <p>Hello ${userName},</p>
        <p>Your manager assignment has been updated in the Adria Leave Management System.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>New Manager:</strong> ${managerName}</p>
          <p><strong>Department:</strong> ${managerDepartment}</p>
        </div>
        <p>Your new manager will now review and approve your leave requests. Any pending leave requests have been automatically reassigned to your new manager.</p>
        <p>If you have any questions about this change, please contact your HR department.</p>
        <p>Best regards,<br>Adria Leave Management System</p>
      </div>
    `
  })
}

// Email sending functions
export async function sendLeaveRequestEmail(managerEmail: string, managerName: string, employeeName: string, startDate: string, endDate: string, leaveType: string): Promise<boolean> {
  try {
    console.log('🚀 ===== SENDGRID EMAIL DEBUG START =====')
    console.log('📧 Target Manager Email:', managerEmail)
    console.log('📧 Manager Name:', managerName)
    console.log('📧 Employee Name:', employeeName)
    console.log('📧 Leave Type:', leaveType)
    console.log('📧 Start Date:', startDate)
    console.log('📧 End Date:', endDate)
    console.log('📧 Timestamp:', new Date().toISOString())
    
    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(managerEmail)) {
      console.error('❌ Invalid email address format:', managerEmail)
      return false
    }
    console.log('✅ Email address format is valid')
    
    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ CRITICAL: SENDGRID_API_KEY environment variable is not set')
      console.log('🔍 Available env vars:', Object.keys(process.env).filter(key => key.includes('SENDGRID')))
      return false
    }
    
    console.log('✅ SendGrid API key is configured (length:', process.env.SENDGRID_API_KEY.length, ')')
    
    // Use simple text format like the working test
    const subject = `Leave Request from ${employeeName}`
    const text = `Hello ${managerName},\n\nYou have received a leave request from ${employeeName}:\n\nLeave Type: ${leaveType}\nStart Date: ${startDate}\nEnd Date: ${endDate}\n\nPlease review and approve/reject this request.\n\nBest regards,\nAdria Leave Management System`
    
    console.log('📧 Email Subject:', subject)
    console.log('📧 Email From Address:', process.env.SENDGRID_FROM_EMAIL || 'vivek.tak@adria-bt.com')
    console.log('📧 Email To Address:', managerEmail)
    
    const msg = {
      to: managerEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'vivek.tak@adria-bt.com',
      subject,
      text
    }
    
    console.log('📧 Sending email via SendGrid API...')
    
    // Add timeout to SendGrid call
    const sendPromise = sgMail.send(msg)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('SendGrid timeout after 10 seconds')), 10000)
    )
    
    const result = await Promise.race([sendPromise, timeoutPromise])
    
    console.log('📧 SendGrid API Response:', JSON.stringify(result, null, 2))
    console.log('✅ EMAIL SENT SUCCESSFULLY to', managerEmail)
    console.log('📧 Email delivery confirmed by SendGrid API')
    console.log('🚀 ===== SENDGRID EMAIL DEBUG END =====')
    return true
  } catch (error: unknown) {
    console.error('❌ ===== SENDGRID EMAIL ERROR =====')
    console.error('❌ Error sending email to:', managerEmail)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Full error object:', error)
    
    // Log specific SendGrid error details if available
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as any
      console.error('❌ SendGrid Response Status:', sgError.response?.status)
      console.error('❌ SendGrid Response Body:', sgError.response?.body)
    }
    
    console.error('❌ ===== SENDGRID EMAIL ERROR END =====')
    return false
  }
}

export async function sendLeaveReminderEmail(managerEmail: string, managerName: string, employeeName: string, startDate: string, endDate: string, daysPending: number): Promise<boolean> {
  try {
    console.log('🚀 ===== SENDGRID REMINDER EMAIL DEBUG START =====')
    console.log('📧 Target Manager Email:', managerEmail)
    console.log('📧 Manager Name:', managerName)
    console.log('📧 Employee Name:', employeeName)
    console.log('📧 Days Pending:', daysPending)
    console.log('📧 Start Date:', startDate)
    console.log('📧 End Date:', endDate)
    
    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(managerEmail)) {
      console.error('❌ Invalid email address format:', managerEmail)
      return false
    }
    
    const { subject, html } = emailTemplates.leaveReminder(managerName, employeeName, startDate, endDate, daysPending)
    console.log('📧 Email Subject:', subject)
    
    const msg = {
      to: managerEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'vivek.tak@adria-bt.com',
      subject,
      html
    }
    
    console.log('📧 Sending reminder email via SendGrid API...')
    const result = await sgMail.send(msg)
    
    console.log('📧 SendGrid API Response:', JSON.stringify(result, null, 2))
    console.log('✅ REMINDER EMAIL SENT SUCCESSFULLY to', managerEmail)
    console.log('🚀 ===== SENDGRID REMINDER EMAIL DEBUG END =====')
    return true
  } catch (error: unknown) {
    console.error('❌ ===== SENDGRID REMINDER EMAIL ERROR =====')
    console.error('❌ Error sending reminder email to:', managerEmail)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Full error object:', error)
    console.error('❌ ===== SENDGRID REMINDER EMAIL ERROR END =====')
    return false
  }
}

export async function sendPasswordResetEmail(userEmail: string, userName: string, resetToken: string): Promise<boolean> {
  try {
    console.log('🚀 ===== SENDGRID PASSWORD RESET EMAIL DEBUG START =====')
    console.log('📧 Target User Email:', userEmail)
    console.log('📧 User Name:', userName)
    console.log('📧 Reset Token (first 10 chars):', resetToken.substring(0, 10) + '...')
    
    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userEmail)) {
      console.error('❌ Invalid email address format:', userEmail)
      return false
    }
    
    const { subject, html } = emailTemplates.passwordReset(userName, resetToken)
    console.log('📧 Email Subject:', subject)
    
    const msg = {
      to: userEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'vivek.tak@adria-bt.com',
      subject,
      html
    }
    
    console.log('📧 Sending password reset email via SendGrid API...')
    const result = await sgMail.send(msg)
    
    console.log('📧 SendGrid API Response:', JSON.stringify(result, null, 2))
    console.log('✅ PASSWORD RESET EMAIL SENT SUCCESSFULLY to', userEmail)
    console.log('🚀 ===== SENDGRID PASSWORD RESET EMAIL DEBUG END =====')
    return true
  } catch (error: unknown) {
    console.error('❌ ===== SENDGRID PASSWORD RESET EMAIL ERROR =====')
    console.error('❌ Error sending password reset email to:', userEmail)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Full error object:', error)
    console.error('❌ ===== SENDGRID PASSWORD RESET EMAIL ERROR END =====')
    return false
  }
}

export async function sendManagerChangeNotification(userEmail: string, userName: string, managerName: string, managerDepartment: string): Promise<boolean> {
  try {
    console.log('🚀 ===== SENDGRID MANAGER CHANGE EMAIL DEBUG START =====')
    console.log('📧 Target User Email:', userEmail)
    console.log('📧 User Name:', userName)
    console.log('📧 New Manager Name:', managerName)
    console.log('📧 Manager Department:', managerDepartment)
    
    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userEmail)) {
      console.error('❌ Invalid email address format:', userEmail)
      return false
    }
    
    const { subject, html } = emailTemplates.managerChange(userName, managerName, managerDepartment)
    console.log('📧 Email Subject:', subject)
    
    const msg = {
      to: userEmail,
      from: process.env.SENDGRID_FROM_EMAIL || 'vivek.tak@adria-bt.com',
      subject,
      html
    }
    
    console.log('📧 Sending manager change notification via SendGrid API...')
    const result = await sgMail.send(msg)
    
    console.log('📧 SendGrid API Response:', JSON.stringify(result, null, 2))
    console.log('✅ MANAGER CHANGE EMAIL SENT SUCCESSFULLY to', userEmail)
    console.log('🚀 ===== SENDGRID MANAGER CHANGE EMAIL DEBUG END =====')
    return true
  } catch (error: unknown) {
    console.error('❌ ===== SENDGRID MANAGER CHANGE EMAIL ERROR =====')
    console.error('❌ Error sending manager change email to:', userEmail)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Full error object:', error)
    console.error('❌ ===== SENDGRID MANAGER CHANGE EMAIL ERROR END =====')
    return false
  }
}

// Email delivery tracking and verification
export async function trackEmailDelivery(
  emailType: string,
  recipientEmail: string,
  recipientName: string,
  additionalData: any = {}
): Promise<void> {
  const timestamp = new Date().toISOString()
  console.log('📊 ===== EMAIL DELIVERY TRACKING =====')
  console.log('📊 Email Type:', emailType)
  console.log('📊 Recipient Email:', recipientEmail)
  console.log('📊 Recipient Name:', recipientName)
  console.log('📊 Timestamp:', timestamp)
  console.log('📊 Additional Data:', JSON.stringify(additionalData, null, 2))
  console.log('📊 ===== EMAIL DELIVERY TRACKING END =====')
}

// Test email configuration
export async function testSendGridConfiguration(): Promise<boolean> {
  try {
    console.log('🧪 ===== SENDGRID CONFIGURATION TEST START =====')
    console.log('🧪 Testing SendGrid API configuration...')
    
    const msg = {
      to: 'test@example.com',
      from: process.env.SENDGRID_FROM_EMAIL || 'vivek.tak@adria-bt.com',
      subject: 'SendGrid Test Email',
      html: '<p>This is a test email to verify SendGrid configuration.</p>'
    }
    
    console.log('🧪 Test email details:', JSON.stringify(msg, null, 2))
    const result = await sgMail.send(msg)
    
    console.log('🧪 SendGrid test response:', JSON.stringify(result, null, 2))
    console.log('✅ SendGrid configuration is valid')
    console.log('🧪 ===== SENDGRID CONFIGURATION TEST END =====')
    return true
  } catch (error: unknown) {
    console.error('❌ ===== SENDGRID CONFIGURATION TEST ERROR =====')
    console.error('❌ SendGrid configuration error:', error)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ ===== SENDGRID CONFIGURATION TEST ERROR END =====')
    return false
  }
}
