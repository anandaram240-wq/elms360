'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Check,
  X,
  HelpCircle,
  Eye,
  Search,
  Filter,
  AlertTriangle,
  FileText,
  User,
  Clock,
  CheckCircle2,
  Calendar,
  Building,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useElmsStore, LeaveRequestRecord } from '@/lib/store/elms-store'

export default function ManagerApprovalsPage() {
  const { state, currentUser, managerApprove, managerReject, managerRequestClarification } = useElmsStore()

  const [activeTab, setActiveTab] = React.useState<'PENDING' | 'HISTORY'>('PENDING')
  const [search, setSearch] = React.useState('')
  const [departmentFilter, setDepartmentFilter] = React.useState('ALL')

  // Modals state
  const [selectedRequest, setSelectedRequest] = React.useState<LeaveRequestRecord | null>(null)
  const [rejectTargetId, setRejectTargetId] = React.useState<string | null>(null)
  const [rejectReason, setRejectReason] = React.useState('')
  const [clarifyTargetId, setClarifyTargetId] = React.useState<string | null>(null)
  const [clarifyQuestion, setClarifyQuestion] = React.useState('')
  const [approveComments, setApproveComments] = React.useState('')
  const [approveTargetId, setApproveTargetId] = React.useState<string | null>(null)

  // Manager's viewable requests
  const pendingRequests = state.leaveRequests.filter(
    (r) => r.status === 'PENDING_MANAGER_APPROVAL'
  )

  const historyRequests = state.leaveRequests.filter(
    (r) => r.status !== 'PENDING_MANAGER_APPROVAL' && r.status !== 'DRAFT'
  )

  const displayList = activeTab === 'PENDING' ? pendingRequests : historyRequests

  const filteredData = React.useMemo(() => {
    return displayList.filter((r) => {
      if (departmentFilter !== 'ALL' && r.department_name !== departmentFilter) return false
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
  }, [displayList, departmentFilter, search])

  // Team overlap checker
  const getOverlappingTeammates = (req: LeaveRequestRecord) => {
    return state.leaveRequests.filter((other) => {
      if (other.id === req.id) return false
      if (other.department_name !== req.department_name) return false
      if (other.status !== 'APPROVED' && other.status !== 'PENDING_HR_APPROVAL' && other.status !== 'PENDING_MANAGER_APPROVAL') return false
      return !(other.end_date < req.start_date || other.start_date > req.end_date)
    })
  }

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!approveTargetId) return
    const res = await managerApprove(approveTargetId, approveComments.trim() || undefined)
    if (res.success) {
      toast.success('Leave request approved and forwarded to HR Department for final sign-off.')
      setApproveTargetId(null)
      setApproveComments('')
    } else {
      toast.error(res.error || 'Failed to approve request')
    }
  }

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectTargetId) return
    if (rejectReason.trim().length < 3) {
      toast.error('Please specify a rejection reason (minimum 3 characters)')
      return
    }
    const res = await managerReject(rejectTargetId, rejectReason.trim())
    if (res.success) {
      toast.success('Leave request rejected. Balance reservation released.')
      setRejectTargetId(null)
      setRejectReason('')
    } else {
      toast.error(res.error || 'Failed to reject request')
    }
  }

  // Handle Clarification
  const handleConfirmClarify = async () => {
    if (!clarifyTargetId) return
    if (clarifyQuestion.trim().length < 3) {
      toast.error('Please enter the question for the employee (minimum 3 characters)')
      return
    }
    const res = await managerRequestClarification(clarifyTargetId, clarifyQuestion.trim())
    if (res.success) {
      toast.success('Clarification requested. Employee has been notified.')
      setClarifyTargetId(null)
      setClarifyQuestion('')
    } else {
      toast.error(res.error || 'Failed to request clarification')
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manager Approval Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review team leave applications, check schedule overlap conflicts, and approve or reject requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold py-1 px-3 border-amber-200 bg-amber-50 text-amber-800">
            {pendingRequests.length} Pending Actions
          </Badge>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'PENDING'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Pending Review ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'HISTORY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Approval History ({historyRequests.length})
            </button>
          </div>
        </div>

        {/* Search & Department Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee name, request #, or leave category..."
              className="pl-9 h-9 border-slate-200 text-xs"
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-48 h-9 border-slate-200 text-xs">
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
                <th className="py-3 px-4">Team Conflict</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                    <p className="font-medium text-slate-700">
                      {activeTab === 'PENDING' ? 'No pending approval requests!' : 'No historical records found.'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {activeTab === 'PENDING' ? 'All team leave applications have been reviewed.' : 'Past decisions will be listed here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredData.map((req) => {
                  const overlaps = getOverlappingTeammates(req)
                  const isSelf = currentUser && (req.employee_id === currentUser.id || req.employee_id === currentUser.employeeId)

                  return (
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
                        {overlaps.length > 0 ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800"
                            title={overlaps.map((o) => `${o.employee_name} (${o.start_date} to ${o.end_date})`).join(', ')}
                          >
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            {overlaps.length} teammate{overlaps.length > 1 ? 's' : ''} on leave
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">No conflicts</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'PENDING_MANAGER_APPROVAL'
                              ? 'bg-amber-100 text-amber-800'
                              : req.status === 'PENDING_HR_APPROVAL'
                              ? 'bg-blue-100 text-blue-800'
                              : req.status === 'CLARIFICATION_REQUESTED'
                              ? 'bg-indigo-100 text-indigo-800'
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

                          {activeTab === 'PENDING' && (
                            <>
                              {isSelf ? (
                                <span className="text-[11px] text-slate-400 italic px-2">
                                  Self-approval prohibited
                                </span>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setApproveTargetId(req.id)
                                      setApproveComments('')
                                    }}
                                    className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1 font-semibold"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setClarifyTargetId(req.id)
                                      setClarifyQuestion('')
                                    }}
                                    className="h-8 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs gap-1 border border-indigo-200"
                                  >
                                    <HelpCircle className="h-3.5 w-3.5" />
                                    Clarify
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      <Dialog open={Boolean(approveTargetId)} onOpenChange={() => setApproveTargetId(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Confirm Manager Approval</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Approving will forward this request to the HR Department for final approval.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="approveNotes" className="text-xs font-semibold text-slate-700">
              Optional Manager Note / Comment
            </Label>
            <Textarea
              id="approveNotes"
              value={approveComments}
              onChange={(e) => setApproveComments(e.target.value)}
              placeholder="e.g. Work is covered, approved for vacation..."
              rows={2}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApproveTargetId(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Approve & Forward to HR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={Boolean(rejectTargetId)} onOpenChange={() => setRejectTargetId(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Reject Leave Request</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Specify the reason for rejecting this application. The employee will be notified and reserved days will be refunded.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="rejectReason" className="text-xs font-semibold text-slate-700">
              Rejection Reason <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="rejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Critical release deadline scheduled on these dates..."
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

      {/* Clarification Modal */}
      <Dialog open={Boolean(clarifyTargetId)} onOpenChange={() => setClarifyTargetId(null)}>
        <DialogContent className="max-w-md bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">Request Clarification</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Ask the employee for more details. The request will move to Clarification Needed status.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="clarifyQuestion" className="text-xs font-semibold text-slate-700">
              Clarification Question / Note <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="clarifyQuestion"
              value={clarifyQuestion}
              onChange={(e) => setClarifyQuestion(e.target.value)}
              placeholder="e.g. Please confirm if ticket ABC-102 will be completed before departure..."
              rows={3}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setClarifyTargetId(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmClarify} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
              Send Clarification Request
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
