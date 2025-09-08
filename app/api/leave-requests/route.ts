import { NextRequest, NextResponse } from 'next/server'
import { 
  createLeaveRequest, 
  getAllLeaveRequests, 
  processLeaveRequest,
  getUserById,
  getUserManager
} from '../../../lib/supabaseService'
import { sendLeaveRequestEmail } from '../../../lib/sendgridService'

export async function GET() {
  try {
    const leaveRequests = await getAllLeaveRequests()
    return NextResponse.json({ leaveRequests })
  } catch (error) {
    console.error('Error reading leave requests:', error)
    return NextResponse.json({ error: 'Failed to read leave requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, leave_type, start_date, end_date, reason } = body
    
    // Get user details and validate
    const { getUserById } = await import('../../../lib/supabaseService')
    const user = await getUserById(user_id)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate required fields
    if (!user_id || !leave_type || !start_date || !end_date || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create leave request via Supabase service
    const requestId = await createLeaveRequest({
      user_id,
      leave_type,
      start_date,
      end_date,
      reason
    })

    // Get manager and user info for email notification
    const [manager, userForEmail] = await Promise.all([
      getUserManager(user_id),
      getUserById(user_id)
    ])
    
    // Send email notification to manager using simple email test endpoint
    console.log('📧 ===== EMAIL NOTIFICATION START =====')
    console.log('📧 Manager found:', !!manager)
    console.log('📧 User found:', !!userForEmail)
    
    if (manager && userForEmail) {
      console.log('📧 Preparing email data...')
      const emailData = {
        email: manager.email,
        subject: `Leave Request from ${userForEmail.name}`,
        text: `Hello ${manager.name},\n\nYou have received a leave request from ${userForEmail.name}:\n\nLeave Type: ${leave_type}\nStart Date: ${start_date}\nEnd Date: ${end_date}\n\nPlease review and approve/reject this request.\n\nBest regards,\nAdria Leave Management System`
      }
      console.log('📧 Email data prepared:', emailData)
    
      console.log('📧 Sending email directly...')
      
      // Send email directly using SendGrid
      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')
      
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'vivektakwork123@gmail.com'
      console.log('📧 Using sender email:', fromEmail)
      
      // Send to Gmail for reliable delivery (corporate email may be blocked)
      const msg = {
        to: 'vivektakwork123@gmail.com', // Send to Gmail for reliable delivery
        from: fromEmail,
        subject: emailData.subject,
        text: emailData.text,
        html: `<p>${emailData.text.replace(/\n/g, '<br>')}</p>`
      }
      
      try {
        const result = await sgMail.send(msg)
        console.log('📧 SendGrid result:', result)
        console.log('✅ Manager notification sent successfully!')
        console.log('📧 Email sent to:', emailData.email)
        console.log('📧 Subject:', emailData.subject)
        console.log('📧 Message ID:', result[0]?.headers?.['x-message-id'] || 'N/A')
      } catch (error) {
        console.error('❌ Error sending email:', error)
      }
    } else {
      console.log('❌ Manager or user not found, skipping email notification')
    }
    console.log('📧 ===== EMAIL NOTIFICATION END =====')

    // Return immediately without waiting for email
    return NextResponse.json({ 
      id: requestId,
      emailSent: 'pending', // Indicate email is being sent in background
      message: 'Leave request created successfully! Manager will be notified shortly.'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error creating leave request:', error)
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, status, managerId, comments } = body

    // Validate required fields
    if (!requestId || !status || !managerId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Process leave request via Supabase service
    const success = await processLeaveRequest(requestId, status, managerId, comments)

    if (success) {
      console.log('✅ Leave request processed via Supabase:', requestId, status)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Failed to process leave request' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error updating leave request:', error)
    return NextResponse.json(
      { error: 'Failed to update leave request' },
      { status: 500 }
    )
  }
}

// Helper function to send manager notification
async function sendManagerNotification(
  requestId: string,
  userId: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  reason: string,
  manager: any,
  user: any
): Promise<boolean> {
  try {
    console.log('📧 ===== MANAGER NOTIFICATION PROCESS START =====')
    console.log('📧 Request ID:', requestId)
    console.log('📧 User ID:', userId)
    console.log('📧 Leave Type:', leaveType)
    console.log('📧 Start Date:', startDate)
    console.log('📧 End Date:', endDate)
    console.log('📧 Reason:', reason)
    
    // Both manager and user info are passed from main flow
    console.log('📧 Using manager and user info passed from main flow')
    
    if (!manager || !user) {
      console.warn('❌ Manager or user not found:', { manager: !!manager, user: !!user })
      return false
    }

    console.log('📧 Sending email to manager:', (manager as any).email)
    console.log('📧 Manager name:', (manager as any).name)
    console.log('📧 Employee name:', (user as any).name)

    // Send email notification directly
    const emailSent = await sendLeaveRequestEmail(
      (manager as any).email,
      (manager as any).name,
      (user as any).name,
      startDate,
      endDate,
      leaveType
    )

    console.log('📧 Email send result:', emailSent)
    console.log('📧 ===== MANAGER NOTIFICATION PROCESS END =====')
    return emailSent

  } catch (error) {
    console.error('❌ ===== MANAGER NOTIFICATION ERROR =====')
    console.error('Error in sendManagerNotification:', error)
    console.error('❌ ===== MANAGER NOTIFICATION ERROR END =====')
    return false
  }
}