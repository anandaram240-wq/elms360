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
  ShieldAlert,
  Send,
  Building,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
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
    if (!leaveTypeId) return 'Please choose a leave category.'
    if (!startDate || !endDate) return 'Please select both start and end dates.'
    if (endDateStr < startDateStr) return 'End date cannot be earlier than start date.'
    if (durationResult && durationResult.workingDays <= 0) {
      return 'The selected dates contain 0 working days (weekends or holidays are automatically exempted).'
    }
    if (selectedType?.code !== 'LOP' && workingDays > availableDays) {
      return `Insufficient leave balance (${availableDays} days available, but requested ${workingDays} days).`
    }
    if (overlapConflict) {
      return `Overlaps with existing leave request (${overlapConflict.request_number}: ${overlapConflict.start_date} to ${overlapConflict.end_date}).`
    }
    if (reason.trim().length < 3) {
      return 'Please enter a justification (minimum 3 characters).'
    }
    return null
  }, [leaveTypeId, startDate, endDate, endDateStr, startDateStr, durationResult, selectedType, workingDays, availableDays, overlapConflict, reason])

  const canSubmit = !validationError && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !startDateStr || !endDateStr) return

    setSubmitting(true)
    try {
      const res = submitLeave({
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

      toast.success(`Leave request ${res.request.request_number} submitted successfully! Routed to manager for approval.`)
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Apply for Leave</h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit your leave application for manager and HR approval. Working days are computed automatically based on your schedule.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Clean Single-Page Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-base font-semibold text-slate-900">1. Leave Category & Schedule</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Select the applicable leave policy and duration
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Leave Type */}
                <div className="space-y-2">
                  <Label htmlFor="leaveType" className="text-xs font-semibold text-slate-700">
                    Leave Type <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                    <SelectTrigger id="leaveType" className="w-full h-10 border-slate-200">
                      <SelectValue placeholder="Select leave category" />
                    </SelectTrigger>
                    <SelectContent>
                      {state.leaveTypes.map((type) => {
                        const bal = myBalances.find((b) => b.leave_type_id === type.id)
                        const avail = bal ? bal.available_balance : 0
                        return (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center justify-between w-full gap-4">
                              <span className="font-medium text-slate-800">
                                {type.name} ({type.code})
                              </span>
                              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {avail} days available
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
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">
                      Start Date <span className="text-rose-500">*</span>
                    </Label>
                    <DatePicker
                      value={startDate}
                      onChange={(date) => {
                        setStartDate(date)
                        if (!endDate || (date && endDate < date)) {
                          setEndDate(date)
                        }
                      }}
                      placeholder="Select start date"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">
                      End Date <span className="text-rose-500">*</span>
                    </Label>
                    <DatePicker
                      value={endDate}
                      onChange={setEndDate}
                      minDate={startDate}
                      placeholder="Select end date"
                    />
                  </div>
                </div>

                {/* Day Schedule Toggle */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700">Day Schedule</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'FULL_DAY', label: 'Full Day' },
                      { id: 'HALF_DAY_AM', label: 'Half Day (Morning)' },
                      { id: 'HALF_DAY_PM', label: 'Half Day (Afternoon)' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDayType(item.id as DayType)}
                        className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all text-center ${
                          dayType === item.id
                            ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="text-base font-semibold text-slate-900">2. Justification & Handover</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Provide reason and optional team contact coverage
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Reason */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="reason" className="text-xs font-semibold text-slate-700">
                      Reason for Leave <span className="text-rose-500">*</span>
                    </Label>
                    <span className="text-[11px] text-slate-400">Min 3 characters</span>
                  </div>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe the reason for your leave request..."
                    rows={3}
                    className="border-slate-200 text-sm resize-none"
                  />
                </div>

                {/* Optional Handover & Emergency Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="handover" className="text-xs font-semibold text-slate-700">
                      Work Handover Note (Optional)
                    </Label>
                    <Input
                      id="handover"
                      value={handoverNotes}
                      onChange={(e) => setHandoverNotes(e.target.value)}
                      placeholder="e.g. Rahul covering sprint tasks"
                      className="border-slate-200 text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency" className="text-xs font-semibold text-slate-700">
                      Emergency Phone / Contact (Optional)
                    </Label>
                    <Input
                      id="emergency"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="border-slate-200 text-sm h-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live Calculation & Summary Card (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="bg-slate-900 text-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                    Live Calculation Preview
                  </span>
                  <span className="text-xs bg-slate-800 text-blue-300 px-2 py-0.5 rounded font-mono">
                    {dayType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tabular-nums tracking-tight text-white">
                    {workingDays}
                  </span>
                  <span className="text-slate-300 font-medium text-sm">Working Day(s)</span>
                </div>
                {durationResult && (
                  <p className="text-xs text-slate-400 mt-1">
                    {durationResult.totalCalendarDays} total calendar days ({durationResult.skippedWeekends} weekends, {durationResult.skippedHolidays} holidays exempted)
                  </p>
                )}
              </div>

              <CardContent className="p-6 space-y-6">
                {/* Balance Impact */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Balance Impact</p>
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">Current Available</p>
                      <p className="text-lg font-bold text-slate-800 tabular-nums">{availableDays} d</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 font-medium">After Approval</p>
                      <p className={`text-lg font-bold tabular-nums ${workingDays > availableDays ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {remainingAfterApproval} d
                      </p>
                    </div>
                  </div>
                </div>

                {/* Day-by-Day Breakdown */}
                {durationResult && durationResult.breakdown.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Calendar Schedule</p>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {durationResult.breakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between py-1.5 px-2.5 rounded-md ${
                            item.isWorkingDay ? 'bg-blue-50/60 text-blue-900' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span className="font-medium font-mono text-[11px]">{item.date}</span>
                          <span className="text-[11px]">
                            {item.isWorkingDay ? (
                              <span className="text-emerald-700 font-semibold">Working Day</span>
                            ) : (
                              <span className="text-slate-500 italic">{item.reason || 'Off'}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval Route */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approval Chain</p>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs font-medium text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      <span>Reporting Manager</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    <div className="flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-blue-600" />
                      <span>HR Department</span>
                    </div>
                  </div>
                </div>

                {/* Validation Notice Banner */}
                {validationError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{validationError}</p>
                  </div>
                )}

                {!validationError && startDate && endDate && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Application is ready for submission.</span>
                  </div>
                )}

                {/* Submit Action */}
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Application...
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
