import { describe, it } from 'node:test'
import assert from 'node:assert'

export type LeaveStatus =
  | 'DRAFT'
  | 'PENDING_MANAGER_APPROVAL'
  | 'PENDING_HR_APPROVAL'
  | 'PENDING_ADDITIONAL_APPROVAL'
  | 'CLARIFICATION_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'CANCELLATION_REQUESTED'
  | 'CANCELLED'

export type ApprovalAction =
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'REQUEST_CLARIFICATION'
  | 'WITHDRAW'
  | 'REQUEST_CANCELLATION'
  | 'APPROVE_CANCELLATION'

const VALID_TRANSITIONS: Record<LeaveStatus, Partial<Record<ApprovalAction, LeaveStatus>>> = {
  DRAFT: {
    SUBMIT: 'PENDING_MANAGER_APPROVAL',
    WITHDRAW: 'WITHDRAWN',
  },
  PENDING_MANAGER_APPROVAL: {
    APPROVE: 'PENDING_HR_APPROVAL', // or APPROVED if no HR step
    REJECT: 'REJECTED',
    REQUEST_CLARIFICATION: 'CLARIFICATION_REQUESTED',
    WITHDRAW: 'WITHDRAWN',
  },
  PENDING_HR_APPROVAL: {
    APPROVE: 'APPROVED',
    REJECT: 'REJECTED',
    REQUEST_CLARIFICATION: 'CLARIFICATION_REQUESTED',
    WITHDRAW: 'WITHDRAWN',
  },
  PENDING_ADDITIONAL_APPROVAL: {
    APPROVE: 'APPROVED',
    REJECT: 'REJECTED',
    REQUEST_CLARIFICATION: 'CLARIFICATION_REQUESTED',
    WITHDRAW: 'WITHDRAWN',
  },
  CLARIFICATION_REQUESTED: {
    SUBMIT: 'PENDING_MANAGER_APPROVAL', // re-submit after clarification
    WITHDRAW: 'WITHDRAWN',
  },
  APPROVED: {
    REQUEST_CANCELLATION: 'CANCELLATION_REQUESTED',
  },
  CANCELLATION_REQUESTED: {
    APPROVE_CANCELLATION: 'CANCELLED',
    REJECT: 'APPROVED', // cancellation rejected, returns to approved
  },
  REJECTED: {},
  WITHDRAWN: {},
  CANCELLED: {},
}

export function transitionLeaveStatus(params: {
  currentStatus: LeaveStatus
  action: ApprovalAction
  hasHrStep?: boolean
}): { success: boolean; nextStatus?: LeaveStatus; error?: string } {
  const { currentStatus, action, hasHrStep = true } = params
  const allowedMap = VALID_TRANSITIONS[currentStatus]

  if (!allowedMap || !(action in allowedMap)) {
    return {
      success: false,
      error: `Invalid transition: cannot perform action '${action}' on request with status '${currentStatus}'`,
    }
  }

  let next = allowedMap[action]!
  // If manager approves and workflow has no HR step, transition directly to APPROVED
  if (currentStatus === 'PENDING_MANAGER_APPROVAL' && action === 'APPROVE' && !hasHrStep) {
    next = 'APPROVED'
  }

  return { success: true, nextStatus: next }
}

describe('Approval Workflow State Machine Unit Tests', () => {
  it('transitions DRAFT to PENDING_MANAGER_APPROVAL upon SUBMIT', () => {
    const res = transitionLeaveStatus({ currentStatus: 'DRAFT', action: 'SUBMIT' })
    assert.strictEqual(res.success, true)
    assert.strictEqual(res.nextStatus, 'PENDING_MANAGER_APPROVAL')
  })

  it('routes to PENDING_HR_APPROVAL when manager approves and HR step exists', () => {
    const res = transitionLeaveStatus({
      currentStatus: 'PENDING_MANAGER_APPROVAL',
      action: 'APPROVE',
      hasHrStep: true,
    })
    assert.strictEqual(res.success, true)
    assert.strictEqual(res.nextStatus, 'PENDING_HR_APPROVAL')
  })

  it('routes directly to APPROVED when manager approves and NO HR step configured', () => {
    const res = transitionLeaveStatus({
      currentStatus: 'PENDING_MANAGER_APPROVAL',
      action: 'APPROVE',
      hasHrStep: false,
    })
    assert.strictEqual(res.success, true)
    assert.strictEqual(res.nextStatus, 'APPROVED')
  })

  it('transitions to APPROVED upon final HR approval', () => {
    const res = transitionLeaveStatus({
      currentStatus: 'PENDING_HR_APPROVAL',
      action: 'APPROVE',
    })
    assert.strictEqual(res.success, true)
    assert.strictEqual(res.nextStatus, 'APPROVED')
  })

  it('transitions to REJECTED with reason when manager rejects', () => {
    const res = transitionLeaveStatus({
      currentStatus: 'PENDING_MANAGER_APPROVAL',
      action: 'REJECT',
    })
    assert.strictEqual(res.success, true)
    assert.strictEqual(res.nextStatus, 'REJECTED')
  })

  it('transitions to CLARIFICATION_REQUESTED when clarification is asked', () => {
    const res = transitionLeaveStatus({
      currentStatus: 'PENDING_MANAGER_APPROVAL',
      action: 'REQUEST_CLARIFICATION',
    })
    assert.strictEqual(res.success, true)
    assert.strictEqual(res.nextStatus, 'CLARIFICATION_REQUESTED')
  })

  it('prevents invalid direct status transitions (e.g. REJECTED -> APPROVED)', () => {
    const res = transitionLeaveStatus({
      currentStatus: 'REJECTED',
      action: 'APPROVE',
    })
    assert.strictEqual(res.success, false)
    assert.ok(res.error?.includes('Invalid transition'))
  })

  it('prevents approving already WITHDRAWN requests', () => {
    const res = transitionLeaveStatus({
      currentStatus: 'WITHDRAWN',
      action: 'APPROVE',
    })
    assert.strictEqual(res.success, false)
    assert.ok(res.error?.includes('Invalid transition'))
  })

  it('supports full cancellation workflow for approved leave', () => {
    // 1. Employee requests cancellation
    const cancelReq = transitionLeaveStatus({
      currentStatus: 'APPROVED',
      action: 'REQUEST_CANCELLATION',
    })
    assert.strictEqual(cancelReq.success, true)
    assert.strictEqual(cancelReq.nextStatus, 'CANCELLATION_REQUESTED')

    // 2. HR approves cancellation -> CANCELLED
    const cancelled = transitionLeaveStatus({
      currentStatus: 'CANCELLATION_REQUESTED',
      action: 'APPROVE_CANCELLATION',
    })
    assert.strictEqual(cancelled.success, true)
    assert.strictEqual(cancelled.nextStatus, 'CANCELLED')
  })

  it('returns to APPROVED if cancellation request is rejected', () => {
    const rejectedCancel = transitionLeaveStatus({
      currentStatus: 'CANCELLATION_REQUESTED',
      action: 'REJECT',
    })
    assert.strictEqual(rejectedCancel.success, true)
    assert.strictEqual(rejectedCancel.nextStatus, 'APPROVED')
  })
})
