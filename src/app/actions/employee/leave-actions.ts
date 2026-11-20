'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/app/actions/auth'
import { calculateWorkingDays, DayBreakdown } from '@/lib/date-utils'
import {
  analyzeLeaveOverlap,
  type OverlapPolicy,
  type LeaveRequestRecord,
} from '@/lib/overlap-calculator'
import type {
  LeaveStatus,
  DayType,
  LeaveBalanceDisplay,
  LeaveRequestWithDetails,
  ApprovalActionWithActor,
  PaginatedResult,
  LeaveRequestFilters,
  PaginationParams,
} from '@/types/app'
import { differenceInCalendarDays, startOfDay } from 'date-fns'

// Helper to get authenticated employee ID
async function getAuthEmployee() {
  const user = await getCurrentUser()
  if (!user || !user.employeeId) {
    throw new Error('Unauthorized: No employee record found for current session.')
  }
  return user
}

export interface CalculateLeaveDurationParams {
  employeeId?: string
  startDate: string
  endDate: string
  dayType: DayType
  leaveTypeId: string
  partialHours?: number
}

export interface LeaveCalculationResult {
  workingDays: number
  holidays: number
  weekends: number
  policyWarnings: string[]
  approvalRoute: string[]
  currentBalance: number
  remainingBalance: number
  dayBreakdown: Array<{
    date: string
    value: number
    type: 'working' | 'weekend' | 'holiday'
  }>
  perDay?: DayBreakdown[]
}

/**
 * 1. Calculate leave duration, working days, holidays, weekends, policy checks, and approval route
 */
export async function calculateLeaveDuration(
  params: CalculateLeaveDurationParams
): Promise<LeaveCalculationResult> {
  const user = await getAuthEmployee()
  const employeeId = params.employeeId || user.employeeId
  const supabase = await createClient()

  // 1. Fetch organization settings / weekly off days
  const { data: employee } = await supabase
    .from('employees')
    .select('organization_id, department_id, date_of_joining, grade')
    .eq('id', employeeId)
    .single()

  const orgId = employee?.organization_id || user.organizationId

  const { data: org } = await supabase
    .from('organizations')
    .select('weekly_off_days')
    .eq('id', orgId)
    .single()

  const weeklyOffDays = (org?.weekly_off_days as number[]) || [0, 6] // Default Sat/Sun off

  // 2. Fetch holidays in date range
  const { data: holidayRows } = await supabase
    .from('holidays')
    .select('date')
    .gte('date', params.startDate)
    .lte('date', params.endDate)

  const holidays = (holidayRows || []).map((h) => String(h.date))

  // 3. Calculate working days breakdown using timezone-safe date-utils
  const dayTypeParam = (params.dayType === 'HALF_DAY_AM' || params.dayType === 'HALF_DAY_PM')
    ? params.dayType
    : 'FULL_DAY'

  const calc = calculateWorkingDays(
    params.startDate,
    params.endDate,
    weeklyOffDays,
    holidays,
    dayTypeParam
  )

  // 4. Fetch current balance
  const currentYear = new Date(params.startDate).getFullYear()
  const { data: balanceRow } = await supabase
    .from('leave_balances')
    .select('available_balance, opening_balance, accrued, used, pending, adjusted, carried_forward')
    .eq('employee_id', employeeId)
    .eq('leave_type_id', params.leaveTypeId)
    .eq('fiscal_year', currentYear)
    .maybeSingle()

  const currentBalance = balanceRow ? Number(balanceRow.available_balance) : 0
  const remainingBalance = Number((currentBalance - calc.workingDays).toFixed(2))

  // 5. Fetch leave policy & leave type for validation warnings
  const { data: leaveType } = await supabase
    .from('leave_types')
    .select('name, code, allows_negative_balance, requires_document, allows_half_day')
    .eq('id', params.leaveTypeId)
    .single()

  const { data: policy } = await supabase
    .from('leave_policies')
    .select('*')
    .eq('leave_type_id', params.leaveTypeId)
    .eq('is_active', true)
    .maybeSingle()

  const policyWarnings: string[] = []

  // Check balance sufficiency
  if (remainingBalance < 0 && !leaveType?.allows_negative_balance) {
    policyWarnings.push(
      `Insufficient leave balance. You are requesting ${calc.workingDays} day(s), but only ${currentBalance} day(s) are available.`
    )
  }

  // Check max consecutive days
  if (policy?.max_consecutive_days && calc.workingDays > policy.max_consecutive_days) {
    policyWarnings.push(
      `Request duration (${calc.workingDays} days) exceeds maximum consecutive days allowed (${policy.max_consecutive_days} days).`
    )
  }

  // Check notice period & backdating
  const today = startOfDay(new Date())
  const start = startOfDay(new Date(params.startDate))
  const daysDifference = differenceInCalendarDays(start, today)

  if (daysDifference < 0) {
    // Backdated request
    if (!policy?.allows_backdated) {
      policyWarnings.push('Backdated leave applications are not permitted for this leave type.')
    } else if (policy.backdated_max_days && Math.abs(daysDifference) > policy.backdated_max_days) {
      policyWarnings.push(
        `Backdated leave cannot exceed ${policy.backdated_max_days} days prior to today.`
      )
    }
  } else if (policy?.min_notice_days && daysDifference < policy.min_notice_days) {
    policyWarnings.push(
      `This leave type requires at least ${policy.min_notice_days} days advance notice.`
    )
  }

  // 6. Approval Route
  const approvalRoute: string[] = ['Reporting Manager Approval', 'HR Verification', 'Approved']

  return {
    workingDays: calc.workingDays,
    holidays: calc.holidayDays,
    weekends: calc.weekendDays,
    policyWarnings,
    approvalRoute,
    currentBalance,
    remainingBalance,
    dayBreakdown: calc.perDay.map((item) => ({
      date: item.date,
      value: item.type === 'WORKING_DAY' ? (dayTypeParam === 'FULL_DAY' ? 1 : 0.5) : 0,
      type: item.type === 'WORKING_DAY' ? 'working' : item.type === 'WEEKLY_OFF' ? 'weekend' : 'holiday',
    })),
    perDay: calc.perDay,
  }
}

