import { describe, it } from 'node:test'
import assert from 'node:assert'

export interface LeavePolicyRules {
  annualEntitlement: number
  accrualType: 'ANNUAL' | 'MONTHLY' | 'QUARTERLY' | 'NONE'
  accrualAmount: number
  carryForwardEnabled: boolean
  carryForwardMaxDays: number
  carryForwardExpiryMonths: number
  maxConsecutiveDays: number
  allowsNegativeBalance: boolean
  probationEligible: boolean
  probationDays: number
}

export function calculateAccrual(params: {
  policy: LeavePolicyRules
  monthsWorked: number
  fiscalYearMonth: number // 1 to 12
}): number {
  const { policy, monthsWorked, fiscalYearMonth } = params

  if (policy.accrualType === 'NONE') return 0
  if (policy.accrualType === 'ANNUAL') {
    // Lump sum at start of fiscal year or upon completing probation
    if (policy.probationEligible || monthsWorked >= policy.probationDays / 30) {
      return policy.annualEntitlement
    }
    return 0
  }
  if (policy.accrualType === 'MONTHLY') {
    const eligibleMonths = Math.min(monthsWorked, fiscalYearMonth)
    return Number((eligibleMonths * policy.accrualAmount).toFixed(2))
  }
  if (policy.accrualType === 'QUARTERLY') {
    const quarters = Math.floor(Math.min(monthsWorked, fiscalYearMonth) / 3)
    return Number((quarters * (policy.annualEntitlement / 4)).toFixed(2))
  }
  return 0
}

export function calculateCarryForward(params: {
  policy: LeavePolicyRules
  unusedBalance: number
  asOfMonthsIntoNewYear: number
}): { carriedForward: number; expired: number } {
  const { policy, unusedBalance, asOfMonthsIntoNewYear } = params

  if (!policy.carryForwardEnabled || unusedBalance <= 0) {
    return { carriedForward: 0, expired: unusedBalance > 0 ? unusedBalance : 0 }
  }

  const eligibleCarryForward = Math.min(unusedBalance, policy.carryForwardMaxDays)

  // Check if expired
  if (asOfMonthsIntoNewYear > policy.carryForwardExpiryMonths) {
    return { carriedForward: 0, expired: eligibleCarryForward }
  }

  return {
    carriedForward: eligibleCarryForward,
    expired: Math.max(0, unusedBalance - eligibleCarryForward),
  }
}

export function validateApplicationPolicy(params: {
  policy: LeavePolicyRules
  requestedDays: number
  availableBalance: number
}): { allowed: boolean; violation?: string } {
  const { policy, requestedDays, availableBalance } = params

  if (policy.maxConsecutiveDays && requestedDays > policy.maxConsecutiveDays) {
    return {
      allowed: false,
      violation: `Requested duration (${requestedDays} days) exceeds maximum consecutive days (${policy.maxConsecutiveDays} days)`,
    }
  }

  if (!policy.allowsNegativeBalance && availableBalance < requestedDays) {
    return {
      allowed: false,
      violation: `Insufficient leave balance: requested ${requestedDays} days, available ${availableBalance} days`,
    }
  }

  return { allowed: true }
}

