import { NextResponse } from 'next/server'
import { getUserLeaveRequests } from '../../lib/supabaseService'
import { withManagerOrSelf, AuthenticatedRequest } from '../../lib/authMiddleware'

export const GET = withManagerOrSelf()(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId') || req.user!.userId
    
    const requests = await getUserLeaveRequests(userId)
    
    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error getting user leave requests:', error)
    return NextResponse.json(
      { error: 'Failed to get leave requests' },
      { status: 500 }
    )
  }
})
