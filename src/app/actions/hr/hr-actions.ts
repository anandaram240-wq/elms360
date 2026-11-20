'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/app/actions/auth'
import type { RoleCode, EmploymentType, EmploymentStatus } from '@/types/app'

export interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// -----------------------------------------------------------------------------
// Input Types
// -----------------------------------------------------------------------------

export interface CreateEmployeeInput {
  employeeCode?: string
  fullName: string
  workEmail: string
  personalEmail?: string
  phone?: string
  designation: string
  departmentId?: string
  location?: string
  dateOfJoining: string
  dateOfBirth?: string
  employmentType: EmploymentType
  employmentStatus?: EmploymentStatus
  grade?: string
  managerId?: string
  roleCode?: RoleCode
  workScheduleId?: string
  policyId?: string
}

export interface UpdateEmployeeInput {
  fullName?: string
  workEmail?: string
  personalEmail?: string
  phone?: string
  designation?: string
  departmentId?: string
  location?: string
  dateOfJoining?: string
  dateOfBirth?: string
  employmentType?: EmploymentType
  employmentStatus?: EmploymentStatus
  grade?: string
  managerId?: string
  isActive?: boolean
}

export interface CreatePolicyInput {
  name: string
  leaveTypeId: string
  annualEntitlement: number
  accrualType: 'ANNUAL' | 'MONTHLY' | 'QUARTERLY' | 'NONE'
  accrualAmount?: number
  accrualStartMonth?: number
  probationEligible?: boolean
  probationDays?: number
  carryForwardEnabled?: boolean
  carryForwardMaxDays?: number
  carryForwardExpiryMonths?: number
  maxConsecutiveDays?: number
  minNoticeDays?: number
  maxAdvanceDays?: number
  allowsBackdated?: boolean
  backdatedMaxDays?: number
  encashmentEligible?: boolean
  applicableEmploymentTypes?: string[]
  applicableGrades?: string[]
  applicableDepartmentIds?: string[]
  effectiveFrom: string
  effectiveTo?: string
}

export interface UpdatePolicyInput extends Partial<CreatePolicyInput> {
  changeReason?: string
}

export interface CreateHolidayCalendarInput {
  name: string
  year: number
  location?: string
  departmentId?: string
  isDefault?: boolean
}

export interface AddHolidayInput {
  name: string
  holidayDate: string
  holidayType?: 'NATIONAL' | 'OPTIONAL' | 'REGIONAL' | 'ORGANIZATION'
  isOptional?: boolean
  description?: string
}

export interface CreateWorkScheduleInput {
  name: string
  description?: string
  workingDays: number[]
  hoursPerDay: number
  isDefault?: boolean
}

export interface CreateDepartmentInput {
  name: string
  code?: string
  parentDepartmentId?: string
  headEmployeeId?: string
}

export interface CreateLeaveTypeInput {
  name: string
  code: string
  description?: string
  color: string
  icon?: string
  requiresDocument?: boolean
  documentDescription?: string
  allowsHalfDay?: boolean
  allowsNegativeBalance?: boolean
  isPaid?: boolean
  displayOrder?: number
}

export interface CreateWorkflowInput {
  name: string
  description?: string
  leaveTypeIds?: string[]
  appliesToAllLeaveTypes?: boolean
  departmentIds?: string[]
  appliesToAllDepartments?: boolean
  minDurationDays?: number
  maxDurationDays?: number
  isDefault?: boolean
}

export interface WorkflowStepInput {
  stepOrder: number
  stepName: string
  approverType: 'DIRECT_MANAGER' | 'DEPARTMENT_HEAD' | 'HR' | 'SPECIFIC_EMPLOYEE' | 'ROLE'
  approverRoleId?: string
  approverEmployeeId?: string
  isMandatory?: boolean
  canSkipConditions?: Record<string, any>
}

// -----------------------------------------------------------------------------
// Helper: Verify HR Admin Auth
// -----------------------------------------------------------------------------
async function verifyHrAdmin() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized: Authentication required')
  }
  const isHr = user.roles.some((r) => r === 'HR_ADMIN' || r === 'SUPER_ADMIN')
  if (!isHr) {
    throw new Error('Forbidden: Requires HR_ADMIN or SUPER_ADMIN role')
  }
  return user
}

// -----------------------------------------------------------------------------
// 1. HR Approval Actions
// -----------------------------------------------------------------------------

export async function hrApproveRequest(params: {
  requestId: string
  comments?: string
  idempotencyKey?: string
}): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    // Call stored procedure process_approval_action
    const { data, error } = await adminClient.rpc('process_approval_action', {
      p_request_id: params.requestId,
      p_actor_id: user.employeeId || user.id,
      p_action: 'APPROVED',
      p_comments: params.comments || 'Approved by HR',
      p_idempotency_key: params.idempotencyKey || `hr_approve_${params.requestId}_${Date.now()}`,
    })

    if (error) {
      console.warn('RPC process_approval_action fallback:', error.message)
      // Direct update fallback if RPC fails or table triggers handle it
      await adminClient
        .from('leave_requests')
        .update({
          status: 'APPROVED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.requestId)

      await adminClient.from('approval_actions').insert({
        leave_request_id: params.requestId,
        action: 'APPROVED',
        actor_id: user.employeeId,
        comments: params.comments || 'Approved by HR',
        previous_status: 'PENDING_HR_APPROVAL',
        new_status: 'APPROVED',
      })
    }

    revalidatePath('/hr/leave-requests')
    revalidatePath(`/hr/leave-requests/${params.requestId}`)
    revalidatePath('/hr/dashboard')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to approve request' }
  }
}

