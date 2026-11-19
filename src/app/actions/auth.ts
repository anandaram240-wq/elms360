'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
    const supabase = await createClient()

    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (signInError || !authData.user) {
      return {
        success: false,
        error: signInError?.message || 'Invalid email or password',
      }
    }

    // Fetch user details and role
    const currentUser = await getCurrentUser()
    const primaryRole: RoleCode = currentUser?.roles?.[0] ?? 'EMPLOYEE'
    const redirectTo = ROUTE_BY_ROLE[primaryRole] ?? '/employee/dashboard'

    return {
      success: true,
      data: currentUser ? { user: currentUser } : undefined,
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
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Send password reset email
 */
export async function forgotPassword(email: string): Promise<AuthActionResult> {
  try {
    const supabase = await createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    })

    if (error) {
      return { success: false, error: error.message }
    }

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
  try {
    const supabase = await createClient()

    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        return { success: false, error: exchangeError.message }
      }
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, redirectTo: '/login' }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reset password'
    return { success: false, error: message }
  }
}

/**
 * Fetch current user profile with active roles from the database
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    // 1. Fetch user_profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id, full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    // 2. Fetch employee record
    const { data: employee } = await supabase
      .from('employees')
      .select('id, organization_id, employee_code, full_name, work_email, department_id, designation')
      .eq('user_id', user.id)
      .maybeSingle()

    // 3. Fetch active roles
    const roles: RoleCode[] = []
    if (employee?.id) {
      const { data: assignments } = await supabase
        .from('employee_role_assignments')
        .select('roles(code)')
        .eq('employee_id', employee.id)
        .eq('is_active', true)

      if (assignments && Array.isArray(assignments)) {
        for (const item of assignments) {
          const roleData = item.roles as unknown as { code: string } | null
          if (roleData?.code) {
            roles.push(roleData.code as RoleCode)
          }
        }
      }
    }

    // Priority sorting: SUPER_ADMIN > HR_ADMIN > MANAGER > EMPLOYEE
    const rolePriority: Record<RoleCode, number> = {
      SUPER_ADMIN: 4,
      HR_ADMIN: 3,
      MANAGER: 2,
      EMPLOYEE: 1,
    }
    roles.sort((a, b) => (rolePriority[b] ?? 0) - (rolePriority[a] ?? 0))

    if (roles.length === 0) {
      roles.push('EMPLOYEE')
    }

    const currentUser: CurrentUser = {
      id: user.id,
      email: employee?.work_email || user.email || '',
      employeeId: employee?.id || '',
      organizationId: employee?.organization_id || profile?.organization_id || '',
      fullName: employee?.full_name || profile?.full_name || user.email || 'User',
      avatarUrl: profile?.avatar_url || undefined,
      roles,
      employeeCode: employee?.employee_code || '',
      departmentId: employee?.department_id || undefined,
      designation: employee?.designation || undefined,
    }

    return currentUser
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

/**
 * Returns current Supabase session
 */
export async function getSession() {
  const supabase = await createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    return null
  }
  return session
}
