import { NextResponse } from 'next/server'
import { getUsersByManager, getAllUsers } from '../../../../lib/supabaseService'
import { withRole, AuthenticatedRequest } from '../../../../lib/authMiddleware'

export const GET = withRole('manager')(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.user!.userId
    const url = new URL(req.url)
    const scope = url.searchParams.get('scope') || 'team' // 'team' or 'all'
    
    let users
    
    if (scope === 'all') {
      // Only allow access to all users if explicitly requested
      users = await getAllUsers()
    } else {
      // Default to team members only
      users = await getUsersByManager(userId)
    }
    
    // Remove sensitive information
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      manager_id: user.manager_id,
      created_at: user.created_at
      // password is intentionally excluded
    }))
    
    return NextResponse.json({ users: sanitizedUsers })
  } catch (error) {
    console.error('Error getting users:', error)
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    )
  }
})
