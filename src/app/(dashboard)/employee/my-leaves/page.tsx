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
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useElmsStore, LeaveRequestRecord } from '@/lib/store/elms-store'
import { LeaveStatus } from '@/types/app'

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

  // Filtered requests
  const filteredData = React.useMemo(() => {
    return myRequests.filter((r) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING') {
          if (r.status !== 'PENDING_MANAGER_APPROVAL' && r.status !== 'PENDING_HR_APPROVAL') return false
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
  const handleConfirmWithdraw = () => {
    if (!withdrawTargetId) return
    const res = withdrawLeave(withdrawTargetId)
    if (res.success) {
      toast.success('Leave application withdrawn successfully. Reserved balance restored.')
      setWithdrawTargetId(null)
    } else {
      toast.error(res.error || 'Failed to withdraw application')
    }
  }

  // Handle Cancellation
  const handleConfirmCancellation = () => {
    if (!cancelTargetId) return
    if (cancellationReason.trim().length < 3) {
      toast.error('Please enter a cancellation reason (minimum 3 characters)')
      return
    }
    const res = cancelApprovedLeave(cancelTargetId, cancellationReason.trim())
    if (res.success) {
      toast.success('Approved leave cancelled. Balance has been refunded to your account.')
      setCancelTargetId(null)
      setCancellationReason('')
    } else {
      toast.error(res.error || 'Failed to cancel leave')
    }
  }

  // Handle Clarification Reply
  const handleConfirmClarifyReply = () => {
    if (!clarifyTargetId) return
    if (clarifyReply.trim().length < 3) {
      toast.error('Please enter your reply (minimum 3 characters)')
      return
    }
    const res = employeeReplyClarification(clarifyTargetId, clarifyReply.trim())
    if (res.success) {
      toast.success('Reply submitted. Your request is back in your manager’s approval queue.')
      setClarifyTargetId(null)
      setClarifyReply('')
    } else {
      toast.error(res.error || 'Failed to submit reply')
    }
  }

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Approved</span>
      case 'PENDING_MANAGER_APPROVAL':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Pending Manager</span>
      case 'PENDING_HR_APPROVAL':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Pending HR</span>
      case 'CLARIFICATION_REQUESTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">Clarification Needed</span>
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Rejected</span>
      case 'WITHDRAWN':
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Leave Applications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track status, review timeline history, withdraw pending applications, or respond to clarifications.
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold shadow-xs">
          <Link href="/employee/apply-leave">
            <CalendarPlus className="h-4 w-4" />
            Apply for Leave
          </Link>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'PENDING', label: 'Pending Approvals' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'CLARIFICATION_REQUESTED', label: 'Needs Clarification' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'WITHDRAWN', label: 'Withdrawn / Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Leave Type Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by request #, leave type, or justification..."
              className="pl-9 h-9 border-slate-200 text-xs"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48 h-9 border-slate-200 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
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

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Request #</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Date Range</th>
                <th className="py-3 px-4">Working Days</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium">No leave applications found.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "Apply for Leave" above to submit a new request.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {req.request_number}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {req.leave_type_name}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {req.start_date} → {req.end_date}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums">
                      {req.total_days} d
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-500" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRequest(req)}
                          className="h-8 px-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-xs gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </Button>

                        {/* Clarification Reply Button */}
                        {req.status === 'CLARIFICATION_REQUESTED' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setClarifyTargetId(req.id)
                              setClarifyReply('')
                            }}
                            className="h-8 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Reply
                          </Button>
                        )}

                        {/* Withdraw Button */}
                        {(req.status === 'PENDING_MANAGER_APPROVAL' || req.status === 'PENDING_HR_APPROVAL' || req.status === 'CLARIFICATION_REQUESTED') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setWithdrawTargetId(req.id)}
                            className="h-8 px-2 text-rose-600 hover:bg-rose-50 border-rose-200 text-xs gap-1"
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                            Withdraw
                          </Button>
                        )}

                        {/* Cancel Approved Leave */}
                        {req.status === 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCancelTargetId(req.id)
                              setCancellationReason('')
                            }}
                            className="h-8 px-2 text-slate-600 hover:bg-slate-100 text-xs gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Drawer / Modal */}
      {selectedRequest && (
        <Dialog open={Boolean(selectedRequest)} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-lg bg-white border-slate-200">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-slate-900 font-mono">
                  {selectedRequest.request_number}
                </DialogTitle>
                {getStatusBadge(selectedRequest.status)}
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Application details & complete approval timeline
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-slate-400 font-medium">Leave Category</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.leave_type_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Working Days</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.total_days} working days</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Schedule</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.start_date} → {selectedRequest.end_date}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Day Type</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.day_type.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Justification / Reason</p>
                <p className="mt-1 p-2.5 bg-slate-50 rounded border border-slate-100 text-slate-700 leading-relaxed">
                  {selectedRequest.reason}
                </p>
              </div>

              {selectedRequest.handover_notes && (
                <div>
                  <p className="text-slate-400 font-medium">Handover Notes</p>
                  <p className="mt-1 p-2 bg-slate-50 rounded border border-slate-100 text-slate-700">
                    {selectedRequest.handover_notes}
                  </p>
                </div>
              )}

              {/* Approval Timeline */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="font-semibold text-slate-800">Approval Workflow Timeline</p>
                <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                  {/* Step 1 */}
                  <div className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-[10px] font-bold">
                      ✓
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Submitted by Employee</p>
                      <p className="text-[11px] text-slate-400">{selectedRequest.created_at}</p>
                    </div>
                  </div>

                  {/* Step 2: Manager */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        selectedRequest.status === 'APPROVED' || selectedRequest.status === 'PENDING_HR_APPROVAL'
                          ? 'bg-emerald-500 text-white'
                          : selectedRequest.status === 'REJECTED'
                          ? 'bg-rose-500 text-white'
                          : selectedRequest.status === 'CLARIFICATION_REQUESTED'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {selectedRequest.status === 'APPROVED' || selectedRequest.status === 'PENDING_HR_APPROVAL' ? '✓' : '2'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        Manager Review: {selectedRequest.manager_name || 'Vikram Singh'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {selectedRequest.status === 'PENDING_MANAGER_APPROVAL'
                          ? 'Pending manager review'
                          : selectedRequest.status === 'CLARIFICATION_REQUESTED'
                          ? `Clarification asked: "${selectedRequest.clarification_question}"`
                          : selectedRequest.status === 'REJECTED'
                          ? `Rejected: "${selectedRequest.rejection_reason}"`
                          : 'Manager Approved'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: HR */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        selectedRequest.status === 'APPROVED'
                          ? 'bg-emerald-500 text-white'
                          : selectedRequest.status === 'PENDING_HR_APPROVAL'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {selectedRequest.status === 'APPROVED' ? '✓' : '3'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">HR Department Review</p>
                      <p className="text-[11px] text-slate-500">
                        {selectedRequest.status === 'APPROVED'
                          ? 'Final HR Approval Granted (Balance permanently deducted)'
                          : selectedRequest.status === 'PENDING_HR_APPROVAL'
                          ? 'Pending final HR sign-off'
                          : 'Awaiting prior approval steps'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Withdraw Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(withdrawTargetId)}
        onOpenChange={(open) => !open && setWithdrawTargetId(null)}
        title="Withdraw Leave Application"
        description="Are you sure you want to withdraw this application? The pending balance reservation will be immediately refunded back to your available balance."
        confirmLabel="Withdraw Application"
        variant="destructive"
        onConfirm={handleConfirmWithdraw}
      />

      {/* Cancellation Dialog */}
      <Dialog open={Boolean(cancelTargetId)} onOpenChange={() => setCancelTargetId(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Request Leave Cancellation</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Please enter the reason for cancelling this previously approved leave.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="cancelReason" className="text-xs font-semibold text-slate-700">
              Reason for Cancellation <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="cancelReason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="e.g. Travel plans postponed, attending project emergency..."
              rows={3}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCancelTargetId(null)}>
              Dismiss
            </Button>
            <Button size="sm" onClick={handleConfirmCancellation} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clarification Reply Dialog */}
      <Dialog open={Boolean(clarifyTargetId)} onOpenChange={() => setClarifyTargetId(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Reply to Clarification</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Your manager asked for clarification on your application. Provide your response below to resubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="clarifyReply" className="text-xs font-semibold text-slate-700">
              Your Clarification / Response <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="clarifyReply"
              value={clarifyReply}
              onChange={(e) => setClarifyReply(e.target.value)}
              placeholder="Provide the details requested by your manager..."
              rows={3}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setClarifyTargetId(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmClarifyReply} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              Submit Reply & Resubmit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
