'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/auth'

export interface EmployeeProfileData {
  id: string
  employeeCode: string
  fullName: string
  workEmail: string
  personalEmail?: string | null
  phone?: string | null
  avatarUrl?: string | null
  designation?: string | null
  departmentName?: string | null
  managerName?: string | null
  dateOfJoining: string
  employmentType: string
  employmentStatus: string
  location?: string | null
}

export async function getEmployeeProfile(): Promise<EmployeeProfileData | null> {
  const user = await getCurrentUser()
  if (!user || !user.employeeId) return null

  const supabase = await createClient()

  // 1. Fetch employee details
  const { data: employee, error } = await supabase
    .from('employees')
    .select(`
      id,
      employee_code,
      full_name,
      work_email,
      personal_email,
      phone,
      designation,
      date_of_joining,
      employment_type,
      employment_status,
      location,
      departments (
        name
      )
    `)
    .eq('id', user.employeeId)
    .single()

  if (error || !employee) {
    console.error('Error fetching employee profile:', error)
    return null
  }

  // 2. Fetch manager info
  const { data: relationship } = await supabase
    .from('reporting_relationships')
    .select(`
      manager:manager_id (
        full_name,
        designation
      )
    `)
    .eq('employee_id', user.employeeId)
    .eq('relationship_type', 'PRIMARY')
    .eq('is_active', true)
    .maybeSingle()

  // 3. Fetch user_profile avatar
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  const deptData = employee.departments as unknown as { name: string } | null
  const managerData = relationship?.manager as unknown as { full_name: string } | null

  return {
    id: employee.id,
    employeeCode: employee.employee_code,
    fullName: employee.full_name,
    workEmail: employee.work_email,
    personalEmail: employee.personal_email,
    phone: employee.phone,
    avatarUrl: profile?.avatar_url || null,
    designation: employee.designation,
    departmentName: deptData?.name || 'General',
    managerName: managerData?.full_name || 'None Assigned',
    dateOfJoining: employee.date_of_joining,
    employmentType: employee.employment_type,
    employmentStatus: employee.employment_status,
    location: employee.location,
  }
}

export async function updateEmployeeProfile(data: {
  personalEmail?: string
  phone?: string
  avatarUrl?: string
}) {
  const user = await getCurrentUser()
  if (!user || !user.employeeId) {
    return { success: false, error: 'Unauthorized' }
  }

  const supabase = await createClient()

  // Update employee record
  const { error: empError } = await supabase
    .from('employees')
    .update({
      personal_email: data.personalEmail || null,
      phone: data.phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.employeeId)

  if (empError) {
    return { success: false, error: empError.message }
  }

  // Update user_profiles table
  if (data.avatarUrl !== undefined || data.phone !== undefined) {
    await supabase
      .from('user_profiles')
      .update({
        avatar_url: data.avatarUrl || null,
        phone: data.phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
  }

  revalidatePath('/employee/profile')
  return { success: true, message: 'Profile updated successfully!' }
}

export async function changePassword(newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, message: 'Password changed successfully!' }
}

