import { NextResponse, type NextRequest } from 'next/server'
import type { RoleCode } from '@/types/app'
import { ROUTE_BY_ROLE } from '@/lib/constants'

// Routes that require authentication
const PROTECTED_PREFIXES = ['/employee', '/manager', '/hr', '/admin']

// Role requirements per route prefix
const ROUTE_ROLE_MAP: Record<string, RoleCode[]> = {
  '/admin': ['SUPER_ADMIN'],
  '/hr': ['HR_ADMIN', 'SUPER_ADMIN'],
  '/manager': ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  '/employee': ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
}

function getRequiredRoles(pathname: string): RoleCode[] | null {
  for (const prefix of ['/admin', '/hr', '/manager', '/employee']) {
    if (pathname.startsWith(prefix)) {
      return ROUTE_ROLE_MAP[prefix] ?? null
    }
  }
  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore static assets and health check
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/health') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Check session cookie
  const sessionCookie = request.cookies.get('elms360_user')
  let currentUser: { id: string; roles: RoleCode[] } | null = null

  if (sessionCookie?.value) {
    try {
      currentUser = JSON.parse(sessionCookie.value)
    } catch {}
  }

  const primaryRole: RoleCode = currentUser?.roles?.[0] || 'EMPLOYEE'
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isLoginPage = pathname === '/login'

  // Root path routing:
  // If authenticated -> redirect to dashboard
  // If unauthenticated -> redirect to /login
  if (pathname === '/') {
    if (currentUser) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = ROUTE_BY_ROLE[primaryRole] || '/employee/dashboard'
      return NextResponse.redirect(dashboardUrl)
    } else {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }
  }

  // If user is authenticated and visiting /login -> redirect to dashboard
  if (isLoginPage && currentUser) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = ROUTE_BY_ROLE[primaryRole] || '/employee/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // If user is unauthenticated and visiting a protected route -> redirect to /login
  if (isProtected && !currentUser) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role permissions check for protected routes
  if (isProtected && currentUser) {
    const requiredRoles = getRequiredRoles(pathname)
    if (requiredRoles) {
      const hasPermission = requiredRoles.some((r) => currentUser!.roles.includes(r))
      if (!hasPermission) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = ROUTE_BY_ROLE[primaryRole] || '/employee/dashboard'
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
