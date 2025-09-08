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

    // Get manager info for email notification
    const manager = await getUserManager(user_id)
    
    // Send email notification to manager (non-blocking)
    sendManagerNotification(requestId, user_id, leave_type, start_date, end_date, reason, manager)
      .then((emailResult) => {
        if (emailResult) {
          console.log('✅ Manager notification sent successfully');
        } else {
          console.log('❌ Manager notification failed to send');
        }
      })
      .catch((error) => {
        console.error('❌ Error sending manager notification:', error)
      })

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
  manager: any
): Promise<boolean> {
  try {
    console.log('📧 ===== MANAGER NOTIFICATION PROCESS START =====')
    console.log('📧 Request ID:', requestId)
    console.log('📧 User ID:', userId)
    console.log('📧 Leave Type:', leaveType)
    console.log('📧 Start Date:', startDate)
    console.log('📧 End Date:', endDate)
    console.log('📧 Reason:', reason)
    
    // Get user details (manager is already passed as parameter)
    console.log('📧 About to call getUserById...')
    
    let user
    try {
      console.log('📧 Calling getUserById...')
      
      // Add timeout to prevent hanging
      const userPromise = getUserById(userId)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('getUserById timeout after 10 seconds')), 10000)
      )
      
      user = await Promise.race([userPromise, timeoutPromise])
      console.log('📧 getUserById completed:', !!user)
    } catch (error) {
      console.error('❌ Error in getUserById:', error)
      console.log('📧 ===== MANAGER NOTIFICATION PROCESS END (ERROR) =====')
      return false
    }
    
    console.log('📧 User found:', !!user, user ? { name: user.name, email: user.email } : 'N/A')
    console.log('📧 Manager passed:', !!manager, manager ? { name: manager.name, email: manager.email } : 'N/A')
    
    if (!user || !manager) {
      console.warn('❌ User or manager not found for notification:', { userId, user: !!user, manager: !!manager })
      console.log('📧 ===== MANAGER NOTIFICATION PROCESS END (FAILED) =====')
      return false
    }

    console.log('📧 Sending email to manager:', manager.email)
    console.log('📧 Manager name:', manager.name)
    console.log('📧 Employee name:', user.name)

    // Send email notification directly
    const emailSent = await sendLeaveRequestEmail(
      manager.email,
      manager.name,
      user.name,
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