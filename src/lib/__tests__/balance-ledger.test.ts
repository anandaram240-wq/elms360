import { describe, it } from 'node:test'
import assert from 'node:assert'

export interface LeaveBalance {
  openingBalance: number
  accrued: number
  used: number
  pending: number
  adjusted: number
  carriedForward: number
  expired: number
}

export function computeBalances(b: LeaveBalance): { closingBalance: number; availableBalance: number } {
  const closingBalance = b.openingBalance + b.accrued + b.adjusted + b.carriedForward - b.used - b.expired
  const availableBalance = closingBalance - b.pending
  return { closingBalance, availableBalance }
}

export interface LedgerTransaction {
  id: string
  transactionType: 'OPENING' | 'ACCRUAL' | 'DEDUCTION' | 'REVERSAL' | 'PENDING_RESERVE' | 'PENDING_RELEASE' | 'MANUAL_ADJUSTMENT'
  amount: number
  balanceBefore: number
  balanceAfter: number
  idempotencyKey?: string
}

export class BalanceLedgerEngine {
  private balance: LeaveBalance
  private processedKeys = new Set<string>()
  public ledger: LedgerTransaction[] = []

  constructor(initial: LeaveBalance) {
    this.balance = { ...initial }
  }

  getBalance(): LeaveBalance {
    return { ...this.balance }
  }

  // Reserve pending balance when employee submits request
  reservePending(amount: number, idempotencyKey: string): boolean {
    if (this.processedKeys.has(idempotencyKey)) {
      return false // Idempotent duplicate call ignored
    }
    const { availableBalance } = computeBalances(this.balance)
    if (availableBalance < amount) {
      throw new Error('Insufficient balance to reserve pending leave')
    }

    this.balance.pending += amount
    this.processedKeys.add(idempotencyKey)
    return true
  }

  // Deduct upon final approval: release pending and increment used exactly once
  processApprovalDeduction(amount: number, idempotencyKey: string): LedgerTransaction {
    if (this.processedKeys.has(idempotencyKey)) {
      throw new Error(`Duplicate transaction prevented by idempotency key: ${idempotencyKey}`)
    }

    const { closingBalance: before } = computeBalances(this.balance)

    // Release from pending, commit to used
    this.balance.pending = Math.max(0, this.balance.pending - amount)
    this.balance.used += amount

    const { closingBalance: after } = computeBalances(this.balance)

    const tx: LedgerTransaction = {
      id: `tx-${Date.now()}-${Math.random()}`,
      transactionType: 'DEDUCTION',
      amount,
      balanceBefore: before,
      balanceAfter: after,
      idempotencyKey,
    }

    this.ledger.push(tx)
    this.processedKeys.add(idempotencyKey)
    return tx
  }

  // Reverse deduction when approved leave is cancelled
  processCancellationReversal(amount: number, idempotencyKey: string): LedgerTransaction {
    if (this.processedKeys.has(idempotencyKey)) {
      throw new Error(`Duplicate reversal prevented by idempotency key: ${idempotencyKey}`)
    }

    const { closingBalance: before } = computeBalances(this.balance)
    this.balance.used = Math.max(0, this.balance.used - amount)
    const { closingBalance: after } = computeBalances(this.balance)

    const tx: LedgerTransaction = {
      id: `tx-${Date.now()}-${Math.random()}`,
      transactionType: 'REVERSAL',
      amount,
      balanceBefore: before,
      balanceAfter: after,
      idempotencyKey,
    }

    this.ledger.push(tx)
    this.processedKeys.add(idempotencyKey)
    return tx
  }
}

describe('Leave Balance Ledger & Concurrency Tests', () => {
  it('correctly calculates closing and available balance with pending reservations', () => {
    const balance: LeaveBalance = {
      openingBalance: 20,
      accrued: 5,
      used: 3,
      pending: 4,
      adjusted: 0,
      carriedForward: 0,
      expired: 0,
    }
    const { closingBalance, availableBalance } = computeBalances(balance)
    // closing = 20 + 5 - 3 = 22
    assert.strictEqual(closingBalance, 22)
    // available = 22 - 4 = 18
    assert.strictEqual(availableBalance, 18)
  })

  it('reserves pending balance upon application submission', () => {
    const engine = new BalanceLedgerEngine({
      openingBalance: 15,
      accrued: 0,
      used: 0,
      pending: 0,
      adjusted: 0,
      carriedForward: 0,
      expired: 0,
    })

    const reserved = engine.reservePending(3, 'idemp-req-001')
    assert.strictEqual(reserved, true)
    const b = engine.getBalance()
    assert.strictEqual(b.pending, 3)
    assert.strictEqual(computeBalances(b).availableBalance, 12)
  })

  it('deducts leave exactly once upon approval and releases pending reservation', () => {
    const engine = new BalanceLedgerEngine({
      openingBalance: 15,
      accrued: 0,
      used: 0,
      pending: 3,
      adjusted: 0,
      carriedForward: 0,
      expired: 0,
    })

    const tx = engine.processApprovalDeduction(3, 'idemp-approve-001')
    assert.strictEqual(tx.transactionType, 'DEDUCTION')
    assert.strictEqual(tx.amount, 3)
    assert.strictEqual(tx.balanceBefore, 15)
    assert.strictEqual(tx.balanceAfter, 12)

    const b = engine.getBalance()
    assert.strictEqual(b.pending, 0)
    assert.strictEqual(b.used, 3)
    assert.strictEqual(computeBalances(b).closingBalance, 12)
    assert.strictEqual(computeBalances(b).availableBalance, 12)
  })

  it('prevents double deductions when approver submits duplicate or concurrent action', () => {
    const engine = new BalanceLedgerEngine({
      openingBalance: 20,
      accrued: 0,
      used: 0,
      pending: 5,
      adjusted: 0,
      carriedForward: 0,
      expired: 0,
    })

    // First approval succeeds
    engine.processApprovalDeduction(5, 'idemp-concurrent-key')

    // Second simultaneous approval with same key must throw
    assert.throws(
      () => engine.processApprovalDeduction(5, 'idemp-concurrent-key'),
      /Duplicate transaction prevented by idempotency key/
    )

    // Verify balance was only deducted ONCE
    const b = engine.getBalance()
    assert.strictEqual(b.used, 5)
    assert.strictEqual(computeBalances(b).closingBalance, 15)
    assert.strictEqual(engine.ledger.length, 1)
  })

  it('restores leave balance upon cancellation through an authorized reversal ledger entry', () => {
    const engine = new BalanceLedgerEngine({
      openingBalance: 20,
      accrued: 0,
      used: 4,
      pending: 0,
      adjusted: 0,
      carriedForward: 0,
      expired: 0,
    })

    assert.strictEqual(computeBalances(engine.getBalance()).closingBalance, 16)

    const revTx = engine.processCancellationReversal(4, 'idemp-cancel-rev-001')
    assert.strictEqual(revTx.transactionType, 'REVERSAL')
    assert.strictEqual(revTx.amount, 4)
    assert.strictEqual(revTx.balanceBefore, 16)
    assert.strictEqual(revTx.balanceAfter, 20)

    const b = engine.getBalance()
    assert.strictEqual(b.used, 0)
    assert.strictEqual(computeBalances(b).closingBalance, 20)
  })
})
