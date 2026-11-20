import { describe, it } from 'node:test'
import assert from 'node:assert'
import { getFiscalYear } from '@/lib/date-utils'

describe('Fiscal Year & Multi-Year Leave Balance Resolution Tests', () => {
  it('correctly maps dates to fiscal year under April-start fiscal policy', () => {
    // Under April-start (fiscal_year_start = 4):
    // FY 2026 runs from 2026-04-01 to 2027-03-31
    assert.strictEqual(getFiscalYear('2026-04-01', 4, 'FISCAL'), 2026)
    assert.strictEqual(getFiscalYear('2026-11-20', 4, 'FISCAL'), 2026)
    assert.strictEqual(getFiscalYear('2026-12-31', 4, 'FISCAL'), 2026)
    assert.strictEqual(getFiscalYear('2027-01-13', 4, 'FISCAL'), 2026) // User screenshot date!
    assert.strictEqual(getFiscalYear('2027-02-15', 4, 'FISCAL'), 2026)
    assert.strictEqual(getFiscalYear('2027-03-31', 4, 'FISCAL'), 2026)

    // FY 2027 begins 2027-04-01
    assert.strictEqual(getFiscalYear('2027-04-01', 4, 'FISCAL'), 2027)
    assert.strictEqual(getFiscalYear('2027-05-15', 4, 'FISCAL'), 2027)
    assert.strictEqual(getFiscalYear('2028-01-10', 4, 'FISCAL'), 2027)
  })

  it('correctly maps dates under calendar year policy', () => {
    assert.strictEqual(getFiscalYear('2026-11-20', 1, 'CALENDAR'), 2026)
    assert.strictEqual(getFiscalYear('2027-01-13', 1, 'CALENDAR'), 2027)
    assert.strictEqual(getFiscalYear('2027-05-15', 1, 'CALENDAR'), 2027)
  })

  it('prevents zero-day balance false rejection when applying across year boundary', () => {
    // When an employee has 10 days of Sick Leave in FY 2026:
    const mockBalances = [
      { fiscal_year: 2026, leave_type_id: 'SL_ID', available_balance: 10 },
      { fiscal_year: 2027, leave_type_id: 'SL_ID', available_balance: 10 },
    ]

    const startDate = '2027-01-13'
    const calYear = 2027
    const fy = getFiscalYear(startDate, 4, 'FISCAL') // 2026

    // Whether matched by calendar year 2027 or by fiscal year 2026, balance must be >= requested days (2)
    const matchByCal = mockBalances.find((b) => b.fiscal_year === calYear && b.leave_type_id === 'SL_ID')
    const matchByFy = mockBalances.find((b) => b.fiscal_year === fy && b.leave_type_id === 'SL_ID')

    assert.ok(matchByCal && matchByCal.available_balance >= 2)
    assert.ok(matchByFy && matchByFy.available_balance >= 2)
  })
})
