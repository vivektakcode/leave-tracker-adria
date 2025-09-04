import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, testType = 'basic' } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
    }

    console.log('🔍 Email Debug Test:', { email, testType })

    // Test 1: Check Resend API key
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'RESEND_API_KEY not configured',
        details: 'Environment variable is missing'
      }, { status: 500 })
    }

    if (!process.env.RESEND_API_KEY.startsWith('re_')) {
      return NextResponse.json({ 
        error: 'Invalid RESEND_API_KEY format',
        details: 'API key should start with "re_"'
      }, { status: 500 })
    }

    // Test 2: Try different from addresses
    const fromAddresses = [
      'Leave Management <onboarding@resend.dev>',
      'Leave Management <noreply@resend.dev>',
      'Leave Management <hello@resend.dev>',
      `Leave Management <noreply@${process.env.NEXT_PUBLIC_WEBSITE_URL?.replace('https://', '') || 'your-domain.com'}>`
    ]

    const results = []

    for (const fromAddress of fromAddresses) {
      try {
        console.log(`📧 Testing from address: ${fromAddress}`)
        
        const result = await resend.emails.send({
          from: fromAddress,
          to: email,
          subject: `Email Test - ${testType} - ${new Date().toISOString()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f97316;">Email Delivery Test</h2>
              <p>This is a test email to verify email delivery configuration.</p>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Test Type:</strong> ${testType}</p>
                <p><strong>From Address:</strong> ${fromAddress}</p>
                <p><strong>To Address:</strong> ${email}</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              </div>
              <p>If you receive this email, the configuration is working correctly.</p>
              <p>Best regards,<br>Leave Management System</p>
            </div>
          `
        })

        results.push({
          fromAddress,
          success: true,
          result: result,
          emailId: result.data?.id
        })

        console.log(`✅ Success with ${fromAddress}:`, result.data?.id)

      } catch (error: any) {
        results.push({
          fromAddress,
          success: false,
          error: error.message,
          code: error.code,
          status: error.status
        })

        console.error(`❌ Failed with ${fromAddress}:`, error.message)
      }
    }

    // Test 3: Check domain-specific issues
    const emailDomain = email.split('@')[1]
    const recommendations: string[] = []
    
    if (emailDomain === 'adria-bt.com') {
      recommendations.push('Custom domain detected - may need domain verification in Resend')
    }

    if (!['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(emailDomain)) {
      recommendations.push('Consider using a verified domain or Gmail for testing')
    }

    const domainAnalysis = {
      email,
      domain: emailDomain,
      isCustomDomain: !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(emailDomain),
      isAdriaDomain: emailDomain === 'adria-bt.com',
      recommendations
    }

    return NextResponse.json({
      success: true,
      message: 'Email debug test completed',
      results,
      domainAnalysis,
      recommendations: [
        'If all tests fail, check Resend dashboard for domain verification status',
        'For adria-bt.com emails, you may need to verify the domain in Resend',
        'Consider using Gmail addresses for testing initially',
        'Check Resend API limits and account status'
      ]
    })

  } catch (error: unknown) {
    console.error('❌ Email debug test error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: 'Email debug test failed',
      details: errorMessage 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Email debug endpoint. Send POST request with { "email": "your-email@example.com", "testType": "basic" }',
    usage: 'POST /api/debug-email with JSON body containing email field',
    testTypes: ['basic', 'domain', 'custom']
  })
}
