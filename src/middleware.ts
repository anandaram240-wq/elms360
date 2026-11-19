import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create a response to mutate cookies on
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthPage = pathname === '/login' || pathname.startsWith('/(auth)')

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated, retrieve their employee profile & active roles
  if (user) {
    // Helper to get roles
    async function getUserRoles(): Promise<{ roles: RoleCode[]; primaryRole: RoleCode }> {
      try {
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user!.id)
          .maybeSingle()

        if (!employee) {
          return { roles: ['EMPLOYEE'], primaryRole: 'EMPLOYEE' }
        }

        const { data: assignments } = await supabase
          .from('employee_role_assignments')
          .select('roles(code)')
          .eq('employee_id', employee.id)
          .eq('is_active', true)

        const roles: RoleCode[] = []
        if (assignments && Array.isArray(assignments)) {
          for (const item of assignments) {
            const roleData = item.roles as unknown as { code: string } | null
            if (roleData?.code) {
              roles.push(roleData.code as RoleCode)
            }
          }
        }

        if (roles.length === 0) {
          roles.push('EMPLOYEE')
        }

        let primaryRole: RoleCode = 'EMPLOYEE'
        if (roles.includes('SUPER_ADMIN')) primaryRole = 'SUPER_ADMIN'
        else if (roles.includes('HR_ADMIN')) primaryRole = 'HR_ADMIN'
        else if (roles.includes('MANAGER')) primaryRole = 'MANAGER'
        else primaryRole = 'EMPLOYEE'

        return { roles, primaryRole }
      } catch {
        return { roles: ['EMPLOYEE'], primaryRole: 'EMPLOYEE' }
      }
    }

    // Redirect authenticated users away from /login
    if (pathname === '/login') {
      const { primaryRole } = await getUserRoles()
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = ROUTE_BY_ROLE[primaryRole]
      return NextResponse.redirect(dashboardUrl)
    }

    // Role check for protected routes
    if (isProtected) {
      const requiredRoles = getRequiredRoles(pathname)
      if (requiredRoles) {
        const { roles, primaryRole } = await getUserRoles()
        const hasPermission = requiredRoles.some((r) => roles.includes(r))

        if (!hasPermission) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = ROUTE_BY_ROLE[primaryRole]
          return NextResponse.redirect(redirectUrl)
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
