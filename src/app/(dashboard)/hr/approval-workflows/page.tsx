'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  GitBranch,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  ArrowRight,
  Shield,
  Layers,
  Users,
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
import { getApprovalWorkflows } from '@/app/actions/hr/hr-queries'
import {
  createApprovalWorkflow,
  updateApprovalWorkflow,
  deleteApprovalWorkflow,
  addWorkflowStep,
  deleteWorkflowStep,
} from '@/app/actions/hr/hr-actions'

export default function ApprovalWorkflowsPage() {
  const [workflows, setWorkflows] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Workflow Form Modal
  const [workflowModalOpen, setWorkflowModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [workflowForm, setWorkflowForm] = React.useState({
    name: '',
    description: '',
    appliesToAllLeaveTypes: true,
    appliesToAllDepartments: true,
    minDurationDays: '',
    maxDurationDays: '',
    isDefault: false,
  })

  // Add Step Modal
  const [stepModalOpen, setStepModalOpen] = React.useState(false)
  const [activeWorkflowId, setActiveWorkflowId] = React.useState<string | null>(null)
  const [stepForm, setStepForm] = React.useState({
    stepOrder: 1,
    stepName: '',
    approverType: 'DIRECT_MANAGER' as 'DIRECT_MANAGER' | 'DEPARTMENT_HEAD' | 'HR' | 'SPECIFIC_EMPLOYEE' | 'ROLE',
    isMandatory: true,
  })

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getApprovalWorkflows()
      setWorkflows(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenCreateWorkflow = () => {
    setEditingId(null)
    setWorkflowForm({
      name: '',
      description: '',
      appliesToAllLeaveTypes: true,
      appliesToAllDepartments: true,
      minDurationDays: '',
      maxDurationDays: '',
      isDefault: false,
    })
    setWorkflowModalOpen(true)
  }

  const handleOpenEditWorkflow = (wf: any) => {
    setEditingId(wf.id)
    setWorkflowForm({
      name: wf.name,
      description: wf.description || '',
      appliesToAllLeaveTypes: wf.applies_to_all_leave_types !== false,
      appliesToAllDepartments: wf.applies_to_all_departments !== false,
      minDurationDays: wf.min_duration_days ? String(wf.min_duration_days) : '',
      maxDurationDays: wf.max_duration_days ? String(wf.max_duration_days) : '',
      isDefault: !!wf.is_default,
    })
    setWorkflowModalOpen(true)
  }

  const handleSaveWorkflow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workflowForm.name.trim()) return
    setIsSubmitting(true)
    try {
      if (editingId) {
        await updateApprovalWorkflow(editingId, {
          name: workflowForm.name,
          description: workflowForm.description,
          appliesToAllLeaveTypes: workflowForm.appliesToAllLeaveTypes,
          appliesToAllDepartments: workflowForm.appliesToAllDepartments,
          minDurationDays: workflowForm.minDurationDays ? Number(workflowForm.minDurationDays) : undefined,
          maxDurationDays: workflowForm.maxDurationDays ? Number(workflowForm.maxDurationDays) : undefined,
          isDefault: workflowForm.isDefault,
        })
        toast.success(`Workflow ${workflowForm.name} updated`)
      } else {
        await createApprovalWorkflow({
          name: workflowForm.name,
          description: workflowForm.description,
          appliesToAllLeaveTypes: workflowForm.appliesToAllLeaveTypes,
          appliesToAllDepartments: workflowForm.appliesToAllDepartments,
          minDurationDays: workflowForm.minDurationDays ? Number(workflowForm.minDurationDays) : undefined,
          maxDurationDays: workflowForm.maxDurationDays ? Number(workflowForm.maxDurationDays) : undefined,
          isDefault: workflowForm.isDefault,
        })
        toast.success(`Workflow ${workflowForm.name} created`)
      }
      setWorkflowModalOpen(false)
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this approval workflow?')) return
    await deleteApprovalWorkflow(id)
    toast.success('Workflow deleted')
    loadData()
  }

  const handleOpenAddStep = (wfId: string, currentStepCount: number) => {
    setActiveWorkflowId(wfId)
    setStepForm({
      stepOrder: currentStepCount + 1,
      stepName: `Step ${currentStepCount + 1}`,
      approverType: 'HR',
      isMandatory: true,
    })
    setStepModalOpen(true)
  }

  const handleSaveStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeWorkflowId || !stepForm.stepName.trim()) return
    setIsSubmitting(true)
    try {
      await addWorkflowStep(activeWorkflowId, {
        stepOrder: Number(stepForm.stepOrder),
        stepName: stepForm.stepName,
        approverType: stepForm.approverType,
        isMandatory: stepForm.isMandatory,
      })
      toast.success(`Added approval step: ${stepForm.stepName}`)
      setStepModalOpen(false)
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('Delete this approval step?')) return
    await deleteWorkflowStep(stepId)
    toast.success('Approval step removed')
    loadData()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approval Workflows & Routing"
        description="Design multi-tier approval paths, sequential escalation chains, role-based verifications, and conditional duration triggers."
      >
        <Button onClick={handleOpenCreateWorkflow} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Create Workflow
        </Button>
      </PageHeader>

      <div className="space-y-6">
        {workflows.map((wf) => (
          <Card key={wf.id} className="hover:border-primary/50 transition-all">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{wf.name}</CardTitle>
                  {wf.is_default && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      Default Workflow
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs mt-1 max-w-2xl">
                  {wf.description || 'Configured approval sequence for leave requests.'}
                </CardDescription>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                  <span>
                    Duration:{' '}
                    {wf.min_duration_days
                      ? `From ${wf.min_duration_days} days`
                      : 'Any duration'}
                    {wf.max_duration_days ? ` up to ${wf.max_duration_days} days` : ''}
                  </span>
                  <span>•</span>
                  <span>
                    Scope: {wf.applies_to_all_leave_types ? 'All Leave Types' : 'Specific Types'} •{' '}
                    {wf.applies_to_all_departments ? 'All Departments' : 'Specific Departments'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditWorkflow(wf)}>
                  <Edit className="h-4 w-4" />
                </Button>
                {!wf.is_default && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteWorkflow(wf.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Visual Workflow Diagram */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Approval Pathway Progression Diagram
                </p>
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  {/* Start Node */}
                  <div className="p-2.5 rounded-lg border bg-card flex items-center gap-2 font-medium">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>Employee Submit</span>
                  </div>

                  {wf.steps && wf.steps.length > 0 ? (
                    wf.steps.map((s: any, idx: number) => (
                      <React.Fragment key={s.id || idx}>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="p-2.5 rounded-lg border bg-primary/5 border-primary/30 flex items-center gap-2 font-medium group relative">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                            {s.step_order}
                          </span>
                          <span>
                            {s.step_name} ({s.approver_type?.replace('_', ' ')})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteStep(s.id)}
                            className="text-muted-foreground hover:text-destructive ml-1"
                            title="Delete step"
                          >
                            ×
                          </button>
                        </div>
                      </React.Fragment>
                    ))
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="p-2.5 rounded-lg border border-dashed text-muted-foreground">
                        No steps defined
                      </div>
                    </>
                  )}

                  {/* End Node */}
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="p-2.5 rounded-lg border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-2 font-semibold">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Approved & Balance Deducted</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-3 border-t bg-muted/10 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleOpenAddStep(wf.id, wf.steps?.length || 0)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Intermediate Step
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Create / Edit Workflow Modal */}
      <Dialog open={workflowModalOpen} onOpenChange={setWorkflowModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Approval Workflow' : 'Create Approval Workflow'}</DialogTitle>
            <DialogDescription>
              Configure workflow criteria and eligibility triggers.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveWorkflow} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wfName">Workflow Name *</Label>
              <Input
                id="wfName"
                placeholder="e.g. Extended Absence Multi-Tier Sign-off"
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wfDesc">Description</Label>
              <Input
                id="wfDesc"
                placeholder="Workflow details..."
                value={workflowForm.description}
                onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minDays">Min Leave Duration (Days)</Label>
                <Input
                  id="minDays"
                  type="number"
                  placeholder="e.g. 5"
                  value={workflowForm.minDurationDays}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, minDurationDays: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxDays">Max Leave Duration (Days)</Label>
                <Input
                  id="maxDays"
                  type="number"
                  placeholder="e.g. 30"
                  value={workflowForm.maxDurationDays}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, maxDurationDays: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Applies to All Leave Types</Label>
                  <p className="text-xs text-muted-foreground">Applies universally across PL, SL, CL, etc.</p>
                </div>
                <Switch
                  checked={workflowForm.appliesToAllLeaveTypes}
                  onCheckedChange={(val) =>
                    setWorkflowForm({ ...workflowForm, appliesToAllLeaveTypes: val })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Set as Default Workflow</Label>
                  <p className="text-xs text-muted-foreground">Default route for all standard leave requests</p>
                </div>
                <Switch
                  checked={workflowForm.isDefault}
                  onCheckedChange={(val) => setWorkflowForm({ ...workflowForm, isDefault: val })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setWorkflowModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Workflow' : 'Create Workflow'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Step Modal */}
      <Dialog open={stepModalOpen} onOpenChange={setStepModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Approval Workflow Step</DialogTitle>
            <DialogDescription>Define the role or party responsible for authorizing this stage.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStep} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Step Order</Label>
                <Input
                  type="number"
                  value={stepForm.stepOrder}
                  onChange={(e) => setStepForm({ ...stepForm, stepOrder: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Step Label *</Label>
                <Input
                  placeholder="e.g. Department Head Review"
                  value={stepForm.stepName}
                  onChange={(e) => setStepForm({ ...stepForm, stepName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Approver Classification *</Label>
              <Select
                value={stepForm.approverType}
                onValueChange={(val: any) => setStepForm({ ...stepForm, approverType: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECT_MANAGER">Direct Line Manager</SelectItem>
                  <SelectItem value="DEPARTMENT_HEAD">Department Head</SelectItem>
                  <SelectItem value="HR">HR Administrator</SelectItem>
                  <SelectItem value="ROLE">Role Based (Admin/Exec)</SelectItem>
                  <SelectItem value="SPECIFIC_EMPLOYEE">Specific Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <Label>Mandatory Step</Label>
                <p className="text-xs text-muted-foreground">Cannot be skipped automatically</p>
              </div>
              <Switch
                checked={stepForm.isMandatory}
                onCheckedChange={(val) => setStepForm({ ...stepForm, isMandatory: val })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setStepModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Save Step
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
