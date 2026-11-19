import { createAdminClient } from '@/lib/supabase/admin'
import { eachDayOfInterval, format, parseISO } from 'date-fns'

export interface LeaveConflictResult {
  hasOverlap: boolean
  overlappingRequests: Array<{
    requestNumber: string
    startDate: string
    endDate: string
    status: string
  }>
}

export interface DayTeamAvailability {
  date: string
  employeesOnLeave: Array<{ name: string; leaveType: string; color?: string }>
  availableCount: number
  onLeaveCount: number
}

/**
 * Checks if the given employee has existing active or pending leave requests
 * that overlap with [startDate, endDate].
 */
export async function detectLeaveConflicts(params: {
  employeeId: string
  startDate: string
  endDate: string
  excludeRequestId?: string
}): Promise<LeaveConflictResult> {
  const { employeeId, startDate, endDate, excludeRequestId } = params
  const supabase = createAdminClient()

  // Find requests for this employee overlapping the date range
  // [req.start_date <= endDate] AND [req.end_date >= startDate]
  let query = supabase
    .from('leave_requests')
    .select('id, request_number, start_date, end_date, status')
    .eq('employee_id', employeeId)
    .not('status', 'in', '("REJECTED","WITHDRAWN","CANCELLED")')
    .lte('start_date', endDate)
    .gte('end_date', startDate)

  if (excludeRequestId) {
    query = query.neq('id', excludeRequestId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error detecting leave conflicts:', error)
    return { hasOverlap: false, overlappingRequests: [] }
  }

  const overlappingRequests = (data || []).map((req) => ({
    requestNumber: req.request_number,
    startDate: req.start_date,
    endDate: req.end_date,
    status: req.status,
  }))

  return {
    hasOverlap: overlappingRequests.length > 0,
    overlappingRequests,
  }
}

/**
 * Calculates team availability for each day between startDate and endDate
 * for all direct reports of the given managerId.
 */
export async function getTeamAvailability(params: {
  managerId: string
  startDate: string
  endDate: string
}): Promise<DayTeamAvailability[]> {
  const { managerId, startDate, endDate } = params
  const supabase = createAdminClient()

  // 1. Get all active direct reports under this manager
  const { data: directReports, error: repError } = await supabase
    .from('reporting_relationships')
    .select(`
      employee_id,
      employees!reporting_relationships_employee_id_fkey(
        id,
        full_name,
        is_active
      )
    `)
    .eq('manager_id', managerId)
    .eq('is_active', true)

  if (repError || !directReports) {
    console.error('Error fetching direct reports for availability:', repError)
    return []
  }

  // Filter only active employees
  const teamEmployees: Array<{ id: string; fullName: string }> = []
  for (const r of directReports) {
    const emp = r.employees as unknown as { id: string; full_name: string; is_active: boolean } | null
    if (emp && emp.is_active) {
      teamEmployees.push({ id: emp.id, fullName: emp.full_name })
    }
  }

  const totalTeamSize = teamEmployees.length
  if (totalTeamSize === 0) {
    // If no reports found, return empty array
    return []
  }

  const teamEmployeeIds = teamEmployees.map((e) => e.id)

  // 2. Fetch approved/pending leave requests overlapping the date range
  const { data: leaves, error: leaveError } = await supabase
    .from('leave_requests')
    .select(`
      id,
      employee_id,
      start_date,
      end_date,
      status,
      leave_types(name, color)
    `)
    .in('employee_id', teamEmployeeIds)
    .in('status', ['APPROVED', 'PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL', 'PENDING_ADDITIONAL_APPROVAL'])
    .lte('start_date', endDate)
    .gte('end_date', startDate)

  if (leaveError) {
    console.error('Error fetching team leaves for availability:', leaveError)
  }

  const leaveList = leaves || []

  // 3. Generate each date in interval
  const dates = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  })

  const empNameMap = new Map<string, string>()
  teamEmployees.forEach((e) => empNameMap.set(e.id, e.fullName))

  return dates.map((d) => {
    const dateStr = format(d, 'yyyy-MM-dd')
    const employeesOnLeave: Array<{ name: string; leaveType: string; color?: string }> = []

    for (const req of leaveList) {
      if (req.start_date <= dateStr && req.end_date >= dateStr) {
        const empName = empNameMap.get(req.employee_id) || 'Team Member'
        const leaveTypeData = req.leave_types as unknown as { name: string; color: string } | null
        employeesOnLeave.push({
          name: empName,
          leaveType: leaveTypeData?.name || 'Leave',
          color: leaveTypeData?.color,
        })
      }
    }

    const onLeaveCount = employeesOnLeave.length
    const availableCount = Math.max(0, totalTeamSize - onLeaveCount)

    return {
      date: dateStr,
      employeesOnLeave,
      availableCount,
      onLeaveCount,
    }
  })
}
