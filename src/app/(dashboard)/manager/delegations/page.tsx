'use client'

import * as React from 'react'
import {
  getMyDelegations,
  getEligibleDelegates,
  delegateApproval,
  cancelDelegation,
} from '@/app/actions/manager/approval-actions'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  UserCheck,
  Plus,
  RefreshCw,
  Calendar,
  XCircle,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'

export default function ManagerDelegationsPage() {
  const [delegations, setDelegations] = React.useState<any[]>([])
  const [eligibleDelegates, setEligibleDelegates] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // New Delegation Form state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [delegateId, setDelegateId] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [reason, setReason] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Cancel confirmation state
  const [cancelTargetId, setCancelTargetId] = React.useState<string | null>(null)
  const [isCancelling, setIsCancelling] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [delData, delegates] = await Promise.all([
        getMyDelegations(),
        getEligibleDelegates(),
      ])
      setDelegations(delData)
      setEligibleDelegates(delegates)
    } catch (err) {
      console.error('Failed to load delegations:', err)
      toast.error('Failed to load delegations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateDelegation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!delegateId) {
      toast.error('Please select an employee to delegate to')
      return
    }
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates')
      return
    }
    if (startDate > endDate) {
      toast.error('End date cannot be earlier than start date')
      return
    }
    if (!reason.trim()) {
      toast.error('Please enter a delegation reason')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await delegateApproval({
        delegateEmployeeId: delegateId,
        startDate,
        endDate,
        reason: reason.trim(),
      })

      if (res.success) {
        toast.success('Approval authority delegated successfully!')
        setIsCreateOpen(false)
        setDelegateId('')
        setStartDate('')
        setEndDate('')
        setReason('')
        loadData()
      } else {
        toast.error(res.error || 'Failed to create delegation')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating delegation'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return
    setIsCancelling(true)

    try {
      const res = await cancelDelegation(cancelTargetId)
      if (res.success) {
        toast.success('Delegation cancelled successfully')
        setCancelTargetId(null)
        loadData()
      } else {
        toast.error(res.error || 'Failed to cancel delegation')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error cancelling delegation'
      toast.error(msg)
    } finally {
      setIsCancelling(false)
    }
  }

  const activeDelegations = delegations.filter((d) => d.status === 'ACTIVE' || d.status === 'SCHEDULED')
  const pastDelegations = delegations.filter((d) => d.status === 'EXPIRED' || d.status === 'CANCELLED')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Delegations"
        description="Temporarily delegate your leave approval authority to a peer or deputy when you are out of office."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 shadow-sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" /> New Delegation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData()}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Active Delegations Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-primary" />
            Active & Scheduled Delegations
          </CardTitle>
          <CardDescription>Currently active or upcoming delegations of your approval authority</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delegate</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-1 text-primary" />
                      Loading delegations...
                    </TableCell>
                  </TableRow>
                ) : activeDelegations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <ShieldCheck className="h-8 w-8 mx-auto mb-1 text-muted-foreground/60" />
                      <p className="font-medium text-foreground">No active delegations</p>
                      <p className="text-xs">You are currently handling all approvals directly.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  activeDelegations.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="font-semibold text-sm text-foreground">{d.delegateName}</div>
                        <div className="text-xs text-muted-foreground">{d.delegateCode}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {d.delegateDesignation || 'Staff'}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium text-foreground">{d.startDate}</span>
                        <span className="text-muted-foreground"> to </span>
                        <span className="font-medium text-foreground">{d.endDate}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {d.reason}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={d.status === 'ACTIVE' ? 'success' : 'warning'}
                          className="text-xs"
                        >
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-300 h-8"
                          onClick={() => setCancelTargetId(d.id)}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Past Delegations History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            Past Delegations History
          </CardTitle>
          <CardDescription>Completed or revoked approval delegations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Delegate</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Created On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pastDelegations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground text-xs">
                      No historical delegations recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  pastDelegations.map((d) => (
                    <TableRow key={d.id} className="opacity-75">
                      <TableCell>
                        <div className="font-semibold text-xs text-foreground">{d.delegateName}</div>
                        <div className="text-[11px] text-muted-foreground">{d.delegateCode}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {d.startDate} to {d.endDate}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {d.reason}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Delegation Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleCreateDelegation}>
            <DialogHeader>
              <DialogTitle>Delegate Approval Authority</DialogTitle>
              <DialogDescription>
                Assign another employee to approve leave requests on your behalf during your absence.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              {/* Select Delegate */}
              <div className="space-y-1.5">
                <Label htmlFor="delegate-select">Select Delegate</Label>
                <Select value={delegateId} onValueChange={setDelegateId}>
                  <SelectTrigger id="delegate-select" className="h-9">
                    <SelectValue placeholder="Choose colleague..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {eligibleDelegates.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.full_name} ({e.designation || 'Staff'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="del-start">Start Date</Label>
                  <Input
                    id="del-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="del-end">End Date</Label>
                  <Input
                    id="del-end"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <Label htmlFor="del-reason">Reason for Delegation</Label>
                <Textarea
                  id="del-reason"
                  rows={3}
                  placeholder="e.g., Annual leave / out of office without internet access"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Delegating...' : 'Assign Delegation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog open={Boolean(cancelTargetId)} onOpenChange={(open) => !open && setCancelTargetId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Delegation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this delegation? The delegate will immediately lose authority to act on your requests.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTargetId(null)} disabled={isCancelling}>
              Keep Active
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
            >
              {isCancelling ? 'Revoking...' : 'Yes, Revoke Authority'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
