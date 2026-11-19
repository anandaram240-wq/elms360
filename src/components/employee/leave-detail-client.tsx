'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Paperclip,
  Download,
  AlertCircle,
  Undo2,
  XCircle,
  FileText,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import { ApprovalTimeline, TimelineStep } from '@/components/shared/approval-timeline'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useLeaveRequestDetail } from '@/hooks/queries/use-employee-queries'
import {
  withdrawLeaveRequest,
  requestCancellation,
} from '@/app/actions/employee/leave-actions'

export function LeaveDetailClient({ requestId }: { requestId: string }) {
  const router = useRouter()
  const { data: request, isLoading, error, refetch } = useLeaveRequestDetail(requestId)

  const [withdrawOpen, setWithdrawOpen] = React.useState(false)
  const [withdrawing, setWithdrawing] = React.useState(false)

  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [cancelReason, setCancelReason] = React.useState('')
  const [cancelling, setCancelling] = React.useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading leave application details...</p>
        </div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Request Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested leave application could not be found or you do not have permission to view it.
        </p>
        <Link href="/employee/my-leaves">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to My Leaves
          </Button>
        </Link>
      </div>
    )
  }

  const handleWithdraw = async () => {
    setWithdrawing(true)
    try {
      const res = await withdrawLeaveRequest(requestId)
      if (res.success) {
        toast.success(res.message || 'Leave request withdrawn')
        refetch()
      } else {
        toast.error(res.error || 'Failed to withdraw request')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error withdrawing request')
    } finally {
      setWithdrawing(false)
      setWithdrawOpen(false)
    }
  }

  const handleRequestCancellation = async () => {
    if (cancelReason.trim().length < 10) {
      toast.error('Please enter a cancellation reason (min 10 characters)')
      return
    }

    setCancelling(true)
    try {
      const res = await requestCancellation(requestId, cancelReason)
      if (res.success) {
        toast.success(res.message || 'Cancellation requested')
        refetch()
      } else {
        toast.error(res.error || 'Failed to request cancellation')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error requesting cancellation')
    } finally {
      setCancelling(false)
      setCancelOpen(false)
    }
  }

  const canWithdraw = [
    'PENDING_MANAGER_APPROVAL',
    'PENDING_HR_APPROVAL',
    'CLARIFICATION_REQUESTED',
  ].includes(request.status)

  const canCancel = request.status === 'APPROVED'

  // Map approval actions to TimelineStep format
  const timelineSteps: TimelineStep[] = (request.approvalHistory || []).map((action) => {
    let actType: TimelineStep['action'] = 'PENDING'
    if (action.action === 'APPROVED' || action.action === 'CANCELLATION_APPROVED') {
      actType = 'APPROVED'
    } else if (action.action === 'REJECTED') {
      actType = 'REJECTED'
    } else if (action.action === 'CLARIFICATION_REQUESTED') {
      actType = 'CLARIFICATION_REQUESTED'
    } else if (action.action === 'SUBMITTED') {
      actType = 'APPROVED'
    }

    return {
      id: action.id,
      actorName: action.actorName,
      actorRole: action.actorDesignation || 'Reviewer',
      action: actType,
      comments: action.comments,
      timestamp: action.actedAt,
    }
  })

  // Add current pending step if still awaiting decision
  if (canWithdraw && request.currentApproverName) {
    timelineSteps.push({
      id: 'current-pending',
      actorName: request.currentApproverName,
      actorRole: 'Assigned Approver',
      action: 'PENDING',
      isCurrent: true,
      comments: 'Pending review and decision',
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/employee/my-leaves">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              All Leaves
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground font-mono">
                {request.requestNumber}
              </h1>
              <LeaveStatusBadge status={request.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Applied on {request.appliedAt ? format(parseISO(request.appliedAt), 'PPP p') : '—'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canWithdraw && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWithdrawOpen(true)}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Withdraw Request
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelOpen(true)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-2"
            >
              <XCircle className="h-4 w-4" />
              Request Cancellation
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Info + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Details, Breakdown, Attachments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Primary Overview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: request.leaveTypeColor }}
                  />
                  {request.leaveTypeName}
                </CardTitle>
                <Badge variant="secondary" className="font-mono text-xs">
                  {request.totalDays} {request.totalDays === 1 ? 'Working Day' : 'Working Days'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/30 border text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {format(parseISO(request.startDate), 'EEE, dd MMM yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {format(parseISO(request.endDate), 'EEE, dd MMM yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Schedule</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {request.dayType.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Reason for Application
                </p>
                <div className="p-3.5 rounded-lg border bg-background text-sm text-foreground">
                  {request.reason}
                </div>
              </div>

              {/* Handover notes */}
              {request.handoverNotes && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Work Handover Notes
                  </p>
                  <div className="p-3.5 rounded-lg border bg-background text-sm text-foreground">
                    {request.handoverNotes}
                  </div>
                </div>
              )}

              {/* Rejection / Clarification Notice */}
              {request.rejectionReason && (
                <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 space-y-1">
                  <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" />
                    Rejection Reason
                  </p>
                  <p className="text-xs text-destructive/90">{request.rejectionReason}</p>
                </div>
              )}

              {request.clarificationMessage && (
                <div className="p-4 rounded-xl border border-blue-400 bg-blue-50 dark:bg-blue-950/30 space-y-1">
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    Clarification Requested by Approver
                  </p>
                  <p className="text-xs text-blue-900 dark:text-blue-200">
                    {request.clarificationMessage}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card: Daily Breakdown */}
          {request.days && request.days.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Day-by-Day Breakdown
                </CardTitle>
                <CardDescription>
                  Detailed calendar schedule including weekends and holidays
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border border rounded-lg overflow-hidden">
                  {request.days.map((day: any) => (
                    <div
                      key={day.id}
                      className="flex items-center justify-between p-3 text-sm hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            {format(parseISO(day.leave_date), 'EEEE, MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div>
                        {day.is_weekend ? (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Weekend (0 d)
                          </Badge>
                        ) : day.is_holiday ? (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                            Holiday (0 d)
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs font-semibold">
                            {day.day_value} {Number(day.day_value) === 1 ? 'day' : 'days'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Card: Attached Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-primary" />
                Attached Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {request.attachments && request.attachments.length > 0 ? (
                <div className="space-y-2">
                  {request.attachments.map((att: any) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="truncate">
                          <p className="text-sm font-medium truncate">{att.file_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(att.file_size / 1024).toFixed(1)} KB • Uploaded on{' '}
                            {format(parseISO(att.uploaded_at), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <a
                        href={att.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                          <Download className="h-3.5 w-3.5" />
                          Download
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  No attachments were provided with this leave request.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Approval Timeline Stepper */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Approval Workflow History
              </CardTitle>
              <CardDescription>
                Progress and audit logs for this application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApprovalTimeline steps={timelineSteps} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog: Withdraw */}
      <ConfirmDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        title="Withdraw Leave Request?"
        description="Are you sure you want to withdraw this application? This action cannot be undone."
        confirmLabel="Confirm Withdrawal"
        cancelLabel="Keep Request"
        variant="destructive"
        isLoading={withdrawing}
        onConfirm={handleWithdraw}
      />

      {/* Dialog: Request Cancellation */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Leave Cancellation</DialogTitle>
            <DialogDescription>
              Submit a formal request to cancel this approved leave. HR will review and reinstate your balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="detailCancelReason">
              Cancellation Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="detailCancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide justification for cancellation (at least 10 characters)..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestCancellation}
              disabled={cancelling || cancelReason.trim().length < 10}
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
