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
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  const handleConfirmApprove = () => {
    if (!approveTargetId) return
    const res = hrFinalApprove(approveTargetId, approveComment.trim() || undefined)
    if (res.success) {
      toast.success('Final HR approval granted! Leave balance permanently deducted and ledger updated.')
      setApproveTargetId(null)
      setApproveComment('')
    } else {
      toast.error(res.error || 'Failed to approve request')
    }
  }

  // Handle HR Reject
  const handleConfirmReject = () => {
    if (!rejectTargetId) return
    if (rejectReason.trim().length < 3) {
      toast.error('Please specify a rejection reason (minimum 3 characters)')
      return
    }
    const res = hrReject(rejectTargetId, rejectReason.trim())
    if (res.success) {
      toast.success('Leave request rejected by HR. Reserved balance released back to employee.')
      setRejectTargetId(null)
      setRejectReason('')
    } else {
      toast.error(res.error || 'Failed to reject request')
    }
  }

  // Handle Cancel
  const handleConfirmCancel = () => {
    if (!cancelTargetId) return
    if (cancelReason.trim().length < 3) {
      toast.error('Please enter cancellation reason (minimum 3 characters)')
      return
    }
    const res = cancelApprovedLeave(cancelTargetId, cancelReason.trim())
    if (res.success) {
      toast.success('Approved leave cancelled. Balance refunded to employee with reversal ledger entry.')
      setCancelTargetId(null)
      setCancelReason('')
    } else {
      toast.error(res.error || 'Failed to cancel leave')
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">HR Approval & Leave Governance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Perform final HR approval, audit organizational leave requests, and process cancellations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold py-1 px-3 border-blue-200 bg-blue-50 text-blue-800">
            {pendingHrRequests.length} Pending HR Sign-off
          </Badge>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('PENDING_HR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'PENDING_HR'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pending HR Final Approval ({pendingHrRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('ALL_REQUESTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ALL_REQUESTS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Organization Requests ({allRequests.length})
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee name, request #, or category..."
              className="pl-9 h-9 border-slate-200 text-xs"
            />
          </div>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 border-slate-200 text-xs">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Human Resources">Human Resources</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
            </SelectContent>
          </Select>

          {activeTab === 'ALL_REQUESTS' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 h-9 border-slate-200 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
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
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                    <p className="font-medium text-slate-700">No requests found in this queue.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {activeTab === 'PENDING_HR' ? 'All Manager-approved leaves have been finalized.' : 'Try adjusting your search filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div>
                        <p className="font-semibold text-slate-900">{req.employee_name}</p>
                        <p className="text-[10px] text-slate-400">{req.department_name}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {req.request_number}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {req.leave_type_name}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {req.start_date} → {req.end_date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                      {req.total_days} d
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                        ✓ Approved by Mgr
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'PENDING_HR_APPROVAL'
                            ? 'bg-blue-100 text-blue-800'
                            : req.status === 'PENDING_MANAGER_APPROVAL'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {req.status.replace(/_/g, ' ')}
                      </span>
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
                          View
                        </Button>

                        {/* HR Actions for Pending HR Requests */}
                        {req.status === 'PENDING_HR_APPROVAL' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setApproveTargetId(req.id)
                                setApproveComment('')
                              }}
                              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1 font-semibold"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Final Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectTargetId(req.id)
                                setRejectReason('')
                              }}
                              className="h-8 px-2 text-rose-600 hover:bg-rose-50 border-rose-200 text-xs gap-1"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </Button>
                          </>
                        )}

                        {/* Process Cancellation for Approved Leaves */}
                        {req.status === 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCancelTargetId(req.id)
                              setCancelReason('')
                            }}
                            className="h-8 px-2 text-slate-600 hover:bg-slate-100 text-xs gap-1"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Cancel Leave
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

      {/* HR Final Approve Modal */}
      <Dialog open={Boolean(approveTargetId)} onOpenChange={() => setApproveTargetId(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Final HR Approval</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Granting final approval will permanently deduct leave days from the employee's balance and generate an immutable ledger entry.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="hrNotes" className="text-xs font-semibold text-slate-700">
              HR Approval Note / Reference (Optional)
            </Label>
            <Textarea
              id="hrNotes"
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              placeholder="e.g. Official HR sign-off completed..."
              rows={2}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApproveTargetId(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Grant Final Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HR Reject Modal */}
      <Dialog open={Boolean(rejectTargetId)} onOpenChange={() => setRejectTargetId(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Reject Application (HR)</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Specify the HR policy reason for rejecting this request. Reserved days will be refunded to the employee.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="hrRejectReason" className="text-xs font-semibold text-slate-700">
              Rejection Reason <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="hrRejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Leave policy non-compliance, missing medical document..."
              rows={3}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectTargetId(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmReject} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HR Cancel Modal */}
      <Dialog open={Boolean(cancelTargetId)} onOpenChange={() => setCancelTargetId(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Process Leave Cancellation (HR)</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Cancelling this approved leave will automatically refund the deducted days back to the employee's available balance via a reversal ledger entry.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="hrCancelReason" className="text-xs font-semibold text-slate-700">
              Cancellation Justification <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="hrCancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Employee requested cancellation due to cancelled conference..."
              rows={3}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCancelTargetId(null)}>
              Dismiss
            </Button>
            <Button size="sm" onClick={handleConfirmCancel} className="bg-rose-600 hover:bg-rose-700 text-white font-semibold">
              Refund & Cancel Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Details Modal */}
      {selectedRequest && (
        <Dialog open={Boolean(selectedRequest)} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-lg bg-white border-slate-200">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-slate-900 font-mono">
                  {selectedRequest.request_number}
                </DialogTitle>
                <Badge variant="outline">{selectedRequest.status.replace(/_/g, ' ')}</Badge>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Submitted by {selectedRequest.employee_name} ({selectedRequest.department_name})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-slate-400 font-medium">Leave Type</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.leave_type_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Duration</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.total_days} working days</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Schedule</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.start_date} → {selectedRequest.end_date}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Day Schedule</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.day_type.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Employee Justification</p>
                <p className="mt-1 p-2.5 bg-slate-50 rounded border border-slate-100 text-slate-700 leading-relaxed">
                  {selectedRequest.reason}
                </p>
              </div>

              {selectedRequest.handover_notes && (
                <div>
                  <p className="text-slate-400 font-medium">Handover & Contact Notes</p>
                  <p className="mt-1 p-2.5 bg-slate-50 rounded border border-slate-100 text-slate-700">
                    {selectedRequest.handover_notes}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-slate-100 pt-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
