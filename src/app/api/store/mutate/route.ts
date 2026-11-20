import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { broadcastToEmployee, broadcastToEmployees } from '@/lib/realtime-broadcaster'
import {
  analyzeLeaveOverlap,
  getWorkingDaysInRange,
  type OverlapPolicy,
  type LeaveRequestRecord,
} from '@/lib/overlap-calculator'
import { getFiscalYear } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
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

    const body = await request.json()
    const { action, payload } = body
    const admin = createAdminClient()

    if (action === 'submit_leave') {
      const {
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        dayType = 'FULL_DAY',
        reason,
        handoverNotes,
        emergencyContact,
      } = payload

      const actingEmpId = employeeId || activeUser?.id
      if (!actingEmpId) {
        return NextResponse.json({ success: false, error: 'Unauthorized session' }, { status: 401 })
      }

      // 1. Recalculate working days using the authoritative PostgreSQL function
      const { data: workingDays, error: rpcCalcErr } = await admin.rpc('calculate_working_days', {
        p_start_date: startDate,
        p_end_date: endDate,
        p_employee_id: actingEmpId,
        p_day_type: dayType,
      })

      if (rpcCalcErr) {
        return NextResponse.json({ success: false, error: rpcCalcErr.message }, { status: 400 })
      }

      const totalDays = Number(workingDays || 0)
      if (totalDays <= 0) {
        return NextResponse.json({
          success: false,
          error: 'The selected date range contains 0 working days (all selected days are weekends or holidays).',
        }, { status: 400 })
      }

      // 2. Fetch employee organization
      const { data: emp, error: empErr } = await admin
        .from('employees')
        .select('id, organization_id, full_name')
        .eq('id', actingEmpId)
        .single()

      if (empErr || !emp) {
        return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
      }

      // 3. Fetch org settings to determine overlap policy
      const { data: orgSettings } = await admin
        .from('organization_settings')
        .select('*')
        .eq('organization_id', emp.organization_id)
        .limit(1)
        .maybeSingle()

      const overlapPolicy: OverlapPolicy =
        (orgSettings?.overlap_policy as OverlapPolicy) ||
        (orgSettings?.allow_concurrent_leaves ? 'ALLOW' : 'WARN_AND_ALLOW')

      // Fetch weekly off days and holidays for accurate working-day calculation
      const { data: rawOrg } = await admin
        .from('organizations')
        .select('weekly_off_days, fiscal_year_start')
        .eq('id', emp.organization_id)
        .limit(1)
        .maybeSingle()
      const weeklyOffDays = (rawOrg?.weekly_off_days as number[]) || [0, 6]

      const { data: rawHolidays } = await admin
        .from('holidays')
        .select('holiday_date')
      const holidayDates = (rawHolidays || []).map((h) => String(h.holiday_date))

      // 4. Check for overlapping active requests strictly scoped to THIS employee
      const { data: rawEmpRequests } = await admin
        .from('leave_requests')
        .select('id, request_number, employee_id, start_date, end_date, status, leave_types(name, code)')
        .eq('employee_id', actingEmpId)
        .not('status', 'in', '("REJECTED","WITHDRAWN","CANCELLED","DRAFT")')

      const existingEmpRequests: LeaveRequestRecord[] = (rawEmpRequests || []).map((r: any) => ({
        id: r.id,
        request_number: r.request_number,
        employee_id: r.employee_id,
        start_date: String(r.start_date),
        end_date: String(r.end_date),
        status: r.status,
        leave_type_name: r.leave_types?.name,
        leave_type_code: r.leave_types?.code,
      }))

      const overlapAnalysis = analyzeLeaveOverlap({
        employeeId: actingEmpId,
        startDate,
        endDate,
        existingRequests: existingEmpRequests,
        weeklyOffDays,
        holidayDates,
        policy: overlapPolicy,
      })

      // If policy is BLOCK and working-day overlap exists, reject submission
      if (overlapAnalysis.hasWorkingDayOverlap && !overlapAnalysis.canSubmit) {
        return NextResponse.json({
          success: false,
          error: overlapAnalysis.blockingError || 'Leave request blocked due to existing overlap.',
          conflicts: overlapAnalysis.conflicts,
        }, { status: 400 })
      }

      // 5. Validate available balance
      const startYear = new Date(startDate).getFullYear()

      // Fetch org settings to determine fiscal year rules
      const { data: rawOrgSettings } = await admin
        .from('organization_settings')
        .select('leave_year_type')
        .eq('organization_id', emp.organization_id)
        .maybeSingle()

      const fiscalYearStart = rawOrg?.fiscal_year_start || 4
      const leaveYearType = (rawOrgSettings?.leave_year_type as 'CALENDAR' | 'FISCAL') || 'FISCAL'
      const computedFiscalYear = getFiscalYear(startDate, fiscalYearStart, leaveYearType)

      // Look up balance by calendar year first, or by computed fiscal year
      let { data: balance } = await admin
        .from('leave_balances')
        .select('available_balance, fiscal_year')
        .eq('employee_id', actingEmpId)
        .eq('leave_type_id', leaveTypeId)
        .eq('fiscal_year', startYear)
        .maybeSingle()

      if (!balance && computedFiscalYear !== startYear) {
        const { data: fyBal } = await admin
          .from('leave_balances')
          .select('available_balance, fiscal_year')
          .eq('employee_id', actingEmpId)
          .eq('leave_type_id', leaveTypeId)
          .eq('fiscal_year', computedFiscalYear)
          .maybeSingle()
        if (fyBal) {
          balance = fyBal
        }
      }

      // If no balance row exists for this fiscal year, auto-provision from leave_policies
      if (!balance) {
        const { data: policy } = await admin
          .from('leave_policies')
          .select('annual_entitlement')
          .eq('organization_id', emp.organization_id)
          .eq('leave_type_id', leaveTypeId)
          .eq('is_active', true)
          .maybeSingle()

        const entitlement = Number(policy?.annual_entitlement || 0)
        if (entitlement > 0) {
          const { data: newBal } = await admin
            .from('leave_balances')
            .insert({
              employee_id: actingEmpId,
              leave_type_id: leaveTypeId,
              organization_id: emp.organization_id,
              fiscal_year: startYear,
              opening_balance: entitlement,
              accrued: 0,
              used: 0,
              pending: 0,
              adjusted: 0,
              carried_forward: 0,
              expired: 0,
            })
            .select('available_balance, fiscal_year')
            .single()

          if (newBal) {
            balance = newBal
          }
        }
      }

      const avail = Number(balance?.available_balance || 0)
      if (avail < totalDays) {
        return NextResponse.json({
          success: false,
          error: `Insufficient leave balance. You have ${avail} days available, but requested ${totalDays} days.`,
        }, { status: 400 })
      }

      // 6. Insert DRAFT request into PostgreSQL
      const { data: inserted, error: insertErr } = await admin
        .from('leave_requests')
        .insert({
          organization_id: emp.organization_id,
          employee_id: actingEmpId,
          leave_type_id: leaveTypeId,
          status: 'DRAFT',
          start_date: startDate,
          end_date: endDate,
          total_days: totalDays,
          day_type: dayType,
          reason: (reason || '').trim(),
          handover_notes: handoverNotes?.trim() || null,
          emergency_contact: emergencyContact?.trim() || null,
        })
        .select('id, request_number')
        .single()

      if (insertErr || !inserted) {
        return NextResponse.json({ success: false, error: insertErr?.message || 'Failed to insert request' }, { status: 500 })
      }

      // 7. Execute atomic PostgreSQL submit_leave_request transaction
      const { data: submitRes, error: submitRpcErr } = await admin.rpc('submit_leave_request', {
        p_request_id: inserted.id,
        p_employee_id: actingEmpId,
      })

      if (submitRpcErr) {
        return NextResponse.json({ success: false, error: submitRpcErr.message }, { status: 500 })
      }

      // 8. If an overlap warning exists, prepend note to manager notification
      const { data: reporting } = await admin
        .from('reporting_relationships')
        .select('manager_id')
        .eq('employee_id', actingEmpId)
        .eq('relationship_type', 'PRIMARY')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()

      if (reporting?.manager_id && overlapAnalysis.hasWorkingDayOverlap) {
        const conflictBrief = overlapAnalysis.conflicts
          .map((c) => `${c.requestNumber} on ${c.commonWorkingDays.join(', ')}`)
          .join('; ')

        await admin
          .from('notifications')
          .insert({
            organization_id: emp.organization_id,
            recipient_id: reporting.manager_id,
            sender_id: actingEmpId,
            type: 'LEAVE_SCHEDULE_CONFLICT',
            title: `Overlap Notice: ${inserted.request_number}`,
            message: `${emp.full_name}'s leave request (${inserted.request_number}) overlaps on working days with existing request(s): ${conflictBrief}. Please review before approving.`,
            leave_request_id: inserted.id,
          })
      }

      const broadcastPayload = {
        requestId: inserted.id,
        requestNumber: inserted.request_number,
        hasOverlapWarning: overlapAnalysis.hasWorkingDayOverlap,
        warningMessage: overlapAnalysis.warningMessage,
      }

      // Notify manager
      if (reporting?.manager_id) {
        await broadcastToEmployee(reporting.manager_id, 'LEAVE_REQUEST_SUBMITTED', broadcastPayload)
      }
      // Confirm submission to employee
      await broadcastToEmployee(actingEmpId, 'LEAVE_REQUEST_SUBMITTED', broadcastPayload)

      return NextResponse.json({
        success: true,
        requestId: inserted.id,
        requestNumber: inserted.request_number,
        details: submitRes,
        overlapWarning: overlapAnalysis.warningMessage,
        conflicts: overlapAnalysis.conflicts,
      })
    }

    if (action === 'manager_approve') {
      const { requestId, managerId, comments, overrideJustification } = payload
      const actorId = managerId || activeUser?.id

      // Overlap & Double Deduction Protection
      const { data: targetReq } = await admin
        .from('leave_requests')
        .select('id, request_number, employee_id, organization_id, start_date, end_date, total_days, leave_type_id')
        .eq('id', requestId)
        .single()

      if (targetReq) {
        // Check for existing APPROVED requests for the SAME employee overlapping requested dates
        const { data: approvedOverlaps } = await admin
          .from('leave_requests')
          .select('id, request_number, start_date, end_date, total_days, status, leave_type_id')
          .eq('employee_id', targetReq.employee_id)
          .eq('status', 'APPROVED')
          .neq('id', requestId)
          .lte('start_date', targetReq.end_date)
          .gte('end_date', targetReq.start_date)

        if (approvedOverlaps && approvedOverlaps.length > 0) {
          // Check working day intersection
          const { data: rawOrg } = await admin
            .from('organizations')
            .select('weekly_off_days')
            .eq('id', targetReq.organization_id)
            .limit(1)
            .maybeSingle()
          const weeklyOffDays = (rawOrg?.weekly_off_days as number[]) || [0, 6]

          const { data: rawHolidays } = await admin
            .from('holidays')
            .select('holiday_date')
          const holidayDates = (rawHolidays || []).map((h) => String(h.holiday_date))

          const targetDays = getWorkingDaysInRange(targetReq.start_date, targetReq.end_date, weeklyOffDays, holidayDates)
          const conflictingApprovedDays: string[] = []

          for (const app of approvedOverlaps) {
            const appDays = getWorkingDaysInRange(app.start_date, app.end_date, weeklyOffDays, holidayDates)
            targetDays.forEach((d) => {
              if (appDays.includes(d) && !conflictingApprovedDays.includes(d)) {
                conflictingApprovedDays.push(d)
              }
            })
          }

          if (conflictingApprovedDays.length > 0) {
            if (!overrideJustification || overrideJustification.trim().length < 5) {
              return NextResponse.json({
                success: false,
                requiresOverride: true,
                error: `Approval conflict: Date(s) ${conflictingApprovedDays.join(', ')} are already approved under ${approvedOverlaps[0].request_number}. An authorized conflict override justification (minimum 5 characters) is required to approve.`,
                conflictingRequest: approvedOverlaps[0].request_number,
                conflictingDates: conflictingApprovedDays,
              }, { status: 409 })
            }
          }
        }
      }

      const finalComments = overrideJustification
        ? `${comments || 'Approved by Manager'} [AUTHORIZED CONFLICT OVERRIDE: ${overrideJustification.trim()}]`
        : comments || 'Approved by Manager'

      const { data, error } = await admin.rpc('process_approval_action', {
        p_request_id: requestId,
        p_actor_id: actorId,
        p_action: 'APPROVED',
        p_comments: finalComments,
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }

      await _broadcastApprovalEvent(admin, requestId, actorId, 'LEAVE_APPROVED')

      return NextResponse.json({ success: true, data })
    }

    if (action === 'manager_reject') {
      const { requestId, managerId, comments } = payload
      const actorId = managerId || activeUser?.id

      const { data, error } = await admin.rpc('process_approval_action', {
        p_request_id: requestId,
        p_actor_id: actorId,
        p_action: 'REJECTED',
        p_comments: comments || 'Rejected by Manager',
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }

      await _broadcastApprovalEvent(admin, requestId, actorId, 'LEAVE_REJECTED')

      return NextResponse.json({ success: true, data })
    }

    if (action === 'manager_clarify') {
      const { requestId, managerId, comments } = payload
      const actorId = managerId || activeUser?.id

      const { data, error } = await admin.rpc('process_approval_action', {
        p_request_id: requestId,
        p_actor_id: actorId,
        p_action: 'CLARIFICATION_REQUESTED',
        p_comments: comments || 'Clarification requested by Manager',
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }

      await _broadcastApprovalEvent(admin, requestId, actorId, 'LEAVE_CLARIFICATION_REQUESTED')

      return NextResponse.json({ success: true, data })
    }

    if (action === 'hr_approve') {
      const { requestId, hrId, comments, overrideJustification } = payload
      const actorId = hrId || activeUser?.id

      // Check for approved conflict override if approving overlapping dates
      const { data: targetReq } = await admin
        .from('leave_requests')
        .select('id, request_number, employee_id, organization_id, start_date, end_date, total_days, leave_type_id')
        .eq('id', requestId)
        .single()

      if (targetReq) {
        const { data: approvedOverlaps } = await admin
          .from('leave_requests')
          .select('id, request_number, start_date, end_date, total_days, status, leave_type_id')
          .eq('employee_id', targetReq.employee_id)
          .eq('status', 'APPROVED')
          .neq('id', requestId)
          .lte('start_date', targetReq.end_date)
          .gte('end_date', targetReq.start_date)

        if (approvedOverlaps && approvedOverlaps.length > 0) {
          const { data: rawOrg } = await admin
            .from('organizations')
            .select('weekly_off_days')
            .eq('id', targetReq.organization_id)
            .limit(1)
            .maybeSingle()
          const weeklyOffDays = (rawOrg?.weekly_off_days as number[]) || [0, 6]

          const { data: rawHolidays } = await admin
            .from('holidays')
            .select('holiday_date')
          const holidayDates = (rawHolidays || []).map((h) => String(h.holiday_date))

          const targetDays = getWorkingDaysInRange(targetReq.start_date, targetReq.end_date, weeklyOffDays, holidayDates)
          const conflictingApprovedDays: string[] = []

          for (const app of approvedOverlaps) {
            const appDays = getWorkingDaysInRange(app.start_date, app.end_date, weeklyOffDays, holidayDates)
            targetDays.forEach((d) => {
              if (appDays.includes(d) && !conflictingApprovedDays.includes(d)) {
                conflictingApprovedDays.push(d)
              }
            })
          }

          if (conflictingApprovedDays.length > 0) {
            if (!overrideJustification || overrideJustification.trim().length < 5) {
              return NextResponse.json({
                success: false,
                requiresOverride: true,
                error: `Approval conflict: Date(s) ${conflictingApprovedDays.join(', ')} are already approved under ${approvedOverlaps[0].request_number}. An authorized conflict override justification (minimum 5 characters) is required for final sign-off.`,
                conflictingRequest: approvedOverlaps[0].request_number,
                conflictingDates: conflictingApprovedDays,
              }, { status: 409 })
            }
          }
        }
      }

      const finalComments = overrideJustification
        ? `${comments || 'Final approval by HR'} [AUTHORIZED CONFLICT OVERRIDE: ${overrideJustification.trim()}]`
        : comments || 'Final approval by HR'

      const { data, error } = await admin.rpc('process_approval_action', {
        p_request_id: requestId,
        p_actor_id: actorId,
        p_action: 'APPROVED',
        p_comments: finalComments,
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }

      await _broadcastApprovalEvent(admin, requestId, actorId, 'LEAVE_APPROVED')

      return NextResponse.json({ success: true, data })
    }

    if (action === 'hr_reject') {
      const { requestId, hrId, comments } = payload
      const actorId = hrId || activeUser?.id

      const { data, error } = await admin.rpc('process_approval_action', {
        p_request_id: requestId,
        p_actor_id: actorId,
        p_action: 'REJECTED',
        p_comments: comments || 'Rejected by HR',
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }

      await _broadcastApprovalEvent(admin, requestId, actorId, 'LEAVE_REJECTED')

      return NextResponse.json({ success: true, data })
    }

    if (action === 'withdraw') {
      const { requestId, employeeId } = payload
      const actorId = employeeId || activeUser?.id

      const { data, error } = await admin.rpc('process_approval_action', {
        p_request_id: requestId,
        p_actor_id: actorId,
        p_action: 'WITHDRAWN',
        p_comments: 'Withdrawn by employee',
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }

      await _broadcastApprovalEvent(admin, requestId, actorId, 'LEAVE_WITHDRAWN')

      return NextResponse.json({ success: true, data })
    }

    if (action === 'cancel_approved') {
      const { requestId, actorId, comments } = payload
      const currentActor = actorId || activeUser?.id

      await admin
        .from('leave_requests')
        .update({ status: 'CANCELLATION_REQUESTED', cancellation_reason: comments })
        .eq('id', requestId)

      const { data, error } = await admin.rpc('process_approval_action', {
        p_request_id: requestId,
        p_actor_id: currentActor,
        p_action: 'CANCELLATION_APPROVED',
        p_comments: comments || 'Approved cancellation and reversed balance',
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }

      await _broadcastApprovalEvent(admin, requestId, currentActor, 'LEAVE_CANCELLED_APPROVED')

      return NextResponse.json({ success: true, data })
    }

    if (action === 'employee_reply_clarification') {
      const { requestId, employeeId, reply } = payload
      const actorId = employeeId || activeUser?.id

      const { data, error } = await admin.rpc('process_approval_action', {
        p_request_id: requestId,
        p_actor_id: actorId,
        p_action: 'REPLIED',
        p_comments: reply,
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }

      await _broadcastApprovalEvent(admin, requestId, actorId, 'STORE_REFRESH')

      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    console.error('[MUTATE_ERROR]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

/**
 * After an approval action, broadcast a refresh event to:
 * - The employee who owns the leave request
 * - The manager (current_approver_id if still pending, or the actor)
 * - Any HR users in the same organization
 */
async function _broadcastApprovalEvent(
  admin: ReturnType<typeof createAdminClient>,
  requestId: string,
  actorId: string,
  eventType: Parameters<typeof broadcastToEmployee>[1]
) {
  try {
    const { data: lr } = await admin
      .from('leave_requests')
      .select('id, request_number, employee_id, current_approver_id, organization_id, status')
      .eq('id', requestId)
      .single()

    if (!lr) return

    const broadcastPayload = { requestId: lr.id, requestNumber: lr.request_number }
    const recipientIds = new Set<string>()

    if (lr.employee_id) recipientIds.add(lr.employee_id)
    if (actorId) recipientIds.add(actorId)
    if (lr.current_approver_id && lr.current_approver_id !== actorId) {
      recipientIds.add(lr.current_approver_id)
    }

    // Broadcast to HR Admins if status changed
    if (lr.organization_id) {
      const { data: hrStaff } = await admin
        .from('employee_role_assignments')
        .select('employee_id, roles!inner(code)')
        .eq('roles.code', 'HR_ADMIN')
        .eq('is_active', true)

      if (hrStaff) {
        hrStaff.forEach((h: any) => {
          if (h.employee_id) recipientIds.add(h.employee_id)
        })
      }
    }

    const recipients = Array.from(recipientIds)
    if (recipients.length > 0) {
      await broadcastToEmployees(recipients, eventType, broadcastPayload)
    }
  } catch (err) {
    console.warn('[BROADCAST_APPROVAL_NOTE]', err)
  }
}
