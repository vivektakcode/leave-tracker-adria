import { NextRequest, NextResponse } from 'next/server'
import { emailQueue } from '../../../lib/emailQueue'

export async function GET(request: NextRequest) {
  try {
    const status = emailQueue.getStatus()
    
    return NextResponse.json({
      success: true,
      emailQueue: {
        total: status.total,
        processing: status.processing,
        pending: status.pending,
        status: status.processing > 0 ? 'processing' : 'idle'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: unknown) {
    console.error('❌ Error getting email status:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: 'Failed to get email status',
      details: errorMessage
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'clear') {
      emailQueue.clearQueue()
      return NextResponse.json({ 
        success: true, 
        message: 'Email queue cleared successfully' 
      })
    }
    
    return NextResponse.json({ 
      error: 'Invalid action. Use "clear" to clear the queue.' 
    }, { status: 400 })
    
  } catch (error: unknown) {
    console.error('❌ Error processing email status action:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: 'Failed to process action',
      details: errorMessage
    }, { status: 500 })
  }
}
