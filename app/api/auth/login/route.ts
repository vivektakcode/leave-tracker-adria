import { NextRequest, NextResponse } from 'next/server'
import { getUserByUsername } from '../../../../lib/supabaseService'
import { verifyPassword } from '../../../../lib/passwordUtils'
import { generateToken } from '../../../../lib/jwtUtils'
import { loginSchema } from '../../../../lib/validationSchemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }
    
    const { username, password } = validationResult.data
    
    // Get user from database
    const user = await getUserByUsername(username)
    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Generate JWT token
    const token = generateToken(user)
    
    // Return user data (without password) and token
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json({
      user: userWithoutPassword,
      token,
      message: 'Login successful'
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
