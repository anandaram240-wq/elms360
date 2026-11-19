'use client'

import * as React from 'react'
import {
  Check,
  X,
  Search,
  Filter,
  CheckCircle2,
  Building,
  User,
  Clock,
  RotateCcw,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import { useElmsStore, LeaveRequestRecord } from '@/lib/store/elms-store'

export default function HrApprovalsPage() {
  const { state, hrFinalApprove, hrReject, cancelApprovedLeave } = useElmsStore()

  const [activeTab, setActiveTab] = React.useState<'PENDING_HR' | 'ALL_REQUESTS'>('PENDING_HR')
  const [search, setSearch] = React.useState('')
  const [departmentFilter, setDepartmentFilter] = React.useState('ALL')
  const [statusFilter, setStatusFilter] = React.useState('ALL')

  // Modals state
  const [selectedRequest, setSelectedRequest] = React.useState<LeaveRequestRecord | null>(null)
  const [approveTargetId, setApproveTargetId] = React.useState<string | null>(null)
  const [approveComment, setApproveComment] = React.useState('')
  const [rejectTargetId, setRejectTargetId] = React.useState<string | null>(null)
  const [rejectReason, setRejectReason] = React.useState('')
  const [cancelTargetId, setCancelTargetId] = React.useState<string | null>(null)
  const [cancelReason, setCancelReason] = React.useState('')

  // Queues
  const pendingHrRequests = state.leaveRequests.filter(
    (r) => r.status === 'PENDING_HR_APPROVAL'
  )

  const allRequests = state.leaveRequests

  const displayList = activeTab === 'PENDING_HR' ? pendingHrRequests : allRequests

  const filteredData = React.useMemo(() => {
    return displayList.filter((r) => {
      if (departmentFilter !== 'ALL' && r.department_name !== departmentFilter) return false
      if (activeTab === 'ALL_REQUESTS' && statusFilter !== 'ALL' && r.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const match =
          r.request_number.toLowerCase().includes(q) ||
          r.employee_name.toLowerCase().includes(q) ||
          r.leave_type_name.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [displayList, departmentFilter, statusFilter, search, activeTab])

  // Handle HR Approve
  const handleConfirmApprove = async () => {
    if (!approveTargetId) return
    const res = await hrFinalApprove(approveTargetId, approveComment.trim() || undefined)
    if (res.success) {
      toast.success('Final HR approval granted! Leave balance permanently deducted in PostgreSQL.')
      setApproveTargetId(null)
      setApproveComment('')
    } else {
      toast.error(res.error || 'Failed to approve request')
    }
  }

  // Handle HR Reject
  const handleConfirmReject = async () => {
    if (!rejectTargetId) return
    if (rejectReason.trim().length < 3) {
      toast.error('Please specify a rejection reason (minimum 3 characters)')
      return
    }
    const res = await hrReject(rejectTargetId, rejectReason.trim())
    if (res.success) {
      toast.success('Leave application rejected. Reserved balance restored.')
      setRejectTargetId(null)
      setRejectReason('')
    } else {
      toast.error(res.error || 'Failed to reject request')
    }
  }

  // Handle HR Cancel
  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return
    if (cancelReason.trim().length < 3) {
      toast.error('Please enter a cancellation reason')
      return
    }
    const res = await cancelApprovedLeave(cancelTargetId, cancelReason.trim())
    if (res.success) {
      toast.success('Approved leave cancelled. Balance restored to employee.')
      setCancelTargetId(null)
      setCancelReason('')
    } else {
      toast.error(res.error || 'Failed to cancel leave')
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Organization Leave Requests</h1>
          <p className="text-sm text-[#475569] mt-1">
            Review manager-approved applications, grant final HR authorization, or manage historical records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold py-1 px-3 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            {pendingHrRequests.length} Pending HR Sign-Off
          </span>
        </div>
      </div>

      {/* Tabs & Search Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-subtle space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#F1F3F5] pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('PENDING_HR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'PENDING_HR'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#475569] hover:bg-[#F1F3F5] hover:text-[#111827]'
              }`}
            >
              Pending HR Final Approval ({pendingHrRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('ALL_REQUESTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ALL_REQUESTS'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#475569] hover:bg-[#F1F3F5] hover:text-[#111827]'
              }`}
            >
              All Organization Requests ({allRequests.length})
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee name, request #, or leave category..."
              className="pl-9 h-9 border-[#E5E7EB] text-xs bg-white text-[#111827]"
            />
          </div>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 border-[#E5E7EB] text-xs bg-white text-[#111827]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#E5E7EB] text-[#111827]">
              <SelectItem value="ALL">All Departments</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Human Resources">Human Resources</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Customer Support">Customer Support</SelectItem>
            </SelectContent>
          </Select>

          {activeTab === 'ALL_REQUESTS' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 h-9 border-[#E5E7EB] text-xs bg-white text-[#111827]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E7EB] text-[#111827]">
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PENDING_HR_APPROVAL">Pending HR</SelectItem>
                <SelectItem value="PENDING_MANAGER_APPROVAL">Pending Manager</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#475569] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Request #</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Manager Review</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#334155]">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[#94A3B8]">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-[#166534]" />
                    <p className="font-semibold text-xs text-[#111827]">No requests found in this queue.</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {activeTab === 'PENDING_HR' ? 'All Manager-approved leaves have been finalized.' : 'Try adjusting your search filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((req) => (
                  <tr key={req.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-medium text-[#111827]">
                      <div>
                        <p className="font-semibold text-[#111827]">{req.employee_name}</p>
                        <p className="text-[10px] text-[#64748B]">{req.department_name}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#2563EB]">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {req.request_number}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#111827]">
                      {req.leave_type_name}
                    </td>
                    <td className="py-3.5 px-4 text-[#475569] whitespace-nowrap">
                      {req.start_date} → {req.end_date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#111827] tabular-nums">
                      {req.total_days} d
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-[#166534] font-semibold bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                        ✓ Approved by Mgr
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <LeaveStatusBadge status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRequest(req)}
                          className="h-8 px-2 text-[#2563EB] hover:bg-[#EFF6FF] text-xs gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </Button>

                        {req.status === 'PENDING_HR_APPROVAL' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => setApproveTargetId(req.id)}
                              className="h-8 px-2.5 bg-[#166534] hover:bg-[#14532D] text-white text-xs gap-1 font-semibold"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Final Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRejectTargetId(req.id)}
                              className="h-8 px-2 border-[#FEE2E2] bg-[#FEF2F2] text-[#991B1B] hover:bg-[#FEE2E2] text-xs gap-1 font-semibold"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </>
                        )}

                        {req.status === 'APPROVED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelTargetId(req.id)}
                            className="h-8 px-2 text-[#475569] hover:bg-[#F1F3F5] text-xs gap-1"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Admin Cancel
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

      {/* Details Dialog */}
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
                Employee: {selectedRequest.employee_name} ({selectedRequest.department_name})
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

              {/* Approval Timeline */}
              <div>
                <span className="text-[#64748B] block font-semibold mb-2">Workflow Activity Trail</span>
                <div className="space-y-2 border-l-2 border-[#E5E7EB] pl-3 ml-1">
                  {state.approvalActions
                    .filter((a) => a.leave_request_id === selectedRequest.id)
                    .map((action, i) => (
                      <div key={action.id || i} className="text-[11px] relative">
                        <span className="font-semibold text-[#111827]">{action.actor_name}</span>{' '}
                        <span className="text-[#64748B]">action:</span>{' '}
                        <span className="font-semibold text-[#2563EB]">{action.action}</span>
                        {action.comments && (
                          <p className="text-[#475569] italic mt-0.5">"{action.comments}"</p>
                        )}
                        <span className="text-[10px] text-[#94A3B8] block mt-0.5">
                          {action.created_at ? new Date(action.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                className="w-full text-xs h-9 border-[#E5E7EB]"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* HR Final Approve Dialog */}
      {approveTargetId && (
        <Dialog open={!!approveTargetId} onOpenChange={() => setApproveTargetId(null)}>
          <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-[#111827] rounded-2xl shadow-modal">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#166534]">
                Grant Final HR Approval
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                This action grants final approval for this leave request. The employee's leave balance will be permanently deducted and ledger updated.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <Label htmlFor="approveComment" className="font-semibold text-[#111827]">
                HR Sign-Off Comment (Optional)
              </Label>
              <Input
                id="approveComment"
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder="e.g. HR final approval granted. Leave recorded."
                className="border-[#E5E7EB] text-xs h-9"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveTargetId(null)} className="text-xs h-9 border-[#E5E7EB]">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmApprove}
                className="bg-[#166534] hover:bg-[#14532D] text-white text-xs h-9 font-semibold"
              >
                Finalize Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* HR Reject Dialog */}
      {rejectTargetId && (
        <Dialog open={!!rejectTargetId} onOpenChange={() => setRejectTargetId(null)}>
          <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-[#111827] rounded-2xl shadow-modal">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#991B1B]">
                Reject Leave Request (HR)
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Provide an administrative rejection reason. The reserved leave balance will be refunded.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <Label htmlFor="rejectReason" className="font-semibold text-[#111827]">
                Rejection Reason <span className="text-[#991B1B]">*</span>
              </Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter justification for rejection..."
                rows={3}
                className="border-[#E5E7EB] text-xs resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectTargetId(null)} className="text-xs h-9 border-[#E5E7EB]">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReject}
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs h-9 font-semibold"
              >
                Reject Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* HR Cancel Dialog */}
      {cancelTargetId && (
        <Dialog open={!!cancelTargetId} onOpenChange={() => setCancelTargetId(null)}>
          <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-[#111827] rounded-2xl shadow-modal">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#111827]">
                Administrative Leave Cancellation
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Cancel an approved leave and restore the deducted balance to the employee's quota.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <Label htmlFor="cancelReason" className="font-semibold text-[#111827]">
                Reason for Cancellation <span className="text-[#991B1B]">*</span>
              </Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for administrative cancellation..."
                rows={3}
                className="border-[#E5E7EB] text-xs resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelTargetId(null)} className="text-xs h-9 border-[#E5E7EB]">
                Dismiss
              </Button>
              <Button
                onClick={handleConfirmCancel}
                className="bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs h-9 font-semibold"
              >
                Cancel Leave
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
