import * as React from 'react'
import Link from 'next/link'
import {
  Users,
  CalendarCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Percent,
  Calendar,
  ArrowRight,
  UserCheck,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { StatsCard } from '@/components/shared/stats-card'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getHRDashboardMetrics } from '@/app/actions/hr/hr-queries'
import { HRDashboardCharts } from '@/components/hr/dashboard-charts'

export const dynamic = 'force-dynamic'

export default async function HRDashboardPage() {
  const metrics = await getHRDashboardMetrics()

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="HR Administrator Dashboard"
        description="Comprehensive organization-wide leave operations, approval queues, utilization analytics, and employee status."
      >
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/hr/reports">View Detailed Reports</Link>
          </Button>
          <Button asChild>
            <Link href="/hr/leave-requests">Review Pending Leaves</Link>
          </Button>
        </div>
      </PageHeader>

      {/* 7 Organization-wide Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatsCard
          title="Active Employees"
          value={metrics.totalEmployees}
          icon={Users}
          change={{ value: 4, type: 'increase', period: 'vs last quarter' }}
        />
        <StatsCard
          title="On Leave Today"
          value={metrics.onLeaveToday}
          icon={UserCheck}
          description="Organization-wide"
        />
        <StatsCard
          title="Pending HR Queue"
          value={metrics.pendingHrApprovals}
          icon={Clock}
          description="Requires HR action"
          className={metrics.pendingHrApprovals > 0 ? 'border-amber-300 dark:border-amber-700' : ''}
        />
        <StatsCard
          title="Manager Queue"
          value={metrics.pendingManagerApprovals}
          icon={Clock}
          description="With line managers"
        />
        <StatsCard
          title="Approved (Month)"
          value={metrics.approvedThisMonth}
          icon={CheckCircle2}
          change={{ value: 12, type: 'increase' }}
        />
        <StatsCard
          title="Rejected (Month)"
          value={metrics.rejectedThisMonth}
          icon={XCircle}
          description="Total rejections"
        />
        <StatsCard
          title="Leave Utilization"
          value={`${metrics.leaveUtilization}%`}
          icon={Percent}
          description="Used vs Entitlement"
        />
      </div>

      {/* Charts Section */}
      <HRDashboardCharts
        departmentDistribution={metrics.departmentDistribution}
        monthlyTrends={metrics.monthlyTrends}
        leaveTypeBreakdown={metrics.leaveTypeBreakdown}
        topDepartments={metrics.topDepartments}
      />

      {/* Upcoming Absences: Next 7 Days Organization-Wide */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Organization Absences (Next 7 Days)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Confirmed scheduled employee absences across all business units
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1">
            <Link href="/hr/leave-requests">
              All Requests <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {metrics.upcomingAbsences && metrics.upcomingAbsences.length > 0 ? (
            <div className="divide-y border rounded-lg overflow-hidden">
              {metrics.upcomingAbsences.map((req: any) => (
                <div
                  key={req.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: req.leave_types?.color || '#3B82F6' }}
                    />
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{req.employees?.full_name || 'Employee'}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {req.employees?.employee_code}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {req.employees?.designation} • {req.employees?.departments?.name || 'General'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {req.start_date} to {req.end_date}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.total_days} {req.total_days === 1 ? 'day' : 'days'} ({req.leave_types?.name})
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      Confirmed
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No employee absences scheduled for the next 7 days.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
