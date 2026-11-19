'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  CalendarPlus,
  Search,
  RotateCcw,
  Eye,
  Undo2,
  XCircle,
  FileText,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  useMyLeaveRequests,
  useLeaveTypes,
} from '@/hooks/queries/use-employee-queries'
import {
  withdrawLeaveRequest,
  requestCancellation,
} from '@/app/actions/employee/leave-actions'
import { LeaveRequestWithDetails, LeaveStatus } from '@/types/app'

export default function MyLeavesPage() {
  const router = useRouter()
  const { data: leaveTypes = [] } = useLeaveTypes()

  // Filters state
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')
  const [typeFilter, setTypeFilter] = React.useState<string>('ALL')
  const [search, setSearch] = React.useState<string>('')

  // Action modals state
  const [withdrawTargetId, setWithdrawTargetId] = React.useState<string | null>(null)
  const [withdrawing, setWithdrawing] = React.useState(false)

  const [cancelTargetId, setCancelTargetId] = React.useState<string | null>(null)
  const [cancellationReason, setCancellationReason] = React.useState('')
  const [cancelling, setCancelling] = React.useState(false)

  // Query hook
  const {
    data: paginatedData,
    isLoading,
    refetch,
  } = useMyLeaveRequests({
    page,
    pageSize,
    status: statusFilter !== 'ALL' ? (statusFilter as LeaveStatus) : undefined,
    leaveTypeId: typeFilter !== 'ALL' ? typeFilter : undefined,
  })

  // Filter in memory by search string if typed
  const rawData = paginatedData?.data || []
  const filteredData = React.useMemo(() => {
    if (!search.trim()) return rawData
    const q = search.toLowerCase()
    return rawData.filter(
      (r) =>
        r.requestNumber.toLowerCase().includes(q) ||
        r.leaveTypeName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
    )
  }, [rawData, search])

  // Handle Withdraw
  const handleConfirmWithdraw = async () => {
    if (!withdrawTargetId) return
    setWithdrawing(true)
    try {
      const res = await withdrawLeaveRequest(withdrawTargetId)
      if (res.success) {
        toast.success(res.message || 'Leave request withdrawn')
        refetch()
      } else {
        toast.error(res.error || 'Failed to withdraw request')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error withdrawing leave request')
    } finally {
      setWithdrawing(false)
      setWithdrawTargetId(null)
    }
  }

  // Handle Cancellation Request
  const handleConfirmCancellation = async () => {
    if (!cancelTargetId) return
    if (cancellationReason.trim().length < 10) {
      toast.error('Please enter a cancellation reason (min 10 characters)')
      return
    }

    setCancelling(true)
    try {
      const res = await requestCancellation(cancelTargetId, cancellationReason)
      if (res.success) {
        toast.success(res.message || 'Cancellation request submitted')
        refetch()
      } else {
        toast.error(res.error || 'Failed to request cancellation')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error requesting cancellation')
    } finally {
      setCancelling(false)
      setCancelTargetId(null)
      setCancellationReason('')
    }
  }

  const columns: ColumnDef<LeaveRequestWithDetails>[] = [
    {
      key: 'requestNumber',
      header: 'Request #',
      cell: (row) => (
        <button
          onClick={() => router.push(`/employee/my-leaves/${row.id}`)}
          className="font-mono font-semibold text-primary hover:underline text-left"
        >
          {row.requestNumber}
        </button>
      ),
    },
    {
      key: 'leaveTypeName',
      header: 'Leave Type',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: row.leaveTypeColor || '#3b82f6' }}
          />
          <span className="font-medium text-foreground">{row.leaveTypeName}</span>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Duration & Dates',
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground">
            {row.totalDays} {row.totalDays === 1 ? 'day' : 'days'}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(row.startDate), 'dd MMM yyyy')} —{' '}
            {format(parseISO(row.endDate), 'dd MMM yyyy')}
          </p>
        </div>
      ),
    },
    {
      key: 'appliedAt',
      header: 'Applied On',
      cell: (row) => (
        <span className="text-muted-foreground text-xs">
          {row.appliedAt || row.createdAt
            ? format(parseISO(row.appliedAt || row.createdAt), 'dd MMM yyyy, h:mm a')
            : '—'}
        </span>
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
      className: 'text-right',
      cell: (row) => {
        const canWithdraw = [
          'PENDING_MANAGER_APPROVAL',
          'PENDING_HR_APPROVAL',
          'CLARIFICATION_REQUESTED',
        ].includes(row.status)
        const canCancel = row.status === 'APPROVED'

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/employee/my-leaves/${row.id}`)}
              title="View Request Details"
            >
              <Eye className="h-4 w-4" />
            </Button>

            {canWithdraw && (
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs"
                onClick={() => setWithdrawTargetId(row.id)}
              >
                Withdraw
              </Button>
            )}

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs"
                onClick={() => setCancelTargetId(row.id)}
              >
                Cancel Leave
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Leave Applications
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track historical and current leave requests, withdraw pending applications, or request cancellations.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-medium">
          <Link href="/employee/apply-leave">
            <CalendarPlus className="h-4 w-4" />
            Apply for Leave
          </Link>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-card p-4 rounded-xl border shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by request # or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Leave Type Filter */}
        <div className="w-full md:w-52">
          <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="All Leave Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Leave Types</SelectItem>
              {leaveTypes.map((t) => (
                <SelectItem key={t.leaveTypeId} value={t.leaveTypeId}>
                  {t.leaveTypeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-56">
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING_MANAGER_APPROVAL">Pending Manager</SelectItem>
              <SelectItem value="PENDING_HR_APPROVAL">Pending HR</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CLARIFICATION_REQUESTED">Clarification Requested</SelectItem>
              <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
              <SelectItem value="CANCELLATION_REQUESTED">Cancellation Requested</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filters */}
        {(statusFilter !== 'ALL' || typeFilter !== 'ALL' || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter('ALL')
              setTypeFilter('ALL')
              setSearch('')
              setPage(1)
            }}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Requests Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        totalCount={paginatedData?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        emptyMessage="No leave applications match your current filters."
      />

      {/* Confirmation Dialog: Withdraw */}
      <ConfirmDialog
        open={Boolean(withdrawTargetId)}
        onOpenChange={(open) => !open && setWithdrawTargetId(null)}
        title="Withdraw Leave Request?"
        description="Are you sure you want to withdraw this application? This action will cancel the pending review and release the reserved leave balance immediately."
        confirmLabel="Confirm Withdrawal"
        cancelLabel="Keep Request"
        variant="destructive"
        isLoading={withdrawing}
        onConfirm={handleConfirmWithdraw}
      />

      {/* Modal Dialog: Request Cancellation */}
      <Dialog open={Boolean(cancelTargetId)} onOpenChange={(open) => !open && setCancelTargetId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Leave Cancellation</DialogTitle>
            <DialogDescription>
              This approved leave will be sent to HR for cancellation review. Please specify why you are cancelling.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="cancelReason">
              Cancellation Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancelReason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g. Project deliverable postponed, urgent client meeting scheduled..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              {cancellationReason.trim().length}/10 minimum characters
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelTargetId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCancellation}
              disabled={cancelling || cancellationReason.trim().length < 10}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {cancelling ? 'Submitting...' : 'Submit Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
