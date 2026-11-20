import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  analyzeLeaveOverlap,
  getWorkingDaysInRange,
  type LeaveRequestRecord,
} from '@/lib/overlap-calculator'

describe('Leave Overlap Validation & Policy Engine (Phase 9 Tests A - K)', () => {
  const EMP_ARJUN = '44444444-0008-0000-0000-000000000001'
  const EMP_PRIYA = '44444444-0002-0000-0000-000000000001'
  const WEEKLY_OFF = [0, 6] // Sat, Sun off

  // TEST A: Different employee requests the same date
  it('TEST A: Different employee requests the same date -> ALLOW', () => {
    const existingRequests: LeaveRequestRecord[] = [
      {
        id: 'req-priya-1',
        request_number: 'LR-2026-000101',
        employee_id: EMP_PRIYA,
        start_date: '2026-11-27',
        end_date: '2026-11-27',
        status: 'APPROVED',
      },
    ]

    const result = analyzeLeaveOverlap({
      employeeId: EMP_ARJUN,
      startDate: '2026-11-27',
      endDate: '2026-11-27',
      existingRequests,
      weeklyOffDays: WEEKLY_OFF,
      policy: 'BLOCK', // Even under strict BLOCK policy, different employee must never block
    })

    assert.equal(result.hasWorkingDayOverlap, false)
    assert.equal(result.canSubmit, true)
    assert.equal(result.blockingError, null)
    assert.equal(result.conflicts.length, 0)
  })

  // TEST B: Same employee has an existing REJECTED request
  it('TEST B: Same employee has an existing REJECTED request -> ALLOW', () => {
    const existingRequests: LeaveRequestRecord[] = [
      {
        id: 'req-rejected',
        request_number: 'LR-2026-000102',
        employee_id: EMP_ARJUN,
        start_date: '2026-11-27',
        end_date: '2026-11-27',
        status: 'REJECTED',
      },
    ]

    const result = analyzeLeaveOverlap({
      employeeId: EMP_ARJUN,
      startDate: '2026-11-27',
      endDate: '2026-11-27',
      existingRequests,
      weeklyOffDays: WEEKLY_OFF,
      policy: 'BLOCK',
    })

    assert.equal(result.hasWorkingDayOverlap, false)
    assert.equal(result.canSubmit, true)
    assert.equal(result.conflicts.length, 0)
  })

  // TEST C: Same employee has an existing WITHDRAWN request
  it('TEST C: Same employee has an existing WITHDRAWN request -> ALLOW', () => {
    const existingRequests: LeaveRequestRecord[] = [
      {
        id: 'req-withdrawn',
        request_number: 'LR-2026-000103',
        employee_id: EMP_ARJUN,
        start_date: '2026-11-27',
        end_date: '2026-11-27',
        status: 'WITHDRAWN',
      },
    ]

    const result = analyzeLeaveOverlap({
      employeeId: EMP_ARJUN,
      startDate: '2026-11-27',
      endDate: '2026-11-27',
      existingRequests,
      weeklyOffDays: WEEKLY_OFF,
      policy: 'BLOCK',
    })

    assert.equal(result.hasWorkingDayOverlap, false)
    assert.equal(result.canSubmit, true)
    assert.equal(result.conflicts.length, 0)
  })

  // TEST D: Same employee has an existing CANCELLED request
  it('TEST D: Same employee has an existing CANCELLED request -> ALLOW', () => {
    const existingRequests: LeaveRequestRecord[] = [
      {
        id: 'req-cancelled',
        request_number: 'LR-2026-000104',
        employee_id: EMP_ARJUN,
        start_date: '2026-11-27',
        end_date: '2026-11-27',
        status: 'CANCELLED',
      },
    ]

    const result = analyzeLeaveOverlap({
      employeeId: EMP_ARJUN,
      startDate: '2026-11-27',
      endDate: '2026-11-27',
      existingRequests,
      weeklyOffDays: WEEKLY_OFF,
      policy: 'BLOCK',
    })

    assert.equal(result.hasWorkingDayOverlap, false)
    assert.equal(result.canSubmit, true)
    assert.equal(result.conflicts.length, 0)
  })

  // TEST E: Same employee has an overlapping PENDING request with WARN_AND_ALLOW
  it('TEST E: Same employee has an overlapping PENDING request with WARN_AND_ALLOW -> SUBMIT WITH WARNING', () => {
    const existingRequests: LeaveRequestRecord[] = [
      {
        id: 'req-pending-1',
        request_number: 'LR-2026-000105',
        employee_id: EMP_ARJUN,
        start_date: '2026-11-27',
        end_date: '2026-11-27',
        status: 'PENDING_MANAGER_APPROVAL',
      },
    ]

    const result = analyzeLeaveOverlap({
      employeeId: EMP_ARJUN,
      startDate: '2026-11-26',
      endDate: '2026-11-27',
      existingRequests,
      weeklyOffDays: WEEKLY_OFF,
      policy: 'WARN_AND_ALLOW',
    })

    assert.equal(result.hasWorkingDayOverlap, true)
    assert.equal(result.canSubmit, true) // Must NOT block submission under WARN_AND_ALLOW
    assert.ok(result.warningMessage && result.warningMessage.includes('LR-2026-000105'))
    assert.deepEqual(result.conflictingWorkingDays, ['2026-11-27'])
    assert.equal(result.blockingError, null)
  })

  // TEST F: Same employee has an overlapping APPROVED request with WARN_AND_ALLOW
  it('TEST F: Same employee has an overlapping APPROVED request with WARN_AND_ALLOW -> SUBMIT WITH WARNING', () => {
    const existingRequests: LeaveRequestRecord[] = [
      {
        id: '55786b70-3583-4fe0-99ea-6764b352557b',
        request_number: 'LR-2026-002002',
        employee_id: EMP_ARJUN,
        start_date: '2026-11-27',
        end_date: '2026-11-27',
        status: 'APPROVED',
      },
    ]

    const result = analyzeLeaveOverlap({
      employeeId: EMP_ARJUN,
      startDate: '2026-11-26',
      endDate: '2026-11-27',
      existingRequests,
      weeklyOffDays: WEEKLY_OFF,
      policy: 'WARN_AND_ALLOW',
    })

    assert.equal(result.hasWorkingDayOverlap, true)
    assert.equal(result.hasApprovedConflict, true)
    assert.equal(result.canSubmit, true) // Allowed to submit with warning
    assert.ok(result.warningMessage && result.warningMessage.includes('LR-2026-002002'))
    assert.equal(result.conflicts[0].isAlreadyApproved, true)
  })

  // TEST G: Same employee has an overlapping active request with BLOCK
  it('TEST G: Same employee has an overlapping active request with BLOCK -> BLOCK', () => {
    const existingRequests: LeaveRequestRecord[] = [
      {
        id: 'req-active-g',
        request_number: 'LR-2026-002002',
        employee_id: EMP_ARJUN,
        start_date: '2026-11-27',
        end_date: '2026-11-27',
        status: 'APPROVED',
      },
    ]

    const result = analyzeLeaveOverlap({
      employeeId: EMP_ARJUN,
      startDate: '2026-11-26',
      endDate: '2026-11-27',
      existingRequests,
      weeklyOffDays: WEEKLY_OFF,
      policy: 'BLOCK',
    })

    assert.equal(result.hasWorkingDayOverlap, true)
    assert.equal(result.canSubmit, false) // Strictly blocked under BLOCK policy
    assert.ok(result.blockingError && result.blockingError.includes('LR-2026-002002'))
  })

  // TEST H: Overlapping calendar ranges with no common eligible working dates
  it('TEST H: Overlapping calendar ranges with no common eligible working dates -> ALLOW', () => {
    // Nov 21 (Sat) and Nov 22 (Sun) 2026
    const existingRequests: LeaveRequestRecord[] = [
      {
        id: 'req-weekend',
        request_number: 'LR-2026-000108',
        employee_id: EMP_ARJUN,
        start_date: '2026-11-21',
        end_date: '2026-11-22',
        status: 'APPROVED',
      },
    ]

    // New request is Nov 22 (Sun) to Nov 23 (Mon)
    // Calendar ranges intersect on Nov 22 (Sunday), but Sunday is a weekend (not a working day).
    const result = analyzeLeaveOverlap({
      employeeId: EMP_ARJUN,
      startDate: '2026-11-22',
      endDate: '2026-11-23',
      existingRequests,
      weeklyOffDays: WEEKLY_OFF,
      policy: 'BLOCK',
    })

    assert.equal(result.hasWorkingDayOverlap, false)
    assert.equal(result.hasCalendarOverlapOnly, true)
    assert.equal(result.canSubmit, true) // Must NOT block because there are NO common working days!
    assert.equal(result.conflictingWorkingDays.length, 0)
  })

  // TEST I: Two employees submit leave simultaneously for the same date
  it('TEST I: Two employees submit leave for the same date -> Both proceed independently', () => {
    const existingRequests: LeaveRequestRecord[] = []

    // Employee 1 submits for Nov 27
    const resultEmp1 = analyzeLeaveOverlap({
      employeeId: EMP_ARJUN,
      startDate: '2026-11-27',
      endDate: '2026-11-27',
      existingRequests,
      weeklyOffDays: WEEKLY_OFF,
      policy: 'BLOCK',
    })
    assert.equal(resultEmp1.canSubmit, true)

    // Add employee 1's request to DB
    const updatedRequests: LeaveRequestRecord[] = [
      ...existingRequests,
      {
        id: 'req-emp-1',
        request_number: 'LR-2026-000110',
        employee_id: EMP_ARJUN,
        start_date: '2026-11-27',
        end_date: '2026-11-27',
        status: 'PENDING_MANAGER_APPROVAL',
      },
    ]

    // Employee 2 submits for the EXACT SAME date
    const resultEmp2 = analyzeLeaveOverlap({
      employeeId: EMP_PRIYA,
      startDate: '2026-11-27',
      endDate: '2026-11-27',
      existingRequests: updatedRequests,
      weeklyOffDays: WEEKLY_OFF,
      policy: 'BLOCK',
    })
    // Employee 2 must NOT be blocked by Employee 1!
    assert.equal(resultEmp2.canSubmit, true)
    assert.equal(resultEmp2.hasWorkingDayOverlap, false)
  })

  // TEST J: Two applications for same employee and same working day -> Conflict handling & double deduction protection
  it('TEST J: Two applications for same employee and same working day -> Conflict handled without double deduction', () => {
    const existingRequests: LeaveRequestRecord[] = [
      {
        id: 'req-original',
        request_number: 'LR-2026-000111',
        employee_id: EMP_ARJUN,
        start_date: '2026-11-27',
        end_date: '2026-11-27',
        status: 'APPROVED',
      },
    ]

    // Second request submitted under WARN_AND_ALLOW
    const result = analyzeLeaveOverlap({
      employeeId: EMP_ARJUN,
      startDate: '2026-11-27',
      endDate: '2026-11-27',
      existingRequests,
      weeklyOffDays: WEEKLY_OFF,
      policy: 'WARN_AND_ALLOW',
    })

    assert.equal(result.hasWorkingDayOverlap, true)
    assert.equal(result.hasApprovedConflict, true)
    assert.equal(result.canSubmit, true) // Allowed to submit with warning

    // Approval conflict check: simulate manager approval of duplicate approved date
    // Approval without override justification must be flagged
    const requiresOverride = result.hasApprovedConflict
    assert.equal(requiresOverride, true)

    // Net new working days to deduct should be 0 (since 2026-11-27 was already deducted)
    const proposedWorkingDays = getWorkingDaysInRange('2026-11-27', '2026-11-27', WEEKLY_OFF)
    const alreadyDeductedDays = result.conflicts
      .filter((c) => c.isAlreadyApproved)
      .flatMap((c) => c.commonWorkingDays)

    const netNewDays = proposedWorkingDays.filter((d) => !alreadyDeductedDays.includes(d))
    assert.equal(netNewDays.length, 0) // Prevents duplicate deduction!
  })

  // TEST K: Existing request is a seed fixture from another test account
  it('TEST K: Existing request is a seed fixture from another test account -> It must not block the real employee', () => {
    const SEED_FIXTURE_EMPLOYEE = '00000000-0000-0000-0000-000000000099'
    const existingRequests: LeaveRequestRecord[] = [
      {
        id: 'seed-req-99',
        request_number: 'LR-2026-000099',
        employee_id: SEED_FIXTURE_EMPLOYEE,
        start_date: '2026-11-27',
        end_date: '2026-11-27',
        status: 'APPROVED',
      },
    ]

    const result = analyzeLeaveOverlap({
      employeeId: EMP_ARJUN,
      startDate: '2026-11-27',
      endDate: '2026-11-27',
      existingRequests,
      weeklyOffDays: WEEKLY_OFF,
      policy: 'BLOCK',
    })

    assert.equal(result.hasWorkingDayOverlap, false)
    assert.equal(result.canSubmit, true)
  })
})