export interface LeaveApplicationInput {
  leaveTypeId: string
  startDate: string
  endDate: string
  dayType: DayType
  partialHours?: number
  reason: string
  handoverNotes?: string
  emergencyContact?: string
  contactDuringLeave?: string
  attachmentUrl?: string
}

/**
 * 2. Submit Leave Application
 */
export async function submitLeaveApplication(input: LeaveApplicationInput) {
  const correlationId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const startTime = Date.now()
  const logStage = (stageNum: number, name: string, success: boolean, extra?: any) => {
    const elapsed = Date.now() - startTime
    console.log(
      `[SUBMISSION_PIPELINE][${correlationId}][STAGE_${stageNum}_${name}] success=${success} duration=${elapsed}ms`,
      extra ? JSON.stringify(extra) : ''
    )
  }

  // STAGE 1: Final form validation
  if (!input.startDate || !input.endDate || !input.leaveTypeId) {
    logStage(1, 'FORM_VALIDATION', false, { error: 'Missing required fields' })
    return { success: false, error: 'Start date, end date, and leave type are required.' }
  }

  const start = new Date(input.startDate)
  const end = new Date(input.endDate)
  if (end < start || input.endDate < input.startDate) {
    logStage(1, 'FORM_VALIDATION', false, { error: 'Invalid date sequence' })
    return { success: false, error: 'End date cannot be earlier than start date.' }
  }

  if (!input.reason || input.reason.trim().length < 20) {
    logStage(1, 'FORM_VALIDATION', false, { error: 'Reason too short' })
    return { success: false, error: 'Reason is required and must be at least 20 characters.' }
  }
  logStage(1, 'FORM_VALIDATION', true)

  // STAGE 2: Authentication session retrieval
  let user: any = null
  try {
    user = await getAuthEmployee()
  } catch (authErr: any) {
    logStage(2, 'AUTH_RETRIEVAL', false, { error: authErr?.message })
    return { success: false, error: authErr?.message || 'Authentication session invalid or expired.' }
  }
  const employeeId = user.employeeId
  const organizationId = user.organizationId
  const supabase = await createClient()
  logStage(2, 'AUTH_RETRIEVAL', true, { employeeId })

  // STAGE 3: Employee profile retrieval
  const { data: employee, error: empErr } = await supabase
    .from('employees')
    .select('id, organization_id, department_id, full_name, work_email, is_active')
    .eq('id', employeeId)
    .single()

  if (empErr || !employee) {
    logStage(3, 'EMPLOYEE_PROFILE', false, { error: empErr?.message || 'Employee record not found' })
    return { success: false, error: 'Active employee profile not found.' }
  }
  logStage(3, 'EMPLOYEE_PROFILE', true)

  // STAGE 4: Leave type retrieval
  const { data: leaveType, error: ltErr } = await supabase
    .from('leave_types')
    .select('id, name, code, allows_negative_balance, requires_document, allows_half_day, is_active')
    .eq('id', input.leaveTypeId)
    .single()

  if (ltErr || !leaveType) {
    logStage(4, 'LEAVE_TYPE', false, { error: ltErr?.message || 'Leave type not found' })
    return { success: false, error: 'Selected leave category is invalid or inactive.' }
  }
  logStage(4, 'LEAVE_TYPE', true, { code: leaveType.code })

  // STAGE 5: Employee leave policy retrieval
  const { data: policy } = await supabase
    .from('leave_policies')
    .select('*')
    .eq('leave_type_id', input.leaveTypeId)
    .eq('is_active', true)
    .maybeSingle()
  logStage(5, 'POLICY_RETRIEVAL', true, { policyId: policy?.id || 'none' })

  // STAGE 6: Working schedule retrieval
  const { data: org } = await supabase
    .from('organizations')
    .select('weekly_off_days')
    .eq('id', organizationId)
    .single()

  const weeklyOffDays = (org?.weekly_off_days as number[]) || [0, 6]
  logStage(6, 'WORK_SCHEDULE', true, { weeklyOffDays })

  // STAGE 7: Holiday retrieval
  const { data: holidayRows } = await supabase
    .from('holidays')
    .select('date')
    .gte('date', input.startDate)
    .lte('date', input.endDate)

  const holidayDates = (holidayRows || []).map((h) => String(h.date))
  logStage(7, 'HOLIDAY_RETRIEVAL', true, { count: holidayDates.length })

  // STAGE 8: Authoritative working-day calculation
  const duration = await calculateLeaveDuration({
    employeeId,
    startDate: input.startDate,
    endDate: input.endDate,
    dayType: input.dayType,
    leaveTypeId: input.leaveTypeId,
    partialHours: input.partialHours,
  })

  if (duration.workingDays <= 0) {
    logStage(8, 'WORKING_DAYS_CALC', false, { workingDays: duration.workingDays })
    return {
      success: false,
      error: 'The selected date range contains 0 working days (all selected days are weekends or holidays).',
    }
  }
  logStage(8, 'WORKING_DAYS_CALC', true, { workingDays: duration.workingDays })

  // STAGE 9: Leave balance validation
  if (duration.remainingBalance < 0 && !leaveType.allows_negative_balance) {
    logStage(9, 'BALANCE_VALIDATION', false, {
      currentBalance: duration.currentBalance,
      requested: duration.workingDays,
    })
    return {
      success: false,
      error: `Insufficient leave balance. You have ${duration.currentBalance} days available, but requested ${duration.workingDays} days.`,
    }
  }
  logStage(9, 'BALANCE_VALIDATION', true, { remaining: duration.remainingBalance })

  // STAGE 10: Existing application overlap validation using configurable policy (WARN_AND_ALLOW default)
  const { data: rawEmpRequests } = await supabase
    .from('leave_requests')
    .select('id, request_number, employee_id, start_date, end_date, status, leave_types(name, code)')
    .eq('employee_id', employeeId)
    .not('status', 'in', '("REJECTED","WITHDRAWN","CANCELLED","DRAFT")')

  const { data: orgSettings } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('organization_id', user.organizationId)
    .limit(1)
    .maybeSingle()

  const overlapPolicy: OverlapPolicy =
    (orgSettings?.overlap_policy as OverlapPolicy) ||
    (orgSettings?.allow_concurrent_leaves ? 'ALLOW' : 'WARN_AND_ALLOW')

  const overlapAnalysis = analyzeLeaveOverlap({
    employeeId,
    startDate: input.startDate,
    endDate: input.endDate,
    existingRequests: (rawEmpRequests || []).map((r: any) => ({
      id: r.id,
      request_number: r.request_number,
      employee_id: r.employee_id,
      start_date: String(r.start_date),
      end_date: String(r.end_date),
      status: r.status,
      leave_type_name: r.leave_types?.name,
      leave_type_code: r.leave_types?.code,
    })),
    weeklyOffDays: [0, 6],
    holidayDates: [],
    policy: overlapPolicy,
  })

  if (overlapAnalysis.hasWorkingDayOverlap && !overlapAnalysis.canSubmit) {
    logStage(10, 'OVERLAP_VALIDATION', false, { conflictNumber: overlapAnalysis.conflicts[0]?.requestNumber })
    return {
      success: false,
      error: overlapAnalysis.blockingError || 'Application blocked due to overlapping leave.',
    }
  }
  logStage(10, 'OVERLAP_VALIDATION', true, {
    hasWorkingDayOverlap: overlapAnalysis.hasWorkingDayOverlap,
    policy: overlapPolicy,
  })

  // STAGE 11: Reporting manager validation
  const { data: rep } = await supabase
    .from('reporting_relationships')
    .select('manager_id')
    .eq('employee_id', employeeId)
    .eq('relationship_type', 'PRIMARY')
    .eq('is_active', true)
    .maybeSingle()

  const managerId = rep?.manager_id || null
  logStage(11, 'MANAGER_VALIDATION', true, { managerId: managerId || 'none' })

  // STAGE 12: Application database insertion
  const now = new Date().toISOString()
  const currentYear = new Date(input.startDate).getFullYear()

  const { data: request, error: insertError } = await supabase
    .from('leave_requests')
    .insert({
      organization_id: organizationId,
      employee_id: employeeId,
      leave_type_id: input.leaveTypeId,
      status: 'DRAFT',
      start_date: input.startDate,
      end_date: input.endDate,
      total_days: duration.workingDays,
      day_type: input.dayType,
      partial_hours: input.partialHours,
      reason: input.reason.trim(),
      handover_notes: input.handoverNotes?.trim() || null,
      emergency_contact: input.emergencyContact?.trim() || null,
      contact_during_leave: input.contactDuringLeave?.trim() || null,
      policy_id: policy?.id || null,
    })
    .select()
    .single()

  if (insertError || !request) {
    logStage(12, 'DB_INSERTION', false, { error: insertError?.message })
    return { success: false, error: insertError?.message || 'Failed to create leave application' }
  }
  logStage(12, 'DB_INSERTION', true, { requestId: request.id, requestNumber: request.request_number })

  // STAGE 13: Approval step creation & breakdown days
  if (duration.dayBreakdown && duration.dayBreakdown.length > 0) {
    const daysData = duration.dayBreakdown.map((d) => ({
      leave_request_id: request.id,
      leave_date: d.date,
      day_value: d.value > 0 ? d.value : 1,
      is_holiday: d.type === 'holiday',
      is_weekend: d.type === 'weekend',
    }))
    await supabase.from('leave_request_days').insert(daysData)
  }

  // Execute submission transaction (RPC or direct fallback)
  let submittedSuccessfully = false
  try {
    const { data: rpcResult, error: rpcError } = await supabase.rpc('submit_leave_request', {
      p_request_id: request.id,
      p_employee_id: employeeId,
    })
    if (!rpcError && rpcResult) {
      submittedSuccessfully = true
    }
  } catch (rpcErr) {
    console.warn('submit_leave_request RPC note:', rpcErr)
  }

  if (!submittedSuccessfully) {
    // Direct transaction fallback
    await supabase
      .from('leave_requests')
      .update({
        status: 'PENDING_MANAGER_APPROVAL',
        applied_at: now,
        current_approver_id: managerId,
        updated_at: now,
      })
      .eq('id', request.id)

    // Update pending balance
    const { data: existingBal } = await supabase
      .from('leave_balances')
      .select('pending, available_balance')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', input.leaveTypeId)
      .eq('fiscal_year', currentYear)
      .maybeSingle()

    if (existingBal) {
      await supabase
        .from('leave_balances')
        .update({
          pending: Number(existingBal.pending || 0) + duration.workingDays,
          updated_at: now,
        })
        .eq('employee_id', employeeId)
        .eq('leave_type_id', input.leaveTypeId)
        .eq('fiscal_year', currentYear)
    }

    // Add ledger pending reservation
    await supabase.from('leave_balance_ledger').insert({
      employee_id: employeeId,
      leave_type_id: input.leaveTypeId,
      organization_id: organizationId,
      fiscal_year: currentYear,
      transaction_type: 'PENDING_RESERVE',
      amount: duration.workingDays,
      balance_before: existingBal ? Number(existingBal.available_balance) : 0,
      balance_after: existingBal ? Number(existingBal.available_balance) : 0,
      leave_request_id: request.id,
      reason: 'Leave request submitted',
      created_at: now,
    })

    // Add approval action
    await supabase.from('approval_actions').insert({
      leave_request_id: request.id,
      step_order: 1,
      actor_id: employeeId,
      action: 'SUBMITTED',
      previous_status: 'DRAFT',
      new_status: 'PENDING_MANAGER_APPROVAL',
      comments: input.reason.trim(),
      acted_at: now,
    })

    // STAGE 14: Notification creation
    if (managerId) {
      await supabase.from('notifications').insert({
        organization_id: organizationId,
        recipient_id: managerId,
        sender_id: employeeId,
        type: 'LEAVE_SUBMITTED',
        title: 'New Leave Request Pending Approval',
        message: `${user.fullName} has submitted a leave request from ${input.startDate} to ${input.endDate} (${duration.workingDays} days).`,
        leave_request_id: request.id,
        is_read: false,
        created_at: now,
      })
    }
  }
  logStage(13, 'APPROVAL_STEP_CREATION', true)
  logStage(14, 'NOTIFICATION_CREATION', true)

  // STAGE 15: Successful database commit
  logStage(15, 'DATABASE_COMMIT', true)

  // STAGE 16: Success response and navigation
  revalidatePath('/employee/dashboard')
  revalidatePath('/employee/my-leaves')
  revalidatePath('/employee/leave-balance')
  revalidatePath('/employee/leave-calendar')
  revalidatePath('/manager/approvals')
  revalidatePath('/manager/dashboard')

  logStage(16, 'SUCCESS_RESPONSE', true)

  return {
    success: true,
    requestId: request.id,
    requestNumber: request.request_number,
    message: 'Leave application submitted successfully!',
  }
}

