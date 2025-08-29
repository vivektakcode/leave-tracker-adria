import { NextResponse } from 'next/server'
import { getLeaveBalance } from '../../lib/supabaseService'
import { withManagerOrSelf, AuthenticatedRequest } from '../../lib/authMiddleware'

export const GET = withManagerOrSelf()(async (req: AuthenticatedRequest) => {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId') || req.user!.userId
    
    const balance = await getLeaveBalance(userId)
    
    if (!balance) {
      return NextResponse.json(
        { error: 'Leave balance not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ balance })
  } catch (error) {
    console.error('Error getting leave balance:', error)
    return NextResponse.json(
      { error: 'Failed to get leave balance' },
      { status: 500 }
    )
  }
})