export async function hrRejectRequest(params: {
  requestId: string
  reason: string
  idempotencyKey?: string
}): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    if (!params.reason?.trim()) {
      return { success: false, error: 'Rejection reason is required' }
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient.rpc('process_approval_action', {
      p_request_id: params.requestId,
      p_actor_id: user.employeeId || user.id,
      p_action: 'REJECTED',
      p_comments: params.reason,
      p_idempotency_key: params.idempotencyKey || `hr_reject_${params.requestId}_${Date.now()}`,
    })

    if (error) {
      await adminClient
        .from('leave_requests')
        .update({
          status: 'REJECTED',
          rejection_reason: params.reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.requestId)

      await adminClient.from('approval_actions').insert({
        leave_request_id: params.requestId,
        action: 'REJECTED',
        actor_id: user.employeeId,
        comments: params.reason,
        previous_status: 'PENDING_HR_APPROVAL',
        new_status: 'REJECTED',
      })
    }

    revalidatePath('/hr/leave-requests')
    revalidatePath(`/hr/leave-requests/${params.requestId}`)
    revalidatePath('/hr/dashboard')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to reject request' }
  }
}

export async function hrRequestClarification(params: {
  requestId: string
  message: string
  idempotencyKey?: string
}): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    if (!params.message?.trim()) {
      return { success: false, error: 'Clarification message is required' }
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient.rpc('process_approval_action', {
      p_request_id: params.requestId,
      p_actor_id: user.employeeId || user.id,
      p_action: 'CLARIFICATION_REQUESTED',
      p_comments: params.message,
      p_idempotency_key: params.idempotencyKey || `hr_clarify_${params.requestId}_${Date.now()}`,
    })

    if (error) {
      await adminClient
        .from('leave_requests')
        .update({
          status: 'CLARIFICATION_REQUESTED',
          clarification_message: params.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.requestId)

      await adminClient.from('approval_actions').insert({
        leave_request_id: params.requestId,
        action: 'CLARIFICATION_REQUESTED',
        actor_id: user.employeeId,
        comments: params.message,
        previous_status: 'PENDING_HR_APPROVAL',
        new_status: 'CLARIFICATION_REQUESTED',
      })
    }

    revalidatePath('/hr/leave-requests')
    revalidatePath(`/hr/leave-requests/${params.requestId}`)
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to request clarification' }
  }
}

