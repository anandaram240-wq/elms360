'use client'

import * as React from 'react'
import {
  Download,
  FileSpreadsheet,
  BarChart3,
  Building,
  History,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useElmsStore } from '@/lib/store/elms-store'

export default function HrReportsPage() {
  const { state } = useElmsStore()
  const [activeTab, setActiveTab] = React.useState<'DEPARTMENTS' | 'LEDGER'>('DEPARTMENTS')

  // Department-wise stats
  const departmentStats = React.useMemo(() => {
    const depts = ['Engineering', 'Human Resources', 'Finance', 'Marketing', 'Operations']
    return depts.map((dept) => {
      const emps = state.employees.filter((e) => e.department_name === dept)
      const empIds = new Set(emps.map((e) => e.id))
      const requests = state.leaveRequests.filter((r) => empIds.has(r.employee_id))
      const approvedDays = requests
        .filter((r) => r.status === 'APPROVED')
        .reduce((sum, r) => sum + r.total_days, 0)
      const pendingDays = requests
        .filter((r) => r.status === 'PENDING_MANAGER_APPROVAL' || r.status === 'PENDING_HR_APPROVAL')
        .reduce((sum, r) => sum + r.total_days, 0)

      return {
        name: dept,
        headcount: emps.length,
        totalRequests: requests.length,
        approvedDays,
        pendingDays,
      }
    })
  }, [state.employees, state.leaveRequests])

  // Real CSV Export
  const handleExportCsv = () => {
    try {
      if (activeTab === 'DEPARTMENTS') {
        let csv = 'Department,Headcount,Total Requests,Approved Days,Pending Days\n'
        departmentStats.forEach((d) => {
          csv += `"${d.name}",${d.headcount},${d.totalRequests},${d.approvedDays},${d.pendingDays}\n`
        })
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `department_leave_summary_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Department leave summary CSV downloaded!')
      } else {
        let csv = 'Request Number,Employee,Leave Type,Start Date,End Date,Days,Status,Created At\n'
        state.leaveRequests.forEach((r) => {
          csv += `"${r.request_number}","${r.employee_name}","${r.leave_type_name}",${r.start_date},${r.end_date},${r.total_days},"${r.status}","${r.created_at}"\n`
        })
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `organization_leave_ledger_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Organization leave ledger CSV downloaded!')
      }
    } catch (err) {
      toast.error('Failed to export CSV')
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Leave Audit Ledger</h1>
          <p className="text-sm text-slate-500 mt-1">
            Analyze departmental utilization, audit balance ledger entries, and download CSV reports.
          </p>
        </div>
        <Button onClick={handleExportCsv} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-xs">
          <Download className="h-4 w-4" />
          Export CSV Report
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'DEPARTMENTS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Department Utilization Summary
          </button>
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'LEDGER' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Audit Log & Balance Ledger
          </button>
        </div>
      </div>

      {activeTab === 'DEPARTMENTS' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Headcount</th>
                  <th className="py-3 px-4">Total Leave Requests</th>
                  <th className="py-3 px-4">Approved Days Deducted</th>
                  <th className="py-3 px-4">Pending Days Reserved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {departmentStats.map((d) => (
                  <tr key={d.name} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{d.name}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{d.headcount} members</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{d.totalRequests}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700 tabular-nums">{d.approvedDays} days</td>
                    <td className="py-3.5 px-4 font-bold text-amber-700 tabular-nums">{d.pendingDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Leave Category</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {state.leaveRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">{r.request_number}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{r.employee_name}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{r.leave_type_name}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">{r.start_date} → {r.end_date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">{r.total_days} d</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">{r.created_at.slice(0, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
