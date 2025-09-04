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
  const timestamp = new Date().toISOString()
  
  try {
    console.log(`[${timestamp}] POST /api/leave-requests - Starting request processing`)
    
    const body = await request.json()
    const { user_id, leave_type, start_date, end_date, reason } = body
    
    console.log(`[${timestamp}] Request data:`, { user_id, leave_type, start_date, end_date, reason: reason ? 'PROVIDED' : 'MISSING' })
    
    // Optimized: Get user details and validate in one call
    const { getUserById } = await import('../../../lib/supabaseService')
    const user = await getUserById(user_id)
    if (!user) {
      console.log(`[${timestamp}] ❌ User not found for ID:`, user_id)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    console.log(`[${timestamp}] User found:`, { name: user.name, email: user.email, role: user.role, manager_id: user.manager_id })

    // Validate required fields
    if (!user_id || !leave_type || !start_date || !end_date || !reason) {
      console.log(`[${timestamp}] Validation failed - missing fields`)
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log(`[${timestamp}] Validation passed - creating leave request`)

    // Create leave request via Supabase service
    const requestId = await createLeaveRequest({
      user_id,
      leave_type,
      start_date,
      end_date,
      reason
    })

    console.log(`[${timestamp}] Leave request created via Supabase:`, requestId)

    // Send email notification to manager
    console.log(`[${timestamp}] Starting email notification process`)
    let emailResult = false
    try {
      console.log(`[${timestamp}] Calling sendManagerNotification with:`, { requestId, user_id, leave_type, start_date, end_date })
      emailResult = await sendManagerNotification(requestId, user_id, leave_type, start_date, end_date, reason)
      console.log(`[${timestamp}] sendManagerNotification result:`, emailResult)
      if (emailResult) {
        console.log(`[${timestamp}] ✅ Manager notification sent successfully`);
      } else {
        console.log(`[${timestamp}] ❌ Manager notification failed to send`);
      }
    } catch (error) {
      console.error(`[${timestamp}] ❌ Error sending manager notification:`, error)
      // Don't fail the request creation if email fails
    }

    console.log(`[${timestamp}] Request processing completed successfully`)
    return NextResponse.json({ 
      id: requestId,
      emailSent: emailResult,
      message: emailResult ? 'Leave request created and manager notified' : 'Leave request created but email notification failed'
    }, { status: 201 })

  } catch (error) {
    console.error(`[${timestamp}] ❌ Error creating leave request:`, error)
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
    console.log('📧 sendManagerNotification called with:', { requestId, userId, leaveType, startDate, endDate })
    
    // Get user details
    const user = await getUserById(userId)
    if (!user) {
      console.warn('❌ User not found for notification:', userId)
      return false
    }
    console.log('📧 User found for notification:', { name: user.name, email: user.email })

    // Get manager details
    const manager = await getUserManager(userId)
    if (!manager) {
      console.warn('❌ Manager not found for user:', userId)
      return false
    }
    console.log('📧 Manager found for notification:', { name: manager.name, email: manager.email, id: manager.id })
    
    // Debug: Check if this is the correct manager email
    if (manager.email === 'vivektakwork123@gmail.com') {
      console.warn('⚠️ WARNING: Email is going to test address instead of actual manager!')
    }

    // Send email notification using the correct function
    console.log('📧 Calling sendLeaveRequestEmail with:', { 
      managerEmail: manager.email, 
      managerName: manager.name, 
      employeeName: user.name, 
      startDate, 
      endDate, 
      leaveType 
    })
    
    const emailSent = await sendLeaveRequestEmail(
      manager.email,
      manager.name,
      user.name,
      startDate,
      endDate,
      leaveType
    )

    console.log('📧 sendLeaveRequestEmail result:', emailSent)

    if (emailSent) {
      console.log('✅ Manager notification sent successfully to:', manager.email)
      return true
    } else {
      console.warn('❌ Failed to send manager notification to:', manager.email)
      return false
    }
  } catch (error) {
    console.error('Error in sendManagerNotification:', error)
    return false
  }
}