describe('Leave Policy Engine Unit Tests', () => {
  const annualPolicy: LeavePolicyRules = {
    annualEntitlement: 21,
    accrualType: 'ANNUAL',
    accrualAmount: 0,
    carryForwardEnabled: true,
    carryForwardMaxDays: 7,
    carryForwardExpiryMonths: 3,
    maxConsecutiveDays: 14,
    allowsNegativeBalance: false,
    probationEligible: true,
    probationDays: 90,
  }

  const monthlyPolicy: LeavePolicyRules = {
    annualEntitlement: 18,
    accrualType: 'MONTHLY',
    accrualAmount: 1.5,
    carryForwardEnabled: true,
    carryForwardMaxDays: 5,
    carryForwardExpiryMonths: 6,
    maxConsecutiveDays: 10,
    allowsNegativeBalance: false,
    probationEligible: false,
    probationDays: 90,
  }

  describe('Accrual Calculations', () => {
    it('calculates full lump-sum annual accrual for eligible employees', () => {
      const accrued = calculateAccrual({
        policy: annualPolicy,
        monthsWorked: 12,
        fiscalYearMonth: 6,
      })
      assert.strictEqual(accrued, 21)
    })

    it('calculates monthly incremental accrual correctly', () => {
      // 4 months worked: 4 * 1.5 = 6 days
      const accrued = calculateAccrual({
        policy: monthlyPolicy,
        monthsWorked: 4,
        fiscalYearMonth: 4,
      })
      assert.strictEqual(accrued, 6)
    })

    it('caps monthly accrual by current fiscal year month', () => {
      // Worked 12 months, but currently month 3 of fiscal year
      const accrued = calculateAccrual({
        policy: monthlyPolicy,
        monthsWorked: 12,
        fiscalYearMonth: 3,
      })
      assert.strictEqual(accrued, 4.5)
    })

    it('withholds accrual for employees under probation when not probation-eligible', () => {
      const probationPolicy: LeavePolicyRules = {
        ...annualPolicy,
        probationEligible: false,
        probationDays: 90,
      }
      const accrued = calculateAccrual({
        policy: probationPolicy,
        monthsWorked: 1, // 30 days < 90 days
        fiscalYearMonth: 2,
      })
      assert.strictEqual(accrued, 0)
    })
  })

  describe('Carry Forward and Expiry Rules', () => {
    it('carries forward unused balance up to max limit', () => {
      const res = calculateCarryForward({
        policy: annualPolicy, // max 7 days
        unusedBalance: 12,
        asOfMonthsIntoNewYear: 2, // within 3-month expiry
      })
      assert.strictEqual(res.carriedForward, 7)
      assert.strictEqual(res.expired, 5) // 12 - 7 = 5 expired
    })

    it('expires carried-forward leave after expiry period', () => {
      const res = calculateCarryForward({
        policy: annualPolicy, // 3 months expiry
        unusedBalance: 6,
        asOfMonthsIntoNewYear: 4, // 4 months > 3 months expiry
      })
      assert.strictEqual(res.carriedForward, 0)
      assert.strictEqual(res.expired, 6)
    })

    it('does not carry forward if carry forward is disabled', () => {
      const noCarryForward: LeavePolicyRules = {
        ...annualPolicy,
        carryForwardEnabled: false,
      }
      const res = calculateCarryForward({
        policy: noCarryForward,
        unusedBalance: 10,
        asOfMonthsIntoNewYear: 1,
      })
      assert.strictEqual(res.carriedForward, 0)
      assert.strictEqual(res.expired, 10)
    })
  })

  describe('Application Policy Rules Validation', () => {
    it('blocks leave request exceeding maximum consecutive days', () => {
      const res = validateApplicationPolicy({
        policy: annualPolicy, // max 14 days
        requestedDays: 16,
        availableBalance: 20,
      })
      assert.strictEqual(res.allowed, false)
      assert.ok(res.violation?.includes('exceeds maximum consecutive days'))
    })

    it('blocks negative balance when negative balance is prohibited', () => {
      const res = validateApplicationPolicy({
        policy: annualPolicy, // negative balance prohibited
        requestedDays: 5,
        availableBalance: 3,
      })
      assert.strictEqual(res.allowed, false)
      assert.ok(res.violation?.includes('Insufficient leave balance'))
    })

    it('allows negative balance when explicitly authorized by policy', () => {
      const flexiblePolicy: LeavePolicyRules = {
        ...annualPolicy,
        allowsNegativeBalance: true,
      }
      const res = validateApplicationPolicy({
        policy: flexiblePolicy,
        requestedDays: 5,
        availableBalance: 3,
      })
      assert.strictEqual(res.allowed, true)
    })
  })
})
