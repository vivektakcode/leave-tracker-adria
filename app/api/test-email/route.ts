import { NextRequest, NextResponse } from 'next/server'
import { sendLeaveRequestEmail } from '../../../lib/sendgridService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, managerName, employeeName, startDate, endDate, leaveType } = body
    
    console.log('🧪 Testing email delivery to:', email)
    
    // Send test email
    const emailSent = await sendLeaveRequestEmail(
      email,
      managerName || 'Test Manager',
      employeeName || 'Test Employee',
      startDate || '2025-01-15',
      endDate || '2025-01-15',
      leaveType || 'casual'
    )
    
    return NextResponse.json({ 
      success: emailSent,
      message: emailSent ? 'Test email sent successfully!' : 'Failed to send test email',
      email,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error in test email:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Test email failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check if SendGrid is configured
    const hasApiKey = !!process.env.SENDGRID_API_KEY
    const apiKeyLength = process.env.SENDGRID_API_KEY?.length || 0
    
    return NextResponse.json({
      sendgridConfigured: hasApiKey,
      apiKeyLength,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error checking email configuration:', error)
    return NextResponse.json({ 
      error: 'Failed to check email configuration'
    }, { status: 500 })
  }
}
