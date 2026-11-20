/**
 * ELMS 360 — Timezone-Safe Date Utilities
 * 
 * All functions operate on YYYY-MM-DD strings using pure calendar arithmetic.
 * We deliberately avoid `new Date(dateStr).getDay()` because it creates a UTC
 * midnight Date, which shifts the weekday by -5:30 for Asia/Kolkata users.
 * 
 * Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday (matches PostgreSQL dow)
 */

export interface DayBreakdown {
  date: string // YYYY-MM-DD
  dayOfWeek: number // 0=Sun..6=Sat
  type: 'WORKING_DAY' | 'WEEKLY_OFF' | 'COMPANY_HOLIDAY'
}

export interface WorkingDaysResult {
  totalCalendarDays: number
  workingDays: number
  weekendDays: number
  holidayDays: number
  perDay: DayBreakdown[]
}

/** 
 * Parse YYYY-MM-DD into numeric parts.
 * Never uses Date constructor to avoid timezone issues.
 */
export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { year: y, month: m, day: d }
}

/**
 * Calculate day of week for a YYYY-MM-DD string using Tomohiko Sakamoto's algorithm.
 * Returns 0=Sunday, 1=Monday ... 6=Saturday.
 * This is timezone-independent (pure calendar math).
 */
export function getDayOfWeek(dateStr: string): number {
  const { year, month, day } = parseDateParts(dateStr)
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  let y = year
  if (month < 3) y -= 1
  return (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[month - 1] + day) % 7
}

/**
 * Returns true if dateStr falls on a weekly off day.
 * weeklyOffDays: array of day numbers (0=Sun, 6=Sat). Default [0,6].
 */
export function isWeeklyOff(dateStr: string, weeklyOffDays: number[] = [0, 6]): boolean {
  return weeklyOffDays.includes(getDayOfWeek(dateStr))
}

/**
 * Add n days to a YYYY-MM-DD string. Returns YYYY-MM-DD.
 */
export function addDays(dateStr: string, n: number): string {
  // Use Date only for arithmetic (not .getDay() / timezone interpretation)
  const { year, month, day } = parseDateParts(dateStr)
  const d = new Date(year, month - 1, day + n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/**
 * Returns array of YYYY-MM-DD strings from start to end inclusive.
 */
export function datesBetween(startDate: string, endDate: string): string[] {
  if (endDate < startDate) return []
  const result: string[] = []
  let current = startDate
  while (current <= endDate) {
    result.push(current)
    current = addDays(current, 1)
  }
  return result
}

/**
 * Compare two YYYY-MM-DD strings. Returns -1, 0, or 1.
 */
export function compareDate(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/**
 * Calculate working days between two dates (inclusive).
 * Uses timezone-safe getDayOfWeek, not new Date().getDay().
 * 
 * @param startDate YYYY-MM-DD
 * @param endDate YYYY-MM-DD
 * @param weeklyOffDays Day numbers that are off. Default [0, 6] = Sun+Sat.
 * @param holidayDates Array of YYYY-MM-DD holiday dates
 * @param dayType 'FULL_DAY' | 'HALF_DAY_AM' | 'HALF_DAY_PM'
 */
export function calculateWorkingDays(
  startDate: string,
  endDate: string,
  weeklyOffDays: number[] = [0, 6],
  holidayDates: string[] = [],
  dayType: 'FULL_DAY' | 'HALF_DAY_AM' | 'HALF_DAY_PM' = 'FULL_DAY'
): WorkingDaysResult {
  if (endDate < startDate) {
    return { totalCalendarDays: 0, workingDays: 0, weekendDays: 0, holidayDays: 0, perDay: [] }
  }

  const days = datesBetween(startDate, endDate)
  const holidaySet = new Set(holidayDates)
  let workingDays = 0
  let weekendDays = 0
  let holidayDays = 0
  const perDay: DayBreakdown[] = []

  for (const date of days) {
    const dow = getDayOfWeek(date)
    if (weeklyOffDays.includes(dow)) {
      weekendDays++
      perDay.push({ date, dayOfWeek: dow, type: 'WEEKLY_OFF' })
    } else if (holidaySet.has(date)) {
      holidayDays++
      perDay.push({ date, dayOfWeek: dow, type: 'COMPANY_HOLIDAY' })
    } else {
      workingDays++
      perDay.push({ date, dayOfWeek: dow, type: 'WORKING_DAY' })
    }
  }

  // Apply half-day multiplier
  const effectiveWorkingDays = dayType === 'FULL_DAY' ? workingDays : workingDays * 0.5

  return {
    totalCalendarDays: days.length,
    workingDays: effectiveWorkingDays,
    weekendDays,
    holidayDays,
    perDay,
  }
}

/**
 * Format YYYY-MM-DD to a human-readable string like "21 Nov 2026 (Saturday)".
 */
export function formatDateWithDay(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const { year, month, day } = parseDateParts(dateStr)
  const dow = getDayOfWeek(dateStr)
  return `${day} ${months[month - 1]} ${year} (${days[dow]})`
}

/**
 * Calculates the fiscal year for a given date string (YYYY-MM-DD).
 * 
 * If leaveYearType === 'FISCAL' and fiscalYearStart > 1 (e.g., 4 for April):
 * - Dates from April to December of year Y belong to fiscal year Y.
 * - Dates from January to March of year Y belong to fiscal year Y - 1.
 * 
 * If leaveYearType === 'CALENDAR' or fiscalYearStart === 1:
 * - Returns calendar year.
 */
export function getFiscalYear(
  dateStr: string,
  fiscalYearStart: number = 4,
  leaveYearType: 'CALENDAR' | 'FISCAL' = 'FISCAL'
): number {
  if (!dateStr) return new Date().getFullYear()
  const { year, month } = parseDateParts(dateStr)
  if (leaveYearType === 'FISCAL' && fiscalYearStart > 1) {
    return month < fiscalYearStart ? year - 1 : year
  }
  return year
}
