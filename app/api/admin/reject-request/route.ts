import { NextRequest, NextResponse } from 'next/server'
import { processLeaveRequest, getUsersByManager, supabase } from '@/lib/supabaseService'
import { withRole, AuthenticatedRequest } from '@/lib/authMiddleware'

export const POST = withRole('manager')(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { requestId, comments } = body
    
    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }
    
    const managerId = req.user!.userId
    
    // Check if the manager can process this request
    const { data: request } = await supabase
      .from('leave_requests')
      .select('user_id')
      .eq('id', requestId)
      .single()
    
    if (!request) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      )
    }
    
    // Verify the manager is managing the user who made the request
    const managedUsers = await getUsersByManager(managerId)
    const canManage = managedUsers.some(user => user.id === request.user_id)
    
    if (!canManage) {
      return NextResponse.json(
        { error: 'You can only process requests for your team members' },
        { status: 403 }
      )
    }
    
    // Process the rejection
    const success = await processLeaveRequest(requestId, 'rejected', managerId, comments)
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Leave request rejected successfully' 
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to reject leave request' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error rejecting leave request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
