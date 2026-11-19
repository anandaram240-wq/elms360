'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  PieChart,
  Download,
  Search,
  PlusCircle,
  SlidersHorizontal,
  History,
  FileSpreadsheet,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getLeaveBalances,
  getDepartmentsList,
  getLeaveTypes,
  getEmployeesList,
} from '@/app/actions/hr/hr-queries'
import { adjustLeaveBalance } from '@/app/actions/hr/hr-actions'

export default function LeaveBalancesPage() {
  const [balances, setBalances] = React.useState<any[]>([])
  const [departments, setDepartments] = React.useState<any[]>([])
  const [leaveTypes, setLeaveTypes] = React.useState<any[]>([])
  const [employees, setEmployees] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Filters
  const [fiscalYear, setFiscalYear] = React.useState(2026)
  const [departmentId, setDepartmentId] = React.useState('ALL')
  const [employeeId, setEmployeeId] = React.useState('ALL')
  const [leaveTypeId, setLeaveTypeId] = React.useState('ALL')
  const [search, setSearch] = React.useState('')

  // Manual Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = React.useState(false)
  const [selectedRecord, setSelectedRecord] = React.useState<any | null>(null)
  const [adjustAmount, setAdjustAmount] = React.useState(1)
  const [adjustType, setAdjustType] = React.useState<'MANUAL_ADJUSTMENT' | 'CARRY_FORWARD' | 'EXPIRY'>('MANUAL_ADJUSTMENT')
  const [adjustReason, setAdjustReason] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Ledger Drilldown Modal
  const [ledgerModalOpen, setLedgerModalOpen] = React.useState(false)
  const [activeLedger, setActiveLedger] = React.useState<any | null>(null)

  const loadBalances = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getLeaveBalances({
        fiscalYear,
        departmentId,
        employeeId,
        leaveTypeId,
      })
      setBalances(data)
    } finally {
      setIsLoading(false)
    }
  }, [fiscalYear, departmentId, employeeId, leaveTypeId])

  React.useEffect(() => {
    loadBalances()
  }, [loadBalances])

  React.useEffect(() => {
    getDepartmentsList().then(setDepartments)
    getLeaveTypes().then(setLeaveTypes)
    getEmployeesList({ pageSize: 100 }).then((res) => setEmployees(res.data))
  }, [])

  // Filter client search
  const filteredBalances = React.useMemo(() => {
    if (!search.trim()) return balances
    const q = search.toLowerCase()
    return balances.filter(
      (b) =>
        b.employeeName?.toLowerCase().includes(q) ||
        b.employeeCode?.toLowerCase().includes(q) ||
        b.departmentName?.toLowerCase().includes(q)
    )
  }, [balances, search])

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredBalances.length === 0) return
    const headers = [
      'Employee Code',
      'Employee Name',
      'Department',
      'Leave Type',
      'Fiscal Year',
      'Opening',
      'Accrued',
      'Used',
      'Pending',
      'Adjusted',
      'Carried Forward',
      'Available',
    ]
    const rows = filteredBalances.map((b) => [
      b.employeeCode,
      `"${b.employeeName}"`,
      `"${b.departmentName}"`,
      `"${b.leaveTypeName}"`,
      b.fiscalYear,
      b.openingBalance,
      b.accrued,
      b.used,
      b.pending,
      b.adjusted,
      b.carriedForward,
      b.available,
    ])
    const csvStr = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `leave_balances_${fiscalYear}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${filteredBalances.length} balance records to CSV`)
  }

  // Handle Adjustment Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRecord || !adjustReason.trim()) return
    setIsSubmitting(true)
    try {
      const res = await adjustLeaveBalance({
        employeeId: selectedRecord.employeeId,
        leaveTypeId: selectedRecord.leaveTypeId,
        amount: Number(adjustAmount),
        reason: adjustReason,
        transactionType: adjustType,
      })
      if (res.success) {
        setAdjustModalOpen(false)
        setAdjustReason('')
        toast.success(`Balance adjusted by ${adjustAmount > 0 ? '+' : ''}${adjustAmount} days`)
        loadBalances()
      } else {
        toast.error(res.error || 'Failed to adjust balance')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      key: 'employee',
      header: 'Employee',
      cell: (row) => (
        <div>
          <span className="font-semibold text-foreground text-sm">{row.employeeName}</span>
          <p className="text-xs text-muted-foreground font-mono">{row.employeeCode}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      cell: (row) => (
        <Badge variant="outline" className="font-normal text-xs">
          {row.departmentName}
        </Badge>
      ),
    },
    {
      key: 'leaveType',
      header: 'Leave Type',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: row.leaveTypeColor || '#3B82F6' }}
          />
          <span className="text-sm font-medium">{row.leaveTypeName}</span>
        </div>
      ),
    },
    {
      key: 'openingBalance',
      header: 'Opening',
      cell: (row) => <span className="text-xs font-mono">{row.openingBalance}</span>,
    },
    {
      key: 'accrued',
      header: 'Accrued',
      cell: (row) => <span className="text-xs font-mono">{row.accrued}</span>,
    },
    {
      key: 'used',
      header: 'Used',
      cell: (row) => <span className="text-xs font-mono font-medium text-foreground">{row.used}</span>,
    },
    {
      key: 'pending',
      header: 'Pending',
      cell: (row) => (
        <span className={`text-xs font-mono font-semibold ${row.pending > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
          {row.pending}
        </span>
      ),
    },
    {
      key: 'available',
      header: 'Available Balance',
      cell: (row) => (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-mono font-bold text-xs">
          {row.available} Days
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => {
              setSelectedRecord(row)
              setAdjustAmount(1)
              setAdjustType('MANUAL_ADJUSTMENT')
              setAdjustReason('')
              setAdjustModalOpen(true)
            }}
          >
            Adjust
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => {
              setActiveLedger(row)
              setLedgerModalOpen(true)
            }}
          >
            <History className="h-3.5 w-3.5 mr-1" /> Ledger
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Leave Balances"
        description="Monitor individual leave ledger balances, review accrual pipelines, execute manual adjustments, and audit balance liability."
      >
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1.5" /> Export to CSV
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-card p-4 rounded-lg border">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employee name/code..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Year */}
        <Select value={String(fiscalYear)} onValueChange={(val) => setFiscalYear(Number(val))}>
          <SelectTrigger>
            <SelectValue placeholder="Fiscal Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2026">Year 2026</SelectItem>
            <SelectItem value="2025">Year 2025</SelectItem>
            <SelectItem value="2024">Year 2024</SelectItem>
          </SelectContent>
        </Select>

        {/* Department */}
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger>
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Leave Type */}
        <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
          <SelectTrigger>
            <SelectValue placeholder="All Leave Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Leave Types</SelectItem>
            {leaveTypes.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quick Reset */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch('')
            setDepartmentId('ALL')
            setLeaveTypeId('ALL')
          }}
        >
          Reset Filters
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredBalances}
        isLoading={isLoading}
        emptyMessage="No leave balances found for selected filters."
      />

      {/* Manual Balance Adjustment Modal */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Balance Adjustment</DialogTitle>
            <DialogDescription>
              Adjust balance for{' '}
              <strong className="text-foreground">
                {selectedRecord?.employeeName} ({selectedRecord?.leaveTypeName})
              </strong>
              . This creates an auditable ledger entry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdjustSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={adjustType} onValueChange={(val: any) => setAdjustType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL_ADJUSTMENT">Manual Adjustment (Credit or Debit)</SelectItem>
                  <SelectItem value="CARRY_FORWARD">Carry-Forward Adjustment</SelectItem>
                  <SelectItem value="EXPIRY">Lapse / Expire Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amount (Positive to add, Negative to deduct)</Label>
              <Input
                type="number"
                step="0.5"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Mandatory Audit Reason *</Label>
              <Textarea
                placeholder="e.g., Compensatory off credited for scheduled weekend disaster recovery drill..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !adjustReason.trim()}>
                {isSubmitting ? 'Adjusting...' : 'Apply Ledger Adjustment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ledger Drill-Down Modal */}
      <Dialog open={ledgerModalOpen} onOpenChange={setLedgerModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Balance Ledger History</DialogTitle>
            <DialogDescription>
              {activeLedger?.employeeName} — {activeLedger?.leaveTypeName} (Year {activeLedger?.fiscalYear})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-72 overflow-y-auto divide-y border rounded-lg p-2">
            <div className="p-2.5 text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Annual Opening Credit</p>
                <p className="text-muted-foreground">01 Jan 2026 • System Automated</p>
              </div>
              <span className="font-mono font-bold text-emerald-600">+18.00 Days</span>
            </div>
            <div className="p-2.5 text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Approved Leave Deduction (LR-2026-001001)</p>
                <p className="text-muted-foreground">18 Nov 2026 • HR Approval</p>
              </div>
              <span className="font-mono font-bold text-destructive">-4.00 Days</span>
            </div>
            <div className="p-2.5 text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Pending Reservation (LR-2026-001042)</p>
                <p className="text-muted-foreground">20 Nov 2026 • Pending Manager</p>
              </div>
              <span className="font-mono font-bold text-amber-600">-2.00 Days (Held)</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setLedgerModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
