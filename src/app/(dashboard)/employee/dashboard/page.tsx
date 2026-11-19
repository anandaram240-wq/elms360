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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  const upcomingHolidays = state.holidays.slice(0, 4)

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {currentUser?.fullName || 'Arjun Kumar'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Engineering Department • Senior Software Engineer • Employee Code: {currentUser?.employeeCode || 'EMP008'}
          </p>
        </div>
        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 shadow-xs">
          <Link href="/employee/apply-leave">
            <CalendarPlus className="h-4 w-4" />
            Apply for Leave
          </Link>
        </Button>
      </div>

      {/* 4 Leave Balance KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Your Leave Balances (FY 2026)</h2>
          <Link href="/employee/my-leaves" className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1">
            View history <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {state.leaveTypes.map((type) => {
            const bal = myBalances.find((b) => b.leave_type_id === type.id)
            const available = bal ? bal.available_balance : type.annual_entitlement
            const used = bal ? bal.used : 0
            const pending = bal ? bal.pending : 0

            return (
              <Card key={type.id} className="border-slate-200 shadow-xs bg-white overflow-hidden hover:border-slate-300 transition-all">
                <div className="h-1.5 w-full" style={{ backgroundColor: type.color }} />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{type.code}</span>
                    <span className="text-[11px] font-semibold text-slate-400">{type.name}</span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">{available}</span>
                    <span className="text-xs font-medium text-slate-500">days available</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Used: <strong className="text-slate-800">{used} d</strong></span>
                    <span>Pending: <strong className="text-amber-600">{pending} d</strong></span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* 2-Column: Recent Applications + Upcoming Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Applications (8 cols) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Recent Applications</h2>
            <Link href="/employee/my-leaves" className="text-xs text-blue-600 hover:underline font-semibold">
              View all ({state.leaveRequests.filter((r) => r.employee_id === employeeId).length})
            </Link>
          </div>

          <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {myRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No leave applications submitted yet.
                      </td>
                    </tr>
                  ) : (
                    myRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                          <Link href="/employee/my-leaves" className="hover:underline">
                            {r.request_number}
                          </Link>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">{r.leave_type_name}</td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{r.start_date} → {r.end_date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">{r.total_days} d</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              r.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'PENDING_MANAGER_APPROVAL'
                                ? 'bg-amber-100 text-amber-800'
                                : r.status === 'PENDING_HR_APPROVAL'
                                ? 'bg-blue-100 text-blue-800'
                                : r.status === 'CLARIFICATION_REQUESTED'
                                ? 'bg-indigo-100 text-indigo-800'
                                : r.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {r.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Upcoming Holidays (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Upcoming Holidays</h2>
            <Link href="/employee/calendar" className="text-xs text-blue-600 hover:underline font-semibold">
              Calendar
            </Link>
          </div>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-4 divide-y divide-slate-100 text-xs">
              {upcomingHolidays.map((h) => (
                <div key={h.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{h.name}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">{h.date}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {h.type}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
