'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  CalendarCheck,
  Search,
  Download,
  Filter,
  Check,
  X,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import {
  getLeaveRequests,
  getDepartmentsList,
  getLeaveTypes,
} from '@/app/actions/hr/hr-queries'
import {
  hrApproveRequest,
  hrRejectRequest,
} from '@/app/actions/hr/hr-actions'

export default function HRLeaveRequestsPage() {
  const [requests, setRequests] = React.useState<any[]>([])
  const [departments, setDepartments] = React.useState<any[]>([])
  const [leaveTypes, setLeaveTypes] = React.useState<any[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [isLoading, setIsLoading] = React.useState(true)

  // Filters
  const [status, setStatus] = React.useState('ALL')
  const [departmentId, setDepartmentId] = React.useState('ALL')
  const [leaveTypeId, setLeaveTypeId] = React.useState('ALL')
  const [search, setSearch] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')

  // Quick Action Modal state
  const [selectedReq, setSelectedReq] = React.useState<any | null>(null)
  const [actionType, setActionType] = React.useState<'APPROVE' | 'REJECT' | null>(null)
  const [comments, setComments] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const loadRequests = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getLeaveRequests({
        page,
        pageSize,
        status,
        departmentId,
        leaveTypeId,
        search,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      setRequests(res.data)
      setTotal(res.total)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, status, departmentId, leaveTypeId, search, startDate, endDate])

  React.useEffect(() => {
    loadRequests()
  }, [loadRequests])

  React.useEffect(() => {
    getDepartmentsList().then(setDepartments)
    getLeaveTypes().then(setLeaveTypes)
  }, [])

  // Export to CSV
  const handleExportCSV = () => {
    if (requests.length === 0) return
    const headers = ['Request #', 'Employee', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Applied On']
    const rows = requests.map((r) => [
      r.requestNumber,
      `"${r.employeeName}"`,
      `"${r.departmentName}"`,
      `"${r.leaveTypeName}"`,
      r.startDate,
      r.endDate,
      r.totalDays,
      r.status,
      r.appliedAt?.slice(0, 10),
    ])
    const csvStr = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `all_leave_requests_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Quick Approve/Reject execution
  const handleExecuteAction = async () => {
    if (!selectedReq || !actionType) return
    setIsSubmitting(true)
    try {
      if (actionType === 'APPROVE') {
        await hrApproveRequest({ requestId: selectedReq.id, comments })
      } else {
        await hrRejectRequest({ requestId: selectedReq.id, reason: comments || 'Rejected by HR' })
      }
      setSelectedReq(null)
      setActionType(null)
      setComments('')
      loadRequests()
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      key: 'requestNumber',
      header: 'Request #',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.requestNumber}
        </span>
      ),
    },
    {
      key: 'employeeName',
      header: 'Employee',
      cell: (row) => (
        <div>
          <span className="font-medium text-foreground">{row.employeeName}</span>
          <p className="text-xs text-muted-foreground">
            {row.employeeCode} • {row.departmentName}
          </p>
        </div>
      ),
    },
    {
      key: 'leaveTypeName',
      header: 'Leave Type',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: row.leaveTypeColor || '#3B82F6' }}
          />
          <span className="text-sm">{row.leaveTypeName}</span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      cell: (row) => (
        <div>
          <span className="text-sm font-medium">
            {row.startDate} to {row.endDate}
          </span>
          <p className="text-xs text-muted-foreground">
            {row.totalDays} {row.totalDays === 1 ? 'day' : 'days'} ({row.dayType})
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => <LeaveStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
            <Link href={`/hr/leave-requests/${row.id}`} className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> Details
            </Link>
          </Button>

          {row.status === 'PENDING_HR_APPROVAL' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                onClick={() => {
                  setSelectedReq(row)
                  setActionType('APPROVE')
                  setComments('')
                }}
              >
                <Check className="h-3.5 w-3.5 mr-1" /> Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs text-destructive border-red-200 hover:bg-red-50"
                onClick={() => {
                  setSelectedReq(row)
                  setActionType('REJECT')
                  setComments('')
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization Leave Requests"
        description="Review, monitor, and process leave applications across all business units and hierarchical stages."
      >
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-1.5" /> Export Results (CSV)
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-card p-4 rounded-lg border">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search request # or employee..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING_HR_APPROVAL">Pending HR Action</SelectItem>
            <SelectItem value="PENDING_MANAGER_APPROVAL">Pending Manager</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CLARIFICATION_REQUESTED">Clarification Requested</SelectItem>
            <SelectItem value="CANCELLATION_REQUESTED">Cancellation Requested</SelectItem>
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

        {/* Date From */}
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="From Date"
        />
      </div>

      {/* Paginated Table */}
      <DataTable
        columns={columns}
        data={requests}
        totalCount={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        emptyMessage="No leave requests found matching filters."
      />

      {/* Quick Action Modal (Approve / Reject) */}
      <Dialog open={!!selectedReq && !!actionType} onOpenChange={() => setSelectedReq(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'APPROVE' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'APPROVE'
                ? `Confirm HR approval for ${selectedReq?.employeeName}'s ${selectedReq?.leaveTypeName} (${selectedReq?.totalDays} days).`
                : `Specify reason for rejecting ${selectedReq?.employeeName}'s leave request.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label>{actionType === 'APPROVE' ? 'Comments (Optional)' : 'Rejection Reason *'}</Label>
            <Textarea
              placeholder={
                actionType === 'APPROVE'
                  ? 'e.g., Approved after policy compliance check.'
                  : 'e.g., Inadequate handover notes or blackout period...'
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              required={actionType === 'REJECT'}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReq(null)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'APPROVE' ? 'default' : 'destructive'}
              onClick={handleExecuteAction}
              disabled={isSubmitting || (actionType === 'REJECT' && !comments.trim())}
            >
              {isSubmitting ? 'Processing...' : actionType === 'APPROVE' ? 'Confirm Approval' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
