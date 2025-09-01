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
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find the verification token
    const { data: verificationData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('used_at', null)
      .single()

    if (tokenError || !verificationData) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date() > new Date(verificationData.expires_at)) {
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      )
    }

    // Mark token as used
    const { error: updateTokenError } = await supabase
      .from('email_verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', verificationData.id)

    if (updateTokenError) {
      console.error('Error updating verification token:', updateTokenError)
    }

    // Verify the user's email
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ 
        email_verified: true,
        verification_token: null,
        verification_expires: null
      })
      .eq('id', verificationData.user_id)

    if (userUpdateError) {
      console.error('Error verifying user email:', userUpdateError)
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      )
    }

    // Get user details for success message
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', verificationData.user_id)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: userData
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
