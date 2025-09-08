import { NextRequest, NextResponse } from 'next/server'
import { getUserById, getUserManager } from '../../../lib/supabaseService'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter is required' }, { status: 400 })
    }
    
    console.log('🔍 Debugging manager lookup for user:', userId)
    
    // Get user details
    const user = await getUserById(userId)
    console.log('🔍 User found:', user ? { id: user.id, name: user.name, email: user.email, manager_id: user.manager_id } : 'Not found')
    
    // Get manager details
    const manager = await getUserManager(userId)
    console.log('🔍 Manager found:', manager ? { id: manager.id, name: manager.name, email: manager.email } : 'Not found')
    
    return NextResponse.json({
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        manager_id: user.manager_id,
        role: user.role
      } : null,
      manager: manager ? {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        role: manager.role
      } : null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error in debug manager:', error)
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
