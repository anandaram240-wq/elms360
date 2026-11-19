import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

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
        .select('organization_id')
        .eq('id', actingEmpId)
        .single()

      if (empErr || !emp) {
        return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
      }

      // 3. Check for overlapping active requests
      const { data: overlapping } = await admin
        .from('leave_requests')
        .select('id, request_number, start_date, end_date')
        .eq('employee_id', actingEmpId)
        .not('status', 'in', '("REJECTED","WITHDRAWN","CANCELLED")')
        .lte('start_date', endDate)
        .gte('end_date', startDate)

      if (overlapping && overlapping.length > 0) {
        return NextResponse.json({
          success: false,
          error: `Overlapping leave request (${overlapping[0].request_number}) exists from ${overlapping[0].start_date} to ${overlapping[0].end_date}.`,
        }, { status: 400 })
      }

      // 4. Validate available balance
      const currentYear = new Date(startDate).getFullYear()
      const { data: balance } = await admin
        .from('leave_balances')
        .select('available_balance')
        .eq('employee_id', actingEmpId)
        .eq('leave_type_id', leaveTypeId)
        .eq('fiscal_year', currentYear)
        .maybeSingle()

      const avail = Number(balance?.available_balance || 0)
      if (avail < totalDays) {
        return NextResponse.json({
          success: false,
          error: `Insufficient leave balance. You have ${avail} days available, but requested ${totalDays} days.`,
        }, { status: 400 })
      }

      // 5. Insert DRAFT request into PostgreSQL
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

      // 6. Execute atomic PostgreSQL submit_leave_request transaction
      const { data: submitRes, error: submitRpcErr } = await admin.rpc('submit_leave_request', {
        p_request_id: inserted.id,
        p_employee_id: actingEmpId,
      })

      if (submitRpcErr) {
        return NextResponse.json({ success: false, error: submitRpcErr.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        requestId: inserted.id,
        requestNumber: inserted.request_number,
        details: submitRes,
      })
    }

    if (action === 'manager_approve') {
      const { requestId, managerId, comments } = payload
      const actorId = managerId || activeUser?.id

      const { data, error } = await admin.rpc('process_approval_action', {
        p_request_id: requestId,
        p_actor_id: actorId,
        p_action: 'APPROVED',
        p_comments: comments || 'Approved by Manager',
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }
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
      return NextResponse.json({ success: true, data })
    }

    if (action === 'hr_approve') {
      const { requestId, hrId, comments } = payload
      const actorId = hrId || activeUser?.id

      const { data, error } = await admin.rpc('process_approval_action', {
        p_request_id: requestId,
        p_actor_id: actorId,
        p_action: 'APPROVED',
        p_comments: comments || 'Final approval by HR',
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }
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
      return NextResponse.json({ success: true, data })
    }

    if (action === 'cancel_approved') {
      const { requestId, actorId, comments } = payload
      const currentActor = actorId || activeUser?.id

      // First request cancellation if not already
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
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    console.error('[MUTATE_ERROR]', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
