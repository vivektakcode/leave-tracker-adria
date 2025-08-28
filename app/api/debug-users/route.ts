import { NextResponse } from 'next/server'
import { getAllUsers, getUserManager } from '../../../lib/supabaseService'

export async function GET() {
  try {
    console.log('🔍 Debug: Getting all users...')
    
    const users = await getAllUsers()
    console.log('🔍 Debug: Found users:', users.length)
    
    // Check each user's manager
    const usersWithManagers = await Promise.all(
      users.map(async (user) => {
        const manager = await getUserManager(user.id)
        return {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          manager_id: user.manager_id,
          manager_name: manager?.name || 'NO MANAGER',
          manager_email: manager?.email || 'NO MANAGER EMAIL'
        }
      })
    )
    
    console.log('🔍 Debug: Users with manager info:', usersWithManagers)
    
    return NextResponse.json({ 
      message: 'Debug user data',
      totalUsers: usersWithManagers.length,
      users: usersWithManagers
    })
    
  } catch (error) {
    console.error('❌ Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
