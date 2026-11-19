'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Building2,
  Plus,
  Users,
  Edit,
  Trash2,
  Calendar,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
import { getDepartmentsList, getEmployeesList } from '@/app/actions/hr/hr-queries'
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '@/app/actions/hr/hr-actions'

export default function DepartmentsPage() {
  const [departments, setDepartments] = React.useState<any[]>([])
  const [employees, setEmployees] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [viewEmployeesOpen, setViewEmployeesOpen] = React.useState(false)
  const [selectedDept, setSelectedDept] = React.useState<any | null>(null)
  const [deptEmployees, setDeptEmployees] = React.useState<any[]>([])

  // Form State
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    parentDepartmentId: '',
    headEmployeeId: '',
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [dList, eList] = await Promise.all([
        getDepartmentsList(),
        getEmployeesList({ pageSize: 100 }),
      ])
      setDepartments(dList)
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
    setFormData({ name: '', code: '', parentDepartmentId: '', headEmployeeId: '' })
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (dept: any) => {
    setEditingId(dept.id)
    setFormData({
      name: dept.name,
      code: dept.code || '',
      parentDepartmentId: dept.parentDepartmentId || '',
      headEmployeeId: dept.headEmployeeId || '',
    })
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      if (editingId) {
        const res = await updateDepartment(editingId, {
          name: formData.name,
          code: formData.code || undefined,
          parentDepartmentId: formData.parentDepartmentId || undefined,
          headEmployeeId: formData.headEmployeeId || undefined,
        })
        if (!res.success) throw new Error(res.error)
      } else {
        const res = await createDepartment({
          name: formData.name,
          code: formData.code || undefined,
          parentDepartmentId: formData.parentDepartmentId || undefined,
          headEmployeeId: formData.headEmployeeId || undefined,
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return
    const res = await deleteDepartment(id)
    if (!res.success) {
      alert(res.error || 'Failed to delete department')
    } else {
      loadData()
    }
  }

  const handleViewEmployees = (dept: any) => {
    setSelectedDept(dept)
    const list = employees.filter((e) => e.department_id === dept.id || e.departmentName === dept.name)
    setDeptEmployees(list)
    setViewEmployeesOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Management"
        description="Organize business units, assign department heads, view staffing levels, and monitor leave utilization."
      >
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Department
        </Button>
      </PageHeader>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <Card key={dept.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{dept.name}</CardTitle>
                </div>
                {dept.code && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {dept.code}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(dept)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(dept.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">Department Head</p>
                <p className="font-medium text-foreground">{dept.headName || 'Not Assigned'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-sm">
                <div className="bg-muted/40 p-2.5 rounded-md">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Team Members
                  </p>
                  <p className="text-lg font-bold mt-0.5">{dept.employeeCount}</p>
                </div>
                <div className="bg-muted/40 p-2.5 rounded-md">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> On Leave
                  </p>
                  <p className="text-lg font-bold mt-0.5">{dept.activeLeaves}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={() => handleViewEmployees(dept)}>
                  View Employees
                </Button>
                <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
                  <Link href={`/hr/reports?department=${dept.id}`}>
                    Stats <TrendingUp className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create / Edit Department Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Department' : 'Create Department'}</DialogTitle>
            <DialogDescription>
              Configure department naming, organizational code, and assigned leadership head.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deptName">Department Name *</Label>
              <Input
                id="deptName"
                placeholder="e.g. Quality Assurance"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deptCode">Department Code</Label>
              <Input
                id="deptCode"
                placeholder="e.g. QA"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headEmp">Department Head</Label>
              <Select
                value={formData.headEmployeeId}
                onValueChange={(val) => setFormData({ ...formData, headEmployeeId: val })}
              >
                <SelectTrigger id="headEmp">
                  <SelectValue placeholder="Select Department Head" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.full_name} ({e.designation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Department' : 'Create Department'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Employees in Department Dialog */}
      <Dialog open={viewEmployeesOpen} onOpenChange={setViewEmployeesOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedDept?.name} — Team Roster</DialogTitle>
            <DialogDescription>
              {deptEmployees.length} employees currently assigned to this department
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto divide-y border rounded-lg">
            {deptEmployees.length > 0 ? (
              deptEmployees.map((e) => (
                <div key={e.id} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <Link
                      href={`/hr/employees/${e.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {e.full_name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{e.designation}</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {e.employee_code}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No employees currently assigned to this department.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewEmployeesOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
