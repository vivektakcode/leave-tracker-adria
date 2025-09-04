import { NextRequest, NextResponse } from 'next/server'
import { sendLeaveRequestEmail } from '../../../lib/sendgridService'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    console.log('🧪 Testing SendGrid email delivery to:', email)
    
    // Test email sending with SendGrid
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
        message: '✅ SendGrid email sent successfully!',
        email: email,
        provider: 'SendGrid',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: '❌ Failed to send SendGrid email. Check console logs for details.',
        email: email,
        provider: 'SendGrid',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error: unknown) {
    console.error('❌ SendGrid test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: 'SendGrid test failed',
      details: errorMessage,
      provider: 'SendGrid',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'SendGrid email delivery test endpoint',
    usage: 'POST /api/test-email-delivery with JSON body containing email field',
    provider: 'SendGrid',
    example: {
      method: 'POST',
      body: { email: 'manager@adria-bt.com' }
    }
  })
}