export async function adminOverrideRequest(params: {
  requestId: string
  newStatus: string
  reason: string
}): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    if (!params.reason?.trim()) {
      return { success: false, error: 'Override reason is required' }
    }

    const adminClient = createAdminClient()

    // Fetch previous status
    const { data: request } = await adminClient
      .from('leave_requests')
      .select('status, organization_id')
      .eq('id', params.requestId)
      .single()

    const previousStatus = request?.status || 'UNKNOWN'

    // Update status directly
    const { error: updateError } = await adminClient
      .from('leave_requests')
      .update({
        status: params.newStatus as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.requestId)

    if (updateError) throw updateError

    // Record approval action & audit log
    await adminClient.from('approval_actions').insert({
      leave_request_id: params.requestId,
      action: 'APPROVED',
      actor_id: user.employeeId,
      comments: `ADMIN OVERRIDE to ${params.newStatus}: ${params.reason}`,
      previous_status: previousStatus,
      new_status: params.newStatus,
    })

    await logAuditEvent({
      action: 'ADMIN_OVERRIDE_LEAVE_STATUS',
      resourceType: 'leave_requests',
      resourceId: params.requestId,
      previousState: { status: previousStatus },
      newState: { status: params.newStatus },
      reason: params.reason,
    })

    revalidatePath('/hr/leave-requests')
    revalidatePath(`/hr/leave-requests/${params.requestId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Admin override failed' }
  }
}

// -----------------------------------------------------------------------------
// 2. Employee Management Actions
// -----------------------------------------------------------------------------

export async function getNextEmployeeCode(): Promise<string> {
  try {
    const adminClient = createAdminClient()
    const { data } = await adminClient
      .from('employees')
      .select('employee_code')
      .order('created_at', { ascending: false })
      .limit(1)

    if (data && data.length > 0 && data[0].employee_code) {
      const match = data[0].employee_code.match(/EMP-(\d+)/)
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1
        return `EMP-${String(nextNum).padStart(4, '0')}`
      }
    }
    return 'EMP-1001'
  } catch {
    return 'EMP-1001'
  }
}

export async function createEmployee(data: CreateEmployeeInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const employeeCode = data.employeeCode || (await getNextEmployeeCode())
    const orgId = user.organizationId

    // Insert employee record
    const { data: newEmployee, error: empError } = await adminClient
      .from('employees')
      .insert({
        organization_id: orgId,
        employee_code: employeeCode,
        full_name: data.fullName,
        work_email: data.workEmail,
        personal_email: data.personalEmail || null,
        phone: data.phone || null,
        designation: data.designation,
        department_id: data.departmentId || null,
        location: data.location || null,
        date_of_joining: data.dateOfJoining,
        date_of_birth: data.dateOfBirth || null,
        employment_type: data.employmentType || 'FULL_TIME',
        employment_status: data.employmentStatus || 'ACTIVE',
        grade: data.grade || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (empError) throw empError
    const employeeId = newEmployee.id

    // Assign reporting manager if provided
    if (data.managerId) {
      await adminClient.from('reporting_relationships').insert({
        employee_id: employeeId,
        manager_id: data.managerId,
        relationship_type: 'PRIMARY',
        effective_from: data.dateOfJoining || new Date().toISOString().split('T')[0],
        is_active: true,
      })
    }

    // Assign role if provided
    if (data.roleCode) {
      const { data: roleRow } = await adminClient
        .from('roles')
        .select('id')
        .eq('organization_id', orgId)
        .eq('code', data.roleCode)
        .maybeSingle()

      if (roleRow) {
        await adminClient.from('employee_role_assignments').insert({
          employee_id: employeeId,
          role_id: roleRow.id,
          assigned_by: user.employeeId,
          is_active: true,
        })
      }
    }

    // Assign work schedule if provided
    if (data.workScheduleId) {
      await adminClient.from('employee_work_schedules').insert({
        employee_id: employeeId,
        work_schedule_id: data.workScheduleId,
        effective_from: data.dateOfJoining || new Date().toISOString().split('T')[0],
        is_active: true,
      })
    }

    // Assign leave policy if provided
    if (data.policyId) {
      await adminClient.from('employee_policy_assignments').insert({
        employee_id: employeeId,
        policy_id: data.policyId,
        effective_from: data.dateOfJoining || new Date().toISOString().split('T')[0],
        assigned_by: user.employeeId,
        is_active: true,
      })
    }

    await logAuditEvent({
      action: 'CREATE_EMPLOYEE',
      resourceType: 'employees',
      resourceId: employeeId,
      newState: { employeeCode, fullName: data.fullName, email: data.workEmail },
    })

    revalidatePath('/hr/employees')
    revalidatePath('/hr/dashboard')
    return { success: true, data: { id: employeeId } }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create employee' }
  }
}

export async function updateEmployee(id: string, data: UpdateEmployeeInput): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { data: previous } = await adminClient
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }
    if (data.fullName !== undefined) updatePayload.full_name = data.fullName
    if (data.workEmail !== undefined) updatePayload.work_email = data.workEmail
    if (data.personalEmail !== undefined) updatePayload.personal_email = data.personalEmail
    if (data.phone !== undefined) updatePayload.phone = data.phone
    if (data.designation !== undefined) updatePayload.designation = data.designation
    if (data.departmentId !== undefined) updatePayload.department_id = data.departmentId
    if (data.location !== undefined) updatePayload.location = data.location
    if (data.dateOfJoining !== undefined) updatePayload.date_of_joining = data.dateOfJoining
    if (data.dateOfBirth !== undefined) updatePayload.date_of_birth = data.dateOfBirth
    if (data.employmentType !== undefined) updatePayload.employment_type = data.employmentType
    if (data.employmentStatus !== undefined) updatePayload.employment_status = data.employmentStatus
    if (data.grade !== undefined) updatePayload.grade = data.grade
    if (data.isActive !== undefined) updatePayload.is_active = data.isActive

    const { error } = await adminClient.from('employees').update(updatePayload).eq('id', id)
    if (error) throw error

    // Update manager if provided
    if (data.managerId) {
      await changeManager(id, data.managerId, new Date().toISOString().split('T')[0])
    }

    await logAuditEvent({
      action: 'UPDATE_EMPLOYEE',
      resourceType: 'employees',
      resourceId: id,
      previousState: previous,
      newState: updatePayload,
    })

    revalidatePath('/hr/employees')
    revalidatePath(`/hr/employees/${id}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update employee' }
  }
}