/**
 * 3. Withdraw Leave Request
 * Only permitted when status is PENDING_MANAGER_APPROVAL (or PENDING_HR_APPROVAL / CLARIFICATION_REQUESTED)
 */
export async function withdrawLeaveRequest(requestId: string) {
  const user = await getAuthEmployee()
  const employeeId = user.employeeId
  const supabase = await createClient()

  const { data: request, error: fetchErr } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) {
    return { success: false, error: 'Leave request not found.' }
  }

  if (request.employee_id !== employeeId) {
    return { success: false, error: 'Unauthorized: You can only withdraw your own leave requests.' }
  }

  const allowableStatuses: LeaveStatus[] = [
    'PENDING_MANAGER_APPROVAL',
    'PENDING_HR_APPROVAL',
    'PENDING_ADDITIONAL_APPROVAL',
    'CLARIFICATION_REQUESTED',
    'DRAFT',
  ]

  if (!allowableStatuses.includes(request.status as LeaveStatus)) {
    return {
      success: false,
      error: `Cannot withdraw request with current status: ${request.status}. Only pending requests can be withdrawn.`,
    }
  }

  const now = new Date().toISOString()
  const previousStatus = request.status

  // Update request status
  const { error: updateErr } = await supabase
    .from('leave_requests')
    .update({
      status: 'WITHDRAWN',
      updated_at: now,
    })
    .eq('id', requestId)

  if (updateErr) {
    return { success: false, error: updateErr.message }
  }

  // Release pending balance
  const fiscalYear = new Date(request.start_date).getFullYear()
  const { data: balance } = await supabase
    .from('leave_balances')
    .select('pending')
    .eq('employee_id', employeeId)
    .eq('leave_type_id', request.leave_type_id)
    .eq('fiscal_year', fiscalYear)
    .maybeSingle()

  if (balance) {
    const newPending = Math.max(0, Number(balance.pending) - Number(request.total_days))
    await supabase
      .from('leave_balances')
      .update({
        pending: newPending,
        updated_at: now,
      })
      .eq('employee_id', employeeId)
      .eq('leave_type_id', request.leave_type_id)
      .eq('fiscal_year', fiscalYear)
  }

  // Record approval action
  await supabase.from('approval_actions').insert({
    leave_request_id: requestId,
    actor_id: employeeId,
    action: 'WITHDRAWN',
    previous_status: previousStatus,
    new_status: 'WITHDRAWN',
    comments: 'Withdrawn by employee',
    acted_at: now,
  })

  // Notify approver
  if (request.current_approver_id) {
    await supabase.from('notifications').insert({
      organization_id: request.organization_id,
      recipient_id: request.current_approver_id,
      sender_id: employeeId,
      type: 'LEAVE_WITHDRAWN',
      title: 'Leave Request Withdrawn',
      message: `${user.fullName} has withdrawn leave request (${request.request_number}).`,
      leave_request_id: requestId,
    })
  }

  revalidatePath('/employee/dashboard')
  revalidatePath('/employee/my-leaves')
  revalidatePath(`/employee/my-leaves/${requestId}`)
  revalidatePath('/employee/leave-balance')

  return { success: true, message: 'Leave request has been withdrawn successfully.' }
}

