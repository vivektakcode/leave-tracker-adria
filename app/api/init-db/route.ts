import { NextResponse } from 'next/server'
import { initializeDatabase } from '../../../lib/vercelKVService'

export async function POST() {
  try {
    console.log('🚀 Initializing database...')
    await initializeDatabase()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully' 
    })
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize database' 
      }, 
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log('🔍 Checking database status...')
    await initializeDatabase()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database is ready' 
    })
  } catch (error) {
    console.error('❌ Error checking database status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database not ready' 
      }, 
      { status: 500 }
    )
  }
} 