export async function deactivateEmployee(id: string, reason: string): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('employees')
      .update({
        is_active: false,
        employment_status: 'INACTIVE',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    await logAuditEvent({
      action: 'DEACTIVATE_EMPLOYEE',
      resourceType: 'employees',
      resourceId: id,
      reason,
      newState: { is_active: false, employment_status: 'INACTIVE' },
    })

    revalidatePath('/hr/employees')
    revalidatePath(`/hr/employees/${id}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to deactivate employee' }
  }
}

export async function reactivateEmployee(id: string): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('employees')
      .update({
        is_active: true,
        employment_status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error

    await logAuditEvent({
      action: 'REACTIVATE_EMPLOYEE',
      resourceType: 'employees',
      resourceId: id,
      newState: { is_active: true, employment_status: 'ACTIVE' },
    })

    revalidatePath('/hr/employees')
    revalidatePath(`/hr/employees/${id}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to reactivate employee' }
  }
}

export async function transferDepartment(
  employeeId: string,
  newDeptId: string,
  effectiveDate: string
): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { data: previous } = await adminClient
      .from('employees')
      .select('department_id')
      .eq('id', employeeId)
      .single()

    const { error } = await adminClient
      .from('employees')
      .update({
        department_id: newDeptId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', employeeId)

    if (error) throw error

    await logAuditEvent({
      action: 'TRANSFER_DEPARTMENT',
      resourceType: 'employees',
      resourceId: employeeId,
      previousState: { department_id: previous?.department_id },
      newState: { department_id: newDeptId, effective_date: effectiveDate },
    })

    revalidatePath('/hr/employees')
    revalidatePath(`/hr/employees/${employeeId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to transfer department' }
  }
}

export async function changeManager(
  employeeId: string,
  newManagerId: string,
  effectiveDate: string
): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    // Deactivate previous primary manager
    await adminClient
      .from('reporting_relationships')
      .update({
        is_active: false,
        effective_to: effectiveDate,
      })
      .eq('employee_id', employeeId)
      .eq('relationship_type', 'PRIMARY')
      .eq('is_active', true)

    // Insert new reporting relationship
    const { error } = await adminClient.from('reporting_relationships').insert({
      employee_id: employeeId,
      manager_id: newManagerId,
      relationship_type: 'PRIMARY',
      effective_from: effectiveDate,
      is_active: true,
    })

    if (error) throw error

    await logAuditEvent({
      action: 'CHANGE_MANAGER',
      resourceType: 'employees',
      resourceId: employeeId,
      newState: { new_manager_id: newManagerId, effective_from: effectiveDate },
    })

    revalidatePath('/hr/employees')
    revalidatePath(`/hr/employees/${employeeId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to change manager' }
  }
}

export async function assignRole(employeeId: string, roleCode: RoleCode): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { data: roleRow, error: roleError } = await adminClient
      .from('roles')
      .select('id')
      .eq('organization_id', user.organizationId)
      .eq('code', roleCode)
      .single()

    if (roleError || !roleRow) throw new Error(`Role ${roleCode} not found`)

    const { error } = await adminClient.from('employee_role_assignments').upsert({
      employee_id: employeeId,
      role_id: roleRow.id,
      assigned_by: user.employeeId,
      is_active: true,
    })

    if (error) throw error

    await logAuditEvent({
      action: 'ASSIGN_ROLE',
      resourceType: 'employees',
      resourceId: employeeId,
      newState: { roleCode, roleId: roleRow.id },
    })

    revalidatePath('/hr/employees')
    revalidatePath(`/hr/employees/${employeeId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to assign role' }
  }
}

export async function removeRole(employeeId: string, roleCode: RoleCode): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { data: roleRow } = await adminClient
      .from('roles')
      .select('id')
      .eq('organization_id', user.organizationId)
      .eq('code', roleCode)
      .single()

    if (roleRow) {
      await adminClient
        .from('employee_role_assignments')
        .update({ is_active: false })
        .eq('employee_id', employeeId)
        .eq('role_id', roleRow.id)
    }

    await logAuditEvent({
      action: 'REMOVE_ROLE',
      resourceType: 'employees',
      resourceId: employeeId,
      newState: { roleCode },
    })

    revalidatePath('/hr/employees')
    revalidatePath(`/hr/employees/${employeeId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to remove role' }
  }
}

export async function importEmployeesCSV(csvData: string): Promise<{ imported: number; errors: string[] }> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()
    const lines = csvData.trim().split(/\r?\n/)
    if (lines.length <= 1) {
      return { imported: 0, errors: ['CSV file is empty or missing data rows'] }
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const codeIdx = headers.indexOf('employee_code')
    const nameIdx = headers.indexOf('full_name')
    const emailIdx = headers.indexOf('work_email')
    const desigIdx = headers.indexOf('designation')
    const joinIdx = headers.indexOf('date_of_joining')

    if (nameIdx === -1 || emailIdx === -1) {
      return { imported: 0, errors: ['Header must contain full_name and work_email'] }
    }

    let imported = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))

      const fullName = cols[nameIdx]
      const workEmail = cols[emailIdx]
      const code = codeIdx >= 0 && cols[codeIdx] ? cols[codeIdx] : `EMP-${1000 + i}`
      const designation = desigIdx >= 0 && cols[desigIdx] ? cols[desigIdx] : 'Staff'
      const doj = joinIdx >= 0 && cols[joinIdx] ? cols[joinIdx] : new Date().toISOString().split('T')[0]

      if (!fullName || !workEmail) {
        errors.push(`Row ${i}: Missing full name or email`)
        continue
      }

      const { error: insError } = await adminClient.from('employees').insert({
        organization_id: user.organizationId,
        employee_code: code,
        full_name: fullName,
        work_email: workEmail,
        designation,
        date_of_joining: doj,
        employment_type: 'FULL_TIME',
        employment_status: 'ACTIVE',
        is_active: true,
      })

      if (insError) {
        errors.push(`Row ${i} (${workEmail}): ${insError.message}`)
      } else {
        imported++
      }
    }

    revalidatePath('/hr/employees')
    return { imported, errors }
  } catch (error: any) {
    return { imported: 0, errors: [error?.message || 'CSV Import failed'] }
  }
}

// -----------------------------------------------------------------------------
// 3. Leave Balance Management
// -----------------------------------------------------------------------------

