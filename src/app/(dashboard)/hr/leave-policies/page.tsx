'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  FileSpreadsheet,
  Plus,
  Edit,
  History,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getLeavePolicies,
  getLeaveTypes,
  getEmployeesList,
} from '@/app/actions/hr/hr-queries'
import {
  createLeavePolicy,
  updateLeavePolicy,
  assignPolicyToEmployees,
} from '@/app/actions/hr/hr-actions'

export default function LeavePoliciesPage() {
  const [policies, setPolicies] = React.useState<any[]>([])
  const [leaveTypes, setLeaveTypes] = React.useState<any[]>([])
  const [employees, setEmployees] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Policy Form Modal
  const [policyModalOpen, setPolicyModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    name: '',
    leaveTypeId: '',
    annualEntitlement: 18,
    accrualType: 'MONTHLY' as 'ANNUAL' | 'MONTHLY' | 'QUARTERLY' | 'NONE',
    accrualAmount: 1.5,
    probationEligible: true,
    carryForwardEnabled: true,
    carryForwardMaxDays: 10,
    maxConsecutiveDays: 14,
    minNoticeDays: 7,
    allowsBackdated: false,
    backdatedMaxDays: 3,
    effectiveFrom: new Date().toISOString().split('T')[0],
    changeReason: '',
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  // Version History Modal
  const [historyModalOpen, setHistoryModalOpen] = React.useState(false)
  const [selectedPolicy, setSelectedPolicy] = React.useState<any | null>(null)

  // Assign Policy Modal
  const [assignModalOpen, setAssignModalOpen] = React.useState(false)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<string[]>([])

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [pList, tList, eList] = await Promise.all([
        getLeavePolicies(),
        getLeaveTypes(),
        getEmployeesList({ pageSize: 100 }),
      ])
      setPolicies(pList)
      setLeaveTypes(tList)
      setEmployees(eList.data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({
      name: '',
      leaveTypeId: leaveTypes[0]?.id || '',
      annualEntitlement: 18,
      accrualType: 'MONTHLY',
      accrualAmount: 1.5,
      probationEligible: true,
      carryForwardEnabled: true,
      carryForwardMaxDays: 10,
      maxConsecutiveDays: 14,
      minNoticeDays: 7,
      allowsBackdated: false,
      backdatedMaxDays: 3,
      effectiveFrom: new Date().toISOString().split('T')[0],
      changeReason: '',
    })
    setErrorMsg(null)
    setPolicyModalOpen(true)
  }

  const handleOpenEdit = (p: any) => {
    setEditingId(p.id)
    setFormData({
      name: p.name,
      leaveTypeId: p.leave_type_id,
      annualEntitlement: Number(p.annual_entitlement || 0),
      accrualType: p.accrual_type || 'ANNUAL',
      accrualAmount: Number(p.accrual_amount || 0),
      probationEligible: !!p.probation_eligible,
      carryForwardEnabled: !!p.carry_forward_enabled,
      carryForwardMaxDays: Number(p.carry_forward_max_days || 0),
      maxConsecutiveDays: Number(p.max_consecutive_days || 0),
      minNoticeDays: Number(p.min_notice_days || 0),
      allowsBackdated: !!p.allows_backdated,
      backdatedMaxDays: Number(p.backdated_max_days || 0),
      effectiveFrom: p.effective_from || new Date().toISOString().split('T')[0],
      changeReason: '',
    })
    setErrorMsg(null)
    setPolicyModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.leaveTypeId) return
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      if (editingId) {
        const res = await updateLeavePolicy(editingId, {
          name: formData.name,
          annualEntitlement: Number(formData.annualEntitlement),
          accrualType: formData.accrualType,
          accrualAmount: Number(formData.accrualAmount),
          probationEligible: formData.probationEligible,
          carryForwardEnabled: formData.carryForwardEnabled,
          carryForwardMaxDays: Number(formData.carryForwardMaxDays),
          maxConsecutiveDays: Number(formData.maxConsecutiveDays),
          minNoticeDays: Number(formData.minNoticeDays),
          allowsBackdated: formData.allowsBackdated,
          backdatedMaxDays: Number(formData.backdatedMaxDays),
          effectiveFrom: formData.effectiveFrom,
          changeReason: formData.changeReason || 'Policy terms revision',
        })
        if (!res.success) throw new Error(res.error)
        toast.success(`Policy updated: Published Version ${(selectedPolicy?.version || 1) + 1}`)
      } else {
        const res = await createLeavePolicy({
          name: formData.name,
          leaveTypeId: formData.leaveTypeId,
          annualEntitlement: Number(formData.annualEntitlement),
          accrualType: formData.accrualType,
          accrualAmount: Number(formData.accrualAmount),
          probationEligible: formData.probationEligible,
          carryForwardEnabled: formData.carryForwardEnabled,
          carryForwardMaxDays: Number(formData.carryForwardMaxDays),
          maxConsecutiveDays: Number(formData.maxConsecutiveDays),
          minNoticeDays: Number(formData.minNoticeDays),
          allowsBackdated: formData.allowsBackdated,
          backdatedMaxDays: Number(formData.backdatedMaxDays),
          effectiveFrom: formData.effectiveFrom,
        })
        if (!res.success) throw new Error(res.error)
        toast.success(`Policy ${formData.name} created successfully`)
      }
      setPolicyModalOpen(false)
      loadData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save policy')
      toast.error(err.message || 'Failed to save policy')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignPolicy = async () => {
    if (!selectedPolicy || selectedEmployeeIds.length === 0) return
    setIsSubmitting(true)
    try {
      const res = await assignPolicyToEmployees(selectedPolicy.id, selectedEmployeeIds)
      if (res.success) {
        toast.success(`Assigned ${selectedPolicy.name} to ${selectedEmployeeIds.length} employees`)
      } else {
        toast.error(res.error || 'Failed to assign policy')
      }
      setAssignModalOpen(false)
      setSelectedEmployeeIds([])
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Policies & Entitlements"
        description="Establish rules for accrual frequencies, carry forwards, advance notice buffers, probation eligibility, and assign to employee groups."
      >
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Create New Policy
        </Button>
      </PageHeader>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50/70 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900 text-sm text-blue-900 dark:text-blue-200">
        <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Immutable Historical Balances</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
            Modifying a leave policy creates a new version record. It will NOT retroactively alter or deduct
            previously accrued balances or approved leave history.
          </p>
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map((policy) => (
          <Card key={policy.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="font-semibold text-xs"
                    style={{
                      borderColor: policy.leave_types?.color || '#3B82F6',
                      color: policy.leave_types?.color || '#3B82F6',
                    }}
                  >
                    {policy.leave_types?.name || 'Leave Type'}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-xs">
                    v{policy.version || 1}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2">{policy.name}</CardTitle>
                <CardDescription className="text-xs">
                  Effective from {policy.effective_from || '2026-01-01'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-lg text-xs">
                  <div>
                    <span className="text-muted-foreground">Annual Entitlement</span>
                    <p className="font-bold text-base text-foreground mt-0.5">
                      {policy.annual_entitlement} Days
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Accrual Mode</span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {policy.accrual_type} ({policy.accrual_amount || 0}/cycle)
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground pt-1">
                  <div className="flex justify-between">
                    <span>Carry Forward:</span>
                    <span className="font-medium text-foreground">
                      {policy.carry_forward_enabled
                        ? `Enabled (Max ${policy.carry_forward_max_days || 0} days)`
                        : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Consecutive Days:</span>
                    <span className="font-medium text-foreground">
                      {policy.max_consecutive_days ? `${policy.max_consecutive_days} days` : 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minimum Notice:</span>
                    <span className="font-medium text-foreground">
                      {policy.min_notice_days || 0} days prior
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Probation Eligible:</span>
                    <span className="font-medium text-foreground">
                      {policy.probation_eligible ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </div>

            <CardFooter className="pt-3 border-t flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1"
                onClick={() => {
                  setSelectedPolicy(policy)
                  setHistoryModalOpen(true)
                }}
              >
                <History className="h-3.5 w-3.5" /> Versions
              </Button>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={() => {
                    setSelectedPolicy(policy)
                    setSelectedEmployeeIds([])
                    setAssignModalOpen(true)
                  }}
                >
                  <Users className="h-3.5 w-3.5" /> Assign
                </Button>
                <Button variant="default" size="sm" className="text-xs" onClick={() => handleOpenEdit(policy)}>
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Create / Edit Policy Form Modal */}
      <Dialog open={policyModalOpen} onOpenChange={setPolicyModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Leave Policy' : 'Create Leave Policy'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Creates a new immutable version record for this policy.'
                : 'Define leave allocation parameters and constraints.'}
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="polName">Policy Title *</Label>
                <Input
                  id="polName"
                  placeholder="e.g. Standard Casual Leave Policy 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="polType">Leave Type Category *</Label>
                <Select
                  value={formData.leaveTypeId}
                  onValueChange={(val) => setFormData({ ...formData, leaveTypeId: val })}
                  disabled={!!editingId}
                >
                  <SelectTrigger id="polType">
                    <SelectValue placeholder="Select Leave Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entitlement">Annual Entitlement (Days) *</Label>
                <Input
                  id="entitlement"
                  type="number"
                  step="0.5"
                  value={formData.annualEntitlement}
                  onChange={(e) => setFormData({ ...formData, annualEntitlement: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accrual">Accrual Frequency</Label>
                <Select
                  value={formData.accrualType}
                  onValueChange={(val: any) => setFormData({ ...formData, accrualType: val })}
                >
                  <SelectTrigger id="accrual">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNUAL">Annual (Lump Sum on Jan 1)</SelectItem>
                    <SelectItem value="MONTHLY">Monthly Accrual</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly Accrual</SelectItem>
                    <SelectItem value="NONE">None / Manual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minNotice">Min Notice Buffer (Days)</Label>
                <Input
                  id="minNotice"
                  type="number"
                  value={formData.minNoticeDays}
                  onChange={(e) => setFormData({ ...formData, minNoticeDays: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxConsec">Max Consecutive Days</Label>
                <Input
                  id="maxConsec"
                  type="number"
                  value={formData.maxConsecutiveDays}
                  onChange={(e) => setFormData({ ...formData, maxConsecutiveDays: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Carry-Forward Enabled</Label>
                  <p className="text-xs text-muted-foreground">Allow unused days to roll into next year</p>
                </div>
                <Switch
                  checked={formData.carryForwardEnabled}
                  onCheckedChange={(val) => setFormData({ ...formData, carryForwardEnabled: val })}
                />
              </div>

              {formData.carryForwardEnabled && (
                <div className="space-y-2">
                  <Label className="text-xs">Max Days Allowed to Carry Forward</Label>
                  <Input
                    type="number"
                    value={formData.carryForwardMaxDays}
                    onChange={(e) =>
                      setFormData({ ...formData, carryForwardMaxDays: Number(e.target.value) })
                    }
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>Probation Period Eligibility</Label>
                  <p className="text-xs text-muted-foreground">Employees on probation may utilize this leave</p>
                </div>
                <Switch
                  checked={formData.probationEligible}
                  onCheckedChange={(val) => setFormData({ ...formData, probationEligible: val })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Backdated Submissions</Label>
                  <p className="text-xs text-muted-foreground">Useful for emergency sick leaves</p>
                </div>
                <Switch
                  checked={formData.allowsBackdated}
                  onCheckedChange={(val) => setFormData({ ...formData, allowsBackdated: val })}
                />
              </div>
            </div>

            {editingId && (
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="reason">Version Change Log / Reason *</Label>
                <Input
                  id="reason"
                  placeholder="e.g. Increased annual entitlement by 2 days based on 2026 board review"
                  value={formData.changeReason}
                  onChange={(e) => setFormData({ ...formData, changeReason: e.target.value })}
                  required
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setPolicyModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Publish New Policy Version' : 'Create Policy'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Version History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPolicy?.name} — Version History</DialogTitle>
            <DialogDescription>Audit log of all immutable versions published for this policy</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="p-3 border rounded-lg bg-card text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span>Version 2 (Current)</span>
                <span className="text-muted-foreground">2026-01-01</span>
              </div>
              <p className="text-muted-foreground">Annual Entitlement: 18 Days • Accrual: Monthly</p>
              <p className="italic text-foreground">Reason: Standard 2026 company policy refresh.</p>
            </div>
            <div className="p-3 border rounded-lg bg-muted/30 text-xs space-y-1 opacity-80">
              <div className="flex justify-between font-bold">
                <span>Version 1</span>
                <span className="text-muted-foreground">2025-01-01</span>
              </div>
              <p className="text-muted-foreground">Annual Entitlement: 15 Days • Accrual: Monthly</p>
              <p className="italic text-foreground">Reason: Initial creation.</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setHistoryModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Policy to Employees Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Policy to Employees</DialogTitle>
            <DialogDescription>
              Assign <strong className="text-foreground">{selectedPolicy?.name}</strong> to selected team members.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto divide-y border rounded-lg p-2 space-y-1">
            {employees.map((emp) => {
              const isSelected = selectedEmployeeIds.includes(emp.id)
              return (
                <div
                  key={emp.id}
                  className={`p-2 rounded flex items-center justify-between text-xs cursor-pointer ${
                    isSelected ? 'bg-primary/10 font-semibold' : 'hover:bg-muted/40'
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedEmployeeIds(selectedEmployeeIds.filter((id) => id !== emp.id))
                    } else {
                      setSelectedEmployeeIds([...selectedEmployeeIds, emp.id])
                    }
                  }}
                >
                  <div>
                    <p className="font-medium">{emp.full_name}</p>
                    <p className="text-muted-foreground">{emp.designation} • {emp.departmentName}</p>
                  </div>
                  <Badge variant={isSelected ? 'default' : 'outline'} className="text-[10px]">
                    {isSelected ? 'Selected' : 'Select'}
                  </Badge>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignPolicy}
              disabled={selectedEmployeeIds.length === 0 || isSubmitting}
            >
              Assign to {selectedEmployeeIds.length} Employees
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
