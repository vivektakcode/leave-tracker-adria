import { NextResponse } from 'next/server'
import { getPendingLeaveRequests, getUsersByManager } from '../../../../lib/supabaseService'
import { withRole, AuthenticatedRequest } from '../../../../lib/authMiddleware'

export const GET = withRole('manager')(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.userId
    
    // Get pending requests for the manager's team
    const pendingRequests = await getPendingLeaveRequests()
    const teamMembers = await getUsersByManager(userId)
    
    // Filter pending requests to only show those from the manager's team
    const teamPendingRequests = pendingRequests.filter(request => 
      teamMembers.some(member => member.id === request.user_id)
    )
    
    return NextResponse.json({
      pendingRequests: teamPendingRequests,
      teamMembers: teamMembers.length,
      totalPending: teamPendingRequests.length
    })
  } catch (error) {
    console.error('Error getting admin dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to get dashboard data' },
      { status: 500 }
    )
  }
})