export async function adjustLeaveBalance(params: {
  employeeId: string
  leaveTypeId: string
  amount: number
  reason: string
  transactionType: 'MANUAL_ADJUSTMENT' | 'CARRY_FORWARD' | 'EXPIRY'
}): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()
    const currentYear = new Date().getFullYear()

    // Get current balance record or create one
    const { data: balance, error: balError } = await adminClient
      .from('leave_balances')
      .select('*')
      .eq('employee_id', params.employeeId)
      .eq('leave_type_id', params.leaveTypeId)
      .eq('fiscal_year', currentYear)
      .maybeSingle()

    let balanceBefore = 0
    let balanceRecordId = balance?.id

    if (!balance) {
      const { data: newBal, error: createError } = await adminClient
        .from('leave_balances')
        .insert({
          organization_id: user.organizationId,
          employee_id: params.employeeId,
          leave_type_id: params.leaveTypeId,
          fiscal_year: currentYear,
          opening_balance: 0,
          accrued: 0,
          used: 0,
          pending: 0,
          adjusted: 0,
          carried_forward: 0,
          expired: 0,
        })
        .select('*')
        .single()

      if (createError) throw createError
      balanceRecordId = newBal.id
      balanceBefore = 0
    } else {
      balanceBefore = Number(balance.closing_balance ?? balance.available_balance ?? 0)
    }

    const balanceAfter = balanceBefore + params.amount

    if (!balanceRecordId) {
      throw new Error('Failed to obtain balance record ID')
    }

    // Update balance table
    if (params.transactionType === 'MANUAL_ADJUSTMENT') {
      const currentAdj = Number(balance?.adjusted ?? 0)
      await adminClient
        .from('leave_balances')
        .update({
          adjusted: currentAdj + params.amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', balanceRecordId)
    } else if (params.transactionType === 'CARRY_FORWARD') {
      const currentCF = Number(balance?.carried_forward ?? 0)
      await adminClient
        .from('leave_balances')
        .update({
          carried_forward: currentCF + params.amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', balanceRecordId)
    } else if (params.transactionType === 'EXPIRY') {
      const currentExp = Number(balance?.expired ?? 0)
      await adminClient
        .from('leave_balances')
        .update({
          expired: currentExp + Math.abs(params.amount),
          updated_at: new Date().toISOString(),
        })
        .eq('id', balanceRecordId)
    }

    // Insert into ledger
    await adminClient.from('leave_balance_ledger').insert({
      organization_id: user.organizationId,
      employee_id: params.employeeId,
      leave_type_id: params.leaveTypeId,
      fiscal_year: currentYear,
      transaction_type: params.transactionType,
      amount: params.amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      reason: params.reason,
      performed_by: user.employeeId,
    })

    await logAuditEvent({
      action: 'ADJUST_LEAVE_BALANCE',
      resourceType: 'leave_balances',
      resourceId: balanceRecordId,
      reason: params.reason,
      newState: { employeeId: params.employeeId, amount: params.amount, type: params.transactionType },
    })

    revalidatePath('/hr/leave-balances')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to adjust balance' }
  }
}

// -----------------------------------------------------------------------------
// 4. Policy Management
// -----------------------------------------------------------------------------

export async function createLeavePolicy(data: CreatePolicyInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { data: newPolicy, error } = await adminClient
      .from('leave_policies')
      .insert({
        organization_id: user.organizationId,
        leave_type_id: data.leaveTypeId,
        name: data.name,
        annual_entitlement: data.annualEntitlement,
        accrual_type: data.accrualType,
        accrual_amount: data.accrualAmount ?? 0,
        accrual_start_month: data.accrualStartMonth ?? 1,
        probation_eligible: !!data.probationEligible,
        probation_days: data.probationDays ?? null,
        carry_forward_enabled: !!data.carryForwardEnabled,
        carry_forward_max_days: data.carryForwardMaxDays ?? null,
        carry_forward_expiry_months: data.carryForwardExpiryMonths ?? null,
        max_consecutive_days: data.maxConsecutiveDays ?? null,
        min_notice_days: data.minNoticeDays ?? 0,
        max_advance_days: data.maxAdvanceDays ?? null,
        allows_backdated: !!data.allowsBackdated,
        backdated_max_days: data.backdatedMaxDays ?? null,
        encashment_eligible: !!data.encashmentEligible,
        applicable_employment_types: data.applicableEmploymentTypes || ['FULL_TIME'],
        applicable_grades: data.applicableGrades ?? null,
        applicable_department_ids: data.applicableDepartmentIds ?? null,
        version: 1,
        effective_from: data.effectiveFrom,
        effective_to: data.effectiveTo ?? null,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) throw error

    // Create initial version record
    await adminClient.from('leave_policy_versions').insert({
      policy_id: newPolicy.id,
      version: 1,
      policy_snapshot: data as any,
      changed_by: user.employeeId,
      change_reason: 'Initial policy creation',
    })

    revalidatePath('/hr/leave-policies')
    return { success: true, data: { id: newPolicy.id } }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create policy' }
  }
}

export async function updateLeavePolicy(id: string, data: UpdatePolicyInput): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    // Fetch existing policy
    const { data: existing, error: fetchErr } = await adminClient
      .from('leave_policies')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) throw new Error('Policy not found')

    const newVersion = (existing.version || 1) + 1

    const updatePayload: Record<string, any> = {
      version: newVersion,
      updated_at: new Date().toISOString(),
    }
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.annualEntitlement !== undefined) updatePayload.annual_entitlement = data.annualEntitlement
    if (data.accrualType !== undefined) updatePayload.accrual_type = data.accrualType
    if (data.accrualAmount !== undefined) updatePayload.accrual_amount = data.accrualAmount
    if (data.probationEligible !== undefined) updatePayload.probation_eligible = data.probationEligible
    if (data.carryForwardEnabled !== undefined) updatePayload.carry_forward_enabled = data.carryForwardEnabled
    if (data.carryForwardMaxDays !== undefined) updatePayload.carry_forward_max_days = data.carryForwardMaxDays
    if (data.maxConsecutiveDays !== undefined) updatePayload.max_consecutive_days = data.maxConsecutiveDays
    if (data.minNoticeDays !== undefined) updatePayload.min_notice_days = data.minNoticeDays
    if (data.allowsBackdated !== undefined) updatePayload.allows_backdated = data.allowsBackdated
    if (data.backdatedMaxDays !== undefined) updatePayload.backdated_max_days = data.backdatedMaxDays
    if (data.effectiveFrom !== undefined) updatePayload.effective_from = data.effectiveFrom

    // Update policy
    const { error: updErr } = await adminClient.from('leave_policies').update(updatePayload).eq('id', id)
    if (updErr) throw updErr

    // Archive snapshot in leave_policy_versions without modifying historical employee balances
    await adminClient.from('leave_policy_versions').insert({
      policy_id: id,
      version: newVersion,
      policy_snapshot: { ...existing, ...updatePayload },
      changed_by: user.employeeId,
      change_reason: data.changeReason || `Updated to version ${newVersion}`,
    })

    revalidatePath('/hr/leave-policies')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update policy' }
  }
}

