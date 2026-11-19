'use client'

import * as React from 'react'
import {
  FileText,
  Plus,
  Edit,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  FileCheck,
  Percent,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getLeaveTypes } from '@/app/actions/hr/hr-queries'
import {
  createLeaveType,
  updateLeaveType,
  toggleLeaveTypeStatus,
  reorderLeaveTypes,
} from '@/app/actions/hr/hr-actions'

export default function LeaveTypesManagementPage() {
  const [leaveTypes, setLeaveTypes] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)

  // Form State
  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    description: '',
    color: '#3B82F6',
    icon: 'calendar',
    requiresDocument: false,
    documentDescription: '',
    allowsHalfDay: true,
    allowsNegativeBalance: false,
    isPaid: true,
    displayOrder: 0,
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getLeaveTypes()
      setLeaveTypes(data)
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
      code: '',
      description: '',
      color: '#3B82F6',
      icon: 'calendar',
      requiresDocument: false,
      documentDescription: '',
      allowsHalfDay: true,
      allowsNegativeBalance: false,
      isPaid: true,
      displayOrder: leaveTypes.length,
    })
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (t: any) => {
    setEditingId(t.id)
    setFormData({
      name: t.name,
      code: t.code,
      description: t.description || '',
      color: t.color || '#3B82F6',
      icon: t.icon || 'calendar',
      requiresDocument: !!t.requires_document,
      documentDescription: t.document_description || '',
      allowsHalfDay: t.allows_half_day !== false,
      allowsNegativeBalance: !!t.allows_negative_balance,
      isPaid: t.is_paid !== false,
      displayOrder: t.display_order || 0,
    })
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.code.trim()) return
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      if (editingId) {
        const res = await updateLeaveType(editingId, {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          color: formData.color,
          requiresDocument: formData.requiresDocument,
          documentDescription: formData.documentDescription,
          allowsHalfDay: formData.allowsHalfDay,
          allowsNegativeBalance: formData.allowsNegativeBalance,
          isPaid: formData.isPaid,
          displayOrder: formData.displayOrder,
        })
        if (!res.success) throw new Error(res.error)
      } else {
        const res = await createLeaveType({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          color: formData.color,
          requiresDocument: formData.requiresDocument,
          documentDescription: formData.documentDescription,
          allowsHalfDay: formData.allowsHalfDay,
          allowsNegativeBalance: formData.allowsNegativeBalance,
          isPaid: formData.isPaid,
          displayOrder: formData.displayOrder,
        })
        if (!res.success) throw new Error(res.error)
      }
      setModalOpen(false)
      loadData()
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await toggleLeaveTypeStatus(id, !currentStatus)
    setLeaveTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_active: !currentStatus } : t))
    )
  }

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= leaveTypes.length) return

    const newOrder = [...leaveTypes]
    const temp = newOrder[index]
    newOrder[index] = newOrder[targetIdx]
    newOrder[targetIdx] = temp

    setLeaveTypes(newOrder)
    await reorderLeaveTypes(newOrder.map((t) => t.id))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Types Configuration"
        description="Configure categories of absence, color branding, paid status, half-day allowances, and documentation mandates."
      >
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Leave Type
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {leaveTypes.map((type, index) => (
          <Card key={type.id} className="transition-all hover:border-primary/50">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-12 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: type.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base">{type.name}</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {type.code}
                    </Badge>
                    {type.is_paid ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Unpaid
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                    {type.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>Half-Day: {type.allows_half_day ? 'Allowed' : 'Not Allowed'}</span>
                    <span>•</span>
                    <span>Doc Required: {type.requires_document ? 'Yes' : 'No'}</span>
                    <span>•</span>
                    <span>Negative Balance: {type.allows_negative_balance ? 'Allowed' : 'Disabled'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                {/* Active switch */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {type.is_active ? 'Active' : 'Disabled'}
                  </span>
                  <Switch
                    checked={type.is_active}
                    onCheckedChange={() => handleToggleActive(type.id, type.is_active)}
                  />
                </div>

                {/* Move order buttons */}
                <div className="flex items-center border rounded-md overflow-hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none"
                    disabled={index === 0}
                    onClick={() => handleMoveOrder(index, 'up')}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none border-l"
                    disabled={index === leaveTypes.length - 1}
                    onClick={() => handleMoveOrder(index, 'down')}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Edit Button */}
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(type)}>
                  <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Leave Type' : 'Create Leave Type'}</DialogTitle>
            <DialogDescription>
              Define the parameters for how this leave category operates across policies and balances.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="typeName">Leave Type Name *</Label>
                <Input
                  id="typeName"
                  placeholder="e.g. Wellness Leave"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="typeCode">Code (Uppercase) *</Label>
                <Input
                  id="typeCode"
                  placeholder="e.g. WL"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                placeholder="Brief explanation of when this leave is applicable..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Badge & Calendar Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="color"
                  className="h-10 w-16 p-1 border rounded cursor-pointer"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Paid Leave</Label>
                  <p className="text-xs text-muted-foreground">Is employee compensated during absence</p>
                </div>
                <Switch
                  checked={formData.isPaid}
                  onCheckedChange={(val) => setFormData({ ...formData, isPaid: val })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Half-Day Requests</Label>
                  <p className="text-xs text-muted-foreground">Permit AM/PM half day bookings</p>
                </div>
                <Switch
                  checked={formData.allowsHalfDay}
                  onCheckedChange={(val) => setFormData({ ...formData, allowsHalfDay: val })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Requires Proof / Document Attachment</Label>
                  <p className="text-xs text-muted-foreground">Mandatory file upload (e.g. medical slip)</p>
                </div>
                <Switch
                  checked={formData.requiresDocument}
                  onCheckedChange={(val) => setFormData({ ...formData, requiresDocument: val })}
                />
              </div>

              {formData.requiresDocument && (
                <div className="space-y-1">
                  <Label className="text-xs">Document Description Instructions</Label>
                  <Input
                    placeholder="e.g. Upload doctor prescription or hospital discharge summary"
                    value={formData.documentDescription}
                    onChange={(e) => setFormData({ ...formData, documentDescription: e.target.value })}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Leave Type' : 'Create Leave Type'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
