import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Reset token is required' },
        { status: 400 }
      )
    }

    // Find the reset token
    const { data: resetData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used_at', null)
      .single()

    if (tokenError || !resetData) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date() > new Date(resetData.expires_at)) {
      return NextResponse.json(
        { valid: false, error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      message: 'Reset token is valid'
    })

  } catch (error) {
    console.error('Verify reset token error:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
