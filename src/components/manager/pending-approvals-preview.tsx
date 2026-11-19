'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { LeaveRequestWithDetails } from '@/types/app'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import { approveRequest, rejectRequest } from '@/app/actions/manager/approval-actions'
import { Check, X, ArrowRight, Calendar, User, Clock } from 'lucide-react'
import { toast } from 'sonner'

export function PendingApprovalsPreview({
  requests,
}: {
  requests: LeaveRequestWithDetails[]
}) {
  const router = useRouter()
  const [selectedReq, setSelectedReq] = React.useState<LeaveRequestWithDetails | null>(null)
  const [actionType, setActionType] = React.useState<'APPROVE' | 'REJECT' | null>(null)
  const [comment, setComment] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleOpenAction = (req: LeaveRequestWithDetails, type: 'APPROVE' | 'REJECT') => {
    setSelectedReq(req)
    setActionType(type)
    setComment('')
  }

  const handleConfirmAction = async () => {
    if (!selectedReq || !actionType) return

    if (actionType === 'REJECT' && !comment.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    setIsSubmitting(true)
    const idempotencyKey = `quick_${actionType}_${selectedReq.id}_${Date.now()}`

    try {
      if (actionType === 'APPROVE') {
        const res = await approveRequest({
          requestId: selectedReq.id,
          comments: comment.trim() || undefined,
          idempotencyKey,
        })
        if (res.success) {
          toast.success(`Approved leave for ${selectedReq.employeeName}`)
          setSelectedReq(null)
          router.refresh()
        } else {
          toast.error(res.error || 'Failed to approve request')
        }
      } else {
        const res = await rejectRequest({
          requestId: selectedReq.id,
          reason: comment.trim(),
          idempotencyKey,
        })
        if (res.success) {
          toast.success(`Rejected leave for ${selectedReq.employeeName}`)
          setSelectedReq(null)
          router.refresh()
        } else {
          toast.error(res.error || 'Failed to reject request')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Pending Approvals</CardTitle>
              <CardDescription>Leave requests waiting for your review</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/manager/approvals">
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Check className="h-10 w-10 text-emerald-500/60 mb-2" />
            <p className="font-medium text-foreground">You are all caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">No pending leave requests require your approval.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Pending Approvals
                <Badge variant="warning" className="rounded-full px-2 py-0.5 text-xs">
                  {requests.length} Recent
                </Badge>
              </CardTitle>
              <CardDescription>Review and take action on incoming team leave requests</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/manager/approvals">
                View All Approvals <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-lg border bg-card/60 hover:bg-muted/40 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {req.employeeName}
                  </span>
                  <span className="text-xs text-muted-foreground">({req.employeeCode})</span>
                  {req.departmentName && (
                    <Badge variant="outline" className="text-[10px] py-0">
                      {req.departmentName}
                    </Badge>
                  )}
                  <Badge
                    style={{ backgroundColor: `${req.leaveTypeColor}20`, color: req.leaveTypeColor, borderColor: `${req.leaveTypeColor}40` }}
                    className="text-[11px] font-semibold border"
                  >
                    {req.leaveTypeName}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {req.startDate} to {req.endDate}
                  </span>
                  <span>•</span>
                  <span className="font-medium text-foreground">
                    {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'} ({req.dayType.toLowerCase().replace('_', ' ')})
                  </span>
                </div>

                {req.reason && (
                  <p className="text-xs text-muted-foreground line-clamp-1 italic">
                    &ldquo;{req.reason}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-300 h-8 px-2.5"
                  onClick={() => handleOpenAction(req, 'APPROVE')}
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-300 h-8 px-2.5"
                  onClick={() => handleOpenAction(req, 'REJECT')}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Reject
                </Button>
                <Button asChild size="sm" variant="ghost" className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground">
                  <Link href={`/manager/approvals/${req.id}`}>
                    Details
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={Boolean(selectedReq)} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'APPROVE' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </DialogTitle>
            <DialogDescription>
              {selectedReq?.employeeName} &bull; {selectedReq?.leaveTypeName} ({selectedReq?.totalDays} days) &bull;{' '}
              {selectedReq?.startDate} to {selectedReq?.endDate}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="action-comment">
              {actionType === 'APPROVE' ? 'Optional Comments' : 'Rejection Reason (Required)'}
            </Label>
            <Input
              id="action-comment"
              placeholder={
                actionType === 'APPROVE'
                  ? 'Add any handover notes or remarks...'
                  : 'Specify why this leave cannot be approved at this time...'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReq(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'REJECT' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Processing...'
                : actionType === 'APPROVE'
                ? 'Confirm Approval'
                : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
