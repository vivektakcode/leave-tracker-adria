import { NextRequest, NextResponse } from 'next/server'
import { sendLeaveRequestEmail } from '../../../lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    console.log('🧪 Testing email configuration...')
    
    // Test email sending
    const result = await sendLeaveRequestEmail(
      email,
      'Test Manager',
      'Test Employee',
      '2025-01-15',
      '2025-01-15',
      'casual'
    )

    if (result) {
      return NextResponse.json({ 
        success: true, 
        message: 'Test email sent successfully!',
        email: email
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to send test email. Check console logs for details.',
        email: email
      }, { status: 500 })
    }

  } catch (error: unknown) {
    console.error('❌ Test email error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: 'Test email failed',
      details: errorMessage 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Email test endpoint. Send POST request with { "email": "your-email@example.com" }',
    usage: 'POST /api/test-email with JSON body containing email field'
  })
}
