import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let activeUser: any = null
    try {
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get('elms360_user')
      if (sessionCookie?.value) {
        try {
          activeUser = JSON.parse(sessionCookie.value)
        } catch {}
      }
    } catch {}

    const admin = createAdminClient()

    // 1. Fetch employees
    const { data: rawEmployees, error: empErr } = await admin
      .from('employees')
      .select(`
        id, employee_code, full_name, work_email, designation, department_id, is_active,
        departments(name),
        employee_role_assignments!employee_role_assignments_employee_id_fkey(
          is_active,
          roles(code)
        )
      `)
      .order('employee_code', { ascending: true })

    if (empErr) {
      console.error('[SYNC_EMP_ERROR]', empErr)
    }

    const employees = (rawEmployees || []).map((e: any) => {
      const roles: string[] = []
      const assignments = e.employee_role_assignments || []
      for (const a of assignments) {
        if (a.is_active !== false && a.roles?.code) {
          roles.push(a.roles.code)
        }
      }
      if (roles.length === 0) roles.push('EMPLOYEE')

      return {
        id: e.id,
        employee_code: e.employee_code,
        full_name: e.full_name,
        work_email: e.work_email,
        designation: e.designation,
        department_id: e.department_id,
        department_name: e.departments?.name || 'General',
        manager_id: null,
        manager_name: undefined,
        is_active: e.is_active,
        roles,
      }
    })

    // 2. Fetch leave types
    const { data: rawLeaveTypes } = await admin
      .from('leave_types')
      .select('id, name, code, description, color, allows_half_day, leave_policies(annual_entitlement)')
      .eq('is_active', true)
      .order('name', { ascending: true })

    const leaveTypes = (rawLeaveTypes || []).map((lt: any) => ({
      id: lt.id,
      name: lt.name,
      code: lt.code,
      description: lt.description || '',
      color: lt.color || '#3B82F6',
      annual_entitlement: Number(lt.leave_policies?.[0]?.annual_entitlement || 12),
      allows_half_day: lt.allows_half_day ?? true,
    }))

    // 3. Fetch leave balances (current year)
    const currentYear = new Date().getFullYear()
    const { data: rawBalances } = await admin
      .from('leave_balances')
      .select('id, employee_id, leave_type_id, fiscal_year, opening_balance, accrued, used, pending, adjusted, carried_forward, available_balance')
      .eq('fiscal_year', currentYear)

    const leaveBalances = (rawBalances || []).map((b: any) => ({
      id: b.id,
      employee_id: b.employee_id,
      leave_type_id: b.leave_type_id,
      fiscal_year: Number(b.fiscal_year),
      opening_balance: Number(b.opening_balance || 0),
      accrued: Number(b.accrued || 0),
      used: Number(b.used || 0),
      pending: Number(b.pending || 0),
      adjusted: Number(b.adjusted || 0),
      carried_forward: Number(b.carried_forward || 0),
      available_balance: Number(b.available_balance || 0),
    }))

    // 4. Fetch leave requests
    const { data: rawRequests, error: reqErr } = await admin
      .from('leave_requests')
      .select(`
        id, request_number, employee_id, leave_type_id,
        start_date, end_date, day_type, total_days,
        reason, handover_notes, emergency_contact, status,
        current_approver_id, clarification_message, rejection_reason, cancellation_reason,
        created_at, updated_at,
        employees!leave_requests_employee_id_fkey(full_name, employee_code, department_id, departments(name)),
        leave_types(name, code, color),
        approver:employees!leave_requests_current_approver_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })

    if (reqErr) {
      console.error('[SYNC_REQ_ERROR]', reqErr)
    }

    const leaveRequests = (rawRequests || []).map((r: any) => {
      const approverRole =
        r.status === 'PENDING_MANAGER_APPROVAL'
          ? 'MANAGER'
          : r.status === 'PENDING_HR_APPROVAL'
            ? 'HR'
            : null

      return {
        id: r.id,
        request_number: r.request_number,
        employee_id: r.employee_id,
        employee_name: r.employees?.full_name || 'Employee',
        employee_code: r.employees?.employee_code || '',
        department_name: r.employees?.departments?.name || 'General',
        leave_type_id: r.leave_type_id,
        leave_type_code: r.leave_types?.code || 'CL',
        leave_type_name: r.leave_types?.name || 'Casual Leave',
        leave_type_color: r.leave_types?.color || '#3B82F6',
        start_date: String(r.start_date),
        end_date: String(r.end_date),
        day_type: r.day_type || 'FULL_DAY',
        total_days: Number(r.total_days || 1),
        reason: r.reason || '',
        handover_notes: r.handover_notes || undefined,
        emergency_contact: r.emergency_contact || undefined,
        status: r.status,
        current_approver_role: approverRole,
        current_approver_id: r.current_approver_id || undefined,
        manager_name: r.approver?.full_name || undefined,
        clarification_question: r.clarification_message || undefined,
        rejection_reason: r.rejection_reason || undefined,
        cancellation_reason: r.cancellation_reason || undefined,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }
    })

    // 5. Fetch approval actions
    const { data: rawActions } = await admin
      .from('approval_actions')
      .select('id, leave_request_id, actor_id, action, comments, acted_at, employees(full_name)')
      .order('acted_at', { ascending: true })

    const approvalActions = (rawActions || []).map((a: any) => ({
      id: a.id,
      leave_request_id: a.leave_request_id,
      actor_id: a.actor_id,
      actor_name: a.employees?.full_name || 'Approver',
      actor_role: a.action,
      action: a.action,
      comments: a.comments || undefined,
      created_at: a.acted_at,
    }))

    // 6. Fetch holidays
    const { data: rawHolidays } = await admin
      .from('holidays')
      .select('id, name, holiday_date, holiday_type')
      .order('holiday_date', { ascending: true })

    const holidays = (rawHolidays || []).map((h: any) => ({
      id: h.id,
      name: h.name,
      date: String(h.holiday_date),
      type: h.holiday_type || 'PUBLIC',
    }))

    // 7. Fetch ledger
    const { data: rawLedger } = await admin
      .from('leave_balance_ledger')
      .select('id, employee_id, leave_type_id, transaction_type, amount, balance_after, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    const ledger = (rawLedger || []).map((l: any) => ({
      id: l.id,
      employee_id: l.employee_id,
      leave_type_id: l.leave_type_id,
      transaction_type: l.transaction_type,
      amount: Number(l.amount || 0),
      balance_after: Number(l.balance_after || 0),
      reason: l.reason || '',
      created_at: l.created_at,
    }))

    // 8. Fetch weekly off days
    const { data: rawOrg } = await admin
      .from('organizations')
      .select('weekly_off_days')
      .limit(1)

    const weeklyOffDays = (rawOrg?.[0]?.weekly_off_days as number[]) || [0, 6]

    // 9. Fetch notifications for active user if logged in
    let notifications: any[] = []
    if (activeUser?.id) {
      const { data: rawNotifs } = await admin
        .from('notifications')
        .select('id, recipient_id, title, message, is_read, created_at')
        .eq('recipient_id', activeUser.id)
        .order('created_at', { ascending: false })
        .limit(50)

      notifications = (rawNotifs || []).map((n: any) => ({
        id: n.id,
        user_id: n.recipient_id,
        title: n.title,
        message: n.message,
        is_read: n.is_read || false,
        created_at: n.created_at,
      }))
    }

    // 10. Fetch organization settings for overlap policy
    const { data: rawSettings } = await admin
      .from('organization_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    const overlapPolicy: 'BLOCK' | 'WARN_AND_ALLOW' | 'ALLOW' =
      (rawSettings?.overlap_policy as any) ||
      (rawSettings?.allow_concurrent_leaves ? 'ALLOW' : 'WARN_AND_ALLOW')

    return NextResponse.json({
      success: true,
      currentUser: activeUser,
      employees,
      leaveTypes,
      leaveBalances,
      leaveRequests,
      approvalActions,
      holidays,
      ledger,
      notifications,
      weeklyOffDays,
      overlapPolicy,
    })
  } catch (err: any) {
    console.error('[SYNC_ERROR]', err)
    return NextResponse.json(
      { success: false, error: 'DATABASE CONNECTION UNAVAILABLE: ' + err.message },
      { status: 503 }
    )
  }
}
