import * as React from 'react'
import Link from 'next/link'
import { getManagerDashboardData } from '@/app/actions/manager/approval-actions'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { PendingApprovalsPreview } from '@/components/manager/pending-approvals-preview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  CalendarDays,
  ArrowRight,
  UserCheck,
  UserX,
  History,
  ShieldCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ManagerDashboardPage() {
  const data = await getManagerDashboardData()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Dashboard"
        description="Overview of team leave requests, approvals, and upcoming absences."
      >
        <Button asChild variant="default" size="sm" className="gap-1.5 shadow-sm">
          <Link href="/manager/approvals">
            <CheckSquare className="h-4 w-4" />
            Review Approvals ({data.stats.pendingApprovals})
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/manager/team-calendar">
            <Calendar className="h-4 w-4" />
            Team Calendar
          </Link>
        </Button>
      </PageHeader>

      {/* 5 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Pending Approvals"
          value={data.stats.pendingApprovals}
          description="Awaiting your decision"
          icon={CheckSquare}
          className="border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10"
        />
        <StatsCard
          title="Approved This Month"
          value={data.stats.approvedThisMonth}
          description="In current calendar month"
          icon={CheckCircle2}
          className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10"
        />
        <StatsCard
          title="Rejected This Month"
          value={data.stats.rejectedThisMonth}
          description="In current calendar month"
          icon={XCircle}
          className="border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10"
        />
        <StatsCard
          title="On Leave Today"
          value={data.stats.onLeaveTodayCount}
          description="Currently out of office"
          icon={UserX}
          className="border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/10"
        />
        <StatsCard
          title="Upcoming Absences"
          value={data.stats.upcomingAbsences7Days}
          description="Next 7 days"
          icon={CalendarDays}
          className="border-purple-200 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/10"
        />
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pending Approvals & Weekly Availability */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top 3 Pending Approvals */}
          <PendingApprovalsPreview requests={data.pendingPreview} />

          {/* Team Availability This Week */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Team Availability This Week
                  </CardTitle>
                  <CardDescription>Daily in-office coverage for the next 7 days</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link href="/manager/team-calendar">
                    Full Calendar <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {data.teamWeeklyAvailability.map((day, idx) => {
                  const isToday = idx === 0
                  return (
                    <div
                      key={day.date}
                      className={`flex flex-col items-center p-3 rounded-lg border text-center transition-all ${
                        isToday
                          ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                          : 'bg-card/50'
                      }`}
                    >
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                        {day.dayOfWeek}
                      </span>
                      <span className={`text-sm font-bold my-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {day.date.slice(8)}
                      </span>
                      <div className="mt-1 space-y-1 w-full">
                        <span className="inline-block text-[11px] font-medium text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded px-1.5 py-0.5">
                          {day.inOfficeCount} In
                        </span>
                        {day.outOfOfficeCount > 0 ? (
                          <span className="inline-block text-[11px] font-medium text-rose-700 bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 rounded px-1.5 py-0.5">
                            {day.outOfOfficeCount} Out
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] text-muted-foreground">
                            All In
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Employees on leave today */}
              {data.onLeaveToday.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <UserX className="h-3.5 w-3.5 text-rose-600" />
                    Team members out today ({data.onLeaveToday.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.onLeaveToday.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-rose-50 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-800"
                      >
                        <span className="font-medium text-foreground">{emp.employeeName}</span>
                        <span className="text-muted-foreground">({emp.leaveTypeName})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Quick Links, Upcoming Absences & Activity Feed */}
        <div className="space-y-6">
          {/* Quick Links Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-between text-xs h-9">
                <Link href="/manager/approvals">
                  <span className="flex items-center gap-2">
                    <CheckSquare className="h-3.5 w-3.5 text-primary" />
                    Approval Queue
                  </span>
                  <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                    {data.stats.pendingApprovals}
                  </Badge>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between text-xs h-9">
                <Link href="/manager/team-calendar">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Team Leave Calendar
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between text-xs h-9">
                <Link href="/manager/team">
                  <span className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    Direct Reports Directory
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between text-xs h-9">
                <Link href="/manager/delegations">
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                    Approval Delegations
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Upcoming Team Absences (Next 7 Days) */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                  Upcoming Absences
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  Next 7 Days
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {data.upcomingAbsences.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No scheduled team absences in the next 7 days.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.upcomingAbsences.map((abs) => (
                    <div
                      key={abs.id}
                      className="flex items-center justify-between text-xs p-2.5 rounded-md border bg-card/60"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">{abs.employeeName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {abs.startDate} &bull; {abs.totalDays} {abs.totalDays === 1 ? 'day' : 'days'}
                        </p>
                      </div>
                      <Badge
                        style={{
                          backgroundColor: `${abs.leaveTypeColor}15`,
                          color: abs.leaveTypeColor,
                          borderColor: `${abs.leaveTypeColor}30`,
                        }}
                        className="text-[10px] border"
                      >
                        {abs.leaveTypeName}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Recent Actions
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-xs h-7 px-2">
                  <Link href="/manager/history">
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data.recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No recent approval actions recorded.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recentActivity.slice(0, 5).map((act) => (
                    <div key={act.id} className="text-xs border-l-2 pl-3 py-1 space-y-0.5 border-primary/40">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{act.employeeName}</span>
                        <Badge
                          variant={
                            act.action === 'APPROVED'
                              ? 'success'
                              : act.action === 'REJECTED'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-[10px] px-1.5 py-0"
                        >
                          {act.action}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        {act.leaveTypeName} &bull; {new Date(act.actedAt).toLocaleDateString()}
                      </p>
                      {act.comments && (
                        <p className="text-muted-foreground italic text-[11px] line-clamp-1">
                          &ldquo;{act.comments}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
