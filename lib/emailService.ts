import { Resend } from 'resend'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY)

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
        <p>Best regards,<br>Leave Management System</p>
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
        <p>Best regards,<br>Leave Management System</p>
      </div>
    `
  }),

  emailVerification: (userName: string, verificationToken: string) => ({
    subject: `Verify Your Email Address`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f97316;">Email Verification Required</h2>
        <p>Hello ${userName},</p>
        <p>Welcome to the Leave Management System! Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}" 
             style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">
          ${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}
        </p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>Leave Management System</p>
      </div>
    `
  })
}

// Email sending functions
export async function sendLeaveRequestEmail(managerEmail: string, managerName: string, employeeName: string, startDate: string, endDate: string, leaveType: string): Promise<boolean> {
  try {
    const { subject, html } = emailTemplates.leaveRequest(managerName, employeeName, startDate, endDate, leaveType)
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
      to: managerEmail,
      subject,
      html
    })
    
    console.log(`✅ Leave request email sent to ${managerEmail}`)
    return true
  } catch (error) {
    console.error('❌ Error sending leave request email:', error)
    return false
  }
}

export async function sendLeaveReminderEmail(managerEmail: string, managerName: string, employeeName: string, startDate: string, endDate: string, daysPending: number): Promise<boolean> {
  try {
    const { subject, html } = emailTemplates.leaveReminder(managerName, employeeName, startDate, endDate, daysPending)
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
      to: managerEmail,
      subject,
      html
    })
    
    console.log(`✅ Leave reminder email sent to ${managerEmail}`)
    return true
  } catch (error) {
    console.error('❌ Error sending leave reminder email:', error)
    return false
  }
}

export async function sendVerificationEmail(userEmail: string, userName: string, verificationToken: string): Promise<boolean> {
  try {
    const { subject, html } = emailTemplates.emailVerification(userName, verificationToken)
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
      to: userEmail,
      subject,
      html
    })
    
    console.log(`✅ Verification email sent to ${userEmail}`)
    return true
  } catch (error) {
    console.error('❌ Error sending verification email:', error)
    return false
  }
}

// Test email configuration
export async function testEmailConfiguration(): Promise<boolean> {
  try {
    // Send a test email to verify configuration
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
      to: 'test@example.com',
      subject: 'Test Email Configuration',
      html: '<p>This is a test email to verify the configuration.</p>'
    })
    
    console.log('✅ Resend email configuration is valid')
    return true
  } catch (error) {
    console.error('❌ Resend email configuration error:', error)
    return false
  }
}


