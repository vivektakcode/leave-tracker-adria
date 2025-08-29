import { NextRequest, NextResponse } from 'next/server'
import { 
  createLeaveRequest, 
  getAllLeaveRequests, 
  processLeaveRequest,
  getUserById,
  getUserManager,
  getUsersByManager
} from '../../../lib/supabaseService'
import { supabase } from '../../../lib/supabaseService'
import { sendLeaveRequestNotification } from '../../../lib/emailService'
import { withAuth, withRole, withManagerOrSelf, AuthenticatedRequest } from '../../../lib/authMiddleware'
import { leaveRequestSchema, processLeaveRequestSchema, validateDateRange } from '../../../lib/validationSchemas'

export const GET = withRole('manager')(async (req: AuthenticatedRequest) => {
  try {
    const leaveRequests = await getAllLeaveRequests()
    return NextResponse.json({ leaveRequests })
  } catch (error) {
    console.error('Error reading leave requests:', error)
    return NextResponse.json({ error: 'Failed to read leave requests' }, { status: 500 })
  }
})

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const timestamp = new Date().toISOString()
  
  try {
    console.log(`[${timestamp}] POST /api/leave-requests - Starting request processing`)
    
    const body = await req.json()
    
    // Validate input schema
    const validationResult = leaveRequestSchema.safeParse(body)
    if (!validationResult.success) {
      console.log(`[${timestamp}] Schema validation failed:`, validationResult.error.issues)
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }
    
    const { user_id, leave_type, start_date, end_date, reason } = validationResult.data
    
    // Ensure user can only create requests for themselves
    if (req.user!.userId !== user_id) {
      return NextResponse.json(
        { error: 'You can only create leave requests for yourself' },
        { status: 403 }
      )
    }
    
    console.log(`[${timestamp}] Request data:`, { user_id, leave_type, start_date, end_date, reason: reason ? 'PROVIDED' : 'MISSING' })

    // Validate date range
    const dateValidation = validateDateRange(start_date, end_date)
    if (!dateValidation.isValid) {
      console.log(`[${timestamp}] Date validation failed:`, dateValidation.error)
      return NextResponse.json(
        { error: dateValidation.error },
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
    try {
      const emailResult = await sendManagerNotification(requestId, user_id, leave_type, start_date, end_date, reason)
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
    return NextResponse.json({ id: requestId }, { status: 201 })

  } catch (error) {
    console.error(`[${timestamp}] ❌ Error creating leave request:`, error)
    return NextResponse.json(
      { error: 'Failed to create leave request' },
      { status: 500 }
    )
  }
})

export const PUT = withRole('manager')(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    
    // Validate input schema
    const validationResult = processLeaveRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }
    
    const { requestId, status, managerId, comments } = validationResult.data
    
    // Ensure manager can only process requests for their team
    const { data: leaveRequest } = await supabase
      .from('leave_requests')
      .select('user_id')
      .eq('id', requestId)
      .single()
    
    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      )
    }
    
    // Check if the manager is managing the user who made the request
    const managedUsers = await getUsersByManager(managerId)
    const canManage = managedUsers.some((user: any) => user.id === leaveRequest.user_id)
    
    if (!canManage) {
      return NextResponse.json(
        { error: 'You can only process requests for your team members' },
        { status: 403 }
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
})

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
    // Get user details
    const user = await getUserById(userId)
    if (!user) {
      console.warn('User not found for notification:', userId)
      return false
    }

    // Get manager details
    const manager = await getUserManager(userId)
    if (!manager) {
      console.warn('Manager not found for user:', userId)
      return false
    }

    // Get website URL from environment
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL
    if (!websiteUrl) {
      console.error('NEXT_PUBLIC_WEBSITE_URL environment variable is not set')
      return false
    }
    
    // Send email notification
    const emailSent = await sendLeaveRequestNotification({
      managerName: manager.name,
      managerEmail: manager.email,
      employeeName: user.name,
      leaveType,
      startDate,
      endDate,
      reason,
      requestId,
      websiteUrl
    })

    if (emailSent) {
      console.log('Manager notification sent successfully to:', manager.email)
      return true
    } else {
      console.warn('Failed to send manager notification to:', manager.email)
      return false
    }
  } catch (error) {
    console.error('Error in sendManagerNotification:', error)
    return false
  }
}