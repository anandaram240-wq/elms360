import { datesBetween, getDayOfWeek } from '@/lib/date-utils'

export type OverlapPolicy = 'BLOCK' | 'WARN_AND_ALLOW' | 'ALLOW'

export interface LeaveRequestRecord {
  id: string
  request_number: string
  employee_id: string
  start_date: string
  end_date: string
  status: string
  day_type?: string
  total_days?: number
  leave_type_id?: string
  leave_type_name?: string
  leave_type_code?: string
}

export interface OverlapConflict {
  requestId: string
  requestNumber: string
  startDate: string
  endDate: string
  status: string
  leaveTypeName?: string
  leaveTypeCode?: string
  commonWorkingDays: string[]
  isAlreadyApproved: boolean
}

export interface OverlapAnalysisResult {
  hasWorkingDayOverlap: boolean
  hasCalendarOverlapOnly: boolean
  conflicts: OverlapConflict[]
  conflictingWorkingDays: string[]
  hasApprovedConflict: boolean
  canSubmit: boolean
  policy: OverlapPolicy
  warningMessage: string | null
  blockingError: string | null
}

const TERMINAL_STATUSES = new Set(['REJECTED', 'WITHDRAWN', 'CANCELLED', 'DRAFT'])

/**
 * Returns array of working-day date strings (YYYY-MM-DD) between startDate and endDate.
 */
export function getWorkingDaysInRange(
  startDate: string,
  endDate: string,
  weeklyOffDays: number[] = [0, 6],
  holidayDates: string[] = []
): string[] {
  if (!startDate || !endDate || endDate < startDate) return []
  const days = datesBetween(startDate, endDate)
  const holidaySet = new Set(holidayDates)

  return days.filter((d) => {
    const dow = getDayOfWeek(d)
    if (weeklyOffDays.includes(dow)) return false
    if (holidaySet.has(d)) return false
    return true
  })
}

/**
 * Analyzes whether a proposed leave request for a specific employee conflicts with
 * existing active requests belonging to THE SAME EMPLOYEE.
 *
 * Rules:
 * 1. STRICT SCOPING: Only evaluates requests where request.employee_id === employeeId.
 *    Never checks or blocks against requests of other employees.
 * 2. EXCLUDED STATUSES: Ignores REJECTED, WITHDRAWN, CANCELLED, and DRAFT requests.
 * 3. WORKING-DAY INTERSECTION: Only common ELIGIBLE WORKING DAYS are flagged as a conflict.
 *    Calendar overlaps occurring solely on weekends or holidays are NOT working-day overlaps.
 * 4. POLICY ENFORCEMENT:
 *    - 'WARN_AND_ALLOW' (default): canSubmit = true, generates warningMessage with conflict details.
 *    - 'BLOCK': canSubmit = false, generates blockingError.
 *    - 'ALLOW': canSubmit = true, records conflict metadata without blocking.
 */
export function analyzeLeaveOverlap(params: {
  employeeId: string
  startDate: string
  endDate: string
  existingRequests: LeaveRequestRecord[]
  weeklyOffDays?: number[]
  holidayDates?: string[]
  policy?: OverlapPolicy
  excludeRequestId?: string
}): OverlapAnalysisResult {
  const {
    employeeId,
    startDate,
    endDate,
    existingRequests,
    weeklyOffDays = [0, 6],
    holidayDates = [],
    policy = 'WARN_AND_ALLOW',
    excludeRequestId,
  } = params

  const result: OverlapAnalysisResult = {
    hasWorkingDayOverlap: false,
    hasCalendarOverlapOnly: false,
    conflicts: [],
    conflictingWorkingDays: [],
    hasApprovedConflict: false,
    canSubmit: true,
    policy,
    warningMessage: null,
    blockingError: null,
  }

  if (!employeeId || !startDate || !endDate || endDate < startDate) {
    return result
  }

  // Calculate working days for the proposed request
  const newReqWorkingDays = getWorkingDaysInRange(startDate, endDate, weeklyOffDays, holidayDates)
  const newWorkingDaySet = new Set(newReqWorkingDays)

  // 1. Filter existing requests strictly for THIS employee and active statuses
  const candidateRequests = existingRequests.filter((req) => {
    if (req.employee_id !== employeeId) return false
    if (excludeRequestId && req.id === excludeRequestId) return false
    if (TERMINAL_STATUSES.has(req.status.toUpperCase())) return false
    // Quick calendar range check: [start_date <= endDate && end_date >= startDate]
    return !(req.end_date < startDate || req.start_date > endDate)
  })

  if (candidateRequests.length === 0) {
    return result
  }

  let calendarOverlapFound = false
  const allConflictingWorkingDays = new Set<string>()

  for (const cand of candidateRequests) {
    calendarOverlapFound = true
    const candWorkingDays = getWorkingDaysInRange(
      cand.start_date,
      cand.end_date,
      weeklyOffDays,
      holidayDates
    )

    // Intersect working days
    const commonDays = candWorkingDays.filter((d) => newWorkingDaySet.has(d))

    if (commonDays.length > 0) {
      commonDays.forEach((d) => allConflictingWorkingDays.add(d))
      const isApproved = cand.status.toUpperCase() === 'APPROVED'

      result.conflicts.push({
        requestId: cand.id,
        requestNumber: cand.request_number,
        startDate: cand.start_date,
        endDate: cand.end_date,
        status: cand.status,
        leaveTypeName: cand.leave_type_name,
        leaveTypeCode: cand.leave_type_code,
        commonWorkingDays: commonDays,
        isAlreadyApproved: isApproved,
      })

      if (isApproved) {
        result.hasApprovedConflict = true
      }
    }
  }

  result.conflictingWorkingDays = Array.from(allConflictingWorkingDays).sort()
  result.hasWorkingDayOverlap = result.conflicts.length > 0
  result.hasCalendarOverlapOnly = calendarOverlapFound && !result.hasWorkingDayOverlap

  if (result.hasWorkingDayOverlap) {
    const conflictDescriptions = result.conflicts
      .map((c) => `${c.requestNumber} (${c.startDate === c.endDate ? c.startDate : `${c.startDate} to ${c.endDate}`}${c.status === 'APPROVED' ? ' [Approved]' : ''})`)
      .join(', ')

    const daysList = result.conflictingWorkingDays.join(', ')

    if (policy === 'BLOCK') {
      result.canSubmit = false
      result.blockingError = `Application blocked: overlaps with existing leave request (${conflictDescriptions}) on working day(s): ${daysList}.`
    } else if (policy === 'WARN_AND_ALLOW') {
      result.canSubmit = true
      result.warningMessage = `Another leave application exists for ${daysList} (${conflictDescriptions}). You can still submit your request under the current organization policy. Your manager will review the scheduling conflict.`
    } else {
      // ALLOW
      result.canSubmit = true
      result.warningMessage = null
    }
  }

  return result
}
