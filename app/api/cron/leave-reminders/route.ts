import { NextRequest, NextResponse } from 'next/server'
import { sendLeaveReminders, autoApproveEligibleLeaves } from '../../../../lib/supabaseService'

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Starting leave reminder cron job...')

    // Auto-approve eligible leaves first
    console.log('✅ Auto-approving eligible leaves...')
    await autoApproveEligibleLeaves()

    // Send leave reminders
    console.log('📧 Sending leave reminders...')
    await sendLeaveReminders()

    console.log('✅ Leave reminder cron job completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Leave reminder cron job completed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in leave reminder cron job:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also allow GET for testing
export async function GET() {
  return NextResponse.json({
    message: 'Leave reminder cron job endpoint',
    usage: 'POST to this endpoint to run the cron job',
    timestamp: new Date().toISOString()
  })
}