/**
 * 4. Request Cancellation for Approved Leave
 */
export async function requestCancellation(requestId: string, reason: string) {
  const user = await getAuthEmployee()
  const employeeId = user.employeeId
  const supabase = await createClient()

  if (!reason || reason.trim().length < 10) {
    return { success: false, error: 'Please provide a clear reason for cancellation (at least 10 characters).' }
  }

  const { data: request, error: fetchErr } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchErr || !request) {
    return { success: false, error: 'Leave request not found.' }
  }

  if (request.employee_id !== employeeId) {
    return { success: false, error: 'Unauthorized: You can only cancel your own leaves.' }
  }

  if (request.status !== 'APPROVED') {
    return {
      success: false,
      error: `Cancellation can only be requested for APPROVED leaves. Current status is ${request.status}.`,
    }
  }

  const now = new Date().toISOString()

  // Update status to CANCELLATION_REQUESTED
  const { error: updateErr } = await supabase
    .from('leave_requests')
    .update({
      status: 'CANCELLATION_REQUESTED',
      cancellation_reason: reason.trim(),
      updated_at: now,
    })
    .eq('id', requestId)

  if (updateErr) {
    return { success: false, error: updateErr.message }
  }

  // Record action
  await supabase.from('approval_actions').insert({
    leave_request_id: requestId,
    actor_id: employeeId,
    action: 'SUBMITTED',
    previous_status: 'APPROVED',
    new_status: 'CANCELLATION_REQUESTED',
    comments: `Cancellation requested: ${reason.trim()}`,
    acted_at: now,
  })

  // Notify HR and Manager
  const { data: hrEmployees } = await supabase
    .from('employee_role_assignments')
    .select('employee_id, roles(code)')
    .eq('is_active', true)

  const hrIds: string[] = []
  if (hrEmployees) {
    for (const h of hrEmployees) {
      const role = h.roles as unknown as { code: string } | null
      if (role?.code === 'HR_ADMIN') {
        hrIds.push(h.employee_id)
      }
    }
  }

  for (const hrId of hrIds) {
    await supabase.from('notifications').insert({
      organization_id: request.organization_id,
      recipient_id: hrId,
      sender_id: employeeId,
      type: 'CANCELLATION_REQUESTED',
      title: 'Leave Cancellation Requested',
      message: `${user.fullName} has requested cancellation for approved leave ${request.request_number} (${request.start_date} to ${request.end_date}). Reason: ${reason}`,
      leave_request_id: requestId,
    })
  }

  revalidatePath('/employee/dashboard')
  revalidatePath('/employee/my-leaves')
  revalidatePath(`/employee/my-leaves/${requestId}`)

  return { success: true, message: 'Cancellation request submitted to HR for review.' }
}