export async function assignPolicyToEmployees(policyId: string, employeeIds: string[]): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    for (const empId of employeeIds) {
      await adminClient.from('employee_policy_assignments').insert({
        employee_id: empId,
        policy_id: policyId,
        effective_from: today,
        assigned_by: user.employeeId,
        is_active: true,
      })
    }

    revalidatePath('/hr/leave-policies')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to assign policy' }
  }
}

// -----------------------------------------------------------------------------
// 5. Holiday Management
// -----------------------------------------------------------------------------

export async function createHolidayCalendar(data: CreateHolidayCalendarInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { data: newCal, error } = await adminClient
      .from('holiday_calendars')
      .insert({
        organization_id: user.organizationId,
        name: data.name,
        year: data.year,
        location: data.location || null,
        department_id: data.departmentId || null,
        is_default: !!data.isDefault,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/hr/holidays')
    return { success: true, data: { id: newCal.id } }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create holiday calendar' }
  }
}

export async function addHoliday(calendarId: string, data: AddHolidayInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { data: newHoliday, error } = await adminClient
      .from('holidays')
      .insert({
        calendar_id: calendarId,
        organization_id: user.organizationId,
        name: data.name,
        holiday_date: data.holidayDate,
        holiday_type: data.holidayType || 'NATIONAL',
        is_optional: !!data.isOptional,
        description: data.description || null,
      })
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/hr/holidays')
    return { success: true, data: { id: newHoliday.id } }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to add holiday' }
  }
}

export async function updateHoliday(id: string, data: Partial<AddHolidayInput>): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const updatePayload: Record<string, any> = {}
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.holidayDate !== undefined) updatePayload.holiday_date = data.holidayDate
    if (data.holidayType !== undefined) updatePayload.holiday_type = data.holidayType
    if (data.isOptional !== undefined) updatePayload.is_optional = data.isOptional
    if (data.description !== undefined) updatePayload.description = data.description

    const { error } = await adminClient.from('holidays').update(updatePayload).eq('id', id)
    if (error) throw error

    revalidatePath('/hr/holidays')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update holiday' }
  }
}

export async function deleteHoliday(id: string): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient.from('holidays').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/hr/holidays')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to delete holiday' }
  }
}

export async function importHolidaysCSV(calendarId: string, csvData: string): Promise<{ imported: number; errors: string[] }> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const lines = csvData.trim().split(/\r?\n/)
    if (lines.length <= 1) {
      return { imported: 0, errors: ['CSV is empty'] }
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const nameIdx = headers.indexOf('name')
    const dateIdx = headers.indexOf('holiday_date')
    const typeIdx = headers.indexOf('holiday_type')
    const optIdx = headers.indexOf('is_optional')

    if (nameIdx === -1 || dateIdx === -1) {
      return { imported: 0, errors: ['CSV headers must include name and holiday_date'] }
    }

    let imported = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))

      const name = cols[nameIdx]
      const holidayDate = cols[dateIdx]
      const holidayType = typeIdx >= 0 && cols[typeIdx] ? (cols[typeIdx] as any) : 'NATIONAL'
      const isOptional = optIdx >= 0 && cols[optIdx].toLowerCase() === 'true'

      if (!name || !holidayDate) {
        errors.push(`Row ${i}: Missing name or date`)
        continue
      }

      const { error: insErr } = await adminClient.from('holidays').insert({
        calendar_id: calendarId,
        organization_id: user.organizationId,
        name,
        holiday_date: holidayDate,
        holiday_type: holidayType,
        is_optional: isOptional,
      })

      if (insErr) {
        errors.push(`Row ${i} (${name}): ${insErr.message}`)
      } else {
        imported++
      }
    }

    revalidatePath('/hr/holidays')
    return { imported, errors }
  } catch (error: any) {
    return { imported: 0, errors: [error?.message || 'Failed to import holidays'] }
  }
}

// -----------------------------------------------------------------------------
// 6. Work Schedules
// -----------------------------------------------------------------------------

export async function createWorkSchedule(data: CreateWorkScheduleInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    if (data.isDefault) {
      // Unset previous defaults
      await adminClient
        .from('work_schedules')
        .update({ is_default: false })
        .eq('organization_id', user.organizationId)
    }

    const { data: newSchedule, error } = await adminClient
      .from('work_schedules')
      .insert({
        organization_id: user.organizationId,
        name: data.name,
        description: data.description || null,
        working_days: data.workingDays,
        hours_per_day: data.hoursPerDay,
        is_default: !!data.isDefault,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/hr/work-schedules')
    return { success: true, data: { id: newSchedule.id } }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create schedule' }
  }
}

export async function updateWorkSchedule(id: string, data: Partial<CreateWorkScheduleInput>): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    if (data.isDefault) {
      await adminClient
        .from('work_schedules')
        .update({ is_default: false })
        .eq('organization_id', user.organizationId)
    }

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() }
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.description !== undefined) updatePayload.description = data.description
    if (data.workingDays !== undefined) updatePayload.working_days = data.workingDays
    if (data.hoursPerDay !== undefined) updatePayload.hours_per_day = data.hoursPerDay
    if (data.isDefault !== undefined) updatePayload.is_default = data.isDefault

    const { error } = await adminClient.from('work_schedules').update(updatePayload).eq('id', id)
    if (error) throw error

    revalidatePath('/hr/work-schedules')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update schedule' }
  }
}

export async function deleteWorkSchedule(id: string): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient.from('work_schedules').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/hr/work-schedules')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to delete schedule' }
  }
}

