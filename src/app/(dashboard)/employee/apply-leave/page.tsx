'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Send,
  Building,
  Check,
  CalendarCheck,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/shared/date-picker'
import { useElmsStore } from '@/lib/store/elms-store'
import { DayType } from '@/types/app'

export default function ApplyLeavePage() {
  const router = useRouter()
  const { state, currentUser, calculateDuration, submitLeave } = useElmsStore()

  // Form State
  const [leaveTypeId, setLeaveTypeId] = React.useState<string>('')
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)
  const [dayType, setDayType] = React.useState<DayType>('FULL_DAY')
  const [reason, setReason] = React.useState<string>('')
  const [handoverNotes, setHandoverNotes] = React.useState<string>('')
  const [emergencyContact, setEmergencyContact] = React.useState<string>('')
  const [submitting, setSubmitting] = React.useState(false)

  // Current employee & balances
  const employeeId = currentUser?.id || currentUser?.employeeId || ''
  const myBalances = state.leaveBalances.filter(
    (b) => b.employee_id === employeeId && b.fiscal_year === 2026
  )

  // Set default leave type on load
  React.useEffect(() => {
    if (!leaveTypeId && state.leaveTypes.length > 0) {
      setLeaveTypeId(state.leaveTypes[0].id)
    }
  }, [leaveTypeId, state.leaveTypes])

  const selectedType = state.leaveTypes.find((t) => t.id === leaveTypeId)
  const currentBalance = myBalances.find((b) => b.leave_type_id === leaveTypeId)
  const availableDays = currentBalance ? currentBalance.available_balance : 0

  // Format dates for calculation
  const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : ''
  const endDateStr = endDate ? format(endDate, 'yyyy-MM-dd') : ''

  // Real-time duration calculation
  const durationResult = React.useMemo(() => {
    if (!startDateStr || !endDateStr || endDateStr < startDateStr) {
      return null
    }
    return calculateDuration(startDateStr, endDateStr, dayType)
  }, [startDateStr, endDateStr, dayType, calculateDuration])

  const workingDays = durationResult?.workingDays || 0
  const remainingAfterApproval = Math.max(0, availableDays - workingDays)

  // Overlap check
  const overlapConflict = React.useMemo(() => {
    if (!startDateStr || !endDateStr) return null
    return state.leaveRequests.find((r) => {
      if (r.employee_id !== employeeId) return false
      if (r.status === 'REJECTED' || r.status === 'WITHDRAWN' || r.status === 'CANCELLED') return false
      return !(r.end_date < startDateStr || r.start_date > endDateStr)
    })
  }, [state.leaveRequests, employeeId, startDateStr, endDateStr])

  // Validation
  const validationError = React.useMemo(() => {
    if (!leaveTypeId) return 'Please select a leave category.'
    if (!startDate || !endDate) return 'Please select both start and end dates.'
    if (endDateStr < startDateStr) return 'End date cannot be earlier than start date.'
    if (durationResult && durationResult.workingDays <= 0) {
      return 'The selected dates contain 0 working days (weekends or holidays are automatically exempted by policy).'
    }
    if (selectedType?.code !== 'UPL' && workingDays > availableDays) {
      return `Insufficient leave balance (${availableDays} days available, but requested ${workingDays} days).`
    }
    if (overlapConflict) {
      return `Overlaps with existing leave request (${overlapConflict.request_number}: ${overlapConflict.start_date} to ${overlapConflict.end_date}).`
    }
    if (reason.trim().length < 3) {
      return 'Please enter a reason for your leave (minimum 3 characters).'
    }
    return null
  }, [leaveTypeId, startDate, endDate, endDateStr, startDateStr, durationResult, selectedType, workingDays, availableDays, overlapConflict, reason])

  const canSubmit = !validationError && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !startDateStr || !endDateStr) return

    setSubmitting(true)
    try {
      const res = await submitLeave({
        leaveTypeId,
        startDate: startDateStr,
        endDate: endDateStr,
        dayType,
        reason: reason.trim(),
        handoverNotes: handoverNotes.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
      })

      if (!res.success || !res.request) {
        toast.error(res.error || 'Failed to submit leave request')
        setSubmitting(false)
        return
      }

      toast.success(`Leave application ${res.request.request_number} submitted! Routed to manager for review.`)
      router.push('/employee/my-leaves')
    } catch (err: any) {
      toast.error(err?.message || 'An error occurred during submission.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Apply for Leave</h1>
        <p className="text-sm text-[#475569] mt-1">
          Complete the application below. Working days and holidays are computed automatically against your work schedule.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Clean 2-Section Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* SECTION 1: Leave Information */}
            <Card className="border-[#E5E7EB] shadow-subtle bg-white rounded-xl">
              <CardHeader className="pb-4 border-b border-[#F1F3F5]">
                <CardTitle className="text-sm font-bold text-[#111827]">1. Leave Category & Schedule</CardTitle>
                <CardDescription className="text-xs text-[#64748B]">
                  Choose your leave category, date range and schedule type
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                {/* Leave Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="leaveType" className="text-xs font-semibold text-[#111827]">
                    Leave Type <span className="text-[#991B1B]">*</span>
                  </Label>
                  <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                    <SelectTrigger id="leaveType" className="w-full h-10 border-[#E5E7EB] bg-white text-[#111827]">
                      <SelectValue placeholder="Select leave category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#E5E7EB] text-[#111827]">
                      {state.leaveTypes.map((type) => {
                        const bal = myBalances.find((b) => b.leave_type_id === type.id)
                        const avail = bal ? bal.available_balance : 0
                        return (
                          <SelectItem key={type.id} value={type.id} className="cursor-pointer hover:bg-[#F1F3F5]">
                            <div className="flex items-center justify-between w-full gap-4">
                              <span className="font-medium text-[#111827]">
                                {type.name} ({type.code})
                              </span>
                              <span className="text-xs font-semibold text-[#475569] bg-[#F1F3F5] px-2 py-0.5 rounded-full">
                                {avail} days left
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#111827]">
                      Start Date <span className="text-[#991B1B]">*</span>
                    </Label>
                    <DatePicker
                      value={startDate}
                      dateFormat="EEE, MMM d, yyyy"
                      onChange={(date) => {
                        setStartDate(date)
                        if (!endDate || (date && endDate < date)) {
                          setEndDate(date)
                        }
                      }}
                      placeholder="Select start date"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#111827]">
                      End Date <span className="text-[#991B1B]">*</span>
                    </Label>
                    <DatePicker
                      value={endDate}
                      dateFormat="EEE, MMM d, yyyy"
                      onChange={setEndDate}
                      minDate={startDate}
                      placeholder="Select end date"
                    />
                  </div>
                </div>

                {/* Inline Working Day / Weekend Feedback */}
                {startDate && endDate && durationResult && (
                  <div
                    className={cn(
                      'p-3 rounded-lg text-xs font-medium border flex items-center justify-between transition-all',
                      durationResult.workingDays > 0
                        ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                        : 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {durationResult.workingDays > 0 ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-[#166534] shrink-0" />
                          <span>
                            <strong>
                              {durationResult.workingDays} Working Day{durationResult.workingDays > 1 ? 's' : ''}
                            </strong>
                            {durationResult.skippedWeekends > 0 &&
                              ` (${durationResult.skippedWeekends} weekend day${
                                durationResult.skippedWeekends > 1 ? 's' : ''
                              } exempted)`}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-[#92400E] shrink-0" />
                          <span>
                            <strong>Weekend days selected (0 working days).</strong> Weekends are non-working days off.
                          </span>
                        </>
                      )}
                    </div>
                    {durationResult.workingDays <= 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setStartDate(new Date(2026, 10, 24))
                          setEndDate(new Date(2026, 10, 25))
                        }}
                        className="underline font-semibold hover:text-[#78350F] ml-2 shrink-0 cursor-pointer text-xs"
                      >
                        Try Nov 24–25 (Working Days)
                      </button>
                    )}
                  </div>
                )}

                {/* Day Schedule Selection */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#111827]">Day Schedule</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'FULL_DAY', label: 'Full Day' },
                      { id: 'HALF_DAY_AM', label: 'Half Day (AM)' },
                      { id: 'HALF_DAY_PM', label: 'Half Day (PM)' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDayType(item.id as DayType)}
                        className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center cursor-pointer ${
                          dayType === item.id
                            ? 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB] font-semibold shadow-xs'
                            : 'border-[#E5E7EB] bg-white text-[#475569] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 2: Additional Information */}
            <Card className="border-[#E5E7EB] shadow-subtle bg-white rounded-xl">
              <CardHeader className="pb-4 border-b border-[#F1F3F5]">
                <CardTitle className="text-sm font-bold text-[#111827]">2. Justification & Handover Notes</CardTitle>
                <CardDescription className="text-xs text-[#64748B]">
                  Provide reason and optional team contact coverage
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                {/* Reason */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="reason" className="text-xs font-semibold text-[#111827]">
                      Reason for Leave <span className="text-[#991B1B]">*</span>
                    </Label>
                    <span className="text-[11px] text-[#64748B]">Min 3 characters</span>
                  </div>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter the justification for this leave request..."
                    rows={3}
                    className="border-[#E5E7EB] text-sm resize-none focus:border-[#2563EB]"
                  />
                </div>

                {/* Handover & Emergency Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="handover" className="text-xs font-semibold text-[#111827]">
                      Work Handover Note (Optional)
                    </Label>
                    <Input
                      id="handover"
                      value={handoverNotes}
                      onChange={(e) => setHandoverNotes(e.target.value)}
                      placeholder="e.g. Rahul covering sprint tickets"
                      className="border-[#E5E7EB] text-sm h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="emergency" className="text-xs font-semibold text-[#111827]">
                      Emergency Phone / Contact (Optional)
                    </Label>
                    <Input
                      id="emergency"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="border-[#E5E7EB] text-sm h-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Apple-Style Live Calculation Summary (5 cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
            <Card className="border-[#E5E7EB] shadow-subtle bg-white rounded-xl overflow-hidden">
              {/* Working Days Callout Header */}
              <div className="p-5 bg-[#F8FAFC] border-b border-[#E5E7EB]">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#64748B] font-semibold">
                    Calculated Working Days
                  </span>
                  <span className="text-xs bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded-full font-semibold">
                    {dayType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tabular-nums tracking-tight text-[#111827]">
                    {workingDays}
                  </span>
                  <span className="text-sm font-medium text-[#475569]">Working Day(s)</span>
                </div>
                {durationResult && (
                  <p className="text-xs text-[#64748B] mt-1">
                    {durationResult.totalCalendarDays} calendar day(s) • {durationResult.skippedWeekends} weekend(s) & {durationResult.skippedHolidays} holiday(s) exempted
                  </p>
                )}
              </div>

              <CardContent className="p-5 space-y-5">
                {/* Balance Impact */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Balance Impact</p>
                  <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
                    <div>
                      <p className="text-[11px] text-[#64748B] font-medium">Available Balance</p>
                      <p className="text-lg font-bold text-[#111827] tabular-nums">{availableDays} d</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#64748B] font-medium">Remaining After</p>
                      <p className={`text-lg font-bold tabular-nums ${workingDays > availableDays && selectedType?.code !== 'UPL' ? 'text-[#991B1B]' : 'text-[#166534]'}`}>
                        {remainingAfterApproval} d
                      </p>
                    </div>
                  </div>
                </div>

                {/* Day-by-Day Breakdown */}
                {durationResult && durationResult.breakdown.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Date Breakdown</p>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {durationResult.breakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between py-1.5 px-2.5 rounded-md border ${
                            item.isWorkingDay
                              ? 'bg-[#DCFCE7] border-[#BBF7D0] text-[#166534]'
                              : 'bg-[#F1F5F9] border-[#E5E7EB] text-[#475569]'
                          }`}
                        >
                          <span className="font-mono font-medium text-[11px]">{item.date}</span>
                          <span className="text-[11px] font-semibold">
                            {item.isWorkingDay ? 'Working Day' : (item.reason || 'Weekly Off')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval Route */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Approval Hierarchy</p>
                  <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] flex items-center justify-between text-xs font-medium text-[#334155]">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-[#2563EB]" />
                      <span>Reporting Manager</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#94A3B8]" />
                    <div className="flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-[#2563EB]" />
                      <span>HR Sign-Off</span>
                    </div>
                  </div>
                </div>

                {/* Validation Notice Banner */}
                {validationError && (
                  <div className="rounded-lg border border-[#FDE68A] bg-[#FEF3C7] p-3 space-y-2.5 text-xs text-[#92400E]">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="h-4 w-4 text-[#92400E] shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-medium">{validationError}</p>
                    </div>
                    {durationResult && durationResult.workingDays <= 0 && (
                      <div className="pl-6">
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate(new Date(2026, 10, 24))
                            setEndDate(new Date(2026, 10, 25))
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#D97706] hover:bg-[#B45309] text-white font-medium text-xs transition-colors shadow-xs cursor-pointer"
                        >
                          <span>Switch to Working Days (Nov 24 – 25, 2026 · 2 Days)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {!validationError && startDate && endDate && (
                  <div className="rounded-lg border border-[#BBF7D0] bg-[#DCFCE7] p-3 flex items-center gap-2.5 text-xs text-[#166534] font-medium">
                    <CheckCircle2 className="h-4 w-4 text-[#166534] shrink-0" />
                    <span>Application parameters verified and ready to submit.</span>
                  </div>
                )}

                {/* Submit Action */}
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-lg shadow-subtle transition-all gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting to PostgreSQL...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Leave Application
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
