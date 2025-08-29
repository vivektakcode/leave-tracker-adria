import { NextResponse } from 'next/server'
import { sendLeaveRequestNotification } from '../../../lib/emailService'

export async function GET() {
  try {
    // Test data
    const testData = {
      managerName: 'Vivek Tak',
      managerEmail: 'vivektakwork123@gmail.com',
      employeeName: 'Punisher',
      leaveType: 'casual',
      startDate: '2024-01-15',
      endDate: '2024-01-16',
      reason: 'Test email functionality',
      requestId: 'test-' + Date.now(),
      websiteUrl: 'https://leave-tracker-adria.vercel.app'
    }

    // Test the email service directly
    const result = await sendLeaveRequestNotification(testData)
    
    return NextResponse.json({ 
      success: result,
      message: result ? 'Email sent successfully' : 'Email failed to send',
      testData,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
