import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format, addDays, parseISO } from 'date-fns'
import {
  CalendarPlus,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  ArrowRight,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { getCurrentUser } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { getMyLeaveBalances } from '@/app/actions/employee/leave-actions'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { LeaveBalanceCard } from '@/components/shared/leave-balance-card'
import { StatsCard } from '@/components/shared/stats-card'
import { LeaveStatusBadge } from '@/components/shared/status-badge'

export const dynamic = 'force-dynamic'

function getGreeting(name: string) {
  const hour = new Date().getHours()
  if (hour < 12) return `Good morning, ${name}`
  if (hour < 17) return `Good afternoon, ${name}`
  return `Good evening, ${name}`
}

export default async function EmployeeDashboardPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect('/login')
  }

  const supabase = await createClient()
  const employeeId = currentUser.employeeId
  const currentYear = new Date().getFullYear()
  const todayStr = new Date().toISOString().split('T')[0]
  const in30DaysStr = addDays(new Date(), 30).toISOString().split('T')[0]

  // 1. Fetch leave balances
  const balances = await getMyLeaveBalances(currentYear)

  // 2. Fetch requests statistics
  const { data: requests = [] } = await supabase
    .from('leave_requests')
    .select(`
      id,
      request_number,
      leave_type_id,
      status,
      start_date,
      end_date,
      total_days,
      reason,
      created_at,
      leave_types (
        name,
        color
      )
    `)
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  const allRequests = requests || []
  const thisYearRequests = allRequests.filter(
    (r) => new Date(r.start_date).getFullYear() === currentYear
  )

  const pendingCount = allRequests.filter((r) =>
    ['PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL', 'CLARIFICATION_REQUESTED'].includes(
      r.status
    )
  ).length

  const approvedThisYear = thisYearRequests
    .filter((r) => r.status === 'APPROVED')
    .reduce((sum, r) => sum + Number(r.total_days), 0)

  const rejectedCount = thisYearRequests.filter((r) => r.status === 'REJECTED').length

  // Stats calculations
  const totalEntitlement = balances.reduce(
    (acc, b) => acc + (b.openingBalance + b.accrued + b.carriedForward),
    0
  )
  const totalAvailable = balances.reduce((acc, b) => acc + b.availableBalance, 0)
  const totalUsed = balances.reduce((acc, b) => acc + b.used, 0)

  // 3. Upcoming approved leaves (next 30 days)
  const upcomingApprovedLeaves = allRequests
    .filter(
      (r) =>
        r.status === 'APPROVED' &&
        r.start_date >= todayStr &&
        r.start_date <= in30DaysStr
    )
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  // 4. Recent applications (last 5)
  const recentApplications = allRequests.slice(0, 5)

  // 5. Recent notifications (last 5)
  const { data: notificationsData } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(5)
  const notifications = notificationsData || []

  // 6. Company holidays in next 30 days
  const { data: holidaysData } = await supabase
    .from('holidays')
    .select('id, name, holiday_date, is_optional, description')
    .gte('holiday_date', todayStr)
    .lte('holiday_date', in30DaysStr)
    .order('holiday_date', { ascending: true })
  const holidays = holidaysData || []

  return (
    <div className="space-y-7 pb-10">
      {/* Apple-style White Hero Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Sparkles className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                Employee Portal
              </span>
              <span>•</span>
              <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {getGreeting(currentUser.fullName)}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Track your leave balances, submit vacation requests, and review upcoming absences with zero friction.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-[0_1px_2px_rgba(37,99,235,0.2)] rounded-xl gap-2">
              <Link href="/employee/apply-leave">
                <CalendarPlus className="h-4 w-4" />
                Apply for Leave
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 6 Stats Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">
            Annual Leave Overview ({currentYear})
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <StatsCard
            title="Total Quota"
            value={`${totalEntitlement} d`}
            description="Entitlement"
            icon={Briefcase}
          />
          <StatsCard
            title="Available"
            value={`${totalAvailable} d`}
            description="Ready to use"
            icon={CalendarCheck}
            className="border-blue-200/80 bg-blue-50/20 dark:bg-blue-950/20"
          />
          <StatsCard
            title="Used"
            value={`${totalUsed} d`}
            description="Days taken"
            icon={Calendar}
          />
          <StatsCard
            title="Pending"
            value={pendingCount}
            description="Under review"
            icon={Clock}
          />
          <StatsCard
            title="Approved"
            value={`${approvedThisYear} d`}
            description="This year"
            icon={CheckCircle2}
          />
          <StatsCard
            title="Rejected"
            value={rejectedCount}
            description="Declined"
            icon={XCircle}
          />
        </div>
      </div>

      {/* Leave Balances Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Leave Balances
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active quotas by leave category
            </p>
          </div>
          <Link
            href="/employee/leave-balance"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          >
            <span>Detailed ledger</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {balances.length === 0 ? (
            <Card className="col-span-full p-8 text-center text-slate-500">
              No leave policies currently assigned. Contact HR for assistance.
            </Card>
          ) : (
            balances.map((b) => (
              <LeaveBalanceCard
                key={b.leaveTypeId}
                leaveTypeName={b.leaveTypeName}
                color={b.color}
                available={b.availableBalance}
                total={b.openingBalance + b.accrued + b.carriedForward}
                used={b.used}
                pending={b.pending}
              />
            ))
          )}
        </div>
      </div>

      {/* Main Content Grid: Recent Applications & Upcoming Leaves */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2 space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Recent Applications
            </h2>
            <Link
              href="/employee/my-leaves"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              <span>View all leaves</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Card className="overflow-hidden border border-slate-200/80 rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                        You have not submitted any leave requests yet.
                      </td>
                    </tr>
                  ) : (
                    recentApplications.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-xs text-slate-900 dark:text-slate-100">
                          {req.request_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: req.leave_types?.color || '#2563eb' }}
                            />
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {req.leave_types?.name || 'Leave'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                          {req.total_days} {Number(req.total_days) === 1 ? 'day' : 'days'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                          {format(parseISO(req.start_date), 'dd MMM')} -{' '}
                          {format(parseISO(req.end_date), 'dd MMM yyyy')}
                        </td>
                        <td className="py-3.5 px-4">
                          <LeaveStatusBadge status={req.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                            <Link href={`/employee/my-leaves/${req.id}`}>
                              Details
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar Column: Upcoming Approved Leaves & Holidays */}
        <div className="space-y-6">
          {/* Upcoming Leaves Card */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <CalendarCheck className="h-4 w-4 text-blue-600" />
                Upcoming Approved Leaves
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">Scheduled within the next 30 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {upcomingApprovedLeaves.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  No upcoming leaves scheduled.
                </p>
              ) : (
                upcomingApprovedLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div
                      className="w-1 self-stretch rounded-full"
                      style={{ backgroundColor: leave.leave_types?.color || '#10b981' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {leave.leave_types?.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {format(parseISO(leave.start_date), 'MMM d')} -{' '}
                        {format(parseISO(leave.end_date), 'MMM d, yyyy')} ({leave.total_days} days)
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Company Holidays */}
          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Calendar className="h-4 w-4 text-blue-600" />
                Company Holidays (Next 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {holidays.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  No upcoming public holidays in the next 30 days.
                </p>
              ) : (
                holidays.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{h.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {format(parseISO(h.holiday_date), 'EEEE, MMM d, yyyy')}
                      </p>
                    </div>
                    {h.is_optional && (
                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200/60 font-medium px-2 py-0.5 rounded-full">
                        Optional
                      </span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
