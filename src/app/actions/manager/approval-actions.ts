'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/app/actions/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { LeaveRequestWithDetails, LeaveStatus, DayType, ApprovalAction } from '@/types/app'
import { format, startOfMonth, endOfMonth, addDays, isWithinInterval, parseISO } from 'date-fns'

export interface TeamCalendarEntry {
  id: string
  requestId: string
  employeeId: string
  employeeName: string
  employeeCode: string
  departmentName?: string
  leaveTypeId: string
  leaveTypeName: string
  leaveTypeColor: string
  startDate: string
  endDate: string
  totalDays: number
  status: LeaveStatus
  dayType: DayType
}

export interface ManagerDashboardData {
  stats: {
    pendingApprovals: number
    approvedThisMonth: number
    rejectedThisMonth: number
    onLeaveTodayCount: number
    upcomingAbsences7Days: number
  }
  pendingPreview: LeaveRequestWithDetails[]
  onLeaveToday: Array<{
    id: string
    employeeName: string
    designation?: string
    departmentName?: string
    leaveTypeName: string
    leaveTypeColor: string
    startDate: string
    endDate: string
    dayType: string
  }>
  upcomingAbsences: Array<{
    id: string
    employeeName: string
    leaveTypeName: string
    leaveTypeColor: string
    startDate: string
    endDate: string
    totalDays: number
  }>
  recentActivity: Array<{
    id: string
    action: string
    actedAt: string
    actorName: string
    employeeName: string
    leaveTypeName: string
    comments?: string
  }>
  teamWeeklyAvailability: Array<{
    date: string
    dayOfWeek: string
    inOfficeCount: number
    outOfOfficeCount: number
    outEmployees: Array<{ name: string; leaveType: string }>
  }>
}

/**
 * Helper to authenticate and verify manager permissions.
 */
async function authenticateManager() {
  const user = await getCurrentUser()
  if (!user || !user.employeeId) {
    throw new Error('Unauthorized: User not authenticated or has no employee record')
  }

  const isManagerOrAdmin = user.roles.some((r) =>
    ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'].includes(r)
  )

  if (!isManagerOrAdmin) {
    throw new Error('Forbidden: Requires MANAGER, HR_ADMIN, or SUPER_ADMIN role')
  }

  return user
}

/**
 * Helper: check if currentUser is direct approver or has active delegation.
 */
async function checkApproverAuthorized(
  requestId: string,
  managerEmployeeId: string,
  adminClient: ReturnType<typeof createAdminClient>
) {
  const { data: request, error } = await adminClient
    .from('leave_requests')
    .select('*, employees!leave_requests_employee_id_fkey(organization_id, full_name)')
    .eq('id', requestId)
    .single()

  if (error || !request) {
    throw new Error('Leave request not found')
  }

  // Check if directly assigned
  if (request.current_approver_id === managerEmployeeId) {
    return { authorized: true, request }
  }

  // Check if manager is delegated by current_approver_id
  if (request.current_approver_id) {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data: delegation } = await adminClient
      .from('approval_delegations')
      .select('id')
      .eq('delegator_id', request.current_approver_id)
      .eq('delegate_id', managerEmployeeId)
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .maybeSingle()

    if (delegation) {
      return { authorized: true, request, isDelegated: true }
    }
  }

  // Super Admin and HR Admin can also override
  const user = await getCurrentUser()
  if (user?.roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN'].includes(r))) {
    return { authorized: true, request }
  }

  throw new Error('Unauthorized: You are not authorized to act on this request')
}

/**
 * Approve a leave request.
 * Invokes DB stored procedure `process_approval_action`, with a transactional TypeScript fallback.
 */
