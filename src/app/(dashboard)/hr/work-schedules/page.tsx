'use client'

import * as React from 'react'
import { toast } from 'sonner'
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Users,
  CheckCircle,
  Calendar,
  Check,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { getWorkSchedules, getEmployeesList } from '@/app/actions/hr/hr-queries'
import {
  createWorkSchedule,
  updateWorkSchedule,
  deleteWorkSchedule,
  assignWorkSchedule,
} from '@/app/actions/hr/hr-actions'

const DAYS_OF_WEEK = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
]

export default function WorkSchedulesPage() {
  const [schedules, setSchedules] = React.useState<any[]>([])
  const [employees, setEmployees] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Form Modal
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    workingDays: [1, 2, 3, 4, 5],
    hoursPerDay: 8,
    isDefault: false,
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Assign Modal
  const [assignModalOpen, setAssignModalOpen] = React.useState(false)
  const [selectedSchedule, setSelectedSchedule] = React.useState<any | null>(null)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<string[]>([])

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [sList, eList] = await Promise.all([
        getWorkSchedules(),
        getEmployeesList({ pageSize: 100 }),
      ])
      setSchedules(sList)
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
      description: '',
      workingDays: [1, 2, 3, 4, 5],
      hoursPerDay: 8,
      isDefault: false,
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (s: any) => {
    setEditingId(s.id)
    setFormData({
      name: s.name,
      description: s.description || '',
      workingDays: s.working_days || [1, 2, 3, 4, 5],
      hoursPerDay: Number(s.hours_per_day || 8),
      isDefault: !!s.is_default,
    })
    setModalOpen(true)
  }

  const handleDayToggle = (day: number) => {
    setFormData((prev) => {
      const exists = prev.workingDays.includes(day)
      return {
        ...prev,
        workingDays: exists
          ? prev.workingDays.filter((d) => d !== day)
          : [...prev.workingDays, day],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || formData.workingDays.length === 0) return
    setIsSubmitting(true)
    try {
      if (editingId) {
        await updateWorkSchedule(editingId, {
          name: formData.name,
          description: formData.description,
          workingDays: formData.workingDays,
          hoursPerDay: Number(formData.hoursPerDay),
          isDefault: formData.isDefault,
        })
        toast.success(`Work schedule ${formData.name} updated`)
      } else {
        await createWorkSchedule({
          name: formData.name,
          description: formData.description,
          workingDays: formData.workingDays,
          hoursPerDay: Number(formData.hoursPerDay),
          isDefault: formData.isDefault,
        })
        toast.success(`Work schedule ${formData.name} created`)
      }
      setModalOpen(false)
      loadData()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work schedule?')) return
    await deleteWorkSchedule(id)
    toast.success('Work schedule deleted')
    loadData()
  }

  const handleAssignSubmit = async () => {
    if (!selectedSchedule || selectedEmployeeIds.length === 0) return
    setIsSubmitting(true)
    try {
      await assignWorkSchedule(selectedSchedule.id, selectedEmployeeIds)
      toast.success(`Assigned ${selectedSchedule.name} to ${selectedEmployeeIds.length} employees`)
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
        title="Work Schedules & Shifts"
        description="Establish weekly operating work patterns, shift hours, and non-working days used for automated leave duration calculation."
      >
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Work Schedule
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map((schedule) => (
          <Card key={schedule.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={schedule.is_default ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {schedule.is_default ? 'Default Schedule' : 'Custom Shift'}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {schedule.hours_per_day} hrs/day
                  </span>
                </div>
                <CardTitle className="text-lg mt-2">{schedule.name}</CardTitle>
                <CardDescription className="text-xs">
                  {schedule.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">Working Days</p>
                  <div className="flex items-center gap-1">
                    {DAYS_OF_WEEK.map(({ day, label }) => {
                      const isWorkDay = schedule.working_days?.includes(day)
                      return (
                        <span
                          key={day}
                          className={`h-7 w-7 rounded-md flex items-center justify-center text-xs font-bold ${
                            isWorkDay
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground/60 line-through'
                          }`}
                        >
                          {label}
                        </span>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-muted/40 p-2.5 rounded-md flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Assigned Personnel
                  </span>
                  <span className="font-bold text-foreground">
                    {schedule.assignedCount || 0} Employees
                  </span>
                </div>
              </CardContent>
            </div>

            <CardFooter className="pt-3 border-t flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                onClick={() => {
                  setSelectedSchedule(schedule)
                  setSelectedEmployeeIds([])
                  setAssignModalOpen(true)
                }}
              >
                <Users className="h-3.5 w-3.5" /> Assign Team
              </Button>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(schedule)}>
                  <Edit className="h-4 w-4" />
                </Button>
                {!schedule.is_default && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Create / Edit Schedule Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Work Schedule' : 'Create Work Schedule'}</DialogTitle>
            <DialogDescription>
              Define working days and daily hours for leave duration computations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="schedName">Schedule Name *</Label>
              <Input
                id="schedName"
                placeholder="e.g. Standard Full Time (Mon-Fri 8h)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedDesc">Description</Label>
              <Input
                id="schedDesc"
                placeholder="Shift explanation..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours">Hours Per Day *</Label>
              <Input
                id="hours"
                type="number"
                step="0.5"
                min="1"
                max="24"
                value={formData.hoursPerDay}
                onChange={(e) => setFormData({ ...formData, hoursPerDay: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2 pt-2">
              <Label>Active Working Days *</Label>
              <div className="grid grid-cols-4 gap-2 pt-1">
                {DAYS_OF_WEEK.map(({ day, label }) => (
                  <label
                    key={day}
                    className={`flex items-center gap-2 p-2 rounded border cursor-pointer text-xs font-medium ${
                      formData.workingDays.includes(day)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted hover:bg-muted/40'
                    }`}
                  >
                    <Checkbox
                      checked={formData.workingDays.includes(day)}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <div>
                <Label>Set as Default Organization Schedule</Label>
                <p className="text-xs text-muted-foreground">New employees automatically inherit this</p>
              </div>
              <Switch
                checked={formData.isDefault}
                onCheckedChange={(val) => setFormData({ ...formData, isDefault: val })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Schedule' : 'Create Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Schedule to Employees</DialogTitle>
            <DialogDescription>
              Assign <strong className="text-foreground">{selectedSchedule?.name}</strong> to selected employees.
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
              onClick={handleAssignSubmit}
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
