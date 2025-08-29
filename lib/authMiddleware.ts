import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from './jwtUtils'
import { JWTPayload } from './jwtUtils'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization')
      const token = extractTokenFromHeader(authHeader)
      
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication token required' },
          { status: 401 }
        )
      }
      
      const decoded = verifyToken(token)
      if (!decoded) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }
      
      // Add user info to request
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = decoded
      
      return handler(authenticatedReq)
    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

export function withRole(requiredRole: string) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest) => {
      if (!req.user) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 }
        )
      }
      
      if (req.user.role !== requiredRole) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      
      return handler(req)
    })
  }
}

export function withManagerOrSelf() {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest) => {
      if (!req.user) {
        return NextResponse.json(
          { error: 'User not authenticated' },
          { status: 401 }
        )
      }
      
      // Allow if user is a manager or if they're accessing their own data
      if (req.user.role === 'manager') {
        return handler(req)
      }
      
      // For employees, check if they're accessing their own data
      const url = new URL(req.url)
      const userId = url.searchParams.get('userId') || req.nextUrl?.searchParams.get('userId')
      
      if (userId && userId === req.user.userId) {
        return handler(req)
      }
      
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    })
  }
}