export async function approveRequest(params: {
  requestId: string
  comments?: string
  idempotencyKey: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authenticateManager()
    const admin = createAdminClient()

    // Authorization check
    const { request } = await checkApproverAuthorized(params.requestId, user.employeeId, admin)

    // Valid state check
    const validStates: LeaveStatus[] = [
      'PENDING_MANAGER_APPROVAL',
      'PENDING_HR_APPROVAL',
      'PENDING_ADDITIONAL_APPROVAL',
      'CLARIFICATION_REQUESTED',
    ]
    if (!validStates.includes(request.status as LeaveStatus)) {
      return {
        success: false,
        error: `Cannot approve request with status '${request.status}'`,
      }
    }

    // Try DB Stored Procedure first
    try {
      const { data: spResult, error: spError } = await admin.rpc('process_approval_action', {
        p_request_id: params.requestId,
        p_actor_id: user.employeeId,
        p_action: 'APPROVED',
        p_comments: params.comments || null,
        p_idempotency_key: params.idempotencyKey,
      })

      if (!spError && spResult) {
        revalidatePath('/manager/approvals')
        revalidatePath('/manager/dashboard')
        return { success: true }
      }
      if (spError) {
        console.warn('process_approval_action RPC note:', spError.message)
      }
    } catch (spEx) {
      console.warn('RPC invocation failed, proceeding with fallback execution:', spEx)
    }

    // Fallback: Perform atomic updates via adminClient
    const actionKey = `${params.idempotencyKey}_action`

    // Check idempotency
    const { data: existingAction } = await admin
      .from('approval_actions')
      .select('id')
      .eq('idempotency_key', actionKey)
      .maybeSingle()

    if (existingAction) {
      return { success: true }
    }

    // Determine next workflow step
    let nextStatus: LeaveStatus = 'APPROVED'
    let nextApproverId: string | null = null

    if (request.workflow_id) {
      const { data: nextStep } = await admin
        .from('approval_workflow_steps')
        .select('*')
        .eq('workflow_id', request.workflow_id)
        .gt('step_order', request.current_step_order || 0)
        .order('step_order', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextStep) {
        nextStatus = nextStep.approver_type === 'HR' ? 'PENDING_HR_APPROVAL' : 'PENDING_ADDITIONAL_APPROVAL'
      }
    }

    // Update leave_request
    const { error: updateError } = await admin
      .from('leave_requests')
      .update({
        status: nextStatus,
        current_approver_id: nextApproverId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.requestId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Insert approval_actions
    await admin.from('approval_actions').insert({
      leave_request_id: params.requestId,
      actor_id: user.employeeId,
      action: 'APPROVED' as ApprovalAction,
      previous_status: request.status,
      new_status: nextStatus,
      comments: params.comments || null,
      idempotency_key: actionKey,
    })

    // If final approval, deduct balance
    if (nextStatus === 'APPROVED') {
      const currentYear = new Date().getFullYear()
      const { data: balance } = await admin
        .from('leave_balances')
        .select('*')
        .eq('employee_id', request.employee_id)
        .eq('leave_type_id', request.leave_type_id)
        .eq('fiscal_year', currentYear)
        .maybeSingle()

      if (balance) {
        const newUsed = Number(balance.used) + Number(request.total_days)
        const newPending = Math.max(0, Number(balance.pending) - Number(request.total_days))
        const newClosing = Number(balance.opening_balance) + Number(balance.accrued) - newUsed + Number(balance.adjusted)

        await admin
          .from('leave_balances')
          .update({
            used: newUsed,
            pending: newPending,
            updated_at: new Date().toISOString(),
          })
          .eq('id', balance.id)

        // Add ledger entry
        await admin.from('leave_balance_ledger').insert({
          organization_id: request.organization_id || user.organizationId,
          employee_id: request.employee_id,
          leave_type_id: request.leave_type_id,
          fiscal_year: currentYear,
          transaction_type: 'DEDUCTION',
          amount: Number(request.total_days),
          balance_before: Number(balance.closing_balance),
          balance_after: newClosing,
          leave_request_id: params.requestId,
          performed_by: user.employeeId,
          reason: 'Leave approved and deducted',
        })
      }
    }

    // Notification for employee
    await admin.from('notifications').insert({
      recipient_id: request.employee_id,
      organization_id: request.organization_id || user.organizationId,
      type: 'MANAGER_APPROVED',
      title: 'Leave Request Approved',
      message: `Your leave request #${request.request_number} has been approved by ${user.fullName}.${params.comments ? ` Note: ${params.comments}` : ''}`,
      leave_request_id: params.requestId,
      metadata: {
        requestId: params.requestId,
        requestNumber: request.request_number,
        newStatus: nextStatus,
      },
    })

    // Outbox event
    await admin.from('outbox_events').insert({
      event_type: 'LEAVE_APPROVED',
      payload: {
        requestId: params.requestId,
        requestNumber: request.request_number,
        employeeId: request.employee_id,
        actorId: user.employeeId,
        comments: params.comments,
        status: nextStatus,
      },
      status: 'PENDING',
    })

    revalidatePath('/manager/approvals')
    revalidatePath('/manager/dashboard')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred during approval'
    return { success: false, error: message }
  }
}

/**
 * Reject a leave request.
 */
export async function rejectRequest(params: {
  requestId: string
  reason: string
  idempotencyKey: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authenticateManager()
    const admin = createAdminClient()

    if (!params.reason || params.reason.trim().length === 0) {
      return { success: false, error: 'Rejection reason is required' }
    }

    const { request } = await checkApproverAuthorized(params.requestId, user.employeeId, admin)

    const validStates: LeaveStatus[] = [
      'PENDING_MANAGER_APPROVAL',
      'PENDING_HR_APPROVAL',
      'PENDING_ADDITIONAL_APPROVAL',
      'CLARIFICATION_REQUESTED',
    ]
    if (!validStates.includes(request.status as LeaveStatus)) {
      return {
        success: false,
        error: `Cannot reject request with status '${request.status}'`,
      }
    }

    // Try Stored Procedure first
    try {
      const { data: spResult, error: spError } = await admin.rpc('process_approval_action', {
        p_request_id: params.requestId,
        p_actor_id: user.employeeId,
        p_action: 'REJECTED',
        p_comments: params.reason,
        p_idempotency_key: params.idempotencyKey,
      })

      if (!spError && spResult) {
        revalidatePath('/manager/approvals')
        revalidatePath('/manager/dashboard')
        return { success: true }
      }
    } catch {
      // Proceed to fallback
    }

    const actionKey = `${params.idempotencyKey}_action`

    // Update leave request
    const { error: updateError } = await admin
      .from('leave_requests')
      .update({
        status: 'REJECTED',
        rejection_reason: params.reason,
        current_approver_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.requestId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Release pending balance
    const currentYear = new Date().getFullYear()
    const { data: balance } = await admin
      .from('leave_balances')
      .select('*')
      .eq('employee_id', request.employee_id)
      .eq('leave_type_id', request.leave_type_id)
      .eq('fiscal_year', currentYear)
      .maybeSingle()

    if (balance) {
      const newPending = Math.max(0, Number(balance.pending) - Number(request.total_days))
      await admin
        .from('leave_balances')
        .update({
          pending: newPending,
          updated_at: new Date().toISOString(),
        })
        .eq('id', balance.id)
    }

    // Log action
    await admin.from('approval_actions').insert({
      leave_request_id: params.requestId,
      actor_employee_id: user.employeeId,
      action: 'REJECTED' as ApprovalAction,
      previous_status: request.status,
      new_status: 'REJECTED',
      comments: params.reason,
      idempotency_key: actionKey,
    })

    // Notify employee
    await admin.from('notifications').insert({
      recipient_id: request.employee_id,
      organization_id: request.organization_id || user.organizationId,
      type: 'MANAGER_REJECTED',
      title: 'Leave Request Rejected',
      message: `Your leave request #${request.request_number} was rejected by ${user.fullName}. Reason: ${params.reason}`,
      leave_request_id: params.requestId,
      metadata: {
        requestId: params.requestId,
        requestNumber: request.request_number,
        reason: params.reason,
      },
    })

    // Outbox event
    await admin.from('outbox_events').insert({
      event_type: 'LEAVE_REJECTED',
      payload: {
        requestId: params.requestId,
        requestNumber: request.request_number,
        employeeId: request.employee_id,
        actorId: user.employeeId,
        reason: params.reason,
      },
      status: 'PENDING',
    })

    revalidatePath('/manager/approvals')
    revalidatePath('/manager/dashboard')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred during rejection'
    return { success: false, error: message }
  }
}

/**
 * Request clarification for a leave request.
 */
export async function requestClarification(params: {
  requestId: string
  message: string
  idempotencyKey: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authenticateManager()
    const admin = createAdminClient()

    if (!params.message || params.message.trim().length === 0) {
      return { success: false, error: 'Clarification message is required' }
    }

    const { request } = await checkApproverAuthorized(params.requestId, user.employeeId, admin)

    const validStates: LeaveStatus[] = [
      'PENDING_MANAGER_APPROVAL',
      'PENDING_HR_APPROVAL',
      'PENDING_ADDITIONAL_APPROVAL',
    ]
    if (!validStates.includes(request.status as LeaveStatus)) {
      return {
        success: false,
        error: `Cannot request clarification for request with status '${request.status}'`,
      }
    }

    // Try Stored Procedure first
    try {
      const { data: spResult, error: spError } = await admin.rpc('process_approval_action', {
        p_request_id: params.requestId,
        p_actor_id: user.employeeId,
        p_action: 'CLARIFICATION_REQUESTED',
        p_comments: params.message,
        p_idempotency_key: params.idempotencyKey,
      })

      if (!spError && spResult) {
        revalidatePath('/manager/approvals')
        revalidatePath('/manager/dashboard')
        return { success: true }
      }
    } catch {
      // Fallback
    }

    const actionKey = `${params.idempotencyKey}_action`

    // Update leave request
    const { error: updateError } = await admin
      .from('leave_requests')
      .update({
        status: 'CLARIFICATION_REQUESTED',
        clarification_message: params.message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.requestId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Log action
    await admin.from('approval_actions').insert({
      leave_request_id: params.requestId,
      actor_employee_id: user.employeeId,
      action: 'CLARIFICATION_REQUESTED' as ApprovalAction,
      previous_status: request.status,
      new_status: 'CLARIFICATION_REQUESTED',
      comments: params.message,
      idempotency_key: actionKey,
    })

    // Notify employee
    await admin.from('notifications').insert({
      recipient_id: request.employee_id,
      organization_id: request.organization_id || user.organizationId,
      type: 'CLARIFICATION_REQUESTED',
      title: 'Clarification Requested on Leave',
      message: `${user.fullName} requested clarification on leave request #${request.request_number}: "${params.message}"`,
      leave_request_id: params.requestId,
      metadata: {
        requestId: params.requestId,
        requestNumber: request.request_number,
        message: params.message,
      },
    })

    // Outbox event
    await admin.from('outbox_events').insert({
      event_type: 'LEAVE_CLARIFICATION_REQUESTED',
      payload: {
        requestId: params.requestId,
        requestNumber: request.request_number,
        employeeId: request.employee_id,
        actorId: user.employeeId,
        message: params.message,
      },
      status: 'PENDING',
    })

    revalidatePath('/manager/approvals')
    revalidatePath('/manager/dashboard')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An error occurred'
    return { success: false, error: message }
  }
}

/**
 * Bulk approve multiple requests.
 */
export async function bulkApproveRequests(params: {
  requestIds: string[]
  comments?: string
}): Promise<{ approvedCount: number; errors: string[] }> {
  const user = await authenticateManager()
  let approvedCount = 0
  const errors: string[] = []

  for (const requestId of params.requestIds) {
    const idempotencyKey = `bulk_${user.employeeId}_${requestId}_${Date.now()}`
    const res = await approveRequest({
      requestId,
      comments: params.comments,
      idempotencyKey,
    })

    if (res.success) {
      approvedCount++
    } else {
      errors.push(`Request ${requestId}: ${res.error || 'Failed'}`)
    }
  }

  return { approvedCount, errors }
}

/**
 * Fetch pending approvals assigned to this manager (or delegated to them).
 */
export async function getMyPendingApprovals(filters: {
  search?: string
  leaveTypeId?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<{ requests: LeaveRequestWithDetails[]; total: number }> {
  try {
    const user = await authenticateManager()
    const admin = createAdminClient()
    const page = filters.page || 1
    const pageSize = filters.pageSize || 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Find active delegations where user is the delegate
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data: activeDelegations } = await admin
      .from('approval_delegations')
      .select('delegator_id')
      .eq('delegate_id', user.employeeId)
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)

    const approverIds = [user.employeeId]
    if (activeDelegations && activeDelegations.length > 0) {
      activeDelegations.forEach((d) => approverIds.push(d.delegator_id))
    }

    // Build query
    let query = admin
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
        employees!leave_requests_employee_id_fkey(
          id,
          employee_code,
          full_name,
          designation,
          department_id,
          departments(name)
        ),
        leave_types(id, name, code, color)
      `,
        { count: 'exact' }
      )

    // Filter by approver if not viewing all
    if (filters.status === 'ALL') {
      // Find requests where current approver was this manager, or reports to this manager
      const { data: reports } = await admin
        .from('reporting_relationships')
        .select('employee_id')
        .eq('manager_id', user.employeeId)
        .eq('is_active', true)

      const reportIds = (reports || []).map((r) => r.employee_id)
      const allAllowedEmployeeIds = [...reportIds, user.employeeId]

      query = query.in('employee_id', allAllowedEmployeeIds)
    } else {
      // Default to pending approvals
      query = query
        .in('current_approver_id', approverIds)
        .in('status', [
          'PENDING_MANAGER_APPROVAL',
          'PENDING_HR_APPROVAL',
          'PENDING_ADDITIONAL_APPROVAL',
          'CLARIFICATION_REQUESTED',
        ])
    }

    if (filters.leaveTypeId && filters.leaveTypeId !== 'ALL') {
      query = query.eq('leave_type_id', filters.leaveTypeId)
    }

    query = query.order('created_at', { ascending: false }).range(from, to)

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching pending approvals:', error)
      return { requests: [], total: 0 }
    }

    // Transform rows
    let requests: LeaveRequestWithDetails[] = (data || []).map((r) => {
      const emp = r.employees as unknown as {
        id: string
        employee_code: string
        full_name: string
        designation?: string
        departments?: { name: string } | null
      } | null

      const lt = r.leave_types as unknown as {
        id: string
        name: string
        code: string
        color: string
      } | null

      return {
        id: r.id,
        requestNumber: r.request_number,
        employeeId: r.employee_id,
        employeeName: emp?.full_name || 'Unknown',
        employeeCode: emp?.employee_code || '',
        departmentName: emp?.departments?.name || '',
        leaveTypeId: r.leave_type_id,
        leaveTypeName: lt?.name || 'Leave',
        leaveTypeColor: lt?.color || '#3b82f6',
        status: r.status as LeaveStatus,
        startDate: r.start_date,
        endDate: r.end_date,
        totalDays: Number(r.total_days),
        dayType: r.day_type as DayType,
        reason: r.reason,
        handoverNotes: r.handover_notes || undefined,
        rejectionReason: r.rejection_reason || undefined,
        clarificationMessage: r.clarification_message || undefined,
        appliedAt: r.applied_at || undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }
    })

    // Filter by search text if provided
    if (filters.search && filters.search.trim() !== '') {
      const s = filters.search.toLowerCase()
      requests = requests.filter(
        (req) =>
          req.employeeName.toLowerCase().includes(s) ||
          req.employeeCode.toLowerCase().includes(s) ||
          req.requestNumber.toLowerCase().includes(s) ||
          req.reason.toLowerCase().includes(s)
      )
    }

    return { requests, total: count || requests.length }
  } catch (err) {
    console.error('getMyPendingApprovals failed:', err)
    return { requests: [], total: 0 }
  }
}

/**
 * Fetch detailed leave request view with employee details, balance, history, and team conflicts.
 */
export async function getLeaveRequestDetail(requestId: string) {
  const user = await authenticateManager()
  const admin = createAdminClient()

  const { data: request, error } = await admin
    .from('leave_requests')
    .select(`
      *,
      employees!leave_requests_employee_id_fkey(
        id,
        employee_code,
        full_name,
        designation,
        work_email,
        phone,
        date_of_joining,
        department_id,
        departments(id, name)
      ),
      leave_types(id, name, code, color, requires_document, max_consecutive_days, allow_half_day),
      leave_attachments(id, file_name, file_path, file_size, mime_type, created_at)
    `)
    .eq('id', requestId)
    .single()

  if (error || !request) {
    throw new Error('Leave request not found')
  }

  const emp = request.employees as unknown as {
    id: string
    employee_code: string
    full_name: string
    designation?: string
    work_email: string
    phone?: string
    date_of_joining: string
    department_id?: string
    departments?: { id: string; name: string } | null
  } | null

  const lt = request.leave_types as unknown as {
    id: string
    name: string
    code: string
    color: string
    requires_document: boolean
    max_consecutive_days?: number
    allow_half_day: boolean
  } | null

  // Fetch balances for this employee
  const currentYear = new Date().getFullYear()
  const { data: balances } = await admin
    .from('leave_balances')
    .select(`
      *,
      leave_types(name, code, color)
    `)
    .eq('employee_id', request.employee_id)
    .eq('fiscal_year', currentYear)

  // Fetch approval history
  const { data: history } = await admin
    .from('approval_actions')
    .select(`
      id,
      action,
      comments,
      previous_status,
      new_status,
      acted_at,
      actor_employee_id,
      employees!approval_actions_actor_employee_id_fkey(
        full_name,
        designation
      )
    `)
    .eq('leave_request_id', requestId)
    .order('acted_at', { ascending: true })

  // Fetch employee previous 5 leave requests
  const { data: previousLeaves } = await admin
    .from('leave_requests')
    .select(`
      id,
      request_number,
      start_date,
      end_date,
      total_days,
      status,
      created_at,
      leave_types(name, color)
    `)
    .eq('employee_id', request.employee_id)
    .neq('id', requestId)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch team leaves overlapping the requested dates
  const { data: teamOverlaps } = await admin
    .from('leave_requests')
    .select(`
      id,
      start_date,
      end_date,
      status,
      employees!leave_requests_employee_id_fkey(full_name, designation),
      leave_types(name, color)
    `)
    .neq('employee_id', request.employee_id)
    .in('status', ['APPROVED', 'PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL'])
    .lte('start_date', request.end_date)
    .gte('end_date', request.start_date)

  return {
    request: {
      ...request,
      employee: emp,
      leaveType: lt,
      attachments: request.leave_attachments || [],
    },
    balances: balances || [],
    approvalHistory: (history || []).map((h) => {
      const actor = h.employees as unknown as { full_name: string; designation?: string } | null
      return {
        id: h.id,
        action: h.action,
        comments: h.comments,
        previousStatus: h.previous_status,
        newStatus: h.new_status,
        actedAt: h.acted_at,
        actorName: actor?.full_name || 'System / Manager',
        actorDesignation: actor?.designation,
      }
    }),
    previousLeaves: previousLeaves || [],
    teamOverlaps: (teamOverlaps || []).map((o) => {
      const e = o.employees as unknown as { full_name: string; designation?: string } | null
      const t = o.leave_types as unknown as { name: string; color: string } | null
      return {
        id: o.id,
        employeeName: e?.full_name || 'Team member',
        designation: e?.designation,
        leaveTypeName: t?.name || 'Leave',
        color: t?.color || '#3b82f6',
        startDate: o.start_date,
        endDate: o.end_date,
        status: o.status,
      }
    }),
  }
}

/**
 * Fetch team leave calendar for a given date range.
 */
export async function getTeamLeaveCalendar(params: {
  startDate: string
  endDate: string
}): Promise<TeamCalendarEntry[]> {
  const user = await authenticateManager()
  const admin = createAdminClient()

  // Get direct reports
  const { data: directReports } = await admin
    .from('reporting_relationships')
    .select('employee_id')
    .eq('manager_id', user.employeeId)
    .eq('is_active', true)

  const reportIds = (directReports || []).map((r) => r.employee_id)
  reportIds.push(user.employeeId) // Include manager's own leaves too for team context

  const { data, error } = await admin
    .from('leave_requests')
    .select(`
      id,
      request_number,
      employee_id,
      leave_type_id,
      start_date,
      end_date,
      total_days,
      status,
      day_type,
      employees!leave_requests_employee_id_fkey(
        id,
        employee_code,
        full_name,
        departments(name)
      ),
      leave_types(id, name, color)
    `)
    .in('employee_id', reportIds)
    .in('status', ['APPROVED', 'PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL'])
    .lte('start_date', params.endDate)
    .gte('end_date', params.startDate)

  if (error || !data) {
    console.error('getTeamLeaveCalendar error:', error)
    return []
  }

  return data.map((r) => {
    const emp = r.employees as unknown as {
      id: string
      employee_code: string
      full_name: string
      departments?: { name: string } | null
    } | null

    const lt = r.leave_types as unknown as {
      id: string
      name: string
      color: string
    } | null

    return {
      id: r.id,
      requestId: r.id,
      employeeId: r.employee_id,
      employeeName: emp?.full_name || 'Unknown',
      employeeCode: emp?.employee_code || '',
      departmentName: emp?.departments?.name,
      leaveTypeId: r.leave_type_id,
      leaveTypeName: lt?.name || 'Leave',
      leaveTypeColor: lt?.color || '#3b82f6',
      startDate: r.start_date,
      endDate: r.end_date,
      totalDays: Number(r.total_days),
      status: r.status as LeaveStatus,
      dayType: r.day_type as DayType,
    }
  })
}

/**
 * Delegate approval responsibilities to another employee.
 */
export async function delegateApproval(params: {
  delegateEmployeeId: string
  startDate: string
  endDate: string
  reason: string
}): Promise<{ success: boolean; delegationId?: string; error?: string }> {
  try {
    const user = await authenticateManager()
    const admin = createAdminClient()

    if (params.delegateEmployeeId === user.employeeId) {
      return { success: false, error: 'Cannot delegate approvals to yourself' }
    }

    if (params.startDate > params.endDate) {
      return { success: false, error: 'End date must be on or after start date' }
    }

    const { data, error } = await admin
      .from('approval_delegations')
      .insert({
        organization_id: user.organizationId,
        delegator_id: user.employeeId,
        delegate_id: params.delegateEmployeeId,
        start_date: params.startDate,
        end_date: params.endDate,
        reason: params.reason,
        is_active: true,
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    // Notify the delegate
    await admin.from('notifications').insert({
      recipient_id: params.delegateEmployeeId,
      organization_id: user.organizationId,
      type: 'DELEGATION_ASSIGNED',
      title: 'Approval Delegation Assigned',
      message: `${user.fullName} has delegated approval authority to you from ${params.startDate} to ${params.endDate}. Reason: ${params.reason}`,
      metadata: {
        delegatorName: user.fullName,
        startDate: params.startDate,
        endDate: params.endDate,
        delegationId: data.id,
      },
    })

    revalidatePath('/manager/delegations')
    return { success: true, delegationId: data.id }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delegate approval'
    return { success: false, error: message }
  }
}

/**
 * Cancel an active or future approval delegation.
 */
export async function cancelDelegation(
  delegationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await authenticateManager()
    const admin = createAdminClient()

    const { error } = await admin
      .from('approval_delegations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', delegationId)
      .eq('delegator_id', user.employeeId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/manager/delegations')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to cancel delegation'
    return { success: false, error: message }
  }
}

/**
 * Fetch all delegations for the current manager.
 */
export async function getMyDelegations() {
  const user = await authenticateManager()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('approval_delegations')
    .select(`
      id,
      delegator_id,
      delegate_id,
      start_date,
      end_date,
      reason,
      is_active,
      created_at,
      employees!approval_delegations_delegate_id_fkey(
        id,
        full_name,
        designation,
        employee_code
      )
    `)
    .eq('delegator_id', user.employeeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getMyDelegations error:', error)
    return []
  }

  return (data || []).map((d) => {
    const delegate = d.employees as unknown as {
      id: string
      full_name: string
      designation?: string
      employee_code: string
    } | null

    const today = format(new Date(), 'yyyy-MM-dd')
    const isOngoing = d.is_active && d.start_date <= today && d.end_date >= today
    const isFuture = d.is_active && d.start_date > today
    const isPast = d.end_date < today

    return {
      id: d.id,
      delegateId: d.delegate_id,
      delegateName: delegate?.full_name || 'Unknown',
      delegateCode: delegate?.employee_code || '',
      delegateDesignation: delegate?.designation,
      startDate: d.start_date,
      endDate: d.end_date,
      reason: d.reason || '',
      isActive: d.is_active,
      status: !d.is_active ? 'CANCELLED' : isOngoing ? 'ACTIVE' : isFuture ? 'SCHEDULED' : 'EXPIRED',
      createdAt: d.created_at,
    }
  })
}

/**
 * Fetch manager dashboard metrics and statistics.
 */
export async function getManagerDashboardData(): Promise<ManagerDashboardData> {
  const user = await authenticateManager()
  const admin = createAdminClient()
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')
  const next7DaysStr = format(addDays(new Date(), 7), 'yyyy-MM-dd')

  // 1. Direct reports
  const { data: reports } = await admin
    .from('reporting_relationships')
    .select(`
      employee_id,
      employees!reporting_relationships_employee_id_fkey(
        id,
        full_name,
        designation,
        is_active,
        departments(name)
      )
    `)
    .eq('manager_id', user.employeeId)
    .eq('is_active', true)

  const directReportIds = (reports || []).map((r) => r.employee_id)

  // 2. Pending approvals count & top 3 preview
  const pendingData = await getMyPendingApprovals({ pageSize: 3 })

  // 3. Approved this month count
  const { count: approvedCount } = await admin
    .from('approval_actions')
    .select('id', { count: 'exact', head: true })
    .eq('actor_employee_id', user.employeeId)
    .eq('action', 'APPROVED')
    .gte('acted_at', `${monthStart}T00:00:00Z`)
    .lte('acted_at', `${monthEnd}T23:59:59Z`)

  // 4. Rejected this month count
  const { count: rejectedCount } = await admin
    .from('approval_actions')
    .select('id', { count: 'exact', head: true })
    .eq('actor_employee_id', user.employeeId)
    .eq('action', 'REJECTED')
    .gte('acted_at', `${monthStart}T00:00:00Z`)
    .lte('acted_at', `${monthEnd}T23:59:59Z`)

  // 5. Employees currently on approved leave today
  let onLeaveTodayList: Array<{
    id: string
    employeeName: string
    designation?: string
    departmentName?: string
    leaveTypeName: string
    leaveTypeColor: string
    startDate: string
    endDate: string
    dayType: string
  }> = []

  if (directReportIds.length > 0) {
    const { data: todayLeaves } = await admin
      .from('leave_requests')
      .select(`
        id,
        employee_id,
        start_date,
        end_date,
        day_type,
        employees!leave_requests_employee_id_fkey(
          full_name,
          designation,
          departments(name)
        ),
        leave_types(name, color)
      `)
      .in('employee_id', directReportIds)
      .eq('status', 'APPROVED')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr)

    onLeaveTodayList = (todayLeaves || []).map((l) => {
      const e = l.employees as unknown as {
        full_name: string
        designation?: string
        departments?: { name: string } | null
      } | null
      const lt = l.leave_types as unknown as { name: string; color: string } | null

      return {
        id: l.id,
        employeeName: e?.full_name || 'Team member',
        designation: e?.designation,
        departmentName: e?.departments?.name,
        leaveTypeName: lt?.name || 'Leave',
        leaveTypeColor: lt?.color || '#3b82f6',
        startDate: l.start_date,
        endDate: l.end_date,
        dayType: l.day_type,
      }
    })
  }

  // 6. Upcoming team absences in next 7 days
  let upcomingAbsences: Array<{
    id: string
    employeeName: string
    leaveTypeName: string
    leaveTypeColor: string
    startDate: string
    endDate: string
    totalDays: number
  }> = []

  if (directReportIds.length > 0) {
    const { data: upcoming } = await admin
      .from('leave_requests')
      .select(`
        id,
        start_date,
        end_date,
        total_days,
        employees!leave_requests_employee_id_fkey(full_name),
        leave_types(name, color)
      `)
      .in('employee_id', directReportIds)
      .eq('status', 'APPROVED')
      .gt('start_date', todayStr)
      .lte('start_date', next7DaysStr)
      .order('start_date', { ascending: true })

    upcomingAbsences = (upcoming || []).map((u) => {
      const e = u.employees as unknown as { full_name: string } | null
      const lt = u.leave_types as unknown as { name: string; color: string } | null

      return {
        id: u.id,
        employeeName: e?.full_name || 'Team member',
        leaveTypeName: lt?.name || 'Leave',
        leaveTypeColor: lt?.color || '#3b82f6',
        startDate: u.start_date,
        endDate: u.end_date,
        totalDays: Number(u.total_days),
      }
    })
  }

  // 7. Recent activity feed (last 10 approval actions taken by this manager)
  const { data: recentActions } = await admin
    .from('approval_actions')
    .select(`
      id,
      action,
      acted_at,
      comments,
      leave_requests!approval_actions_leave_request_id_fkey(
        employees!leave_requests_employee_id_fkey(full_name),
        leave_types(name)
      )
    `)
    .eq('actor_employee_id', user.employeeId)
    .order('acted_at', { ascending: false })
    .limit(10)

  const recentActivity = (recentActions || []).map((a) => {
    const lr = a.leave_requests as unknown as {
      employees?: { full_name: string } | null
      leave_types?: { name: string } | null
    } | null

    return {
      id: a.id,
      action: a.action,
      actedAt: a.acted_at,
      actorName: user.fullName,
      employeeName: lr?.employees?.full_name || 'Employee',
      leaveTypeName: lr?.leave_types?.name || 'Leave',
      comments: a.comments || undefined,
    }
  })

  // 8. Team availability this week (next 7 days breakdown)
  const teamTotal = directReportIds.length
  const teamWeeklyAvailability: ManagerDashboardData['teamWeeklyAvailability'] = []

  // Check leaves across next 7 days
  const { data: weekLeaves } = directReportIds.length > 0
    ? await admin
        .from('leave_requests')
        .select(`
          start_date,
          end_date,
          employees!leave_requests_employee_id_fkey(full_name),
          leave_types(name)
        `)
        .in('employee_id', directReportIds)
        .eq('status', 'APPROVED')
        .lte('start_date', next7DaysStr)
        .gte('end_date', todayStr)
    : { data: [] }

  for (let i = 0; i < 7; i++) {
    const curDate = addDays(new Date(), i)
    const curDateStr = format(curDate, 'yyyy-MM-dd')
    const dayOfWeek = format(curDate, 'EEE')

    const outEmployees: Array<{ name: string; leaveType: string }> = []
    if (weekLeaves) {
      for (const wl of weekLeaves) {
        if (wl.start_date <= curDateStr && wl.end_date >= curDateStr) {
          const emp = wl.employees as unknown as { full_name: string } | null
          const lt = wl.leave_types as unknown as { name: string } | null
          outEmployees.push({
            name: emp?.full_name || 'Team member',
            leaveType: lt?.name || 'Leave',
          })
        }
      }
    }

    const outCount = outEmployees.length
    const inCount = Math.max(0, teamTotal - outCount)

    teamWeeklyAvailability.push({
      date: curDateStr,
      dayOfWeek,
      inOfficeCount: inCount,
      outOfOfficeCount: outCount,
      outEmployees,
    })
  }

  return {
    stats: {
      pendingApprovals: pendingData.total,
      approvedThisMonth: approvedCount || 0,
      rejectedThisMonth: rejectedCount || 0,
      onLeaveTodayCount: onLeaveTodayList.length,
      upcomingAbsences7Days: upcomingAbsences.length,
    },
    pendingPreview: pendingData.requests,
    onLeaveToday: onLeaveTodayList,
    upcomingAbsences,
    recentActivity,
    teamWeeklyAvailability,
  }
}

/**
 * Fetch direct reports directory with leave balances and current status.
 */
export async function getDirectReportsDirectory(search?: string) {
  const user = await authenticateManager()
  const admin = createAdminClient()
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const currentYear = new Date().getFullYear()

  const { data: reports, error } = await admin
    .from('reporting_relationships')
    .select(`
      employee_id,
      relationship_type,
      effective_from,
      employees!reporting_relationships_employee_id_fkey(
        id,
        employee_code,
        full_name,
        work_email,
        phone,
        designation,
        date_of_joining,
        employment_type,
        employment_status,
        is_active,
        departments(id, name)
      )
    `)
    .eq('manager_id', user.employeeId)
    .eq('is_active', true)

  if (error || !reports) {
    console.error('getDirectReportsDirectory error:', error)
    return []
  }

  const directReports = []
  for (const r of reports) {
    const emp = r.employees as unknown as {
      id: string
      employee_code: string
      full_name: string
      work_email: string
      phone?: string
      designation?: string
      date_of_joining: string
      employment_type: string
      employment_status: string
      is_active: boolean
      departments?: { id: string; name: string } | null
    } | null

    if (!emp) continue

    if (search && search.trim() !== '') {
      const s = search.toLowerCase()
      if (
        !emp.full_name.toLowerCase().includes(s) &&
        !emp.employee_code.toLowerCase().includes(s) &&
        !emp.work_email.toLowerCase().includes(s) &&
        !(emp.designation || '').toLowerCase().includes(s)
      ) {
        continue
      }
    }

    // Check if on leave today
    const { data: activeLeave } = await admin
      .from('leave_requests')
      .select(`
        id,
        start_date,
        end_date,
        day_type,
        leave_types(name, color)
      `)
      .eq('employee_id', emp.id)
      .eq('status', 'APPROVED')
      .lte('start_date', todayStr)
      .gte('end_date', todayStr)
      .maybeSingle()

    // Leave balances
    const { data: balances } = await admin
      .from('leave_balances')
      .select(`
        opening_balance,
        accrued,
        used,
        pending,
        adjusted,
        carried_forward,
        closing_balance,
        leave_types(name, code, color)
      `)
      .eq('employee_id', emp.id)
      .eq('fiscal_year', currentYear)

    // Last 5 leave requests
    const { data: history } = await admin
      .from('leave_requests')
      .select(`
        id,
        request_number,
        start_date,
        end_date,
        total_days,
        status,
        reason,
        created_at,
        leave_types(name, color)
      `)
      .eq('employee_id', emp.id)
      .order('created_at', { ascending: false })
      .limit(5)

    const activeLeaveType = activeLeave?.leave_types as unknown as { name: string; color: string } | null

    directReports.push({
      id: emp.id,
      employeeCode: emp.employee_code,
      fullName: emp.full_name,
      email: emp.work_email,
      phone: emp.phone,
      designation: emp.designation || 'Staff',
      departmentName: emp.departments?.name || 'General',
      dateOfJoining: emp.date_of_joining,
      employmentType: emp.employment_type,
      employmentStatus: emp.employment_status,
      isOnLeaveToday: Boolean(activeLeave),
      currentLeaveInfo: activeLeave
        ? {
            leaveTypeName: activeLeaveType?.name || 'Leave',
            color: activeLeaveType?.color || '#3b82f6',
            startDate: activeLeave.start_date,
            endDate: activeLeave.end_date,
            dayType: activeLeave.day_type,
          }
        : null,
      balances: (balances || []).map((b) => {
        const lt = b.leave_types as unknown as { name: string; code: string; color: string } | null
        const available = Math.max(0, Number(b.closing_balance) - Number(b.pending))
        return {
          leaveTypeName: lt?.name || 'Leave',
          code: lt?.code || 'LV',
          color: lt?.color || '#3b82f6',
          used: Number(b.used),
          available,
          total: Number(b.opening_balance) + Number(b.accrued),
        }
      }),
      recentLeaves: (history || []).map((h) => {
        const lt = h.leave_types as unknown as { name: string; color: string } | null
        return {
          id: h.id,
          requestNumber: h.request_number,
          startDate: h.start_date,
          endDate: h.end_date,
          totalDays: Number(h.total_days),
          status: h.status,
          reason: h.reason,
          leaveTypeName: lt?.name || 'Leave',
          color: lt?.color || '#3b82f6',
        }
      }),
    })
  }

  return directReports
}

/**
 * Fetch manager approval action history for the history table and CSV export.
 */
export async function getApprovalHistory(filters: {
  startDate?: string
  endDate?: string
  employeeId?: string
  leaveTypeId?: string
  action?: string
}) {
  const user = await authenticateManager()
  const admin = createAdminClient()

  let query = admin
    .from('approval_actions')
    .select(`
      id,
      action,
      comments,
      previous_status,
      new_status,
      acted_at,
      leave_requests!approval_actions_leave_request_id_fkey(
        id,
        request_number,
        start_date,
        end_date,
        total_days,
        employees!leave_requests_employee_id_fkey(
          id,
          employee_code,
          full_name,
          departments(name)
        ),
        leave_types(id, name, code, color)
      )
    `)
    .eq('actor_id', user.employeeId)
    .order('acted_at', { ascending: false })

  if (filters.action && filters.action !== 'ALL') {
    query = query.eq('action', filters.action as ApprovalAction)
  }
  if (filters.startDate) {
    query = query.gte('acted_at', `${filters.startDate}T00:00:00Z`)
  }
  if (filters.endDate) {
    query = query.lte('acted_at', `${filters.endDate}T23:59:59Z`)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('getApprovalHistory error:', error)
    return []
  }

  let list = data.map((a) => {
    const lr = a.leave_requests as unknown as {
      id: string
      request_number: string
      start_date: string
      end_date: string
      total_days: number
      employees?: {
        id: string
        employee_code: string
        full_name: string
        departments?: { name: string } | null
      } | null
      leave_types?: {
        id: string
        name: string
        code: string
        color: string
      } | null
    } | null

    return {
      id: a.id,
      action: a.action,
      actedAt: a.acted_at,
      comments: a.comments || '',
      previousStatus: a.previous_status,
      newStatus: a.new_status,
      requestId: lr?.id || '',
      requestNumber: lr?.request_number || '',
      startDate: lr?.start_date || '',
      endDate: lr?.end_date || '',
      totalDays: Number(lr?.total_days || 0),
      employeeId: lr?.employees?.id || '',
      employeeName: lr?.employees?.full_name || 'Unknown',
      employeeCode: lr?.employees?.employee_code || '',
      departmentName: lr?.employees?.departments?.name || '',
      leaveTypeId: lr?.leave_types?.id || '',
      leaveTypeName: lr?.leave_types?.name || 'Leave',
      leaveTypeColor: lr?.leave_types?.color || '#3b82f6',
    }
  })

  if (filters.employeeId && filters.employeeId !== 'ALL') {
    list = list.filter((item) => item.employeeId === filters.employeeId)
  }
  if (filters.leaveTypeId && filters.leaveTypeId !== 'ALL') {
    list = list.filter((item) => item.leaveTypeId === filters.leaveTypeId)
  }

  return list
}

/**
 * Fetch all eligible employees in the organization for delegation selector.
 */
export async function getEligibleDelegates() {
  const user = await authenticateManager()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('employees')
    .select('id, full_name, employee_code, designation, work_email')
    .eq('organization_id', user.organizationId)
    .eq('is_active', true)
    .neq('id', user.employeeId)
    .order('full_name', { ascending: true })

  if (error || !data) {
    return []
  }

  return data
}