export async function assignWorkSchedule(scheduleId: string, employeeIds: string[]): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    for (const empId of employeeIds) {
      await adminClient.from('employee_work_schedules').insert({
        employee_id: empId,
        work_schedule_id: scheduleId,
        effective_from: today,
        is_active: true,
      })
    }

    revalidatePath('/hr/work-schedules')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to assign schedule' }
  }
}

// -----------------------------------------------------------------------------
// 7. Department Management
// -----------------------------------------------------------------------------

export async function createDepartment(data: CreateDepartmentInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { data: newDept, error } = await adminClient
      .from('departments')
      .insert({
        organization_id: user.organizationId,
        name: data.name,
        code: data.code || null,
        parent_department_id: data.parentDepartmentId || null,
        head_employee_id: data.headEmployeeId || null,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/hr/departments')
    return { success: true, data: { id: newDept.id } }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create department' }
  }
}

export async function updateDepartment(id: string, data: Partial<CreateDepartmentInput>): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() }
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.code !== undefined) updatePayload.code = data.code
    if (data.parentDepartmentId !== undefined) updatePayload.parent_department_id = data.parentDepartmentId
    if (data.headEmployeeId !== undefined) updatePayload.head_employee_id = data.headEmployeeId

    const { error } = await adminClient.from('departments').update(updatePayload).eq('id', id)
    if (error) throw error

    revalidatePath('/hr/departments')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update department' }
  }
}

export async function deleteDepartment(id: string): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    // Check if employees are assigned
    const { count } = await adminClient
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('department_id', id)

    if (count && count > 0) {
      return { success: false, error: `Cannot delete department with ${count} active employees. Transfer them first.` }
    }

    const { error } = await adminClient.from('departments').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/hr/departments')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to delete department' }
  }
}

// -----------------------------------------------------------------------------
// 8. Leave Types Management
// -----------------------------------------------------------------------------

export async function createLeaveType(data: CreateLeaveTypeInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { data: newType, error } = await adminClient
      .from('leave_types')
      .insert({
        organization_id: user.organizationId,
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || null,
        color: data.color || '#3B82F6',
        icon: data.icon || null,
        requires_document: !!data.requiresDocument,
        document_description: data.documentDescription || null,
        allows_half_day: data.allowsHalfDay !== false,
        allows_negative_balance: !!data.allowsNegativeBalance,
        is_paid: data.isPaid !== false,
        display_order: data.displayOrder || 0,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/hr/leave-types')
    return { success: true, data: { id: newType.id } }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create leave type' }
  }
}

export async function updateLeaveType(id: string, data: Partial<CreateLeaveTypeInput>): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() }
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.code !== undefined) updatePayload.code = data.code.toUpperCase()
    if (data.description !== undefined) updatePayload.description = data.description
    if (data.color !== undefined) updatePayload.color = data.color
    if (data.requiresDocument !== undefined) updatePayload.requires_document = data.requiresDocument
    if (data.documentDescription !== undefined) updatePayload.document_description = data.documentDescription
    if (data.allowsHalfDay !== undefined) updatePayload.allows_half_day = data.allowsHalfDay
    if (data.allowsNegativeBalance !== undefined) updatePayload.allows_negative_balance = data.allowsNegativeBalance
    if (data.isPaid !== undefined) updatePayload.is_paid = data.isPaid
    if (data.displayOrder !== undefined) updatePayload.display_order = data.displayOrder

    const { error } = await adminClient.from('leave_types').update(updatePayload).eq('id', id)
    if (error) throw error

    revalidatePath('/hr/leave-types')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update leave type' }
  }
}

export async function toggleLeaveTypeStatus(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('leave_types')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/hr/leave-types')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to toggle leave type' }
  }
}

export async function reorderLeaveTypes(orderedIds: string[]): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    for (let i = 0; i < orderedIds.length; i++) {
      await adminClient
        .from('leave_types')
        .update({ display_order: i })
        .eq('id', orderedIds[i])
    }

    revalidatePath('/hr/leave-types')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to reorder leave types' }
  }
}

// -----------------------------------------------------------------------------
// 9. Workflows Management
// -----------------------------------------------------------------------------

export async function createApprovalWorkflow(data: CreateWorkflowInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    if (data.isDefault) {
      await adminClient
        .from('approval_workflows')
        .update({ is_default: false })
        .eq('organization_id', user.organizationId)
    }

    const { data: newWf, error } = await adminClient
      .from('approval_workflows')
      .insert({
        organization_id: user.organizationId,
        name: data.name,
        description: data.description || null,
        leave_type_ids: data.leaveTypeIds || null,
        applies_to_all_leave_types: data.appliesToAllLeaveTypes !== false,
        department_ids: data.departmentIds || null,
        applies_to_all_departments: data.appliesToAllDepartments !== false,
        min_duration_days: data.minDurationDays || null,
        max_duration_days: data.maxDurationDays || null,
        is_default: !!data.isDefault,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) throw error

    revalidatePath('/hr/approval-workflows')
    return { success: true, data: { id: newWf.id } }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to create workflow' }
  }
}

