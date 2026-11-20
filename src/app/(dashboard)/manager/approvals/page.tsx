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
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Send,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import { useElmsStore, LeaveRequestRecord } from '@/lib/store/elms-store'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function ManagerApprovalsPage() {
  const { state, currentUser, managerApprove, managerReject, managerRequestClarification } = useElmsStore()

  const [activeTab, setActiveTab] = React.useState<'PENDING' | 'HISTORY'>('PENDING')
  const [search, setSearch] = React.useState('')
  const [departmentFilter, setDepartmentFilter] = React.useState('ALL')

  // Selected request for Master-Detail workbench
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null)

  // Action Modals state
  const [rejectTargetId, setRejectTargetId] = React.useState<string | null>(null)
  const [rejectReason, setRejectReason] = React.useState('')
  const [clarifyTargetId, setClarifyTargetId] = React.useState<string | null>(null)
  const [clarifyQuestion, setClarifyQuestion] = React.useState('')
  const [approveComments, setApproveComments] = React.useState('')
  const [approveTargetId, setApproveTargetId] = React.useState<string | null>(null)
  const [overrideJustification, setOverrideJustification] = React.useState('')

  // Queues
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

  // Select first item by default if none selected or current selection missing
  React.useEffect(() => {
    if (filteredData.length > 0) {
      if (!selectedRequestId || !filteredData.some((r) => r.id === selectedRequestId)) {
        setSelectedRequestId(filteredData[0].id)
      }
    } else {
      setSelectedRequestId(null)
    }
  }, [filteredData, selectedRequestId])

  const selectedRequest = React.useMemo(() => {
    return filteredData.find((r) => r.id === selectedRequestId) || null
  }, [filteredData, selectedRequestId])

  // Team overlap checker
  const getOverlappingTeammates = (req: LeaveRequestRecord) => {
    return state.leaveRequests.filter((other) => {
      if (other.id === req.id) return false
      if (other.department_name !== req.department_name) return false
      if (other.status !== 'APPROVED' && other.status !== 'PENDING_HR_APPROVAL' && other.status !== 'PENDING_MANAGER_APPROVAL') return false
      return !(other.end_date < req.start_date || other.start_date > req.end_date)
    })
  }

  // Same-employee overlap checker (Phase 5 Protection)
  const getSameEmployeeOverlaps = (req: LeaveRequestRecord) => {
    return state.leaveRequests.filter((other) => {
      if (other.id === req.id) return false
      if (other.employee_id !== req.employee_id) return false
      if (other.status === 'REJECTED' || other.status === 'WITHDRAWN' || other.status === 'CANCELLED' || other.status === 'DRAFT') return false
      return !(other.end_date < req.start_date || other.start_date > req.end_date)
    })
  }

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!approveTargetId) return
    const target = state.leaveRequests.find((r) => r.id === approveTargetId)
    const empConflicts = target ? getSameEmployeeOverlaps(target) : []
    const hasApproved = empConflicts.some((c) => c.status === 'APPROVED')

    if (hasApproved && overrideJustification.trim().length < 5) {
      toast.error('Please specify an authorized conflict override justification (minimum 5 characters) to approve overlapping approved dates.')
      return
    }

    const res = await managerApprove(
      approveTargetId,
      approveComments.trim() || undefined,
      hasApproved ? overrideJustification.trim() : undefined
    )
    if (res.success) {
      toast.success('Leave request approved and routed to HR for final sign-off.')
      setApproveTargetId(null)
      setApproveComments('')
      setOverrideJustification('')
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
      toast.success('Leave request rejected. Notification sent to employee.')
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
      toast.error('Please enter the clarification inquiry for the employee')
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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Approval Workbench</h1>
          <p className="text-sm text-[#475569] mt-1">
            Review team leave applications, inspect schedule conflicts, and grant approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold py-1 px-3 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            {pendingRequests.length} Pending Review
          </span>
        </div>
      </div>

      {/* Tabs & Search Filter Strip */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-subtle space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#F1F3F5] pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#475569] hover:bg-[#F1F3F5] hover:text-[#111827]'
              }`}
            >
              Pending Queue ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'HISTORY'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#475569] hover:bg-[#F1F3F5] hover:text-[#111827]'
              }`}
            >
              Approval History ({historyRequests.length})
            </button>
          </div>
        </div>

        {/* Search & Department Filters */}
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
            <SelectTrigger className="w-full sm:w-48 h-9 border-[#E5E7EB] text-xs bg-white text-[#111827]">
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
        </div>
      </div>

      {/* MASTER-DETAIL WORKBENCH LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Request Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
              Applications Queue ({filteredData.length})
            </h2>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredData.length === 0 ? (
              <Card className="border-[#E5E7EB] bg-white rounded-xl p-8 text-center text-[#94A3B8] shadow-subtle">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-[#166534]" />
                <p className="font-semibold text-xs text-[#111827]">Queue is clear!</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  {activeTab === 'PENDING' ? 'No applications awaiting your review.' : 'No historical records found.'}
                </p>
              </Card>
            ) : (
              filteredData.map((req) => {
                const isSelected = selectedRequestId === req.id
                const overlaps = getOverlappingTeammates(req)
                const sameEmpOverlaps = getSameEmployeeOverlaps(req)
                const hasApprovedConflict = sameEmpOverlaps.some((o) => o.status === 'APPROVED')

                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-[#EFF6FF] border-[#2563EB] shadow-subtle'
                        : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-[#111827] truncate">
                          {req.employee_name}
                        </p>
                        <p className="text-[11px] text-[#64748B] truncate">
                          {req.department_name} • <span className="font-mono">{req.request_number}</span>
                        </p>
                      </div>
                      <LeaveStatusBadge status={req.status} />
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-xs text-[#475569]">
                      <span className="font-semibold text-[#111827]">{req.leave_type_name}</span>
                      <span className="font-bold text-[#111827] tabular-nums">{req.total_days} Working Day(s)</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>{req.start_date} → {req.end_date}</span>
                      <div className="flex items-center gap-1.5">
                        {sameEmpOverlaps.length > 0 && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            hasApprovedConflict ? 'text-[#991B1B] bg-[#FEE2E2]' : 'text-[#92400E] bg-[#FEF3C7]'
                          }`}>
                            <AlertTriangle className="h-3 w-3" />
                            {hasApprovedConflict ? 'Approved Overlap' : 'Pending Overlap'}
                          </span>
                        )}
                        {overlaps.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#92400E] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                            <AlertTriangle className="h-3 w-3" />
                            {overlaps.length} team
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Detail Review Panel (7 cols) */}
        <div className="lg:col-span-7">
          {selectedRequest ? (
            <Card className="border-[#E5E7EB] bg-white rounded-xl shadow-subtle overflow-hidden sticky top-20">
              {/* Review Panel Header */}
              <div className="p-5 border-b border-[#E5E7EB] bg-[#F8FAFC] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[#111827]">
                      {selectedRequest.employee_name}
                    </h2>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#2563EB]">
                      {selectedRequest.request_number}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {selectedRequest.department_name} • Submitted on {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <LeaveStatusBadge status={selectedRequest.status} />
              </div>

              <CardContent className="p-6 space-y-5 text-xs">
                {/* Absence Duration Callout */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Leave Category</span>
                    <span className="font-bold text-[#111827] text-sm">{selectedRequest.leave_type_name}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Total Days</span>
                    <span className="font-bold text-[#111827] text-sm tabular-nums">{selectedRequest.total_days} Day(s)</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Start Date</span>
                    <span className="font-semibold text-[#111827] text-sm">{selectedRequest.start_date}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">End Date</span>
                    <span className="font-semibold text-[#111827] text-sm">{selectedRequest.end_date}</span>
                  </div>
                </div>

                {/* Team Conflict Warnings */}
                {(() => {
                  const conflicts = getOverlappingTeammates(selectedRequest)
                  if (conflicts.length === 0) return null
                  return (
                    <div className="p-3.5 rounded-lg border border-[#FDE68A] bg-[#FEF3C7] text-[#92400E] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Team Availability Conflict Warning</span>
                      </div>
                      <p className="text-[11px]">
                        {conflicts.length} other team member(s) in {selectedRequest.department_name} are scheduled on leave during these dates:
                      </p>
                      <ul className="list-disc pl-5 text-[11px] space-y-0.5 pt-1">
                        {conflicts.map((c) => (
                          <li key={c.id}>
                            <strong>{c.employee_name}</strong> ({c.leave_type_name}: {c.start_date} to {c.end_date})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })()}

                {/* Reason & Justification */}
                <div>
                  <h3 className="font-semibold text-xs text-[#64748B] uppercase tracking-wider mb-1.5">
                    Reason for Absence
                  </h3>
                  <p className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] text-[#334155] leading-relaxed">
                    {selectedRequest.reason || 'None provided'}
                  </p>
                </div>

                {/* Handover & Emergency Contact */}
                {(selectedRequest.handover_notes || selectedRequest.emergency_contact) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedRequest.handover_notes && (
                      <div>
                        <h4 className="font-semibold text-[11px] text-[#64748B] mb-1">Handover Notes</h4>
                        <p className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] text-[#334155]">
                          {selectedRequest.handover_notes}
                        </p>
                      </div>
                    )}
                    {selectedRequest.emergency_contact && (
                      <div>
                        <h4 className="font-semibold text-[11px] text-[#64748B] mb-1">Emergency Contact</h4>
                        <p className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] text-[#334155]">
                          {selectedRequest.emergency_contact}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Same-Employee Overlap Conflicts Notice (Phase 5 Protection) */}
                {(() => {
                  const sameEmpConflicts = getSameEmployeeOverlaps(selectedRequest)
                  if (sameEmpConflicts.length === 0) return null
                  const hasApprovedConflict = sameEmpConflicts.some((c) => c.status === 'APPROVED')

                  return (
                    <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-xs text-amber-950">
                            Employee Schedule Conflict ({sameEmpConflicts.length})
                          </p>
                          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                            {hasApprovedConflict
                              ? 'This employee already has an APPROVED leave request overlapping these dates. Approving will require an authorized conflict override.'
                              : 'This employee has another active leave request overlapping these dates.'}
                          </p>
                        </div>
                      </div>
                      <div className="divide-y divide-amber-200/60 rounded border border-amber-200/70 bg-white/80 text-[11px]">
                        {sameEmpConflicts.map((c) => (
                          <div key={c.id} className="p-2 flex items-center justify-between">
                            <div>
                              <span className="font-mono font-semibold">{c.request_number}</span>
                              <span className="text-[#64748B] ml-2">{c.start_date} → {c.end_date} ({c.total_days}d)</span>
                            </div>
                            <LeaveStatusBadge status={c.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Decision Actions Bar */}
                {selectedRequest.status === 'PENDING_MANAGER_APPROVAL' && (
                  <div className="pt-4 border-t border-[#E5E7EB] space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Manager Decision</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={() => setApproveTargetId(selectedRequest.id)}
                        className="bg-[#166534] hover:bg-[#14532D] text-white font-semibold text-xs h-9 px-4 rounded-lg gap-1.5"
                      >
                        <Check className="h-4 w-4" />
                        Approve Request
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setRejectTargetId(selectedRequest.id)}
                        className="border-[#FEE2E2] bg-[#FEF2F2] text-[#991B1B] hover:bg-[#FEE2E2] font-semibold text-xs h-9 px-4 rounded-lg gap-1.5"
                      >
                        <X className="h-4 w-4" />
                        Reject Application
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setClarifyTargetId(selectedRequest.id)}
                        className="border-[#E5E7EB] text-[#475569] hover:bg-[#F1F3F5] text-xs h-9 px-3 rounded-lg gap-1.5"
                      >
                        <HelpCircle className="h-4 w-4" />
                        Ask Clarification
                      </Button>
                    </div>
                  </div>
                )}

                {/* Historical Decision Info */}
                {selectedRequest.status !== 'PENDING_MANAGER_APPROVAL' && (
                  <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
                    <span>Current Lifecycle Status:</span>
                    <LeaveStatusBadge status={selectedRequest.status} />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-[#E5E7EB] bg-white rounded-xl p-12 text-center text-[#94A3B8] shadow-subtle">
              <Eye className="h-8 w-8 mx-auto mb-2 text-[#CBD5E1]" />
              <p className="font-semibold text-sm text-[#111827]">No application selected</p>
              <p className="text-xs text-[#64748B] mt-1">
                Select an application from the queue to inspect details and record approvals.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      {approveTargetId && (
        <Dialog open={!!approveTargetId} onOpenChange={() => setApproveTargetId(null)}>
          <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-[#111827] rounded-2xl shadow-modal">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#111827]">
                Approve Leave Request
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                This action grants Manager approval and routes the application to HR for final sign-off.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              {(() => {
                const target = state.leaveRequests.find((r) => r.id === approveTargetId)
                const empConflicts = target ? getSameEmployeeOverlaps(target) : []
                const hasApproved = empConflicts.some((c) => c.status === 'APPROVED')
                const approvedReq = empConflicts.find((c) => c.status === 'APPROVED')

                if (!hasApproved) return null

                return (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-950">Approved Conflict Override Required</p>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                          Employee already has an approved request ({approvedReq?.request_number}: {approvedReq?.start_date} to {approvedReq?.end_date}).
                          To proceed, an authorized conflict override justification is required.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 pt-1">
                      <Label htmlFor="overrideJustification" className="text-[11px] font-semibold text-amber-950">
                        Mandatory Override Justification <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="overrideJustification"
                        value={overrideJustification}
                        onChange={(e) => setOverrideJustification(e.target.value)}
                        placeholder="e.g. Schedule adjustment authorized by department head"
                        className="border-amber-300 text-xs h-8.5 bg-white"
                      />
                    </div>
                  </div>
                )
              })()}

              <Label htmlFor="approveComment" className="font-semibold text-[#111827]">
                Optional Approval Comment
              </Label>
              <Input
                id="approveComment"
                value={approveComments}
                onChange={(e) => setApproveComments(e.target.value)}
                placeholder="e.g. Approved. Sprint coverage confirmed."
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
                Confirm Approval
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Dialog */}
      {rejectTargetId && (
        <Dialog open={!!rejectTargetId} onOpenChange={() => setRejectTargetId(null)}>
          <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-[#111827] rounded-2xl shadow-modal">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#991B1B]">
                Reject Leave Request
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                A clear reason is required to reject an application. The employee will receive this feedback.
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
                placeholder="Provide justification for rejecting this request..."
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

      {/* Clarification Dialog */}
      {clarifyTargetId && (
        <Dialog open={!!clarifyTargetId} onOpenChange={() => setClarifyTargetId(null)}>
          <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-[#111827] rounded-2xl shadow-modal">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#111827]">
                Request Additional Clarification
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Ask the employee for more details before making an approval decision.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-xs">
              <Label htmlFor="clarifyQuestion" className="font-semibold text-[#111827]">
                Inquiry / Question <span className="text-[#991B1B]">*</span>
              </Label>
              <Textarea
                id="clarifyQuestion"
                value={clarifyQuestion}
                onChange={(e) => setClarifyQuestion(e.target.value)}
                placeholder="What details are needed from the employee?..."
                rows={3}
                className="border-[#E5E7EB] text-xs resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClarifyTargetId(null)} className="text-xs h-9 border-[#E5E7EB]">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmClarify}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-9 font-semibold"
              >
                Send Inquiry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
