import { NextRequest, NextResponse } from 'next/server'
import { 
  createLeaveRequest, 
  getAllLeaveRequests, 
  processLeaveRequest,
  getUserById,
  getUserManager
} from '../../../lib/supabaseService'
import { sendLeaveRequestEmail } from '../../../lib/emailService'

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

    // Send email notification to manager (non-blocking)
    sendManagerNotification(requestId, user_id, leave_type, start_date, end_date, reason)
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
  reason: string
): Promise<boolean> {
  try {
    // Get user and manager details in parallel
    const [user, manager] = await Promise.all([
      getUserById(userId),
      getUserManager(userId)
    ])
    
    if (!user || !manager) {
      console.warn('❌ User or manager not found for notification:', { userId, user: !!user, manager: !!manager })
      return false
    }

    // Send email notification directly
    const emailSent = await sendLeaveRequestEmail(
      manager.email,
      manager.name,
      user.name,
      startDate,
      endDate,
      leaveType
    )

    return emailSent

  } catch (error) {
    console.error('Error in sendManagerNotification:', error)
    return false
  }
}