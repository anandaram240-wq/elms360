import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  getDayOfWeek,
  isWeeklyOff,
  calculateWorkingDays,
  datesBetween,
  addDays,
} from '../date-utils'

// Nov 2026: 20=Fri, 21=Sat, 22=Sun, 23=Mon, 24=Tue, 25=Wed, 28=Sat

describe('getDayOfWeek — timezone-safe', () => {
  test('20 Nov 2026 is Friday (5)', () => assert.equal(getDayOfWeek('2026-11-20'), 5))
  test('21 Nov 2026 is Saturday (6)', () => assert.equal(getDayOfWeek('2026-11-21'), 6))
  test('22 Nov 2026 is Sunday (0)', () => assert.equal(getDayOfWeek('2026-11-22'), 0))
  test('23 Nov 2026 is Monday (1)', () => assert.equal(getDayOfWeek('2026-11-23'), 1))
  test('24 Nov 2026 is Tuesday (2)', () => assert.equal(getDayOfWeek('2026-11-24'), 2))
  test('25 Nov 2026 is Wednesday (3)', () => assert.equal(getDayOfWeek('2026-11-25'), 3))
  test('28 Nov 2026 is Saturday (6)', () => assert.equal(getDayOfWeek('2026-11-28'), 6))
  test('1 Jan 2026 is Thursday (4)', () => assert.equal(getDayOfWeek('2026-01-01'), 4))
  test('29 Feb 2028 is Tuesday (2) — leap year', () => assert.equal(getDayOfWeek('2028-02-29'), 2))
})

describe('calculateWorkingDays — Mon-Fri schedule [0,6]', () => {
  const offDays = [0, 6] // Sun + Sat

  test('21 Nov 2026 alone → 0 working days (Saturday)', () => {
    const r = calculateWorkingDays('2026-11-21', '2026-11-21', offDays)
    assert.equal(r.workingDays, 0)
    assert.equal(r.weekendDays, 1)
  })

  test('28 Nov 2026 alone → 0 working days (Saturday)', () => {
    const r = calculateWorkingDays('2026-11-28', '2026-11-28', offDays)
    assert.equal(r.workingDays, 0)
  })

  test('24-25 Nov 2026 → 2 working days (Tue-Wed)', () => {
    const r = calculateWorkingDays('2026-11-24', '2026-11-25', offDays)
    assert.equal(r.workingDays, 2)
  })

  test('21-24 Nov 2026 → 2 working days (Sat+Sun skipped)', () => {
    const r = calculateWorkingDays('2026-11-21', '2026-11-24', offDays)
    assert.equal(r.workingDays, 2) // Mon+Tue only (wait: 21=Sat,22=Sun,23=Mon,24=Tue → 2)
  })

  test('20-25 Nov 2026 → 4 working days', () => {
    const r = calculateWorkingDays('2026-11-20', '2026-11-25', offDays)
    assert.equal(r.workingDays, 4) // Fri,Mon,Tue,Wed
  })

  test('end before start → 0 days', () => {
    const r = calculateWorkingDays('2026-11-25', '2026-11-20', offDays)
    assert.equal(r.workingDays, 0)
    assert.equal(r.totalCalendarDays, 0)
  })
})

describe('calculateWorkingDays — Mon-Sat schedule [0] only (Sunday off)', () => {
  const offDays = [0] // Sunday only

  test('21 Nov 2026 alone → 1 working day (Saturday is working)', () => {
    const r = calculateWorkingDays('2026-11-21', '2026-11-21', offDays)
    assert.equal(r.workingDays, 1)
  })

  test('28 Nov 2026 alone → 1 working day', () => {
    const r = calculateWorkingDays('2026-11-28', '2026-11-28', offDays)
    assert.equal(r.workingDays, 1)
  })

  test('21-24 Nov 2026 → 3 working days (Sat+Mon+Tue; Sun skipped)', () => {
    const r = calculateWorkingDays('2026-11-21', '2026-11-24', offDays)
    assert.equal(r.workingDays, 3) // 21=Sat(work), 22=Sun(off), 23=Mon(work), 24=Tue(work)
  })
})

describe('calculateWorkingDays — with holidays', () => {
  const offDays = [0, 6]

  test('holiday on a working day reduces count', () => {
    const r = calculateWorkingDays('2026-11-23', '2026-11-25', offDays, ['2026-11-23'])
    assert.equal(r.workingDays, 2) // Mon is holiday, Tue+Wed working
    assert.equal(r.holidayDays, 1)
  })

  test('holiday on weekend does not affect working day count', () => {
    const r = calculateWorkingDays('2026-11-21', '2026-11-25', offDays, ['2026-11-21'])
    // 21=Sat(weekend), 22=Sun(weekend), 23=Mon, 24=Tue, 25=Wed
    assert.equal(r.workingDays, 3) // holiday was on weekend, doesn't subtract from working
    assert.equal(r.weekendDays, 2) // 21(Sat) is weekend even though it's also a holiday
  })
})

describe('addDays and datesBetween', () => {
  test('addDays across month boundary', () => {
    assert.equal(addDays('2026-11-30', 1), '2026-12-01')
  })
  test('addDays across year boundary', () => {
    assert.equal(addDays('2026-12-31', 1), '2027-01-01')
  })
  test('datesBetween inclusive', () => {
    const r = datesBetween('2026-11-20', '2026-11-22')
    assert.deepEqual(r, ['2026-11-20', '2026-11-21', '2026-11-22'])
  })
  test('datesBetween single day', () => {
    assert.deepEqual(datesBetween('2026-11-21', '2026-11-21'), ['2026-11-21'])
  })
  test('datesBetween end before start = empty', () => {
    assert.deepEqual(datesBetween('2026-11-25', '2026-11-20'), [])
  })
})
