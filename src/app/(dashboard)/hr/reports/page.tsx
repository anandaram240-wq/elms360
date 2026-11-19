'use client'

import * as React from 'react'
import {
  BarChart3,
  Download,
  Printer,
  Filter,
  TrendingUp,
  Clock,
  DollarSign,
  Share2,
  Calendar,
  Activity,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, ColumnDef } from '@/components/shared/data-table'

export default function HRReportsPage() {
  const [activeTab, setActiveTab] = React.useState('utilization')
  const [isMounted, setIsMounted] = React.useState(false)

  // Filters
  const [departmentFilter, setDepartmentFilter] = React.useState('ALL')
  const [startDate, setStartDate] = React.useState('2026-01-01')
  const [endDate, setEndDate] = React.useState('2026-12-31')

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const handlePrint = () => {
    window.print()
  }

  // ---------------------------------------------------------------------------
  // Data for Tab 1: Leave Utilization
  // ---------------------------------------------------------------------------
  const utilizationChartData = [
    { department: 'Engineering', totalEntitled: 756, totalUsed: 362, rate: 48 },
    { department: 'Human Resources', totalEntitled: 198, totalUsed: 104, rate: 52 },
    { department: 'Product & Design', totalEntitled: 432, totalUsed: 228, rate: 53 },
    { department: 'Marketing & Sales', totalEntitled: 324, totalUsed: 142, rate: 44 },
    { department: 'Customer Support', totalEntitled: 270, totalUsed: 118, rate: 43 },
  ]

  const utilizationTableColumns: ColumnDef<any>[] = [
    { key: 'department', header: 'Department' },
    { key: 'totalEntitled', header: 'Total Entitlement (Days)', cell: (r) => `${r.totalEntitled}d` },
    { key: 'totalUsed', header: 'Used Days', cell: (r) => `${r.totalUsed}d` },
    {
      key: 'rate',
      header: 'Utilization Rate',
      cell: (r) => (
        <Badge variant={r.rate > 50 ? 'default' : 'secondary'} className="font-mono text-xs">
          {r.rate}%
        </Badge>
      ),
    },
  ]

  // ---------------------------------------------------------------------------
  // Data for Tab 2: Monthly Statistics
  // ---------------------------------------------------------------------------
  const monthlyStatsChartData = [
    { month: 'Jan', PL: 20, SL: 8, CL: 4 },
    { month: 'Feb', PL: 18, SL: 6, CL: 4 },
    { month: 'Mar', PL: 28, SL: 10, CL: 7 },
    { month: 'Apr', PL: 22, SL: 8, CL: 8 },
    { month: 'May', PL: 32, SL: 12, CL: 8 },
    { month: 'Jun', PL: 38, SL: 14, CL: 8 },
    { month: 'Jul', PL: 30, SL: 10, CL: 8 },
    { month: 'Aug', PL: 34, SL: 12, CL: 9 },
    { month: 'Sep', PL: 25, SL: 9, CL: 8 },
    { month: 'Oct', PL: 42, SL: 11, CL: 12 },
    { month: 'Nov', PL: 46, SL: 14, CL: 12 },
    { month: 'Dec', PL: 56, SL: 15, CL: 14 },
  ]

  const monthlyTableColumns: ColumnDef<any>[] = [
    { key: 'month', header: 'Month' },
    { key: 'PL', header: 'Privilege Leave' },
    { key: 'SL', header: 'Sick Leave' },
    { key: 'CL', header: 'Casual Leave' },
    {
      key: 'total',
      header: 'Total Taken',
      cell: (r) => <span className="font-bold">{r.PL + r.SL + r.CL}</span>,
    },
  ]

  // ---------------------------------------------------------------------------
  // Data for Tab 3: Sick Leave Trends
  // ---------------------------------------------------------------------------
  const sickLeaveChartData = [
    { day: 'Monday', instances: 42 },
    { day: 'Tuesday', instances: 18 },
    { day: 'Wednesday', instances: 16 },
    { day: 'Thursday', instances: 19 },
    { day: 'Friday', instances: 48 },
  ]

  const sickTableColumns: ColumnDef<any>[] = [
    { key: 'day', header: 'Day of Week' },
    { key: 'instances', header: 'Sick Leave Instances Reported' },
    {
      key: 'rate',
      header: 'Share of Total Sick Leaves',
      cell: (r) => `${Math.round((r.instances / 143) * 100)}%`,
    },
  ]

  // ---------------------------------------------------------------------------
  // Data for Tab 4: Pending Approvals Aging
  // ---------------------------------------------------------------------------
  const pendingAgingChartData = [
    { bracket: '< 2 Days (Normal)', count: 14, fill: '#10B981' },
    { bracket: '3 - 5 Days (Moderate)', count: 6, fill: '#F59E0B' },
    { bracket: '> 5 Days (Escalated)', count: 2, fill: '#EF4444' },
  ]

  const pendingTableData = [
    {
      requestNumber: 'LR-2026-001001',
      employee: 'Sarah Connor',
      department: 'Engineering',
      appliedAt: '2026-11-12',
      stage: 'PENDING_HR_APPROVAL',
      agingDays: 7,
    },
    {
      requestNumber: 'LR-2026-001015',
      employee: 'Kevin Vance',
      department: 'Customer Support',
      appliedAt: '2026-11-14',
      stage: 'PENDING_MANAGER_APPROVAL',
      agingDays: 5,
    },
    {
      requestNumber: 'LR-2026-001032',
      employee: 'Michael Brown',
      department: 'Product & Design',
      appliedAt: '2026-11-18',
      stage: 'PENDING_HR_APPROVAL',
      agingDays: 1,
    },
  ]

  const pendingTableColumns: ColumnDef<any>[] = [
    { key: 'requestNumber', header: 'Request #' },
    { key: 'employee', header: 'Employee' },
    { key: 'department', header: 'Department' },
    { key: 'stage', header: 'Pending Stage' },
    {
      key: 'agingDays',
      header: 'Aging',
      cell: (r) => (
        <Badge
          className={
            r.agingDays > 5
              ? 'bg-red-100 text-red-800 border-red-200'
              : r.agingDays >= 3
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-emerald-100 text-emerald-800'
          }
        >
          {r.agingDays} Days Pending
        </Badge>
      ),
    },
  ]

  // ---------------------------------------------------------------------------
  // Data for Tab 5: Balance Liability
  // ---------------------------------------------------------------------------
  const liabilityChartData = [
    { department: 'Engineering', balanceDays: 394, estimatedLiability: 39400 },
    { department: 'Product & Design', balanceDays: 204, estimatedLiability: 20400 },
    { department: 'Marketing & Sales', balanceDays: 182, estimatedLiability: 18200 },
    { department: 'Customer Support', balanceDays: 152, estimatedLiability: 12160 },
    { department: 'Human Resources', balanceDays: 94, estimatedLiability: 9400 },
  ]

  const liabilityTableColumns: ColumnDef<any>[] = [
    { key: 'department', header: 'Department' },
    { key: 'balanceDays', header: 'Outstanding Leave Days', cell: (r) => `${r.balanceDays} Days` },
    {
      key: 'estimatedLiability',
      header: 'Est. Accrued Liability ($)',
      cell: (r) => <span className="font-mono font-bold">${r.estimatedLiability.toLocaleString()}</span>,
    },
  ]

  // ---------------------------------------------------------------------------
  // Data for Tab 6: Carry Forward
  // ---------------------------------------------------------------------------
  const carryForwardTableData = [
    { employee: 'Sarah Connor', code: 'EMP-1001', department: 'Engineering', carriedDays: 5, expiryDate: '2026-06-30' },
    { employee: 'John Doe', code: 'EMP-1002', department: 'Engineering', carriedDays: 2, expiryDate: '2026-06-30' },
    { employee: 'Priya Sharma', code: 'EMP-1003', department: 'Human Resources', carriedDays: 8, expiryDate: '2026-06-30' },
    { employee: 'Alex Wright', code: 'EMP-1000', department: 'Executive', carriedDays: 10, expiryDate: '2026-06-30' },
  ]

  const carryForwardColumns: ColumnDef<any>[] = [
    { key: 'employee', header: 'Employee' },
    { key: 'code', header: 'Code' },
    { key: 'department', header: 'Department' },
    {
      key: 'carriedDays',
      header: 'Carried Forward Days',
      cell: (r) => <span className="font-mono font-bold">{r.carriedDays} Days</span>,
    },
    { key: 'expiryDate', header: 'Expiry Date' },
  ]

  const handleExportTabCSV = () => {
    let headers: string[] = []
    let rows: string[][] = []

    if (activeTab === 'utilization') {
      headers = ['Department', 'Total Entitlement', 'Total Used', 'Utilization Rate %']
      rows = utilizationChartData.map((r) => [r.department, String(r.totalEntitled), String(r.totalUsed), `${r.rate}%`])
    } else if (activeTab === 'monthly') {
      headers = ['Month', 'Privilege Leave', 'Sick Leave', 'Casual Leave', 'Total']
      rows = monthlyStatsChartData.map((r) => [r.month, String(r.PL), String(r.SL), String(r.CL), String(r.PL + r.SL + r.CL)])
    } else if (activeTab === 'sick') {
      headers = ['Day of Week', 'Instances Reported']
      rows = sickLeaveChartData.map((r) => [r.day, String(r.instances)])
    } else if (activeTab === 'pending') {
      headers = ['Request #', 'Employee', 'Department', 'Stage', 'Aging Days']
      rows = pendingTableData.map((r) => [r.requestNumber, r.employee, r.department, r.stage, String(r.agingDays)])
    } else if (activeTab === 'liability') {
      headers = ['Department', 'Balance Days', 'Estimated Liability ($)']
      rows = liabilityChartData.map((r) => [r.department, String(r.balanceDays), String(r.estimatedLiability)])
    } else if (activeTab === 'carryforward') {
      headers = ['Employee', 'Code', 'Department', 'Carried Days', 'Expiry Date']
      rows = carryForwardTableData.map((r) => [r.employee, r.code, r.department, String(r.carriedDays), r.expiryDate])
    }

    const csvStr = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `hr_report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Analytics & Executive Reports"
        description="Comprehensive intelligence on organization-wide utilization, absenteeism frequency, approval SLAs, and balance liabilities."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportTabCSV}>
            <Download className="h-4 w-4 mr-1.5" /> Export Report (CSV)
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5" /> Print View
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1">
          <TabsTrigger value="utilization">Leave Utilization</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Statistics</TabsTrigger>
          <TabsTrigger value="sick">Sick Leave Trends</TabsTrigger>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="liability">Balance Liability</TabsTrigger>
          <TabsTrigger value="carryforward">Carry Forward</TabsTrigger>
        </TabsList>

        {/* Tab 1: Leave Utilization */}
        <TabsContent value="utilization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department Leave Utilization %</CardTitle>
              <CardDescription>Ratio of consumed leaves against total annual entitlements</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalEntitled" fill="#93C5FD" name="Entitled Days" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalUsed" fill="#3B82F6" name="Used Days" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <DataTable columns={utilizationTableColumns} data={utilizationChartData} />
        </TabsContent>

        {/* Tab 2: Monthly Statistics */}
        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Leave Trends by Category</CardTitle>
              <CardDescription>Seasonal patterns across PL, SL, and CL throughout the fiscal year</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyStatsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="PL" stroke="#3B82F6" strokeWidth={2} name="Privilege Leave" />
                    <Line type="monotone" dataKey="SL" stroke="#EF4444" strokeWidth={2} name="Sick Leave" />
                    <Line type="monotone" dataKey="CL" stroke="#10B981" strokeWidth={2} name="Casual Leave" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <DataTable columns={monthlyTableColumns} data={monthlyStatsChartData} />
        </TabsContent>

        {/* Tab 3: Sick Leave Trends */}
        <TabsContent value="sick" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sick Leave Frequency by Day of Week</CardTitle>
              <CardDescription>
                Pattern analysis of medical leaves (identifies weekend adjacent spikes)
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sickLeaveChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="instances" fill="#EF4444" name="Instances" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <DataTable columns={sickTableColumns} data={sickLeaveChartData} />
        </TabsContent>

        {/* Tab 4: Pending Approvals */}
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Request Aging SLA Breakdown</CardTitle>
              <CardDescription>Number of open requests by days elapsed since submission</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pendingAgingChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="bracket" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {pendingAgingChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <DataTable columns={pendingTableColumns} data={pendingTableData} />
        </TabsContent>

        {/* Tab 5: Balance Liability */}
        <TabsContent value="liability" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Departmental Accrued Leave Liability</CardTitle>
              <CardDescription>
                Financial liability computed from outstanding balance days multiplied by standard per-diem
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={liabilityChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="estimatedLiability" fill="#8B5CF6" name="Liability ($)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <DataTable columns={liabilityTableColumns} data={liabilityChartData} />
        </TabsContent>

        {/* Tab 6: Carry Forward */}
        <TabsContent value="carryforward" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Carry-Forward Balances & Expiry Deadlines</CardTitle>
              <CardDescription>
                Personnel with prior year balances carried forward and their respective expiration timelines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={carryForwardColumns} data={carryForwardTableData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
