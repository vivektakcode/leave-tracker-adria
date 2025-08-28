import { NextRequest, NextResponse } from 'next/server'
import { 
  createLeaveRequest, 
  getAllLeaveRequests, 
  processLeaveRequest,
  getUserById,
  getUserManager
} from '../../../lib/supabaseService'
import { sendLeaveRequestNotification } from '../../../lib/emailService'

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

    console.log('✅ Leave request created via Supabase:', requestId)

    // Send email notification to manager
    console.log('🚨🚨🚨 ABOUT TO SEND EMAIL NOTIFICATION 🚨🚨🚨');
    console.log('🚨🚨🚨 LEAVE REQUEST CREATED SUCCESSFULLY 🚨🚨🚨');
    console.log('🚨🚨🚨 CALLING sendManagerNotification NOW 🚨🚨🚨');
    
    try {
      await sendManagerNotification(requestId, user_id, leave_type, start_date, end_date, reason)
      console.log('🚨🚨🚨 sendManagerNotification COMPLETED 🚨🚨🚨');
    } catch (error) {
      console.warn('Failed to send manager notification:', error)
      console.log('🚨🚨🚨 EMAIL NOTIFICATION FAILED 🚨🚨🚨');
      // Don't fail the request creation if email fails
    }

    return NextResponse.json({ id: requestId }, { status: 201 })

  } catch (error) {
    console.error('Error creating leave request:', error)
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
) {
  try {
    console.log('🔔 Starting manager notification process...');
    console.log('🔔 Request ID:', requestId);
    console.log('🔔 User ID:', userId);
    
    // Get user details
    const user = await getUserById(userId)
    if (!user) {
      console.warn('❌ User not found for notification:', userId)
      return
    }
    console.log('✅ User found:', user.name, user.email);
    console.log('🚨🚨🚨 USER DATA:', JSON.stringify(user, null, 2));

    // Get manager details
    const manager = await getUserManager(userId)
    if (!manager) {
      console.warn('❌ Manager not found for user:', userId)
      console.log('🚨🚨🚨 NO MANAGER FOUND - CHECKING WHY 🚨🚨🚨');
      console.log('🚨🚨🚨 USER MANAGER_ID:', user.manager_id);
      return
    }
    console.log('✅ Manager found:', manager.name, manager.email);
    console.log('🚨🚨🚨 MANAGER DATA:', JSON.stringify(manager, null, 2));

    // Get website URL from environment or use default
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:4444'
    console.log('🌐 Website URL:', websiteUrl);

    console.log('📧 Calling sendLeaveRequestNotification...');
    
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
      console.log('✅ Manager notification sent successfully to:', manager.email)
    } else {
      console.warn('❌ Failed to send manager notification to:', manager.email)
    }
  } catch (error) {
    console.error('❌ Error in sendManagerNotification:', error)
    throw error
  }
}