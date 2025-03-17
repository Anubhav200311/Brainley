import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/'
  
  // Get token from cookies or localStorage (cookies are preferred for SSR)
  const token = request.cookies.get('token')?.value || ''
  
  // Redirect logic
  if (isPublicPath && token) {
    // If on login page but already authenticated, redirect to home
    return NextResponse.redirect(new URL('/home', request.url))
  }
  
  if (!isPublicPath && !token) {
    // If on protected route but not authenticated, redirect to login
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

// Define routes where middleware should run
export const config = {
  matcher: ['/', '/home/:path*']
}