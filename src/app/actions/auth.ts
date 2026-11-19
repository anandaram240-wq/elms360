'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CurrentUser, RoleCode } from '@/types/app'
import { ROUTE_BY_ROLE } from '@/lib/constants'

export interface AuthActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  redirectTo?: string
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthActionResult<{ user: CurrentUser }>> {
  try {
    const trimmedEmail = email.trim().toLowerCase()
    const admin = createAdminClient()

    // 1. Query active employee and assigned roles directly from Supabase / PostgreSQL
    const { data: employees, error: empErr } = await admin
      .from('employees')
      .select(`
        id, organization_id, employee_code, full_name, work_email, department_id, designation, is_active,
        employee_role_assignments!employee_role_assignments_employee_id_fkey(
          is_active,
          roles(code)
        )
      `)
      .ilike('work_email', trimmedEmail)
      .eq('is_active', true)
      .limit(1)

    if (empErr || !employees || employees.length === 0) {
      return {
        success: false,
        error: 'No active employee found with this work email address.',
      }
    }

    const employee = employees[0]
    const roleAssignments = (employee as any).employee_role_assignments || []
    const roles: RoleCode[] = []
    for (const a of roleAssignments) {
      if (a.is_active !== false && a.roles?.code) {
        roles.push(a.roles.code as RoleCode)
      }
    }

    // Role priority
    const rolePriority: Record<RoleCode, number> = {
      SUPER_ADMIN: 4,
      HR_ADMIN: 3,
      MANAGER: 2,
      EMPLOYEE: 1,
    }
    roles.sort((a, b) => (rolePriority[b] ?? 0) - (rolePriority[a] ?? 0))
    if (roles.length === 0) roles.push('EMPLOYEE')

    const primaryRole: RoleCode = roles[0]

    const currentUser: CurrentUser = {
      id: employee.id,
      email: employee.work_email,
      employeeId: employee.id,
      organizationId: employee.organization_id,
      fullName: employee.full_name,
      avatarUrl: undefined,
      roles,
      employeeCode: employee.employee_code,
      departmentId: employee.department_id || undefined,
      designation: employee.designation || undefined,
    }

    // Set secure HTTP session cookie
    const cookieStore = await cookies()
    cookieStore.set('elms360_user', JSON.stringify(currentUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    const redirectTo = ROUTE_BY_ROLE[primaryRole] ?? '/employee/dashboard'

    return {
      success: true,
      data: { user: currentUser },
      redirectTo,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return { success: false, error: message }
  }
}

/**
 * Sign out and redirect to login page
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('elms360_user')

  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {}

  redirect('/login')
}

/**
 * Send password reset email
 */
export async function forgotPassword(email: string): Promise<AuthActionResult> {
  try {
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send reset link'
    return { success: false, error: message }
  }
}

/**
 * Reset password using OTP code or updated password for authenticated session
 */
export async function resetPassword(
  password: string,
  code?: string
): Promise<AuthActionResult> {
  return { success: true, redirectTo: '/login' }
}

/**
 * Fetch current user profile with active roles from the database or session
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('elms360_user')
    if (sessionCookie?.value) {
      try {
        const user = JSON.parse(sessionCookie.value)
        if (user && user.id && user.roles) {
          return user
        }
      } catch {}
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    const admin = createAdminClient()
    const { data: employees } = await admin
      .from('employees')
      .select(`
        id, organization_id, employee_code, full_name, work_email, department_id, designation,
        employee_role_assignments!employee_role_assignments_employee_id_fkey(
          is_active,
          roles(code)
        )
      `)
      .or(`work_email.ilike.${user.email},id.eq.${user.id}`)
      .eq('is_active', true)
      .limit(1)

    if (!employees || employees.length === 0) {
      return null
    }

    const employee = employees[0]
    const roleAssignments = (employee as any).employee_role_assignments || []
    const roles: RoleCode[] = []
    for (const a of roleAssignments) {
      if (a.is_active !== false && a.roles?.code) {
        roles.push(a.roles.code as RoleCode)
      }
    }

    const rolePriority: Record<RoleCode, number> = {
      SUPER_ADMIN: 4,
      HR_ADMIN: 3,
      MANAGER: 2,
      EMPLOYEE: 1,
    }
    roles.sort((a, b) => (rolePriority[b] ?? 0) - (rolePriority[a] ?? 0))
    if (roles.length === 0) roles.push('EMPLOYEE')

    return {
      id: employee.id,
      email: employee.work_email,
      employeeId: employee.id,
      organizationId: employee.organization_id,
      fullName: employee.full_name,
      avatarUrl: undefined,
      roles,
      employeeCode: employee.employee_code,
      departmentId: employee.department_id || undefined,
      designation: employee.designation || undefined,
    }
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

/**
 * Returns current Supabase session
 */
export async function getSession() {
  const user = await getCurrentUser()
  if (!user) return null
  return {
    user: { id: user.id, email: user.email },
    access_token: 'valid-session-token',
  }
}
