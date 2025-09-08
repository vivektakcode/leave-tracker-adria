import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables (without exposing sensitive values)
    const envCheck = {
      hasSendGridApiKey: !!process.env.SENDGRID_API_KEY,
      sendGridApiKeyLength: process.env.SENDGRID_API_KEY?.length || 0,
      hasSendGridFromEmail: !!process.env.SENDGRID_FROM_EMAIL,
      sendGridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'NOT_SET',
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      timestamp: new Date().toISOString()
    }
    
    console.log('🔍 Environment Variables Check:', envCheck)
    
    return NextResponse.json(envCheck)
    
  } catch (error) {
    console.error('❌ Error checking environment variables:', error)
    return NextResponse.json({ 
      error: 'Environment check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
