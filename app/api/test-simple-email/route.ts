import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export async function POST(request: NextRequest) {
  let body: any = null
  
  try {
    body = await request.json()
    const { email } = body
    
    console.log('🧪 Testing simple email to:', email)
    console.log('🧪 From email:', process.env.SENDGRID_FROM_EMAIL || 'vivektakwork123@gmail.com')
    
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'vivektakwork123@gmail.com',
      subject: 'Simple Test Email',
      text: 'This is a simple test email to verify SendGrid is working.',
      html: '<p>This is a simple test email to verify SendGrid is working.</p>'
    }
    
    console.log('🧪 Sending simple email...')
    const result = await sgMail.send(msg)
    
    console.log('🧪 SendGrid result:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Simple email sent successfully!',
      email,
      from: process.env.SENDGRID_FROM_EMAIL || 'vivektakwork123@gmail.com',
      result: result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Simple email error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Simple email failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      email: body?.email,
      from: process.env.SENDGRID_FROM_EMAIL || 'vivektakwork123@gmail.com',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
