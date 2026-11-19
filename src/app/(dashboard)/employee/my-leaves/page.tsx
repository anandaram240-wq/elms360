'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CalendarPlus,
  Search,
  RotateCcw,
  Eye,
  Undo2,
  XCircle,
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  UserCheck,
  Building,
  ArrowRight,
  Send,
  Calendar,
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
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import { useElmsStore, LeaveRequestRecord } from '@/lib/store/elms-store'

export default function MyLeavesPage() {
  const router = useRouter()
  const { state, currentUser, withdrawLeave, employeeReplyClarification, cancelApprovedLeave } = useElmsStore()

  // Current employee's requests
  const employeeId = currentUser?.id || currentUser?.employeeId || ''
  const myRequests = state.leaveRequests.filter((r) => r.employee_id === employeeId)

  // Filters state
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')
  const [typeFilter, setTypeFilter] = React.useState<string>('ALL')
  const [search, setSearch] = React.useState<string>('')

  // Action modals state
  const [withdrawTargetId, setWithdrawTargetId] = React.useState<string | null>(null)
  const [cancelTargetId, setCancelTargetId] = React.useState<string | null>(null)
  const [cancellationReason, setCancellationReason] = React.useState('')
  const [clarifyTargetId, setClarifyTargetId] = React.useState<string | null>(null)
  const [clarifyReply, setClarifyReply] = React.useState('')
  const [selectedRequest, setSelectedRequest] = React.useState<LeaveRequestRecord | null>(null)

  // Request counts
  const totalCount = myRequests.length
  const pendingCount = myRequests.filter((r) => r.status.startsWith('PENDING')).length
  const approvedCount = myRequests.filter((r) => r.status === 'APPROVED').length
  const rejectedCount = myRequests.filter((r) => r.status === 'REJECTED').length

  // Filtered requests
  const filteredData = React.useMemo(() => {
    return myRequests.filter((r) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING') {
          if (!r.status.startsWith('PENDING')) return false
        } else if (statusFilter === 'WITHDRAWN_CANCELLED') {
          if (r.status !== 'WITHDRAWN' && !r.status.startsWith('CANCELLED')) return false
        } else if (r.status !== statusFilter) {
          return false
        }
      }
      if (typeFilter !== 'ALL' && r.leave_type_id !== typeFilter) {
        return false
      }
      if (search.trim()) {
        const q = search.toLowerCase()
        const match =
          r.request_number.toLowerCase().includes(q) ||
          r.leave_type_name.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [myRequests, statusFilter, typeFilter, search])

  // Handle Withdraw
  const handleConfirmWithdraw = async () => {
    if (!withdrawTargetId) return
    const res = await withdrawLeave(withdrawTargetId)
    if (res.success) {
      toast.success('Leave application withdrawn. Reserved balance restored.')
      setWithdrawTargetId(null)
    } else {
      toast.error(res.error || 'Failed to withdraw application')
    }
  }

  // Handle Cancellation
  const handleConfirmCancellation = async () => {
    if (!cancelTargetId) return
    if (cancellationReason.trim().length < 3) {
      toast.error('Please enter a cancellation reason (minimum 3 characters)')
      return
    }
    const res = await cancelApprovedLeave(cancelTargetId, cancellationReason.trim())
    if (res.success) {
      toast.success('Approved leave cancelled. Balance has been refunded.')
      setCancelTargetId(null)
      setCancellationReason('')
    } else {
      toast.error(res.error || 'Failed to cancel leave')
    }
  }

  // Handle Clarification Reply
  const handleConfirmClarifyReply = async () => {
    if (!clarifyTargetId) return
    if (clarifyReply.trim().length < 3) {
      toast.error('Please enter your reply (minimum 3 characters)')
      return
    }
    const res = await employeeReplyClarification(clarifyTargetId, clarifyReply.trim())
    if (res.success) {
      toast.success('Reply submitted. Your request is back in review queue.')
      setClarifyTargetId(null)
      setClarifyReply('')
    } else {
      toast.error(res.error || 'Failed to submit reply')
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">My Leave Applications</h1>
          <p className="text-sm text-[#475569] mt-1">
            Track status, review timeline history, withdraw pending applications, or respond to clarifications.
          </p>
        </div>
        <Button asChild className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white gap-2 font-semibold shadow-subtle">
          <Link href="/employee/apply-leave">
            <CalendarPlus className="h-4 w-4" />
            Apply for Leave
          </Link>
        </Button>
      </div>

      {/* Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-subtle">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Total Requests</p>
          <p className="text-xl font-bold text-[#111827] mt-1 tabular-nums">{totalCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-subtle">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#92400E]">Pending Approvals</p>
          <p className="text-xl font-bold text-[#92400E] mt-1 tabular-nums">{pendingCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-subtle">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#166534]">Approved</p>
          <p className="text-xl font-bold text-[#166534] mt-1 tabular-nums">{approvedCount}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-subtle">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#991B1B]">Rejected</p>
          <p className="text-xl font-bold text-[#991B1B] mt-1 tabular-nums">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-subtle space-y-3.5">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-[#F1F3F5] pb-3">
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'PENDING', label: `Pending (${pendingCount})` },
            { id: 'APPROVED', label: `Approved (${approvedCount})` },
            { id: 'CLARIFICATION_REQUESTED', label: 'Needs Clarification' },
            { id: 'REJECTED', label: `Rejected (${rejectedCount})` },
            { id: 'WITHDRAWN_CANCELLED', label: 'Withdrawn / Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#475569] hover:bg-[#F1F3F5] hover:text-[#111827]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Leave Type Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by request #, leave type, or justification..."
              className="pl-9 h-9 border-[#E5E7EB] text-xs bg-white text-[#111827]"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48 h-9 border-[#E5E7EB] text-xs bg-white text-[#111827]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#E5E7EB] text-[#111827]">
              <SelectItem value="ALL">All Categories</SelectItem>
              {state.leaveTypes.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Applications Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-[#E5E7EB] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#475569] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Request #</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date Range</th>
                <th className="py-3 px-4">Working Days</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#334155]">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#94A3B8]">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-[#CBD5E1]" />
                    <p className="font-medium">No leave applications found matching your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-[#2563EB]">
                      <button
                        onClick={() => setSelectedRequest(r)}
                        className="hover:underline cursor-pointer"
                      >
                        {r.request_number}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#111827]">{r.leave_type_name}</td>
                    <td className="py-3 px-4 text-[#475569] whitespace-nowrap">{r.start_date} → {r.end_date}</td>
                    <td className="py-3 px-4 font-bold text-[#111827] tabular-nums">{r.total_days} d</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <LeaveStatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-[#64748B]" title={r.reason}>
                      {r.reason || '—'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRequest(r)}
                        className="h-7 px-2 text-xs text-[#2563EB] hover:bg-[#EFF6FF]"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>

                      {r.status.startsWith('PENDING') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setWithdrawTargetId(r.id)}
                          className="h-7 px-2 text-xs text-[#991B1B] hover:bg-[#FEE2E2]"
                        >
                          <Undo2 className="h-3.5 w-3.5 mr-1" />
                          Withdraw
                        </Button>
                      )}

                      {r.status === 'CLARIFICATION_REQUESTED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setClarifyTargetId(r.id)}
                          className="h-7 px-2 text-xs text-[#6B21A8] hover:bg-[#F3E8FF]"
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />
                          Reply
                        </Button>
                      )}

                      {r.status === 'APPROVED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCancelTargetId(r.id)}
                          className="h-7 px-2 text-xs text-[#475569] hover:bg-[#F1F3F5]"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Applications Mobile Cards */}
      <div className="block md:hidden space-y-3">
        {filteredData.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#E5E7EB] text-center text-[#94A3B8]">
            <FileText className="h-8 w-8 mx-auto mb-2 text-[#CBD5E1]" />
            <p className="text-xs">No leave applications found.</p>
          </div>
        ) : (
          filteredData.map((r) => (
            <Card key={r.id} className="border-[#E5E7EB] bg-white rounded-xl shadow-subtle p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-[#2563EB]">{r.request_number}</span>
                <LeaveStatusBadge status={r.status} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#111827]">{r.leave_type_name}</span>
                <span className="font-bold text-[#111827]">{r.total_days} day(s)</span>
              </div>
              <div className="text-xs text-[#64748B]">
                <span>{r.start_date} → {r.end_date}</span>
              </div>
              {r.reason && (
                <p className="text-xs text-[#475569] bg-[#F8FAFC] p-2 rounded-lg border border-[#E5E7EB]">
                  {r.reason}
                </p>
              )}
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequest(r)}
                  className="h-8 px-2.5 text-xs text-[#2563EB]"
                >
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  View
                </Button>
                {r.status.startsWith('PENDING') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawTargetId(r.id)}
                    className="h-8 px-2.5 text-xs text-[#991B1B]"
                  >
                    Withdraw
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Application Details Modal */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-lg bg-white border-[#E5E7EB] text-[#111827] rounded-2xl shadow-modal">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-[#111827]">
                  Leave Request {selectedRequest.request_number}
                </DialogTitle>
                <LeaveStatusBadge status={selectedRequest.status} />
              </div>
              <DialogDescription className="text-xs text-[#64748B]">
                Submitted on {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleDateString() : 'N/A'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs py-2">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                <div>
                  <span className="text-[#64748B] block">Leave Category</span>
                  <span className="font-semibold text-[#111827]">{selectedRequest.leave_type_name}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Duration</span>
                  <span className="font-semibold text-[#111827]">{selectedRequest.total_days} Working Day(s)</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Start Date</span>
                  <span className="font-semibold text-[#111827]">{selectedRequest.start_date}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">End Date</span>
                  <span className="font-semibold text-[#111827]">{selectedRequest.end_date}</span>
                </div>
              </div>

              <div>
                <span className="text-[#64748B] block font-semibold mb-1">Reason for Absence</span>
                <p className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] text-[#334155]">
                  {selectedRequest.reason || 'None provided'}
                </p>
              </div>

              {selectedRequest.handover_notes && (
                <div>
                  <span className="text-[#64748B] block font-semibold mb-1">Handover Notes</span>
                  <p className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] text-[#334155]">
                    {selectedRequest.handover_notes}
                  </p>
                </div>
              )}

              {selectedRequest.emergency_contact && (
                <div>
                  <span className="text-[#64748B] block font-semibold mb-1">Emergency Contact</span>
                  <p className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] text-[#334155]">
                    {selectedRequest.emergency_contact}
                  </p>
                </div>
              )}

              {/* Approval Timeline History */}
              <div>
                <span className="text-[#64748B] block font-semibold mb-2">Workflow Activity Trail</span>
                <div className="space-y-2 border-l-2 border-[#E5E7EB] pl-3 ml-1">
                  {state.approvalActions
                    .filter((a) => a.leave_request_id === selectedRequest.id)
                    .map((action, i) => (
                      <div key={action.id || i} className="text-[11px] relative">
                        <span className="font-semibold text-[#111827]">{action.actor_name}</span>{' '}
                        <span className="text-[#64748B]">recorded action</span>{' '}
                        <span className="font-semibold text-[#2563EB]">{action.action}</span>
                        {action.comments && (
                          <p className="text-[#475569] italic mt-0.5">"{action.comments}"</p>
                        )}
                        <span className="text-[10px] text-[#94A3B8] block mt-0.5">
                          {action.created_at ? new Date(action.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                    ))}
                  {state.approvalActions.filter((a) => a.leave_request_id === selectedRequest.id).length === 0 && (
                    <p className="text-[11px] text-[#94A3B8]">No approval events recorded yet.</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                className="w-full text-xs h-9 border-[#E5E7EB]"
              >
                Close Details
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Withdraw Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!withdrawTargetId}
        onClose={() => setWithdrawTargetId(null)}
        onConfirm={handleConfirmWithdraw}
        title="Withdraw Leave Application?"
        description="Are you sure you want to withdraw this application? Any pending reserved balance will be immediately released back to your available balance."
        confirmText="Withdraw Application"
        variant="destructive"
      />

      {/* Cancel Approved Dialog */}
      {cancelTargetId && (
        <Dialog open={!!cancelTargetId} onOpenChange={() => setCancelTargetId(null)}>
          <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-[#111827] rounded-2xl shadow-modal">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#111827]">
                Cancel Approved Leave
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Specify why this approved leave is being cancelled. Once cancelled, your leave balance will be automatically refunded.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <Label htmlFor="cancelReason" className="font-semibold text-[#111827]">
                Cancellation Justification <span className="text-[#991B1B]">*</span>
              </Label>
              <Textarea
                id="cancelReason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Reason for cancellation..."
                rows={3}
                className="border-[#E5E7EB] text-xs"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelTargetId(null)} className="text-xs h-9 border-[#E5E7EB]">
                Dismiss
              </Button>
              <Button
                onClick={handleConfirmCancellation}
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs h-9"
              >
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reply Clarification Dialog */}
      {clarifyTargetId && (
        <Dialog open={!!clarifyTargetId} onOpenChange={() => setClarifyTargetId(null)}>
          <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-[#111827] rounded-2xl shadow-modal">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#111827]">
                Respond to Manager Clarification
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Provide the requested additional information to return this application to the approval queue.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <Label htmlFor="clarifyReply" className="font-semibold text-[#111827]">
                Your Response <span className="text-[#991B1B]">*</span>
              </Label>
              <Textarea
                id="clarifyReply"
                value={clarifyReply}
                onChange={(e) => setClarifyReply(e.target.value)}
                placeholder="Type your explanation or response..."
                rows={3}
                className="border-[#E5E7EB] text-xs"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClarifyTargetId(null)} className="text-xs h-9 border-[#E5E7EB]">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmClarifyReply}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-9"
              >
                Submit Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
