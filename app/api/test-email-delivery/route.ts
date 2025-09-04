import { NextRequest, NextResponse } from 'next/server'
import { sendLeaveRequestEmail, testSendGridConfiguration } from '../../../lib/sendgridService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testEmail, managerName, employeeName, startDate, endDate, leaveType } = body
    
    console.log('🧪 ===== EMAIL DELIVERY TEST START =====')
    console.log('🧪 Test Email:', testEmail)
    console.log('🧪 Manager Name:', managerName)
    console.log('🧪 Employee Name:', employeeName)
    console.log('🧪 Leave Type:', leaveType)
    console.log('🧪 Start Date:', startDate)
    console.log('🧪 End Date:', endDate)
    
    // Test SendGrid configuration first
    console.log('🧪 Testing SendGrid configuration...')
    const configTest = await testSendGridConfiguration()
    
    if (!configTest) {
      console.error('❌ SendGrid configuration test failed')
      return NextResponse.json({ 
        success: false, 
        error: 'SendGrid configuration test failed',
        details: 'Check SENDGRID_API_KEY environment variable'
      }, { status: 500 })
    }
    
    console.log('✅ SendGrid configuration test passed')
    
    // Send test email
    console.log('🧪 Sending test email...')
    const emailSent = await sendLeaveRequestEmail(
      testEmail,
      managerName || 'Test Manager',
      employeeName || 'Test Employee',
      startDate || '2025-01-15',
      endDate || '2025-01-15',
      leaveType || 'casual'
    )
    
    console.log('🧪 Email send result:', emailSent)
    console.log('🧪 ===== EMAIL DELIVERY TEST END =====')
    
    return NextResponse.json({ 
      success: emailSent,
      message: emailSent ? 'Test email sent successfully!' : 'Failed to send test email',
      testEmail,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ ===== EMAIL DELIVERY TEST ERROR =====')
    console.error('Error in email delivery test:', error)
    console.error('❌ ===== EMAIL DELIVERY TEST ERROR END =====')
    
    return NextResponse.json({ 
      success: false, 
      error: 'Email delivery test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log('🧪 ===== EMAIL CONFIGURATION CHECK START =====')
    
    // Check environment variables
    const hasApiKey = !!process.env.SENDGRID_API_KEY
    const apiKeyLength = process.env.SENDGRID_API_KEY?.length || 0
    
    console.log('🧪 SENDGRID_API_KEY exists:', hasApiKey)
    console.log('🧪 SENDGRID_API_KEY length:', apiKeyLength)
    
    // Test SendGrid configuration
    const configTest = await testSendGridConfiguration()
    
    console.log('🧪 SendGrid configuration test result:', configTest)
    console.log('🧪 ===== EMAIL CONFIGURATION CHECK END =====')
    
    return NextResponse.json({
      sendgridConfigured: hasApiKey,
      apiKeyLength,
      configurationTest: configTest,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error checking email configuration:', error)
    return NextResponse.json({ 
      error: 'Failed to check email configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
