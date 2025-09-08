import { NextRequest, NextResponse } from 'next/server'
import { sendLeaveRequestEmail } from '../../../lib/sendgridService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, managerName, employeeName, startDate, endDate, leaveType } = body
    
    console.log('🔍 ===== EMAIL DEBUG START =====')
    console.log('🔍 Environment Variables:')
    console.log('🔍 SENDGRID_API_KEY exists:', !!process.env.SENDGRID_API_KEY)
    console.log('🔍 SENDGRID_API_KEY length:', process.env.SENDGRID_API_KEY?.length || 0)
    console.log('🔍 SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'NOT_SET')
    console.log('🔍 NODE_ENV:', process.env.NODE_ENV)
    console.log('🔍 VERCEL_ENV:', process.env.VERCEL_ENV)
    
    console.log('🔍 Email Details:')
    console.log('🔍 To:', email)
    console.log('🔍 Manager Name:', managerName)
    console.log('🔍 Employee Name:', employeeName)
    console.log('🔍 Start Date:', startDate)
    console.log('🔍 End Date:', endDate)
    console.log('🔍 Leave Type:', leaveType)
    
    // Try to send the email
    console.log('🔍 Attempting to send email...')
    const emailSent = await sendLeaveRequestEmail(
      email,
      managerName || 'Test Manager',
      employeeName || 'Test Employee',
      startDate || '2025-09-12',
      endDate || '2025-09-12',
      leaveType || 'casual'
    )
    
    console.log('🔍 Email send result:', emailSent)
    console.log('🔍 ===== EMAIL DEBUG END =====')
    
    return NextResponse.json({
      success: emailSent,
      message: emailSent ? 'Email sent successfully!' : 'Email failed to send',
      environment: {
        hasSendGridApiKey: !!process.env.SENDGRID_API_KEY,
        sendGridApiKeyLength: process.env.SENDGRID_API_KEY?.length || 0,
        sendGridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'NOT_SET',
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      },
      emailDetails: {
        to: email,
        managerName,
        employeeName,
        startDate,
        endDate,
        leaveType
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ ===== EMAIL DEBUG ERROR =====')
    console.error('❌ Error in debug email:', error)
    console.error('❌ Error type:', typeof error)
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ Full error object:', error)
    console.error('❌ ===== EMAIL DEBUG ERROR END =====')
    
    return NextResponse.json({ 
      success: false,
      error: 'Email debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        hasSendGridApiKey: !!process.env.SENDGRID_API_KEY,
        sendGridApiKeyLength: process.env.SENDGRID_API_KEY?.length || 0,
        sendGridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'NOT_SET',
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
