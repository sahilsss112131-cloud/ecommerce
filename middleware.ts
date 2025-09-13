import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Check if user is trying to access admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      // Check if user has admin role
      if (req.nextauth.token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to admin routes only for admins
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN'
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*']
}