import { NextResponse } from 'next/server'
import { sendLeaveRequestNotification } from '../../../lib/emailService'

export async function GET() {
  try {
    // Test the email service directly
    console.log('🧪 Testing email service directly...');
    
    const testData = {
      managerName: 'Vivek Tak',
      managerEmail: 'vivektakwork123@gmail.com',
      employeeName: 'Punisher',
      leaveType: 'casual',
      startDate: '2024-01-15',
      endDate: '2024-01-16',
      reason: 'Testing email functionality',
      requestId: 'test-' + Date.now(),
      websiteUrl: 'https://leave-tracker-adria.vercel.app'
    }

    console.log('📧 Test data prepared:', testData);
    
    // Test the email service
    const result = await sendLeaveRequestNotification(testData)
    
    console.log('📧 Email service result:', result);
    
    return NextResponse.json({ 
      success: result,
      message: result ? 'Email sent successfully' : 'Email failed to send',
      testData,
      environment: {
        hasResendApiKey: !!process.env.RESEND_API_KEY,
        resendApiKeyPrefix: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 10) + '...' : 'NOT SET',
        websiteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL || 'NOT SET'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