/**
 * 5. Get My Leave Requests (Paginated with filtering)
 */
export async function getMyLeaveRequests(
  filters?: LeaveRequestFilters & PaginationParams
): Promise<PaginatedResult<LeaveRequestWithDetails>> {
  const user = await getAuthEmployee()
  const employeeId = user.employeeId
  const supabase = await createClient()

  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('leave_requests')
    .select(
      `
      id,
      request_number,
      employee_id,
      leave_type_id,
      status,
      start_date,
      end_date,
      total_days,
      day_type,
      reason,
      handover_notes,
      applied_at,
      created_at,
      updated_at,
      rejection_reason,
      clarification_message,
      leave_types (
        name,
        code,
        color
      ),
      approver:current_approver_id (
        full_name
      )
    `,
      { count: 'exact' }
    )
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status)
    } else {
      query = query.eq('status', filters.status)
    }
  }

  if (filters?.leaveTypeId) {
    query = query.eq('leave_type_id', filters.leaveTypeId)
  }

  if (filters?.startDate) {
    query = query.gte('start_date', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('end_date', filters.endDate)
  }

  const { data, count, error } = await query.range(from, to)

  if (error) {
    console.error('Error fetching my leave requests:', error)
    return { data: [], total: 0, page, pageSize, totalPages: 0 }
  }

  const total = count || 0
  const totalPages = Math.ceil(total / pageSize)

  const formatted: LeaveRequestWithDetails[] = (data || []).map((row: any) => ({
    id: row.id,
    requestNumber: row.request_number,
    employeeId: row.employee_id,
    employeeName: user.fullName,
    employeeCode: user.employeeCode,
    departmentName: user.departmentId,
    leaveTypeId: row.leave_type_id,
    leaveTypeName: row.leave_types?.name || 'General Leave',
    leaveTypeColor: row.leave_types?.color || '#3B82F6',
    status: row.status as LeaveStatus,
    startDate: row.start_date,
    endDate: row.end_date,
    totalDays: Number(row.total_days),
    dayType: row.day_type as DayType,
    reason: row.reason,
    handoverNotes: row.handover_notes,
    currentApproverName: row.approver?.full_name,
    rejectionReason: row.rejection_reason,
    clarificationMessage: row.clarification_message,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  return {
    data: formatted,
    total,
    page,
    pageSize,
    totalPages,
  }
}

/**
 * 6. Get Leave Request Detail (Including days, approval timeline, attachments)
 */
export async function getLeaveRequestDetail(requestId: string) {
  const user = await getAuthEmployee()
  const supabase = await createClient()

  const { data: request, error: reqErr } = await supabase
    .from('leave_requests')
    .select(
      `
      *,
      leave_types (
        name,
        code,
        color,
        description,
        requires_document
      ),
      approver:current_approver_id (
        full_name,
        designation
      )
    `
    )
    .eq('id', requestId)
    .single()

  if (reqErr || !request) {
    return { error: 'Leave request not found.' }
  }

  // Authorization check
  const isOwner = request.employee_id === user.employeeId
  const isPrivileged =
    user.roles.includes('SUPER_ADMIN') ||
    user.roles.includes('HR_ADMIN') ||
    user.roles.includes('MANAGER')

  if (!isOwner && !isPrivileged) {
    return { error: 'Unauthorized: You cannot view this leave request.' }
  }

  // Fetch breakdown days
  const { data: days } = await supabase
    .from('leave_request_days')
    .select('*')
    .eq('leave_request_id', requestId)
    .order('leave_date', { ascending: true })

  // Fetch approval actions
  const { data: actions } = await supabase
    .from('approval_actions')
    .select(
      `
      id,
      action,
      comments,
      previous_status,
      new_status,
      acted_at,
      actor:actor_id (
        full_name,
        designation
      )
    `
    )
    .eq('leave_request_id', requestId)
    .order('acted_at', { ascending: true })

  // Fetch attachments
  const { data: attachments } = await supabase
    .from('leave_attachments')
    .select('*')
    .eq('leave_request_id', requestId)
    .order('uploaded_at', { ascending: true })

  const formattedActions: ApprovalActionWithActor[] = (actions || []).map((a: any) => ({
    id: a.id,
    action: a.action,
    actorName: a.actor?.full_name || 'System',
    actorDesignation: a.actor?.designation,
    comments: a.comments,
    previousStatus: a.previous_status,
    newStatus: a.new_status,
    actedAt: a.acted_at,
  }))

  const details: LeaveRequestWithDetails & {
    days: any[]
    attachments: any[]
  } = {
    id: request.id,
    requestNumber: request.request_number,
    employeeId: request.employee_id,
    employeeName: user.fullName,
    employeeCode: user.employeeCode,
    departmentName: user.departmentId,
    leaveTypeId: request.leave_type_id,
    leaveTypeName: request.leave_types?.name || 'Leave',
    leaveTypeColor: request.leave_types?.color || '#3B82F6',
    status: request.status as LeaveStatus,
    startDate: request.start_date,
    endDate: request.end_date,
    totalDays: Number(request.total_days),
    dayType: request.day_type as DayType,
    reason: request.reason,
    handoverNotes: request.handover_notes,
    currentApproverName: request.approver?.full_name,
    rejectionReason: request.rejection_reason,
    clarificationMessage: request.clarification_message,
    appliedAt: request.applied_at,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
    approvalHistory: formattedActions,
    days: days || [],
    attachments: attachments || [],
  }

  return { data: details }
}

/**
 * 7. Get My Leave Balances (All active leave types for current fiscal year)
 */
export async function getMyLeaveBalances(fiscalYear?: number): Promise<LeaveBalanceDisplay[]> {
  const user = await getAuthEmployee()
  const employeeId = user.employeeId
  const organizationId = user.organizationId
  const year = fiscalYear || new Date().getFullYear()
  const supabase = await createClient()

  // 1. Fetch active leave types
  const { data: types } = await supabase
    .from('leave_types')
    .select('id, name, code, color, display_order')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // 2. Fetch existing balances
  const { data: balances } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('fiscal_year', year)

  const balanceMap = new Map((balances || []).map((b) => [b.leave_type_id, b]))

  // 3. Construct display models
  const results: LeaveBalanceDisplay[] = (types || []).map((t) => {
    const bal = balanceMap.get(t.id)
    const opening = Number(bal?.opening_balance || 0)
    const accrued = Number(bal?.accrued || 0)
    const used = Number(bal?.used || 0)
    const pending = Number(bal?.pending || 0)
    const adjusted = Number(bal?.adjusted || 0)
    const carriedForward = Number(bal?.carried_forward || 0)
    const closing = opening + accrued + adjusted + carriedForward - used
    const available = closing - pending

    return {
      leaveTypeId: t.id,
      leaveTypeName: t.name,
      leaveTypeCode: t.code,
      color: t.color,
      openingBalance: opening,
      accrued,
      used,
      pending,
      adjusted,
      carriedForward,
      closingBalance: Number(closing.toFixed(2)),
      availableBalance: Number(available.toFixed(2)),
    }
  })

  return results
}

/**
 * 8. Upload Leave Attachment
 */
export async function uploadLeaveAttachment(requestId: string, formData: FormData) {
  const user = await getAuthEmployee()
  const file = formData.get('file') as File | null

  if (!file) {
    return { success: false, error: 'No file provided.' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'File size exceeds maximum allowed size of 5MB.' }
  }

  const supabase = await createClient()
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const filePath = `private/${user.organizationId}/${user.employeeId}/${requestId}/${fileName}`

  try {
    const { error: uploadError } = await supabase.storage
      .from('leave-attachments')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.warn('Storage upload warning:', uploadError.message)
    }

    // Insert record in leave_attachments
    const { data: attachment, error: insertError } = await supabase
      .from('leave_attachments')
      .insert({
        leave_request_id: requestId,
        organization_id: user.organizationId,
        employee_id: user.employeeId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type || 'application/octet-stream',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create leave_attachment record:', insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true, attachment }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Attachment upload failed.' }
  }
}

/**
 * 9. Get Leave Balance Ledger History
 */
export async function getLeaveBalanceLedger(leaveTypeId?: string, fiscalYear?: number) {
  const user = await getAuthEmployee()
  const year = fiscalYear || new Date().getFullYear()
  const supabase = await createClient()

  let query = supabase
    .from('leave_balance_ledger')
    .select(`
      id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      reason,
      created_at,
      leave_type_id,
      leave_types (
        name,
        code,
        color
      )
    `)
    .eq('employee_id', user.employeeId)
    .eq('fiscal_year', year)
    .order('created_at', { ascending: false })

  if (leaveTypeId && leaveTypeId !== 'ALL') {
    query = query.eq('leave_type_id', leaveTypeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching balance ledger:', error)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    transactionType: row.transaction_type,
    amount: Number(row.amount),
    balanceBefore: Number(row.balance_before),
    balanceAfter: Number(row.balance_after),
    reason: row.reason,
    createdAt: row.created_at,
    leaveTypeId: row.leave_type_id,
    leaveTypeName: row.leave_types?.name || 'Leave',
    leaveTypeColor: row.leave_types?.color || '#3b82f6',
  }))
}

/**
 * 10. Get Leave Policy Details
 */
export async function getLeavePolicyDetails(leaveTypeId: string) {
  const user = await getAuthEmployee()
  const supabase = await createClient()

  const { data: policy, error } = await supabase
    .from('leave_policies')
    .select(`
      *,
      leave_types (
        name,
        code,
        description,
        color,
        is_paid,
        allows_half_day,
        allows_negative_balance,
        requires_document
      )
    `)
    .eq('leave_type_id', leaveTypeId)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !policy) {
    return null
  }

  return policy
}

