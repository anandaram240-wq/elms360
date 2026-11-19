'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfDay } from 'date-fns'
import {
  Calendar,
  Clock,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/shared/date-picker'
import { FileUpload } from '@/components/shared/file-upload'
import {
  calculateLeaveDuration,
  submitLeaveApplication,
  uploadLeaveAttachment,
  LeaveCalculationResult,
} from '@/app/actions/employee/leave-actions'
import { useLeaveTypes } from '@/hooks/queries/use-employee-queries'
import { DayType } from '@/types/app'

export default function ApplyLeavePage() {
  const router = useRouter()
  const { data: leaveTypes = [], isLoading: loadingTypes } = useLeaveTypes()

  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1)

  // Step 1 State
  const [leaveTypeId, setLeaveTypeId] = React.useState<string>('')
  const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)
  const [dayType, setDayType] = React.useState<DayType>('FULL_DAY')
  const [reason, setReason] = React.useState<string>('')

  // Step 2 Calculation & Documents
  const [calculating, setCalculating] = React.useState(false)
  const [calcResult, setCalcResult] = React.useState<LeaveCalculationResult | null>(null)
  const [attachedFile, setAttachedFile] = React.useState<File | null>(null)

  // Step 3 Additional Information
  const [handoverNotes, setHandoverNotes] = React.useState<string>('')
  const [emergencyContact, setEmergencyContact] = React.useState<string>('')
  const [contactDuringLeave, setContactDuringLeave] = React.useState<string>('')

  // Step 4 Confirmation
  const [confirmed, setConfirmed] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // Selected leave type details
  const selectedType = leaveTypes.find((t) => t.leaveTypeId === leaveTypeId)

  // Step 1 Validation
  const canProceedStep1 =
    Boolean(leaveTypeId) &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    Boolean(startDate && endDate && endDate >= startDate) &&
    reason.trim().length >= 20

  // Calculate duration when moving to Step 2
  const handleProceedToStep2 = async () => {
    if (!startDate || !endDate || !leaveTypeId) return

    setCalculating(true)
    try {
      const result = await calculateLeaveDuration({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        dayType,
        leaveTypeId,
      })
      setCalcResult(result)
      setStep(2)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to calculate leave duration')
    } finally {
      setCalculating(false)
    }
  }

  // Handle final submission
  const handleSubmit = async () => {
    if (!confirmed) {
      toast.error('Please confirm the accuracy of your application.')
      return
    }

    if (!startDate || !endDate || !leaveTypeId) return

    setSubmitting(true)
    try {
      const result = await submitLeaveApplication({
        leaveTypeId,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        dayType,
        reason: reason.trim(),
        handoverNotes: handoverNotes.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        contactDuringLeave: contactDuringLeave.trim() || undefined,
      })

      if (!result.success || !result.requestId) {
        toast.error(result.error || 'Failed to submit leave application')
        setSubmitting(false)
        return
      }

      // If there is an attachment, upload it
      if (attachedFile) {
        const formData = new FormData()
        formData.append('file', attachedFile)
        await uploadLeaveAttachment(result.requestId, formData)
      }

      toast.success(result.message || 'Leave request submitted successfully!')
      router.push('/employee/my-leaves')
    } catch (err: any) {
      toast.error(err?.message || 'An error occurred during submission.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Apply for Leave
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete the steps below to submit your leave application for approval.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="grid grid-cols-4 gap-2 border-b pb-4">
        {[
          { num: 1, title: 'Basic Details', icon: Calendar },
          { num: 2, title: 'Duration Preview', icon: Clock },
          { num: 3, title: 'Handover & Contacts', icon: FileText },
          { num: 4, title: 'Review & Submit', icon: CheckCircle2 },
        ].map((s) => {
          const isCurrent = step === s.num
          const isDone = step > s.num
          const Icon = s.icon

          return (
            <div
              key={s.num}
              className={`flex items-center gap-2.5 transition-colors ${
                isCurrent
                  ? 'text-primary font-semibold'
                  : isDone
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : isDone
                    ? 'bg-green-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.num}
              </div>
              <div className="hidden sm:block text-xs">
                <p className="leading-tight">{s.title}</p>
                <p className="text-[10px] text-muted-foreground">Step {s.num} of 4</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* STEP 1: Basic Details */}
      {step === 1 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Step 1: Leave Details</CardTitle>
            <CardDescription>
              Select leave category, date range, day schedule, and enter your justification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Leave Type Select */}
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type <span className="text-destructive">*</span></Label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                <SelectTrigger id="leaveType" className="w-full">
                  <SelectValue placeholder={loadingTypes ? 'Loading leave types...' : 'Select leave category'} />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.leaveTypeId} value={type.leaveTypeId}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium">{type.leaveTypeName} ({type.leaveTypeCode})</span>
                        <span className="text-xs text-muted-foreground">
                          Available: {type.availableBalance} days
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <span
                    className="h-2 w-2 rounded-full inline-block"
                    style={{ backgroundColor: selectedType.color }}
                  />
                  <span>
                    Current available balance: <strong>{selectedType.availableBalance} days</strong> (Used: {selectedType.used} d, Pending: {selectedType.pending} d)
                  </span>
                </div>
              )}
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date <span className="text-destructive">*</span></Label>
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
                <Label>End Date <span className="text-destructive">*</span></Label>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  minDate={startDate}
                  placeholder="Select end date"
                />
              </div>
            </div>

            {/* Day Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="dayType">Day Schedule</Label>
              <Select value={dayType} onValueChange={(val) => setDayType(val as DayType)}>
                <SelectTrigger id="dayType">
                  <SelectValue placeholder="Schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_DAY">Full Day</SelectItem>
                  <SelectItem value="HALF_DAY_AM">Half Day - Morning (First Half)</SelectItem>
                  <SelectItem value="HALF_DAY_PM">Half Day - Afternoon (Second Half)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason Textarea */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="reason">
                  Reason for Leave <span className="text-destructive">*</span>
                </Label>
                <span className={`text-xs ${reason.trim().length < 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {reason.trim().length}/20 min chars
                </span>
              </div>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain the reason for your leave application in detail (min 20 characters)..."
                rows={4}
              />
              {reason.trim().length > 0 && reason.trim().length < 20 && (
                <p className="text-xs text-destructive">
                  Please enter at least {20 - reason.trim().length} more characters.
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => router.push('/employee/my-leaves')}>
              Cancel
            </Button>
            <Button
              onClick={handleProceedToStep2}
              disabled={!canProceedStep1 || calculating}
              className="gap-2"
            >
              {calculating && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue to Duration Preview
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 2: Duration Preview & Document Upload */}
      {step === 2 && calcResult && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Step 2: Duration Preview & Policy Check</CardTitle>
            <CardDescription>
              Review calculated working days, policy compliance, and attach supporting medical or travel documents if needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Duration Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/40 border">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Working Days</p>
                <p className="text-2xl font-bold text-primary">{calcResult.workingDays} d</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Skipped Weekends</p>
                <p className="text-lg font-semibold text-foreground">{calcResult.weekends} d</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Skipped Holidays</p>
                <p className="text-lg font-semibold text-foreground">{calcResult.holidays} d</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Remaining Balance</p>
                <p className={`text-lg font-semibold ${calcResult.remainingBalance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {calcResult.remainingBalance} d
                </p>
              </div>
            </div>

            {/* Policy Warnings Alert */}
            {calcResult.policyWarnings.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Policy Compliance Notices</span>
                </div>
                <ul className="list-disc list-inside text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  {calcResult.policyWarnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Approval Route */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Approval Route</Label>
              <div className="flex flex-wrap items-center gap-2 p-3 bg-card border rounded-lg">
                {calcResult.approvalRoute.map((stepName, i) => (
                  <React.Fragment key={i}>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground bg-muted px-2.5 py-1 rounded-md">
                      <UserCheck className="h-3.5 w-3.5 text-primary" />
                      <span>{stepName}</span>
                    </div>
                    {i < calcResult.approvalRoute.length - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Supporting Document Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Supporting Document (Optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Required for sick leave exceeding 2 consecutive days, or maternity / bereavement leaves.
              </p>
              <FileUpload
                value={attachedFile}
                onChange={setAttachedFile}
                accept="image/png,image/jpeg,application/pdf"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => setStep(3)} className="gap-2">
              Continue to Additional Info
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 3: Additional Information */}
      {step === 3 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Step 3: Handover & Emergency Contact</CardTitle>
            <CardDescription>
              Help your teammates manage responsibilities while you are away.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="handover">Work Handover Notes</Label>
              <Textarea
                id="handover"
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Mention tasks assigned, pending deadlines, or who will cover for you during this leave period..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency">Emergency Contact (Phone / Name)</Label>
                <Input
                  id="emergency"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Spouse (+91 9876543210)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactDuring">Contact During Leave (Optional)</Label>
                <Input
                  id="contactDuring"
                  value={contactDuringLeave}
                  onChange={(e) => setContactDuringLeave(e.target.value)}
                  placeholder="e.g. Email available intermittently"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button onClick={() => setStep(4)} className="gap-2">
              Review Application
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* STEP 4: Review & Submit */}
      {step === 4 && calcResult && selectedType && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Step 4: Final Review & Confirmation</CardTitle>
            <CardDescription>
              Please verify all leave information carefully before submitting for manager approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border p-4 bg-muted/20 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Leave Category</p>
                <p className="font-semibold text-foreground flex items-center gap-2 mt-0.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: selectedType.color }}
                  />
                  {selectedType.leaveTypeName} ({selectedType.leaveTypeCode})
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Duration & Schedule</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {calcResult.workingDays} working day(s) ({dayType.replace(/_/g, ' ')})
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Dates</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {startDate && format(startDate, 'dd MMM yyyy')} —{' '}
                  {endDate && format(endDate, 'dd MMM yyyy')}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Balance Impact</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {calcResult.currentBalance} d → {calcResult.remainingBalance} d
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Reason</p>
                <p className="text-foreground mt-0.5 bg-background p-2.5 rounded border">
                  {reason}
                </p>
              </div>

              {handoverNotes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Handover Notes</p>
                  <p className="text-foreground mt-0.5 bg-background p-2.5 rounded border">
                    {handoverNotes}
                  </p>
                </div>
              )}

              {attachedFile && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Attached Document</p>
                  <p className="text-foreground font-medium mt-0.5">
                    📎 {attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-card">
              <Checkbox
                id="confirmCheckbox"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="confirmCheckbox"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  I confirm that all entered information is accurate and complies with company leave policies.
                </label>
                <p className="text-xs text-muted-foreground">
                  Submitting will notify your manager and reserve your leave balance.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!confirmed || submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Leave Application
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
