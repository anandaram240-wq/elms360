'use client'

import * as React from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import {
  PieChart,
  Calendar,
  Info,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarPlus,
  ShieldCheck,
  FileText,
  Clock,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { LeaveBalanceCard } from '@/components/shared/leave-balance-card'
import {
  getMyLeaveBalances,
  getLeaveBalanceLedger,
  getLeavePolicyDetails,
} from '@/app/actions/employee/leave-actions'
import { LeaveBalanceDisplay } from '@/types/app'

export default function LeaveBalancePage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear)
  const [balances, setBalances] = React.useState<LeaveBalanceDisplay[]>([])
  const [loadingBalances, setLoadingBalances] = React.useState(true)

  // Ledger state
  const [selectedTypeForLedger, setSelectedTypeForLedger] = React.useState<string>('ALL')
  const [ledgerEntries, setLedgerEntries] = React.useState<any[]>([])
  const [loadingLedger, setLoadingLedger] = React.useState(true)

  // Policy Modal state
  const [policyModalOpen, setPolicyModalOpen] = React.useState(false)
  const [policyDetails, setPolicyDetails] = React.useState<any>(null)
  const [loadingPolicy, setLoadingPolicy] = React.useState(false)

  // Fetch balances when year changes
  React.useEffect(() => {
    let isMounted = true
    setLoadingBalances(true)
    getMyLeaveBalances(selectedYear)
      .then((data) => {
        if (isMounted) setBalances(data)
      })
      .catch((err) => {
        toast.error('Failed to load leave balances')
      })
      .finally(() => {
        if (isMounted) setLoadingBalances(false)
      })
    return () => {
      isMounted = false
    }
  }, [selectedYear])

  // Fetch ledger entries
  React.useEffect(() => {
    let isMounted = true
    setLoadingLedger(true)
    getLeaveBalanceLedger(selectedTypeForLedger, selectedYear)
      .then((entries) => {
        if (isMounted) setLedgerEntries(entries)
      })
      .catch((err) => {
        console.error('Failed to load ledger', err)
      })
      .finally(() => {
        if (isMounted) setLoadingLedger(false)
      })
    return () => {
      isMounted = false
    }
  }, [selectedTypeForLedger, selectedYear])

  // View policy modal
  const handleViewPolicy = async (leaveTypeId: string) => {
    setLoadingPolicy(true)
    setPolicyModalOpen(true)
    try {
      const details = await getLeavePolicyDetails(leaveTypeId)
      setPolicyDetails(details)
    } catch (err: any) {
      toast.error('Could not load policy details')
    } finally {
      setLoadingPolicy(false)
    }
  }

  const years = [currentYear, currentYear - 1, currentYear - 2]

  return (
    <div className="space-y-8 pb-16">
      {/* Header with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <PieChart className="h-6 w-6 text-primary" />
            Leave Balances & Quota
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View allocated leave quotas, accrued days, utilized balances, and full transaction history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-36">
            <Select
              value={String(selectedYear)}
              onValueChange={(val) => setSelectedYear(Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Fiscal Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    Fiscal Year {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button asChild className="gap-2 bg-primary text-primary-foreground font-medium">
            <Link href="/employee/apply-leave">
              <CalendarPlus className="h-4 w-4" />
              Apply Leave
            </Link>
          </Button>
        </div>
      </div>

      {/* Visual Balance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingBalances ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Loading balances for FY {selectedYear}...
          </div>
        ) : balances.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No leave balances found for fiscal year {selectedYear}.
          </div>
        ) : (
          balances.map((b) => (
            <LeaveBalanceCard
              key={b.leaveTypeId}
              leaveTypeName={b.leaveTypeName}
              color={b.color}
              available={b.availableBalance}
              total={b.openingBalance + b.accrued + b.carriedForward}
              used={b.used}
              pending={b.pending}
            />
          ))
        )}
      </div>

      {/* Balance Summary Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Detailed Leave Balance Breakdown
          </CardTitle>
          <CardDescription>
            Formula: Available = (Opening + Accrued + Carry Forward + Adjusted) - Used - Pending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4 text-right">Opening</th>
                  <th className="py-3 px-4 text-right">Accrued</th>
                  <th className="py-3 px-4 text-right">Carried Fwd</th>
                  <th className="py-3 px-4 text-right">Adjusted</th>
                  <th className="py-3 px-4 text-right">Used</th>
                  <th className="py-3 px-4 text-right">Pending</th>
                  <th className="py-3 px-4 text-right font-bold text-foreground">Available</th>
                  <th className="py-3 px-4 text-right">Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {balances.map((b) => (
                  <tr key={b.leaveTypeId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className="font-semibold text-foreground">{b.leaveTypeName}</span>
                        <Badge variant="outline" className="text-[10px] font-mono ml-1">
                          {b.leaveTypeCode}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                      {b.openingBalance}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                      {b.accrued}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                      {b.carriedForward}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                      {b.adjusted}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-rose-600 font-medium">
                      {b.used}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-600 font-medium">
                      {b.pending}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-base text-primary">
                      {b.availableBalance}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPolicy(b.leaveTypeId)}
                        className="text-xs gap-1"
                      >
                        <Info className="h-3.5 w-3.5 text-primary" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ledger History Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Leave Balance Ledger Transactions
            </CardTitle>
            <CardDescription>
              Audit trail of every accrual, debit, pending reservation, and carry-forward adjustment
            </CardDescription>
          </div>

          <div className="w-56">
            <Select
              value={selectedTypeForLedger}
              onValueChange={setSelectedTypeForLedger}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {balances.map((b) => (
                  <SelectItem key={b.leaveTypeId} value={b.leaveTypeId}>
                    {b.leaveTypeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Balance Before</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                  <th className="py-3 px-4">Reason / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingLedger ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Loading ledger entries...
                    </td>
                  </tr>
                ) : ledgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No ledger transactions found for this selection.
                    </td>
                  </tr>
                ) : (
                  ledgerEntries.map((entry) => {
                    const isCredit = ['OPENING', 'ACCRUAL', 'CARRY_FORWARD', 'REVERSAL', 'PENDING_RELEASE'].includes(
                      entry.transactionType
                    )

                    return (
                      <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
                          {format(parseISO(entry.createdAt), 'dd MMM yyyy, h:mm a')}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: entry.leaveTypeColor }}
                            />
                            <span>{entry.leaveTypeName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {entry.transactionType.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          <span className={isCredit ? 'text-emerald-600' : 'text-rose-600'}>
                            {isCredit ? '+' : '-'}{entry.amount} d
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                          {entry.balanceBefore}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                          {entry.balanceAfter}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground max-w-xs truncate">
                          {entry.reason || '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Policy Details Dialog */}
      <Dialog open={policyModalOpen} onOpenChange={setPolicyModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Leave Policy Rules
            </DialogTitle>
            <DialogDescription>
              Rules governing accrual, notice windows, and documentation
            </DialogDescription>
          </DialogHeader>

          {loadingPolicy ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading policy rules...
            </div>
          ) : policyDetails ? (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                <p className="font-semibold text-base text-foreground">
                  {policyDetails.leave_types?.name} ({policyDetails.leave_types?.code})
                </p>
                <p className="text-xs text-muted-foreground">
                  {policyDetails.leave_types?.description || 'Standard corporate leave policy'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground font-medium">Annual Entitlement</p>
                  <p className="text-lg font-bold text-primary mt-0.5">
                    {policyDetails.annual_entitlement} days
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground font-medium">Accrual Frequency</p>
                  <p className="text-base font-semibold text-foreground mt-0.5">
                    {policyDetails.accrual_type}
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground font-medium">Max Consecutive Days</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {policyDetails.max_consecutive_days ? `${policyDetails.max_consecutive_days} days` : 'No limit'}
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground font-medium">Min Advance Notice</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {policyDetails.min_notice_days > 0 ? `${policyDetails.min_notice_days} days` : 'No notice required'}
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground font-medium">Carry Forward</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {policyDetails.carry_forward_enabled
                      ? `Enabled (Max: ${policyDetails.carry_forward_max_days || 0} d)`
                      : 'Disabled'}
                  </p>
                </div>

                <div className="p-3 border rounded-lg">
                  <p className="text-muted-foreground font-medium">Backdated Application</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {policyDetails.allows_backdated
                      ? `Allowed (Up to ${policyDetails.backdated_max_days || 0} days)`
                      : 'Not Allowed'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant={policyDetails.leave_types?.is_paid ? 'default' : 'secondary'}>
                  {policyDetails.leave_types?.is_paid ? 'Paid Leave' : 'Unpaid Leave'}
                </Badge>
                <Badge variant={policyDetails.leave_types?.allows_half_day ? 'outline' : 'secondary'}>
                  {policyDetails.leave_types?.allows_half_day ? 'Half-Day Allowed' : 'Full-Day Only'}
                </Badge>
                {policyDetails.leave_types?.requires_document && (
                  <Badge variant="destructive">Supporting Document Mandatory</Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No detailed policy configuration is recorded for this category.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
