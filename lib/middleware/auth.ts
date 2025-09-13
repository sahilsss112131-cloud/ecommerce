import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function requireAuth(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
  
  return token
}

export async function requireAdmin(request: NextRequest) {
  const token = await requireAuth(request)
  
  if (token instanceof NextResponse) {
    return token
  }
  
  if (token.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }
  
  return token
}