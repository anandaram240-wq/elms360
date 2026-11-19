'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Shield,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  AlertTriangle,
  Paperclip,
  Check,
  X,
  Lock,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import { ApprovalTimeline } from '@/components/shared/approval-timeline'
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
  hrApproveRequest,
  hrRejectRequest,
  hrRequestClarification,
  adminOverrideRequest,
} from '@/app/actions/hr/hr-actions'

export default function HRLeaveRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string

  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [statusMsg, setStatusMsg] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Form actions
  const [comments, setComments] = React.useState('')
  const [clarificationMsg, setClarificationMsg] = React.useState('')
  const [overrideModalOpen, setOverrideModalOpen] = React.useState(false)
  const [overrideStatus, setOverrideStatus] = React.useState('APPROVED')
  const [overrideReason, setOverrideReason] = React.useState('')

  // Mock / loaded request
  const [request, setRequest] = React.useState<any>({
    id: requestId,
    requestNumber: 'LR-2026-001001',
    status: 'PENDING_HR_APPROVAL',
    employee: {
      id: 'emp-1',
      name: 'Sarah Connor',
      code: 'EMP-1001',
      designation: 'Engineering Lead',
      department: 'Engineering',
      manager: 'Alex Wright',
      joiningDate: '2022-03-15',
    },
    leaveType: {
      id: 'lt-1',
      name: 'Privilege Leave',
      code: 'PL',
      color: '#3B82F6',
      isPaid: true,
    },
    startDate: '2026-11-25',
    endDate: '2026-11-28',
    totalDays: 4,
    dayType: 'FULL_DAY',
    reason: 'Annual family vacation trip to native place.',
    handoverNotes: 'Production deployments handed over to John Doe. Monitoring alerts delegated.',
    appliedAt: '2026-11-18 10:30 AM',
    balanceSnapshot: {
      opening: 15,
      accrued: 18,
      used: 6,
      pending: 4,
      availableAfterThis: 19,
    },
    policyCheck: {
      isNoticeCompliant: true,
      noticeDaysGiven: 7,
      minNoticeRequired: 7,
      isConsecutiveCompliant: true,
      maxConsecutiveAllowed: 14,
      isBalanceSufficient: true,
      isSandwichApplicable: false,
      warnings: [],
    },
    attachments: [
      { id: 'att-1', name: 'Travel_Itinerary_Confirmation.pdf', size: '245 KB', url: '#' },
    ],
    timeline: [
      {
        id: 'act-1',
        actorName: 'Sarah Connor',
        action: 'SUBMITTED',
        date: '18 Nov 2026, 10:30 AM',
        comments: 'Application submitted for 4 days.',
        status: 'approved',
      },
      {
        id: 'act-2',
        actorName: 'Alex Wright (Manager)',
        action: 'APPROVED',
        date: '18 Nov 2026, 02:15 PM',
        comments: 'Team coverage verified with John Doe. Recommended for HR approval.',
        status: 'approved',
      },
      {
        id: 'act-3',
        actorName: 'Human Resources',
        action: 'PENDING_HR_APPROVAL',
        date: 'Current Stage',
        comments: 'Pending HR Administrator sign-off.',
        status: 'pending',
      },
    ],
  })

  // Action handlers
  const handleApprove = async () => {
    setIsSubmitting(true)
    setStatusMsg(null)
    try {
      const res = await hrApproveRequest({ requestId, comments })
      if (res.success) {
        setRequest((prev: any) => ({ ...prev, status: 'APPROVED' }))
        setStatusMsg({ text: 'Leave request approved successfully.', type: 'success' })
      } else {
        setStatusMsg({ text: res.error || 'Failed to approve', type: 'error' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!comments.trim()) {
      setStatusMsg({ text: 'Please provide a reason for rejection.', type: 'error' })
      return
    }
    setIsSubmitting(true)
    setStatusMsg(null)
    try {
      const res = await hrRejectRequest({ requestId, reason: comments })
      if (res.success) {
        setRequest((prev: any) => ({ ...prev, status: 'REJECTED' }))
        setStatusMsg({ text: 'Leave request rejected.', type: 'success' })
      } else {
        setStatusMsg({ text: res.error || 'Failed to reject', type: 'error' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClarification = async () => {
    if (!clarificationMsg.trim()) return
    setIsSubmitting(true)
    setStatusMsg(null)
    try {
      const res = await hrRequestClarification({ requestId, message: clarificationMsg })
      if (res.success) {
        setRequest((prev: any) => ({ ...prev, status: 'CLARIFICATION_REQUESTED' }))
        setStatusMsg({ text: 'Clarification request sent to employee.', type: 'success' })
      } else {
        setStatusMsg({ text: res.error || 'Failed to request clarification', type: 'error' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOverride = async () => {
    if (!overrideReason.trim()) return
    setIsSubmitting(true)
    try {
      const res = await adminOverrideRequest({
        requestId,
        newStatus: overrideStatus,
        reason: overrideReason,
      })
      if (res.success) {
        setRequest((prev: any) => ({ ...prev, status: overrideStatus }))
        setOverrideModalOpen(false)
        setStatusMsg({ text: `Admin override applied: Status changed to ${overrideStatus}.`, type: 'success' })
      } else {
        alert(res.error || 'Admin override failed')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/hr/leave-requests" className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Requests
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setOverrideModalOpen(true)}>
            <Lock className="h-4 w-4 mr-1.5 text-amber-600" /> Admin Override
          </Button>
        </div>
      </div>

      <PageHeader
        title={`Leave Request ${request.requestNumber}`}
        description="Comprehensive employee dossier, policy compliance evaluation, document attachments, and approval authorization."
      >
        <LeaveStatusBadge status={request.status} />
      </PageHeader>

      {statusMsg && (
        <div
          className={`p-4 rounded-md text-sm font-medium ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Details & Checks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Particulars */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Leave Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/40 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Leave Type</p>
                  <p className="font-semibold text-sm flex items-center gap-1.5 mt-0.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: request.leaveType.color }}
                    />
                    {request.leaveType.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-semibold text-sm mt-0.5">
                    {request.totalDays} {request.totalDays === 1 ? 'Day' : 'Days'} ({request.dayType})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-semibold text-sm mt-0.5">{request.startDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-semibold text-sm mt-0.5">{request.endDate}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Employee Reason
                </p>
                <p className="text-sm mt-1 p-3 bg-card border rounded-md">{request.reason}</p>
              </div>

              {request.handoverNotes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Work Handover & Coverage Plan
                  </p>
                  <p className="text-sm mt-1 p-3 bg-card border rounded-md">{request.handoverNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Policy Compliance Check Panel */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3 bg-primary/5">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> Policy Compliance Verification
              </CardTitle>
              <CardDescription>Automated check against organizational leave policies</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Notice Period Compliance
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {request.policyCheck.noticeDaysGiven} days notice (Min: {request.policyCheck.minNoticeRequired} days)
                </span>
              </div>

              <div className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Max Consecutive Duration
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {request.totalDays} of max {request.policyCheck.maxConsecutiveAllowed} days
                </span>
              </div>

              <div className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  Available Balance Check
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Remaining balance after approval: {request.balanceSnapshot.availableAfterThis} days
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Sensitive Documents & Attachments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-primary" /> Attachments & Documents
              </CardTitle>
              <CardDescription>Confidential medical certificates or supporting paperwork</CardDescription>
            </CardHeader>
            <CardContent>
              {request.attachments.length > 0 ? (
                <div className="space-y-2">
                  {request.attachments.map((att: any) => (
                    <div
                      key={att.id}
                      className="p-3 border rounded-lg flex items-center justify-between hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{att.name}</p>
                          <p className="text-xs text-muted-foreground">{att.size}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={att.url} download>
                          Download Document
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  No documents required or attached for this leave request.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Employee Info & HR Action Panel */}
        <div className="space-y-6">
          {/* Employee Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Employee Dossier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-foreground">{request.employee.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{request.employee.code}</p>
              </div>
              <div className="border-t pt-2 space-y-1.5 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Designation:</strong> {request.employee.designation}
                </p>
                <p>
                  <strong className="text-foreground">Department:</strong> {request.employee.department}
                </p>
                <p>
                  <strong className="text-foreground">Reporting Manager:</strong> {request.employee.manager}
                </p>
                <p>
                  <strong className="text-foreground">Tenure:</strong> Since {request.employee.joiningDate}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* HR Decision Action Panel */}
          {request.status === 'PENDING_HR_APPROVAL' ? (
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-primary">HR Final Decision</CardTitle>
                <CardDescription>Authorize, deny, or request clarification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Decision Comments</Label>
                  <Textarea
                    placeholder="Enter approval endorsement or rejection explanation..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1.5" /> Approve Leave
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-1.5" /> Reject Leave
                  </Button>
                </div>

                <div className="pt-2 border-t space-y-2">
                  <Label className="text-xs">Request Employee Clarification</Label>
                  <Input
                    placeholder="Ask employee for more details..."
                    value={clarificationMsg}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClarificationMsg(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleClarification}
                    disabled={isSubmitting || !clarificationMsg.trim()}
                  >
                    <HelpCircle className="h-3.5 w-3.5 mr-1.5" /> Send Clarification Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  This request is in <strong className="text-foreground">{request.status}</strong> state.
                </p>
                <p className="text-xs text-muted-foreground">
                  Use the Admin Override tool above if emergency administrative intervention is necessary.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Workflow & Approval Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Approval Progression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalTimeline steps={request.timeline} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Override Modal */}
      <Dialog open={overrideModalOpen} onOpenChange={setOverrideModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Administrative Status Override</DialogTitle>
            <DialogDescription>
              Emergency intervention to manually set request status. This action is permanently audited.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Target Status</Label>
              <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">APPROVED (Force Approve)</SelectItem>
                  <SelectItem value="REJECTED">REJECTED (Force Reject)</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED (Cancel Request)</SelectItem>
                  <SelectItem value="PENDING_HR_APPROVAL">RESET TO PENDING_HR_APPROVAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mandatory Audit Reason *</Label>
              <Textarea
                placeholder="Explain the justification for this administrative override..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleOverride}
              disabled={isSubmitting || !overrideReason.trim()}
            >
              Apply Admin Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
