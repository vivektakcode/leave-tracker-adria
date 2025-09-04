import { NextRequest, NextResponse } from 'next/server'
import { emailQueue } from '../../../lib/emailQueue'

export async function GET(request: NextRequest) {
  try {
    const status = emailQueue.getStatus()
    
    // Calculate free tier usage
    const freeTierLimits = {
      sendgrid: {
        daily: 100,
        monthly: 3000
      },
      vercel: {
        bandwidth: 100, // GB
        requests: 100000
      },
      supabase: {
        requests: 50000,
        storage: 500 // MB
      }
    }
    
    return NextResponse.json({
      success: true,
      poc: {
        status: 'running',
        cost: '$0/month',
        tier: 'free'
      },
      emailQueue: {
        total: status.total,
        processing: status.processing,
        pending: status.pending,
        status: status.processing > 0 ? 'processing' : 'idle'
      },
      freeTierLimits,
      timestamp: new Date().toISOString(),
      message: 'POC running on free tier - perfect for demonstration!'
    })
  } catch (error: unknown) {
    console.error('❌ Error getting POC status:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: 'Failed to get POC status',
      details: errorMessage
    }, { status: 500 })
  }
}
