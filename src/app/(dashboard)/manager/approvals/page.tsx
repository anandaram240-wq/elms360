'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { LeaveRequestWithDetails } from '@/types/app'
import {
  getMyPendingApprovals,
  approveRequest,
  rejectRequest,
  requestClarification,
  bulkApproveRequests,
} from '@/app/actions/manager/approval-actions'
import { useManagerRealtime } from '@/hooks/use-manager-realtime'
import { useAuth } from '@/providers/auth-provider'
import { PageHeader } from '@/components/shared/page-header'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Check,
  X,
  HelpCircle,
  Eye,
  Search,
  Filter,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ApprovalsQueuePage() {
  const router = useRouter()
  const { currentUser } = useAuth()

  // State
  const [requests, setRequests] = React.useState<LeaveRequestWithDetails[]>([])
  const [total, setTotal] = React.useState<number>(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [pageSize] = React.useState(15)

  // Filters
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'PENDING' | 'ALL'>('PENDING')
  const [leaveTypeFilter, setLeaveTypeFilter] = React.useState<string>('ALL')

  // Selection for bulk action
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  // Modal Dialog states
  const [activeModal, setActiveModal] = React.useState<
    'APPROVE' | 'REJECT' | 'CLARIFY' | 'BULK_APPROVE' | null
  >(null)
  const [targetRequest, setTargetRequest] = React.useState<LeaveRequestWithDetails | null>(null)
  const [modalComment, setModalComment] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Data fetching
  const fetchApprovals = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getMyPendingApprovals({
        search,
        status: statusFilter,
        leaveTypeId: leaveTypeFilter,
        page,
        pageSize,
      })
      setRequests(res.requests)
      setTotal(res.total)
    } catch (err) {
      console.error('Failed to load approvals:', err)
      toast.error('Failed to load approval requests')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, leaveTypeFilter, page, pageSize])

  // Initial load and updates
  React.useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  // Real-time subscription hook
  useManagerRealtime({
    employeeId: currentUser?.employeeId,
    onNewRequest: () => {
      fetchApprovals()
    },
  })

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(requests.map((r) => r.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id))
    }
  }

  // Action open handlers
  const handleOpenApprove = (req: LeaveRequestWithDetails) => {
    setTargetRequest(req)
    setActiveModal('APPROVE')
    setModalComment('')
  }

  const handleOpenReject = (req: LeaveRequestWithDetails) => {
    setTargetRequest(req)
    setActiveModal('REJECT')
    setModalComment('')
  }

  const handleOpenClarify = (req: LeaveRequestWithDetails) => {
    setTargetRequest(req)
    setActiveModal('CLARIFY')
    setModalComment('')
  }

  const handleOpenBulkApprove = () => {
    if (selectedIds.length === 0) return
    setActiveModal('BULK_APPROVE')
    setModalComment('')
  }

  // Action execution
  const handleConfirmAction = async () => {
    if (!activeModal) return
    setIsSubmitting(true)

    try {
      if (activeModal === 'APPROVE' && targetRequest) {
        const idempotencyKey = `appr_${targetRequest.id}_${Date.now()}`
        const res = await approveRequest({
          requestId: targetRequest.id,
          comments: modalComment.trim() || undefined,
          idempotencyKey,
        })
        if (res.success) {
          toast.success(`Request #${targetRequest.requestNumber} approved`)
          setActiveModal(null)
          fetchApprovals()
        } else {
          toast.error(res.error || 'Approval failed')
        }
      } else if (activeModal === 'REJECT' && targetRequest) {
        if (!modalComment.trim()) {
          toast.error('Rejection reason is required')
          setIsSubmitting(false)
          return
        }
        const idempotencyKey = `rej_${targetRequest.id}_${Date.now()}`
        const res = await rejectRequest({
          requestId: targetRequest.id,
          reason: modalComment.trim(),
          idempotencyKey,
        })
        if (res.success) {
          toast.success(`Request #${targetRequest.requestNumber} rejected`)
          setActiveModal(null)
          fetchApprovals()
        } else {
          toast.error(res.error || 'Rejection failed')
        }
      } else if (activeModal === 'CLARIFY' && targetRequest) {
        if (!modalComment.trim()) {
          toast.error('Please enter a clarification question or request')
          setIsSubmitting(false)
          return
        }
        const idempotencyKey = `clar_${targetRequest.id}_${Date.now()}`
        const res = await requestClarification({
          requestId: targetRequest.id,
          message: modalComment.trim(),
          idempotencyKey,
        })
        if (res.success) {
          toast.success(`Clarification requested on #${targetRequest.requestNumber}`)
          setActiveModal(null)
          fetchApprovals()
        } else {
          toast.error(res.error || 'Action failed')
        }
      } else if (activeModal === 'BULK_APPROVE') {
        const res = await bulkApproveRequests({
          requestIds: selectedIds,
          comments: modalComment.trim() || undefined,
        })
        if (res.approvedCount > 0) {
          toast.success(`Successfully approved ${res.approvedCount} requests`)
        }
        if (res.errors.length > 0) {
          toast.error(`Errors encountered: ${res.errors.join(', ')}`)
        }
        setSelectedIds([])
        setActiveModal(null)
        fetchApprovals()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action encountered an error'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const selectedRequests = requests.filter((r) => selectedIds.includes(r.id))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Queue"
        description="Review, approve, or reject leave requests submitted by your team."
      >
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenBulkApprove}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <CheckCheck className="h-4 w-4" />
              Bulk Approve ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchApprovals()}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee, request #..."
                className="pl-8 text-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Status Toggle */}
              <div className="flex items-center rounded-lg border bg-muted/40 p-1">
                <Button
                  size="sm"
                  variant={statusFilter === 'PENDING' ? 'default' : 'ghost'}
                  className="text-xs h-7 px-3"
                  onClick={() => {
                    setStatusFilter('PENDING')
                    setPage(1)
                  }}
                >
                  Pending Review
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'ALL' ? 'default' : 'ghost'}
                  className="text-xs h-7 px-3"
                  onClick={() => {
                    setStatusFilter('ALL')
                    setPage(1)
                  }}
                >
                  All Requests
                </Button>
              </div>

              {/* Leave Type Select */}
              <Select
                value={leaveTypeFilter}
                onValueChange={(val) => {
                  setLeaveTypeFilter(val)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue placeholder="Leave Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="PL">Privilege Leave</SelectItem>
                  <SelectItem value="SL">Sick Leave</SelectItem>
                  <SelectItem value="CL">Casual Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        requests.length > 0 && selectedIds.length === requests.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-sm">Loading approval requests...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Check className="h-8 w-8 text-emerald-500/80" />
                        <span className="font-medium text-foreground">No requests found</span>
                        <span className="text-xs">
                          {statusFilter === 'PENDING'
                            ? 'All pending requests have been reviewed!'
                            : 'No leave requests match your criteria.'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => {
                    const isSelected = selectedIds.includes(req.id)
                    const isPending =
                      req.status === 'PENDING_MANAGER_APPROVAL' ||
                      req.status === 'PENDING_HR_APPROVAL' ||
                      req.status === 'PENDING_ADDITIONAL_APPROVAL' ||
                      req.status === 'CLARIFICATION_REQUESTED'

                    return (
                      <TableRow key={req.id} className={isSelected ? 'bg-primary/5' : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleSelectOne(req.id, Boolean(checked))
                            }
                            disabled={!isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                              {req.employeeName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {req.employeeCode} {req.departmentName ? `• ${req.departmentName}` : ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            style={{
                              backgroundColor: `${req.leaveTypeColor}15`,
                              color: req.leaveTypeColor,
                              borderColor: `${req.leaveTypeColor}35`,
                            }}
                            className="text-xs font-semibold border"
                          >
                            {req.leaveTypeName}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="font-medium text-foreground">{req.startDate}</span>
                            <span className="text-muted-foreground"> to </span>
                            <span className="font-medium text-foreground">{req.endDate}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="font-semibold text-foreground">{req.totalDays}</span>{' '}
                            {req.totalDays === 1 ? 'day' : 'days'}
                            <div className="text-[11px] text-muted-foreground capitalize">
                              {req.dayType.toLowerCase().replace('_', ' ')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {req.appliedAt
                            ? new Date(req.appliedAt).toLocaleDateString()
                            : new Date(req.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <LeaveStatusBadge status={req.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isPending && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-300"
                                  title="Approve"
                                  onClick={() => handleOpenApprove(req)}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-300"
                                  title="Reject"
                                  onClick={() => handleOpenReject(req)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2 text-sky-700 hover:text-sky-800 hover:bg-sky-50 border-sky-300"
                                  title="Request Clarification"
                                  onClick={() => handleOpenClarify(req)}
                                >
                                  <HelpCircle className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            <Link href={`/manager/approvals/${req.id}`}>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination bar */}
          <div className="flex items-center justify-between p-4 border-t text-xs text-muted-foreground">
            <div>
              Showing {requests.length > 0 ? (page - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(page * pageSize, total)} of {total} requests
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog (Approve, Reject, Clarify) */}
      <Dialog open={Boolean(activeModal && activeModal !== 'BULK_APPROVE')} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeModal === 'APPROVE'
                ? 'Approve Leave Request'
                : activeModal === 'REJECT'
                ? 'Reject Leave Request'
                : 'Request Clarification'}
            </DialogTitle>
            <DialogDescription>
              {targetRequest?.employeeName} &bull; {targetRequest?.leaveTypeName} ({targetRequest?.totalDays} days) &bull;{' '}
              {targetRequest?.startDate} to {targetRequest?.endDate}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="action-input">
              {activeModal === 'APPROVE'
                ? 'Optional Comments'
                : activeModal === 'REJECT'
                ? 'Reason for Rejection (Required)'
                : 'Clarification Question / Details (Required)'}
            </Label>
            <Textarea
              id="action-input"
              rows={3}
              placeholder={
                activeModal === 'APPROVE'
                  ? 'Add any handover notes or remarks...'
                  : activeModal === 'REJECT'
                  ? 'Specify why this leave cannot be approved...'
                  : 'Specify what additional details or documents are needed...'
              }
              value={modalComment}
              onChange={(e) => setModalComment(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant={activeModal === 'REJECT' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Processing...'
                : activeModal === 'APPROVE'
                ? 'Confirm Approval'
                : activeModal === 'REJECT'
                ? 'Confirm Rejection'
                : 'Send Clarification Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Confirmation Dialog */}
      <Dialog open={activeModal === 'BULK_APPROVE'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Bulk Approve Requests ({selectedIds.length})</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve the following {selectedIds.length} leave requests at once?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2 divide-y text-xs">
            {selectedRequests.map((req) => (
              <div key={req.id} className="py-1.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-foreground">{req.employeeName}</span>{' '}
                  <span className="text-muted-foreground">({req.employeeCode})</span>
                  <p className="text-[11px] text-muted-foreground">
                    {req.startDate} to {req.endDate} &bull; {req.totalDays} days
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {req.leaveTypeName}
                </Badge>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="bulk-comment">Optional Comments for all requests</Label>
            <Input
              id="bulk-comment"
              placeholder="e.g., Bulk approved for team sprint planning"
              value={modalComment}
              onChange={(e) => setModalComment(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Approving All...' : `Approve ${selectedIds.length} Requests`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
