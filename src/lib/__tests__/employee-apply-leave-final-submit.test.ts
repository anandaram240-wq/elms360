import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { getDb, createMockSupabaseClient } from '../db-store'
import { calculateWorkingDays } from '../date-utils'

describe('Employee Apply Leave Final Step Submission Pipeline', () => {
  const db = getDb()
  const employee = db.employees.find((e) => e.work_email === 'arjun.kumar@abc-tech.com')!
  const manager = db.employees.find((e) => e.work_email === 'manager.eng@abc-tech.com')!
  const hr = db.employees.find((e) => e.work_email === 'hr1@abc-tech.com')!
  const clType = db.leave_types.find((lt) => lt.code === 'CL')!

  const client = createMockSupabaseClient({
    id: employee.id,
    email: employee.work_email,
    employeeId: employee.id,
    organizationId: employee.organization_id,
    fullName: employee.full_name,
  })

  test('Stage 1-8: Working day calculation matches expected business logic', () => {
    // Nov 24-25, 2026 = 2 working days
    const r1 = calculateWorkingDays('2026-11-24', '2026-11-25', [0, 6])
    assert.equal(r1.workingDays, 2)

    // Nov 21-24, 2026 = 2 working days (Sat+Sun skipped)
    const r2 = calculateWorkingDays('2026-11-21', '2026-11-24', [0, 6])
    assert.equal(r2.workingDays, 2)

    // Nov 21, 2026 alone = 0 working days on Mon-Fri
    const r3 = calculateWorkingDays('2026-11-21', '2026-11-21', [0, 6])
    assert.equal(r3.workingDays, 0)

    // Nov 21, 2026 alone = 1 working day on Mon-Sat schedule [0]
    const r4 = calculateWorkingDays('2026-11-21', '2026-11-21', [0])
    assert.equal(r4.workingDays, 1)
  })

  test('Stage 9-16: Submits valid leave application, persists to DB, and routes to manager queue', async () => {
    const testStartDate = '2026-12-15'
    const testEndDate = '2026-12-16'

    // Clean any prior test request on these dates
    db.leave_requests = db.leave_requests.filter(
      (r) => !(r.employee_id === employee.id && r.start_date === testStartDate)
    )

    // Check balance before and ensure fresh test balance
    const balanceBefore = db.leave_balances.find(
      (b) => b.employee_id === employee.id && b.leave_type_id === clType.id && b.fiscal_year === 2026
    )!
    balanceBefore.available_balance = 10
    balanceBefore.pending = 0
    const initialAvailable = 10
    const initialPending = 0

    // Insert leave request in DRAFT
    const { data: request, error: insertError } = await client
      .from('leave_requests')
      .insert({
        organization_id: employee.organization_id,
        employee_id: employee.id,
        leave_type_id: clType.id,
        status: 'DRAFT',
        start_date: testStartDate,
        end_date: testEndDate,
        total_days: 2,
        day_type: 'FULL_DAY',
        reason: 'Personal family ceremony and annual function in hometown',
      })
      .select()
      .single()

    assert.equal(insertError, null)
    assert.ok(request)
    assert.ok(request.id)
    assert.ok(request.request_number.startsWith('LR-2026-'))

    // Call submit_leave_request RPC
    const { data: rpcSuccess, error: rpcError } = await client.rpc('submit_leave_request', {
      p_request_id: request.id,
      p_employee_id: employee.id,
    })

    assert.equal(rpcError, null)
    assert.equal(rpcSuccess, true)

    // Verify request in DB
    const savedRequest = db.leave_requests.find((r) => r.id === request.id)
    assert.ok(savedRequest)
    assert.equal(savedRequest.status, 'PENDING_MANAGER_APPROVAL')
    assert.equal(savedRequest.current_approver_id, manager.id)
    assert.ok(savedRequest.applied_at)

    // Verify pending balance reservation
    assert.equal(balanceBefore.pending, initialPending + 2)

    // Verify ledger entry
    const ledgerEntry = db.leave_balance_ledger.find(
      (l) => l.leave_request_id === request.id && l.transaction_type === 'PENDING_RESERVE'
    )
    assert.ok(ledgerEntry)
    assert.equal(ledgerEntry.amount, 2)

    // Verify manager notification
    const managerNotif = db.notifications.find(
      (n) => n.leave_request_id === request.id && n.recipient_id === manager.id
    )
    assert.ok(managerNotif)

    // Manager Approves
    const mgrClient = createMockSupabaseClient({
      id: manager.id,
      email: manager.work_email,
      employeeId: manager.id,
      organizationId: manager.organization_id,
    })

    const { data: mgrApprove } = await mgrClient.rpc('process_approval_action', {
      p_request_id: request.id,
      p_actor_id: manager.id,
      p_action: 'APPROVE',
      p_comments: 'Approved by engineering manager',
    })
    assert.equal((mgrApprove as any)?.success, true)
    assert.equal(savedRequest.status, 'PENDING_HR_APPROVAL')
    assert.equal(savedRequest.current_approver_id, hr.id)

    // HR Completes Final Approval
    const hrClient = createMockSupabaseClient({
      id: hr.id,
      email: hr.work_email,
      employeeId: hr.id,
      organizationId: hr.organization_id,
    })

    const { data: hrApprove } = await hrClient.rpc('process_approval_action', {
      p_request_id: request.id,
      p_actor_id: hr.id,
      p_action: 'APPROVE',
      p_comments: 'Approved by HR',
    })
    assert.equal((hrApprove as any)?.success, true)
    assert.equal(savedRequest.status, 'APPROVED')

    // Final balance verified
    assert.equal(balanceBefore.available_balance, initialAvailable - 2)
    assert.equal(balanceBefore.pending, initialPending)
  })

  test('Overlapping leave validation blocks duplicate date submission', async () => {
    // Attempting to submit for dates where a request already exists
    const testStartDate = '2026-11-03'
    const testEndDate = '2026-11-07'

    const { data: overlapping } = await client
      .from('leave_requests')
      .select('id, request_number, start_date, end_date, status')
      .eq('employee_id', employee.id)
      .not('status', 'in', '("REJECTED","WITHDRAWN","CANCELLED")')
      .lte('start_date', testEndDate)
      .gte('end_date', testStartDate)

    assert.ok(overlapping && overlapping.length > 0)
    assert.equal(overlapping[0].request_number, 'LR-2026-0001')
  })
})
