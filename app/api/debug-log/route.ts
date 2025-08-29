import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()
  
  console.log(`[${timestamp}] Debug endpoint called`)
  console.log(`[${timestamp}] Environment check:`)
  console.log(`[${timestamp}] - RESEND_API_KEY exists: ${!!process.env.RESEND_API_KEY}`)
  console.log(`[${timestamp}] - NEXT_PUBLIC_WEBSITE_URL: ${process.env.NEXT_PUBLIC_WEBSITE_URL}`)
  
  return NextResponse.json({
    success: true,
    timestamp,
    environment: {
      hasResendApiKey: !!process.env.RESEND_API_KEY,
      websiteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL || 'NOT SET',
      nodeEnv: process.env.NODE_ENV
    },
    message: 'Debug endpoint working - check Vercel function logs'
  })
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  const body = await request.json()
  
  console.log(`[${timestamp}] POST to debug endpoint`)
  console.log(`[${timestamp}] Request body:`, body)
  
  return NextResponse.json({
    success: true,
    timestamp,
    receivedData: body,
    message: 'POST debug endpoint working'
  })
}