export async function updateApprovalWorkflow(id: string, data: Partial<CreateWorkflowInput>): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    if (data.isDefault) {
      await adminClient
        .from('approval_workflows')
        .update({ is_default: false })
        .eq('organization_id', user.organizationId)
    }

    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() }
    if (data.name !== undefined) updatePayload.name = data.name
    if (data.description !== undefined) updatePayload.description = data.description
    if (data.appliesToAllLeaveTypes !== undefined) updatePayload.applies_to_all_leave_types = data.appliesToAllLeaveTypes
    if (data.appliesToAllDepartments !== undefined) updatePayload.applies_to_all_departments = data.appliesToAllDepartments
    if (data.minDurationDays !== undefined) updatePayload.min_duration_days = data.minDurationDays
    if (data.maxDurationDays !== undefined) updatePayload.max_duration_days = data.maxDurationDays
    if (data.isDefault !== undefined) updatePayload.is_default = data.isDefault

    const { error } = await adminClient.from('approval_workflows').update(updatePayload).eq('id', id)
    if (error) throw error

    revalidatePath('/hr/approval-workflows')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update workflow' }
  }
}

export async function deleteApprovalWorkflow(id: string): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient.from('approval_workflows').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/hr/approval-workflows')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to delete workflow' }
  }
}

export async function addWorkflowStep(workflowId: string, data: WorkflowStepInput): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient.from('approval_workflow_steps').insert({
      workflow_id: workflowId,
      step_order: data.stepOrder,
      step_name: data.stepName,
      approver_type: data.approverType,
      approver_role_id: data.approverRoleId || null,
      approver_employee_id: data.approverEmployeeId || null,
      is_mandatory: data.isMandatory !== false,
      can_skip_conditions: data.canSkipConditions || null,
    })

    if (error) throw error

    revalidatePath('/hr/approval-workflows')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to add step' }
  }
}

export async function deleteWorkflowStep(stepId: string): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient.from('approval_workflow_steps').delete().eq('id', stepId)
    if (error) throw error

    revalidatePath('/hr/approval-workflows')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to delete step' }
  }
}

// -----------------------------------------------------------------------------
// 10. Organization Settings Management
// -----------------------------------------------------------------------------

export interface OrganizationSettingsInput {
  leaveYearType: 'CALENDAR' | 'FISCAL'
  maxPendingPerEmployee: number
  allowConcurrentLeaves: boolean
  overlapPolicy?: 'BLOCK' | 'WARN_AND_ALLOW' | 'ALLOW'
  minTeamCoveragePercent: number
  requireHandoverNotes: boolean
  autoApproveAfterDays?: number
  enableEmailNotifications: boolean
  enablePushNotifications: boolean
  workingHoursPerDay: number
}

export async function updateOrganizationSettings(data: Partial<OrganizationSettingsInput>): Promise<ActionResult> {
  try {
    const user = await verifyHrAdmin()
    const adminClient = createAdminClient()

    const payload: Record<string, any> = { updated_at: new Date().toISOString() }
    if (data.leaveYearType !== undefined) payload.leave_year_type = data.leaveYearType
    if (data.maxPendingPerEmployee !== undefined) payload.max_pending_per_employee = data.maxPendingPerEmployee
    if (data.allowConcurrentLeaves !== undefined) payload.allow_concurrent_leaves = data.allowConcurrentLeaves
    if (data.overlapPolicy !== undefined) payload.overlap_policy = data.overlapPolicy
    if (data.minTeamCoveragePercent !== undefined) payload.min_team_coverage_percent = data.minTeamCoveragePercent
    if (data.requireHandoverNotes !== undefined) payload.require_handover_notes = data.requireHandoverNotes
    if (data.autoApproveAfterDays !== undefined) payload.auto_approve_after_days = data.autoApproveAfterDays
    if (data.enableEmailNotifications !== undefined) payload.enable_email_notifications = data.enableEmailNotifications
    if (data.enablePushNotifications !== undefined) payload.enable_push_notifications = data.enablePushNotifications
    if (data.workingHoursPerDay !== undefined) payload.working_hours_per_day = data.workingHoursPerDay

    const { error } = await adminClient
      .from('organization_settings')
      .upsert({
        organization_id: user.organizationId,
        ...payload,
      })

    if (error) throw error

    await logAuditEvent({
      action: 'UPDATE_ORGANIZATION_SETTINGS',
      resourceType: 'organization_settings',
      newState: payload,
    })

    revalidatePath('/hr/settings')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to update settings' }
  }
}

// -----------------------------------------------------------------------------
// 11. Audit Logging
// -----------------------------------------------------------------------------

export async function logAuditEvent(params: {
  action: string
  resourceType: string
  resourceId?: string
  previousState?: any
  newState?: any
  reason?: string
}): Promise<void> {
  try {
    const user = await getCurrentUser()
    const adminClient = createAdminClient()

    await adminClient.from('audit_logs').insert({
      organization_id: user?.organizationId || null,
      actor_id: user?.employeeId || null,
      actor_email: user?.email || 'system',
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      previous_state: params.previousState ? (params.previousState as any) : null,
      new_state: params.newState ? (params.newState as any) : null,
      reason: params.reason || null,
    })
  } catch (err) {
    console.warn('Failed to log audit event:', err)
  }
}

// -----------------------------------------------------------------------------
// Aliases & Report Export
// -----------------------------------------------------------------------------

export const approveHRLeaveRequest = hrApproveRequest
export const rejectHRLeaveRequest = hrRejectRequest
export const addEmployee = createEmployee
export const createHoliday = addHoliday

export async function exportLeaveReport(reportType: string, filters?: Record<string, any>): Promise<ActionResult<{ csvData: string; filename: string }>> {
  try {
    await verifyHrAdmin()
    const today = new Date().toISOString().split('T')[0]
    const filename = `leave_report_${reportType}_${today}.csv`
    const csvData = `Report,Generated At,Scope\n${reportType},${today},Organization-wide\n`
    return {
      success: true,
      data: { csvData, filename },
    }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to export report' }
  }
}

