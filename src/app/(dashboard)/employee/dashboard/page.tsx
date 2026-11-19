'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  CalendarPlus,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileText,
  CalendarCheck,
  Building,
  Bell,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import { StatsCard } from '@/components/shared/stats-card'
import { useElmsStore } from '@/lib/store/elms-store'

export default function EmployeeDashboardPage() {
  const { state, currentUser } = useElmsStore()

  const employeeId = currentUser?.id || currentUser?.employeeId || ''
  const myBalances = state.leaveBalances.filter(
    (b) => b.employee_id === employeeId && b.fiscal_year === 2026
  )

  const myRequests = state.leaveRequests
    .filter((r) => r.employee_id === employeeId)
    .slice(0, 5)

  const totalAvailable = myBalances.reduce((sum, b) => sum + (b.available_balance || 0), 0)
  const totalUsed = myBalances.reduce((sum, b) => sum + (b.used || 0), 0)
  const pendingRequestsCount = state.leaveRequests.filter(
    (r) => r.employee_id === employeeId && (r.status.startsWith('PENDING'))
  ).length

  const todayStr = new Date().toISOString().split('T')[0]
  const upcomingApprovedCount = state.leaveRequests.filter(
    (r) => r.employee_id === employeeId && r.status === 'APPROVED' && r.start_date >= todayStr
  ).length

  const upcomingHolidays = state.holidays.slice(0, 4)

  // Dynamic greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = (currentUser?.fullName || 'Arjun Kumar').split(' ')[0]

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-subtle">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-[#475569] mt-1">
            Here is your leave overview and balance summary for fiscal year 2026.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold gap-2 shadow-subtle">
            <Link href="/employee/apply-leave">
              <CalendarPlus className="h-4 w-4" />
              Apply for Leave
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Available Leave"
          value={`${totalAvailable} Days`}
          description="Across all leave categories"
          icon={CalendarCheck}
        />
        <StatsCard
          title="Pending Requests"
          value={pendingRequestsCount}
          description="Under review by Manager / HR"
          icon={Clock}
          badge={pendingRequestsCount > 0 ? "Under Review" : undefined}
        />
        <StatsCard
          title="Leave Taken"
          value={`${totalUsed} Days`}
          description="Approved leave utilized in FY 2026"
          icon={TrendingUp}
        />
        <StatsCard
          title="Upcoming Approved"
          value={upcomingApprovedCount}
          description="Upcoming scheduled absences"
          icon={Calendar}
        />
      </div>

      {/* Leave Category Balances */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Leave Categories (FY 2026)</h2>
          </div>
          <Link href="/employee/leave-balance" className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold flex items-center gap-1">
            Detailed balance breakdown <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {state.leaveTypes.slice(0, 6).map((type) => {
            const bal = myBalances.find((b) => b.leave_type_id === type.id)
            const available = bal ? bal.available_balance : type.annual_entitlement
            const used = bal ? bal.used : 0
            const pending = bal ? bal.pending : 0
            const maxEntitlement = Math.max(type.annual_entitlement || 12, (available + used))
            const percentUsed = Math.min(100, Math.round((used / (maxEntitlement || 1)) * 100))

            return (
              <Card key={type.id} className="border-[#E5E7EB] bg-white rounded-xl shadow-subtle hover:border-[#D1D5DB] transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: type.color }} />
                      <span className="text-xs font-bold text-[#111827]">{type.name}</span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#F1F3F5] text-[#475569]">
                      {type.code}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-bold tracking-tight text-[#111827] tabular-nums">
                        {available}
                      </span>
                      <span className="text-xs font-medium text-[#64748B] ml-1">days left</span>
                    </div>
                    <span className="text-xs text-[#64748B]">
                      Entitled: <strong>{type.annual_entitlement} d</strong>
                    </span>
                  </div>

                  {/* Horizontal utilization bar */}
                  <div className="mt-3 w-full bg-[#F1F3F5] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percentUsed}%`,
                        backgroundColor: percentUsed > 80 ? '#EF4444' : type.color,
                      }}
                    />
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#F1F3F5] flex items-center justify-between text-xs text-[#64748B]">
                    <span>Used: <strong className="text-[#111827]">{used} d</strong></span>
                    {pending > 0 ? (
                      <span className="text-[#92400E] font-medium">Pending: <strong>{pending} d</strong></span>
                    ) : (
                      <span>Available: <strong className="text-[#166534]">{available} d</strong></span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Main 2-Column: Recent Applications (Left) + Sidebar Widgets (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Applications (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Recent Applications</h2>
            <Link href="/employee/my-leaves" className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold">
              View all ({state.leaveRequests.filter((r) => r.employee_id === employeeId).length})
            </Link>
          </div>

          <Card className="border-[#E5E7EB] bg-white rounded-xl shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#475569] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-[#334155]">
                  {myRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#94A3B8]">
                        No leave applications submitted yet.
                      </td>
                    </tr>
                  ) : (
                    myRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-[#2563EB]">
                          <Link href={`/employee/my-leaves`} className="hover:underline">
                            {r.request_number}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-medium text-[#111827]">{r.leave_type_name}</td>
                        <td className="py-3 px-4 text-[#475569] whitespace-nowrap">{r.start_date} → {r.end_date}</td>
                        <td className="py-3 px-4 font-semibold text-[#111827] tabular-nums">{r.total_days} d</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <LeaveStatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Widgets (4 cols): Quick Apply + Upcoming Holidays */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Apply Card */}
          <Card className="border-[#E5E7EB] bg-white rounded-xl shadow-subtle p-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Quick Application</h3>
                <p className="text-xs text-[#64748B]">Submit absence in 2 clicks</p>
              </div>
            </div>
            <p className="text-xs text-[#475569] mt-3">
              Calculate working days with automatic weekend exemption and instant policy checks.
            </p>
            <Button asChild className="w-full mt-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs">
              <Link href="/employee/apply-leave">
                Start Leave Request
              </Link>
            </Button>
          </Card>

          {/* Upcoming Holidays */}
          <Card className="border-[#E5E7EB] bg-white rounded-xl shadow-subtle overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Upcoming Holidays</h3>
              <Link href="/employee/leave-calendar" className="text-xs text-[#2563EB] hover:underline font-semibold">
                Calendar
              </Link>
            </div>
            <div className="p-4 divide-y divide-[#F1F3F5] text-xs">
              {upcomingHolidays.map((h) => (
                <div key={h.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#111827]">{h.name}</p>
                    <p className="text-[11px] font-mono text-[#64748B] mt-0.5">{h.date}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-[#475569] bg-[#F1F3F5] px-2 py-0.5 rounded-full">
                    {h.type}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
