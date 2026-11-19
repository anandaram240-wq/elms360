import {
  isSameDay,
  isBefore,
  addDays,
  startOfDay,
  format,
} from 'date-fns'

export type DayType = 'FULL_DAY' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'PARTIAL'

export interface CalculateWorkingDaysParams {
  startDate: Date | string
  endDate: Date | string
  workingDays?: number[] // [1,2,3,4,5] = Mon-Fri. Default: [1,2,3,4,5]
  holidays?: (Date | string)[]
  dayType?: DayType
  partialHours?: number
  hoursPerDay?: number
}

export interface DayBreakdownItem {
  date: Date
  value: number
  type: 'working' | 'weekend' | 'holiday'
}

export interface CalculateWorkingDaysResult {
  totalWorkingDays: number
  skippedWeekends: number
  skippedHolidays: number
  dayBreakdown: DayBreakdownItem[]
}

/**
 * Calculates working days between start and end date (inclusive),
 * factoring in non-working days (weekends) and company holidays.
 */
export function calculateWorkingDays(params: CalculateWorkingDaysParams): CalculateWorkingDaysResult {
  const {
    startDate: rawStart,
    endDate: rawEnd,
    workingDays = [1, 2, 3, 4, 5], // Default: Monday (1) to Friday (5)
    holidays: rawHolidays = [],
    dayType = 'FULL_DAY',
    partialHours,
    hoursPerDay = 8,
  } = params

  const start = startOfDay(typeof rawStart === 'string' ? new Date(rawStart) : rawStart)
  const end = startOfDay(typeof rawEnd === 'string' ? new Date(rawEnd) : rawEnd)

  if (isBefore(end, start)) {
    return {
      totalWorkingDays: 0,
      skippedWeekends: 0,
      skippedHolidays: 0,
      dayBreakdown: [],
    }
  }

  // Normalize holidays to startOfDay
  const normalizedHolidays = rawHolidays.map((h) =>
    startOfDay(typeof h === 'string' ? new Date(h) : h)
  )

  const dayBreakdown: DayBreakdownItem[] = []
  let totalWorkingDays = 0
  let skippedWeekends = 0
  let skippedHolidays = 0

  let current = start
  while (!isBefore(end, current)) {
    const dayOfWeek = current.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const isWeekend = !workingDays.includes(dayOfWeek)

    if (isWeekend) {
      skippedWeekends++
      dayBreakdown.push({
        date: new Date(current),
        value: 0,
        type: 'weekend',
      })
    } else {
      // Check if it's a holiday
      const isHoliday = normalizedHolidays.some((h) => isSameDay(h, current))
      if (isHoliday) {
        skippedHolidays++
        dayBreakdown.push({
          date: new Date(current),
          value: 0,
          type: 'holiday',
        })
      } else {
        // Working day
        let value = 1.0
        if (dayType === 'HALF_DAY_AM' || dayType === 'HALF_DAY_PM') {
          value = 0.5
        } else if (dayType === 'PARTIAL') {
          if (partialHours && hoursPerDay > 0) {
            value = Math.min(1, Math.max(0, +(partialHours / hoursPerDay).toFixed(2)))
          } else {
            value = 0.5
          }
        }

        totalWorkingDays += value
        dayBreakdown.push({
          date: new Date(current),
          value,
          type: 'working',
        })
      }
    }

    current = addDays(current, 1)
  }

  return {
    totalWorkingDays: Number(totalWorkingDays.toFixed(2)),
    skippedWeekends,
    skippedHolidays,
    dayBreakdown,
  }
}
