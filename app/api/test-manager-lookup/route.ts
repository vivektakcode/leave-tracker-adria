import { NextRequest, NextResponse } from 'next/server'
import { getUserById, getUserManager } from '../../../lib/supabaseService'

export async function GET() {
  try {
    const userId = '227cc0bc-bd83-4d90-8b60-bbf3fb46fc01' // Deepak Gupta's ID
    
    console.log('🔍 Testing manager lookup for user:', userId)
    
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
    console.error('❌ Error in manager lookup test:', error)
    return NextResponse.json({ 
      error: 'Manager lookup test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
