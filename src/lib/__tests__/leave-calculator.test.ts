import { describe, it } from 'node:test'
import assert from 'node:assert'
import { calculateWorkingDays } from '../leave-calculator'

describe('calculateWorkingDays', () => {
  it('calculates simple weekday range correctly (Mon to Wed)', () => {
    // 2026-03-02 is Monday, 2026-03-04 is Wednesday
    const start = new Date(2026, 2, 2)
    const end = new Date(2026, 2, 4)
    const result = calculateWorkingDays({
      startDate: start,
      endDate: end,
      workingDays: [1, 2, 3, 4, 5],
      holidays: [],
      dayType: 'FULL_DAY',
    })

    assert.strictEqual(result.totalWorkingDays, 3)
    assert.strictEqual(result.skippedWeekends, 0)
    assert.strictEqual(result.skippedHolidays, 0)
    assert.strictEqual(result.dayBreakdown.length, 3)
    assert.strictEqual(result.dayBreakdown.every(d => d.type === 'working'), true)
  })

  it('calculates range spanning a weekend correctly (Fri to Tue)', () => {
    // 2026-03-06 (Fri) to 2026-03-10 (Tue)
    // Days: Fri (work), Sat (weekend), Sun (weekend), Mon (work), Tue (work) -> 3 working days, 2 weekends
    const start = new Date(2026, 2, 6)
    const end = new Date(2026, 2, 10)
    const result = calculateWorkingDays({
      startDate: start,
      endDate: end,
      workingDays: [1, 2, 3, 4, 5],
      holidays: [],
      dayType: 'FULL_DAY',
    })

    assert.strictEqual(result.totalWorkingDays, 3)
    assert.strictEqual(result.skippedWeekends, 2)
    assert.strictEqual(result.skippedHolidays, 0)
    assert.strictEqual(result.dayBreakdown.length, 5)
  })

  it('skips company holidays on working days', () => {
    // 2026-03-02 (Mon) to 2026-03-06 (Fri)
    // Holiday on 2026-03-04 (Wed)
    const start = new Date(2026, 2, 2)
    const end = new Date(2026, 2, 6)
    const holiday = new Date(2026, 2, 4)

    const result = calculateWorkingDays({
      startDate: start,
      endDate: end,
      workingDays: [1, 2, 3, 4, 5],
      holidays: [holiday],
      dayType: 'FULL_DAY',
    })

    assert.strictEqual(result.totalWorkingDays, 4)
    assert.strictEqual(result.skippedWeekends, 0)
    assert.strictEqual(result.skippedHolidays, 1)
    const wedBreakdown = result.dayBreakdown.find(d => d.type === 'holiday')
    assert.ok(wedBreakdown)
    assert.strictEqual(wedBreakdown.value, 0)
  })

  it('handles half day selection', () => {
    // Single day: 2026-03-02 (Mon)
    const start = new Date(2026, 2, 2)
    const end = new Date(2026, 2, 2)

    const resultAM = calculateWorkingDays({
      startDate: start,
      endDate: end,
      workingDays: [1, 2, 3, 4, 5],
      dayType: 'HALF_DAY_AM',
    })
    assert.strictEqual(resultAM.totalWorkingDays, 0.5)
    assert.strictEqual(resultAM.dayBreakdown[0].value, 0.5)

    const resultPM = calculateWorkingDays({
      startDate: start,
      endDate: end,
      workingDays: [1, 2, 3, 4, 5],
      dayType: 'HALF_DAY_PM',
    })
    assert.strictEqual(resultPM.totalWorkingDays, 0.5)
    assert.strictEqual(resultPM.dayBreakdown[0].value, 0.5)
  })

  it('handles single day application', () => {
    // Single working day: 2026-03-03 (Tue)
    const date = new Date(2026, 2, 3)
    const result = calculateWorkingDays({
      startDate: date,
      endDate: date,
      workingDays: [1, 2, 3, 4, 5],
      dayType: 'FULL_DAY',
    })

    assert.strictEqual(result.totalWorkingDays, 1)
    assert.strictEqual(result.skippedWeekends, 0)
    assert.strictEqual(result.skippedHolidays, 0)
    assert.strictEqual(result.dayBreakdown.length, 1)
    assert.strictEqual(result.dayBreakdown[0].type, 'working')
  })

  it('handles single weekend day', () => {
    // 2026-03-07 is Saturday
    const sat = new Date(2026, 2, 7)
    const result = calculateWorkingDays({
      startDate: sat,
      endDate: sat,
      workingDays: [1, 2, 3, 4, 5],
      dayType: 'FULL_DAY',
    })

    assert.strictEqual(result.totalWorkingDays, 0)
    assert.strictEqual(result.skippedWeekends, 1)
    assert.strictEqual(result.dayBreakdown.length, 1)
    assert.strictEqual(result.dayBreakdown[0].type, 'weekend')
  })

  it('handles multi-week range', () => {
    // 2 full weeks: 2026-03-02 (Mon) to 2026-03-15 (Sun) = 14 days
    // 10 working days, 4 weekend days
    const start = new Date(2026, 2, 2)
    const end = new Date(2026, 2, 15)

    const result = calculateWorkingDays({
      startDate: start,
      endDate: end,
      workingDays: [1, 2, 3, 4, 5],
      holidays: [],
      dayType: 'FULL_DAY',
    })

    assert.strictEqual(result.totalWorkingDays, 10)
    assert.strictEqual(result.skippedWeekends, 4)
    assert.strictEqual(result.skippedHolidays, 0)
    assert.strictEqual(result.dayBreakdown.length, 14)
  })

  it('handles partial hours calculation', () => {
    // 2026-03-02: 4 hours of 8 hour workday
    const start = new Date(2026, 2, 2)
    const end = new Date(2026, 2, 2)

    const result = calculateWorkingDays({
      startDate: start,
      endDate: end,
      workingDays: [1, 2, 3, 4, 5],
      dayType: 'PARTIAL',
      partialHours: 4,
      hoursPerDay: 8,
    })

    assert.strictEqual(result.totalWorkingDays, 0.5)
  })

  it('handles invalid date range (endDate before startDate)', () => {
    const start = new Date(2026, 2, 10)
    const end = new Date(2026, 2, 5)

    const result = calculateWorkingDays({
      startDate: start,
      endDate: end,
    })

    assert.strictEqual(result.totalWorkingDays, 0)
    assert.strictEqual(result.dayBreakdown.length, 0)
  })
})
