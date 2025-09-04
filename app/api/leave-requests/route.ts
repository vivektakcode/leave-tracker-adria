import { NextRequest, NextResponse } from 'next/server'
import { 
  createLeaveRequest, 
  getAllLeaveRequests, 
  processLeaveRequest,
  getUserById,
  getUserManager
} from '../../../lib/supabaseService'
import { queueLeaveRequestEmail } from '../../../lib/emailQueue'

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

    console.log(`[${timestamp}] Request processing completed successfully`)
    
    // Queue email notification to manager (non-blocking)
    console.log(`[${timestamp}] Starting email notification process (non-blocking)`)
    queueManagerNotification(requestId, user_id, leave_type, start_date, end_date, reason)
      .then((emailJobId) => {
        console.log(`[${timestamp}] ✅ Manager notification queued successfully (Job ID: ${emailJobId})`);
      })
      .catch((error) => {
        console.error(`[${timestamp}] ❌ Error queuing manager notification:`, error)
      })

    // Return immediately without waiting for email
    return NextResponse.json({ 
      id: requestId,
      emailSent: 'pending', // Indicate email is being sent in background
      message: 'Leave request created successfully! Manager will be notified shortly.'
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

// Helper function to queue manager notification
async function queueManagerNotification(
  requestId: string,
  userId: string,
  leaveType: string,
  startDate: string,
  endDate: string,
  reason: string
): Promise<string> {
  try {
    console.log('📧 queueManagerNotification called with:', { requestId, userId, leaveType, startDate, endDate })
    
    // Get user details
    const user = await getUserById(userId)
    if (!user) {
      throw new Error(`User not found for notification: ${userId}`)
    }
    console.log('📧 User found for notification:', { name: user.name, email: user.email })

    // Get manager details
    const manager = await getUserManager(userId)
    if (!manager) {
      throw new Error(`Manager not found for user: ${userId}`)
    }
    console.log('📧 Manager found for notification:', { name: manager.name, email: manager.email, id: manager.id })
    
    // Debug: Check if this is the correct manager email
    if (manager.email === 'vivektakwork123@gmail.com') {
      console.warn('⚠️ WARNING: Email is going to test address instead of actual manager!')
    }

    // Queue email notification
    console.log('📧 Queuing leave request email with:', { 
      managerEmail: manager.email, 
      managerName: manager.name, 
      employeeName: user.name, 
      startDate, 
      endDate, 
      leaveType 
    })
    
    const emailJobId = await queueLeaveRequestEmail(
      manager.email,
      manager.name,
      user.name,
      startDate,
      endDate,
      leaveType
    )

    console.log('📧 Email queued successfully with Job ID:', emailJobId)
    return emailJobId

  } catch (error) {
    console.error('Error in queueManagerNotification:', error)
    throw error
  }
}