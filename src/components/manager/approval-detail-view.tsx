'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared/page-header'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import { ApprovalTimeline } from '@/components/shared/approval-timeline'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  approveRequest,
  rejectRequest,
  requestClarification,
} from '@/app/actions/manager/approval-actions'
import {
  Check,
  X,
  HelpCircle,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  Paperclip,
  Clock,
  ArrowLeft,
  AlertTriangle,
  History,
  ShieldAlert,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'

export interface ApprovalDetailViewProps {
  data: {
    request: any
    balances: any[]
    approvalHistory: any[]
    previousLeaves: any[]
    teamOverlaps: any[]
  }
}

export function ApprovalDetailView({ data }: ApprovalDetailViewProps) {
  const router = useRouter()
  const { request, balances, approvalHistory, previousLeaves, teamOverlaps } = data
  const emp = request.employee
  const lt = request.leaveType

  const [activeModal, setActiveModal] = React.useState<'APPROVE' | 'REJECT' | 'CLARIFY' | null>(null)
  const [comment, setComment] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showFullHistory, setShowFullHistory] = React.useState(false)

  const isPending =
    request.status === 'PENDING_MANAGER_APPROVAL' ||
    request.status === 'PENDING_HR_APPROVAL' ||
    request.status === 'PENDING_ADDITIONAL_APPROVAL' ||
    request.status === 'CLARIFICATION_REQUESTED'

  const handleAction = async () => {
    if (!activeModal) return
    setIsSubmitting(true)
    const idempotencyKey = `detail_${activeModal}_${request.id}_${Date.now()}`

    try {
      if (activeModal === 'APPROVE') {
        const res = await approveRequest({
          requestId: request.id,
          comments: comment.trim() || undefined,
          idempotencyKey,
        })
        if (res.success) {
          toast.success('Leave request approved successfully!')
          setActiveModal(null)
          router.refresh()
        } else {
          toast.error(res.error || 'Failed to approve request')
        }
      } else if (activeModal === 'REJECT') {
        if (!comment.trim()) {
          toast.error('Please enter a rejection reason')
          setIsSubmitting(false)
          return
        }
        const res = await rejectRequest({
          requestId: request.id,
          reason: comment.trim(),
          idempotencyKey,
        })
        if (res.success) {
          toast.success('Leave request rejected')
          setActiveModal(null)
          router.refresh()
        } else {
          toast.error(res.error || 'Failed to reject request')
        }
      } else if (activeModal === 'CLARIFY') {
        if (!comment.trim()) {
          toast.error('Please enter your clarification message')
          setIsSubmitting(false)
          return
        }
        const res = await requestClarification({
          requestId: request.id,
          message: comment.trim(),
          idempotencyKey,
        })
        if (res.success) {
          toast.success('Clarification requested from employee')
          setActiveModal(null)
          router.refresh()
        } else {
          toast.error(res.error || 'Failed to request clarification')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing action'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Find balance for requested leave type
  const targetBalance = balances.find((b) => b.leave_type_id === request.leave_type_id)
  const availableBal = targetBalance
    ? Math.max(0, Number(targetBalance.closing_balance) - Number(targetBalance.pending))
    : 0

  return (
    <div className="space-y-6">
      {/* Top Bar with back link */}
      <div>
        <Link
          href="/manager/approvals"
          className="inline-flex items-center text-xs font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Approval Queue
        </Link>
        <PageHeader
          title={`Leave Request #${request.request_number}`}
          description={`Submitted on ${
            request.applied_at
              ? new Date(request.applied_at).toLocaleDateString()
              : new Date(request.created_at).toLocaleDateString()
          }`}
        >
          <div className="flex items-center gap-2">
            <LeaveStatusBadge status={request.status} />
            {isPending && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                  onClick={() => {
                    setActiveModal('APPROVE')
                    setComment('')
                  }}
                >
                  <Check className="h-4 w-4" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => {
                    setActiveModal('REJECT')
                    setComment('')
                  }}
                >
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-sky-300 text-sky-700 hover:bg-sky-50"
                  onClick={() => {
                    setActiveModal('CLARIFY')
                    setComment('')
                  }}
                >
                  <HelpCircle className="h-4 w-4" /> Request Clarification
                </Button>
              </>
            )}
          </div>
        </PageHeader>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Request Details & Balances */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details Panel */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Leave Request Details
                </CardTitle>
                <Badge
                  style={{
                    backgroundColor: `${lt?.color || '#3b82f6'}20`,
                    color: lt?.color || '#3b82f6',
                    borderColor: `${lt?.color || '#3b82f6'}40`,
                  }}
                  className="border font-semibold text-xs"
                >
                  {lt?.name || 'Leave'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 rounded-lg bg-muted/40 border">
                <div>
                  <span className="text-xs text-muted-foreground block">Start Date</span>
                  <span className="text-sm font-semibold text-foreground">{request.start_date}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">End Date</span>
                  <span className="text-sm font-semibold text-foreground">{request.end_date}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Duration</span>
                  <span className="text-sm font-bold text-foreground">
                    {request.total_days} {request.total_days === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Day Type</span>
                  <span className="text-sm font-medium text-foreground capitalize">
                    {request.day_type.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Reason for Leave</Label>
                <p className="mt-1 text-sm text-foreground bg-card p-3 rounded-md border">
                  {request.reason}
                </p>
              </div>

              {request.handover_notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Handover Notes / Coverage Plan</Label>
                  <p className="mt-1 text-sm text-foreground bg-card p-3 rounded-md border">
                    {request.handover_notes}
                  </p>
                </div>
              )}

              {request.clarification_message && (
                <div className="p-3 rounded-lg border border-sky-200 bg-sky-50 dark:bg-sky-950/20 text-xs">
                  <span className="font-semibold text-sky-800 dark:text-sky-300 flex items-center gap-1.5 mb-1">
                    <HelpCircle className="h-4 w-4" /> Clarification Note:
                  </span>
                  <p className="text-sky-900 dark:text-sky-200">{request.clarification_message}</p>
                </div>
              )}

              {request.rejection_reason && (
                <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/20 text-xs">
                  <span className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5 mb-1">
                    <X className="h-4 w-4" /> Rejection Reason:
                  </span>
                  <p className="text-rose-900 dark:text-rose-200">{request.rejection_reason}</p>
                </div>
              )}

              {/* Attachments */}
              {request.attachments && request.attachments.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Attachments ({request.attachments.length})</Label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {request.attachments.map((att: any) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 p-2 rounded-md border bg-card text-xs"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{att.file_name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ({Math.round(att.file_size / 1024)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leave Balances Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Employee Leave Balance
              </CardTitle>
              <CardDescription>Current balance status for the employee in fiscal year {new Date().getFullYear()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200">
                  <span className="text-xs text-muted-foreground block">Available Balance</span>
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {availableBal}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">days</span>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-xs text-muted-foreground block">This Request</span>
                  <span className="text-2xl font-bold text-foreground">{request.total_days}</span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">days requested</span>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-xs text-muted-foreground block">Balance After</span>
                  <span
                    className={`text-2xl font-bold ${
                      availableBal - Number(request.total_days) < 0 ? 'text-rose-600' : 'text-foreground'
                    }`}
                  >
                    {availableBal - Number(request.total_days)}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">days remaining</span>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-xs text-muted-foreground block">Already Used</span>
                  <span className="text-2xl font-bold text-muted-foreground">
                    {targetBalance?.used || 0}
                  </span>
                  <span className="text-[11px] text-muted-foreground block mt-0.5">days this year</span>
                </div>
              </div>

              {availableBal < Number(request.total_days) && (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Warning: The requested duration ({request.total_days} days) exceeds available balance ({availableBal} days).
                    Approval may result in a negative leave balance.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Availability During Requested Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-purple-600" />
                Team Availability During Requested Dates
              </CardTitle>
              <CardDescription>
                Checking team absences overlapping {request.start_date} to {request.end_date}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamOverlaps.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 p-3 rounded-lg">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>No other team members are scheduled to be on leave during these dates.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                    {teamOverlaps.length} other team member(s) on leave during this timeframe:
                  </p>
                  <div className="divide-y rounded-md border text-xs">
                    {teamOverlaps.map((o) => (
                      <div key={o.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-foreground">{o.employeeName}</span>
                          {o.designation && (
                            <span className="text-muted-foreground"> ({o.designation})</span>
                          )}
                          <p className="text-[11px] text-muted-foreground">
                            {o.startDate} to {o.endDate}
                          </p>
                        </div>
                        <Badge
                          style={{
                            backgroundColor: `${o.color}15`,
                            color: o.color,
                            borderColor: `${o.color}35`,
                          }}
                          className="text-[10px] border"
                        >
                          {o.leaveTypeName}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous Leave History of Employee */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Employee Leave History (Recent 5)
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowFullHistory(!showFullHistory)}
                >
                  {showFullHistory ? 'Collapse' : 'Expand Details'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {previousLeaves.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No previous leave requests found for this employee.</p>
              ) : (
                <div className="divide-y rounded-md border text-xs">
                  {previousLeaves.map((pl) => (
                    <div key={pl.id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">#{pl.request_number}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {pl.leave_types?.name || 'Leave'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {pl.start_date} to {pl.end_date} &bull; {pl.total_days} days
                        </p>
                        {showFullHistory && pl.reason && (
                          <p className="text-[11px] text-muted-foreground italic mt-1">&ldquo;{pl.reason}&rdquo;</p>
                        )}
                      </div>
                      <LeaveStatusBadge status={pl.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Employee Info, Policy Rules, Approval Timeline */}
        <div className="space-y-6">
          {/* Employee Info Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Employee Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarFallback className="font-bold text-sm bg-primary/10 text-primary">
                    {emp?.full_name
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'EMP'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-sm text-foreground">{emp?.full_name}</p>
                  <p className="text-muted-foreground">{emp?.designation || 'Staff'}</p>
                  <p className="text-[11px] text-muted-foreground">Code: {emp?.employee_code}</p>
                </div>
              </div>

              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" /> Department
                  </span>
                  <span className="font-medium text-foreground">{emp?.departments?.name || 'General'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </span>
                  <span className="font-medium text-foreground">{emp?.work_email}</span>
                </div>
                {emp?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Phone
                    </span>
                    <span className="font-medium text-foreground">{emp.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Date of Joining
                  </span>
                  <span className="font-medium text-foreground">{emp?.date_of_joining}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Policy Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Policy Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Requires Document:</span>
                <span className="font-medium text-foreground">
                  {lt?.requires_document ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Half-Day Allowed:</span>
                <span className="font-medium text-foreground">
                  {lt?.allow_half_day ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Max Consecutive Days:</span>
                <span className="font-medium text-foreground">
                  {lt?.max_consecutive_days ? `${lt.max_consecutive_days} days` : 'Unlimited'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Approval History Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Approval Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvalHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No approval actions recorded yet.</p>
              ) : (
                <ApprovalTimeline
                  steps={approvalHistory.map((step) => ({
                    id: step.id,
                    actorName: step.actorName,
                    actorRole: step.actorDesignation,
                    action: step.action,
                    comments: step.comments,
                    timestamp: step.actedAt,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={Boolean(activeModal)} onOpenChange={(open) => !open && setActiveModal(null)}>
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
              {emp?.full_name} &bull; {lt?.name} ({request.total_days} days) &bull; {request.start_date} to {request.end_date}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="action-reason">
              {activeModal === 'APPROVE'
                ? 'Optional Comments'
                : activeModal === 'REJECT'
                ? 'Rejection Reason (Required)'
                : 'Clarification Message (Required)'}
            </Label>
            <Textarea
              id="action-reason"
              rows={3}
              placeholder={
                activeModal === 'APPROVE'
                  ? 'Add any comments or handover reminders...'
                  : activeModal === 'REJECT'
                  ? 'Explain why this request is being rejected...'
                  : 'Ask employee for additional information or documents...'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant={activeModal === 'REJECT' ? 'destructive' : 'default'}
              className={activeModal === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : undefined}
              onClick={handleAction}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Processing...'
                : activeModal === 'APPROVE'
                ? 'Confirm Approval'
                : activeModal === 'REJECT'
                ? 'Confirm Rejection'
                : 'Send Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
