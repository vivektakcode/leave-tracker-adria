import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '../../../../lib/supabaseService'
import { hashPassword } from '../../../../lib/passwordUtils'
import { signupSchema } from '../../../../lib/validationSchemas'
import { validatePasswordStrength } from '../../../../lib/passwordUtils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = signupSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }
    
    const userData = validationResult.data
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(userData.password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Password too weak', details: passwordValidation.errors },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await hashPassword(userData.password)
    
    // Create user with hashed password
    const userId = await createUser({
      ...userData,
      password: hashedPassword
    })
    
    return NextResponse.json({
      id: userId,
      message: 'User created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Signup error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
