'use client'

import * as React from 'react'
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  UserCheck,
  UserX,
  Building,
  Mail,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'
import { useElmsStore, EmployeeRecord } from '@/lib/store/elms-store'

export default function HrEmployeesPage() {
  const { state, addEmployee, updateEmployee, toggleEmployeeActive } = useElmsStore()

  const [search, setSearch] = React.useState('')
  const [departmentFilter, setDepartmentFilter] = React.useState('ALL')

  // Modals state
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingEmployee, setEditingEmployee] = React.useState<EmployeeRecord | null>(null)

  // Add form fields
  const [addCode, setAddCode] = React.useState('')
  const [addName, setAddName] = React.useState('')
  const [addEmail, setAddEmail] = React.useState('')
  const [addDesignation, setAddDesignation] = React.useState('')
  const [addDepartment, setAddDepartment] = React.useState('Engineering')
  const [addManagerId, setAddManagerId] = React.useState('')

  // Edit form fields
  const [editDesignation, setEditDesignation] = React.useState('')
  const [editDepartment, setEditDepartment] = React.useState('')
  const [editManagerId, setEditManagerId] = React.useState('')

  // Filtered employees
  const filteredEmployees = React.useMemo(() => {
    return state.employees.filter((e) => {
      if (departmentFilter !== 'ALL' && e.department_name !== departmentFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const match =
          e.full_name.toLowerCase().includes(q) ||
          e.work_email.toLowerCase().includes(q) ||
          e.employee_code.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [state.employees, departmentFilter, search])

  // Managers list for dropdowns
  const managers = state.employees.filter(
    (e) => e.roles.includes('MANAGER') || e.roles.includes('HR_ADMIN') || e.roles.includes('SUPER_ADMIN')
  )

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addCode.trim() || !addName.trim() || !addEmail.trim()) {
      toast.error('Please enter employee code, full name, and email')
      return
    }

    const mgr = managers.find((m) => m.id === addManagerId)

    addEmployee({
      employee_code: addCode.trim().toUpperCase(),
      full_name: addName.trim(),
      work_email: addEmail.trim().toLowerCase(),
      designation: addDesignation.trim() || 'Software Engineer',
      department_id: 'dept-1',
      department_name: addDepartment,
      manager_id: addManagerId || null,
      manager_name: mgr ? mgr.full_name : undefined,
      is_active: true,
      roles: ['EMPLOYEE'],
    })

    toast.success(`Employee ${addName.trim()} created successfully with default leave balances.`)
    setIsAddOpen(false)
    setAddCode('')
    setAddName('')
    setAddEmail('')
    setAddDesignation('')
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return

    const mgr = managers.find((m) => m.id === editManagerId)

    updateEmployee(editingEmployee.id, {
      designation: editDesignation.trim() || editingEmployee.designation,
      department_name: editDepartment || editingEmployee.department_name,
      manager_id: editManagerId || null,
      manager_name: mgr ? mgr.full_name : undefined,
    })

    toast.success(`Employee details for ${editingEmployee.full_name} updated successfully.`)
    setEditingEmployee(null)
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#111827]">Employee Directory</h1>
          <p className="text-sm text-[#475569] mt-1">
            Manage organization workforce, assign reporting managers, and monitor employment status.
          </p>
        </div>
        <Button
          onClick={() => {
            setAddCode(`EMP00${state.employees.length + 1}`)
            setIsAddOpen(true)
          }}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white gap-2 font-semibold shadow-subtle cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-subtle flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, email, designation..."
            className="pl-9 h-9 border-[#E5E7EB] text-xs bg-white text-[#111827]"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-48 h-9 border-[#E5E7EB] text-xs bg-white text-[#111827]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#E5E7EB] text-[#111827]">
            <SelectItem value="ALL">All Departments</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Human Resources">Human Resources</SelectItem>
            <SelectItem value="Finance">Finance</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="Customer Support">Customer Support</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB] text-[#475569] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Reporting Manager</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[#334155]">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#475569]">
                    {emp.employee_code}
                  </td>
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-semibold text-[#111827]">{emp.full_name}</p>
                      <p className="text-[11px] text-[#64748B]">{emp.work_email}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div>
                      <p className="font-medium text-[#111827]">{emp.designation}</p>
                      <p className="text-[11px] text-[#64748B]">{emp.department_name}</p>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#475569]">
                    {emp.manager_name || 'Executive Level'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        emp.is_active
                          ? 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]'
                          : 'bg-[#F1F5F9] text-[#475569] border-[#E5E7EB]'
                      }`}
                    >
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingEmployee(emp)
                          setEditDesignation(emp.designation)
                          setEditDepartment(emp.department_name)
                          setEditManagerId(emp.manager_id || '')
                        }}
                        className="h-8 px-2 text-[#2563EB] hover:bg-[#EFF6FF] text-xs gap-1"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toggleEmployeeActive(emp.id)
                          toast.success(`Employee ${emp.full_name} marked as ${emp.is_active ? 'Inactive' : 'Active'}.`)
                        }}
                        className="h-8 px-2 text-[#64748B] hover:text-[#111827] hover:bg-[#F1F3F5] text-xs"
                      >
                        {emp.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isAddOpen && (
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-[#111827] rounded-2xl shadow-modal">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#111827]">
                Add New Employee
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Create a new corporate employee profile and automatically assign baseline leave quotas.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEmployee} className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="code" className="font-semibold text-[#111827]">Employee Code</Label>
                  <Input
                    id="code"
                    value={addCode}
                    onChange={(e) => setAddCode(e.target.value)}
                    required
                    className="border-[#E5E7EB] text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name" className="font-semibold text-[#111827]">Full Name</Label>
                  <Input
                    id="name"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    className="border-[#E5E7EB] text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="font-semibold text-[#111827]">Work Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="e.g. jdoe@abc-tech.com"
                  required
                  className="border-[#E5E7EB] text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="designation" className="font-semibold text-[#111827]">Designation</Label>
                  <Input
                    id="designation"
                    value={addDesignation}
                    onChange={(e) => setAddDesignation(e.target.value)}
                    placeholder="e.g. Product Manager"
                    className="border-[#E5E7EB] text-xs h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-semibold text-[#111827]">Department</Label>
                  <Select value={addDepartment} onValueChange={setAddDepartment}>
                    <SelectTrigger className="border-[#E5E7EB] text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#E5E7EB]">
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Human Resources">Human Resources</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Customer Support">Customer Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-[#111827]">Reporting Line Manager</Label>
                <Select value={addManagerId} onValueChange={setAddManagerId}>
                  <SelectTrigger className="border-[#E5E7EB] text-xs h-9">
                    <SelectValue placeholder="Select reporting manager (Optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E5E7EB]">
                    <SelectItem value="">None (Executive Level)</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name} ({m.designation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="text-xs h-9 border-[#E5E7EB]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-9 font-semibold"
                >
                  Create Employee
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
          <DialogContent className="max-w-md bg-white border-[#E5E7EB] text-[#111827] rounded-2xl shadow-modal">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#111827]">
                Edit Employee Details
              </DialogTitle>
              <DialogDescription className="text-xs text-[#64748B]">
                Update profile, designation, or reporting structure for {editingEmployee.full_name}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveEdit} className="space-y-4 py-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="editDesignation" className="font-semibold text-[#111827]">Job Title / Designation</Label>
                <Input
                  id="editDesignation"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  className="border-[#E5E7EB] text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-[#111827]">Department</Label>
                <Select value={editDepartment} onValueChange={setEditDepartment}>
                  <SelectTrigger className="border-[#E5E7EB] text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E5E7EB]">
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Human Resources">Human Resources</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Customer Support">Customer Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="font-semibold text-[#111827]">Assigned Reporting Manager</Label>
                <Select value={editManagerId} onValueChange={setEditManagerId}>
                  <SelectTrigger className="border-[#E5E7EB] text-xs h-9">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E5E7EB]">
                    <SelectItem value="">None (Executive Level)</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name} ({m.designation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingEmployee(null)}
                  className="text-xs h-9 border-[#E5E7EB]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs h-9 font-semibold"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
