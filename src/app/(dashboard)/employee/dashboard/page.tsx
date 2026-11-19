import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns'
import {
  CalendarPlus,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  AlertCircle,
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
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>Employee Portal</span>
              <span>•</span>
              <span>{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {getGreeting(currentUser.fullName)}
            </h1>
            <p className="text-blue-100/90 text-sm max-w-xl">
              Track your leave balances, submit vacation requests, and stay updated with your team schedule.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/employee/apply-leave">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-md gap-2">
                <CalendarPlus className="h-5 w-5" />
                Apply for Leave
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 6 Stats Cards */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground mb-4">
          Annual Leave Overview ({currentYear})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard
            title="Total Entitlement"
            value={`${totalEntitlement} d`}
            description="Annual quota"
            icon={Briefcase}
          />
          <StatsCard
            title="Available Balance"
            value={`${totalAvailable} d`}
            description="Ready to use"
            icon={CalendarCheck}
            className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/20"
          />
          <StatsCard
            title="Used Leaves"
            value={`${totalUsed} d`}
            description="Days taken"
            icon={Calendar}
          />
          <StatsCard
            title="Pending Requests"
            value={pendingCount}
            description="Under review"
            icon={Clock}
          />
          <StatsCard
            title="Approved Leaves"
            value={`${approvedThisYear} d`}
            description="Approved this year"
            icon={CheckCircle2}
          />
          <StatsCard
            title="Rejected"
            value={rejectedCount}
            description="Declined requests"
            icon={XCircle}
          />
        </div>
      </div>

      {/* Leave Balance Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Leave Balances
            </h2>
            <p className="text-sm text-muted-foreground">
              Breakdown by active leave categories
            </p>
          </div>
          <Link
            href="/employee/leave-balance"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>View detailed ledger</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {balances.length === 0 ? (
            <Card className="col-span-full p-8 text-center text-muted-foreground">
              No leave policies currently assigned. Contact HR for details.
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Recent Applications
            </h2>
            <Link
              href="/employee/my-leaves"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentApplications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        You have not submitted any leave requests yet.
                      </td>
                    </tr>
                  ) : (
                    recentApplications.map((req) => (
                      <tr key={req.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                          {req.request_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: req.leave_types?.color || '#3b82f6' }}
                            />
                            <span className="font-medium text-foreground">
                              {req.leave_types?.name || 'Leave'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">
                          {req.total_days} {Number(req.total_days) === 1 ? 'day' : 'days'}
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {format(parseISO(req.start_date), 'dd MMM')} -{' '}
                          {format(parseISO(req.end_date), 'dd MMM yyyy')}
                        </td>
                        <td className="py-3.5 px-4">
                          <LeaveStatusBadge status={req.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/employee/my-leaves/${req.id}`}>
                            <Button variant="ghost" size="sm">
                              Details
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar Column: Upcoming Approved Leaves & Holidays & Notifications */}
        <div className="space-y-6">
          {/* Upcoming Leaves Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                Upcoming Approved Leaves
              </CardTitle>
              <CardDescription>Scheduled within next 30 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingApprovedLeaves.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No upcoming leaves scheduled.
                </p>
              ) : (
                upcomingApprovedLeaves.map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card text-card-foreground hover:bg-muted/30 transition-colors"
                  >
                    <div
                      className="w-1.5 self-stretch rounded-full"
                      style={{ backgroundColor: leave.leave_types?.color || '#10b981' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {leave.leave_types?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Holidays Next 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {holidays.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No upcoming public holidays in the next 30 days.
                </p>
              ) : (
                holidays.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/20"
                  >
                    <div>
                      <p className="text-sm font-medium">{h.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(h.holiday_date), 'EEEE, MMM d, yyyy')}
                      </p>
                    </div>
                    {h.is_optional && (
                      <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-medium px-2 py-0.5 rounded">
                        Optional
                      </span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Notifications</CardTitle>
                <CardDescription>Recent updates</CardDescription>
              </div>
              <Link
                href="/employee/notifications"
                className="text-xs font-medium text-primary hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No recent notifications.</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-lg border bg-card text-card-foreground text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{n.title}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {format(parseISO(n.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{n.message}</p>
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
