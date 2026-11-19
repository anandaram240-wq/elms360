'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserPlus,
  Download,
  Upload,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Building,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, ColumnDef } from '@/components/shared/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getEmployeesList, getDepartmentsList } from '@/app/actions/hr/hr-queries'
import {
  deactivateEmployee,
  reactivateEmployee,
  changeManager,
  importEmployeesCSV,
} from '@/app/actions/hr/hr-actions'

interface EmployeeRow {
  id: string
  employee_code: string
  full_name: string
  work_email: string
  designation: string | null
  department_id?: string | null
  departmentName: string
  managerName: string
  date_of_joining: string
  employment_type: string
  employment_status: string
  is_active: boolean
}

export default function EmployeesDirectoryPage() {
  const router = useRouter()
  const [employees, setEmployees] = React.useState<EmployeeRow[]>([])
  const [departments, setDepartments] = React.useState<any[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [isLoading, setIsLoading] = React.useState(true)

  // Filters
  const [search, setSearch] = React.useState('')
  const [departmentId, setDepartmentId] = React.useState('ALL')
  const [status, setStatus] = React.useState('ALL')
  const [employmentType, setEmploymentType] = React.useState('ALL')

  // Modals state
  const [selectedEmp, setSelectedEmp] = React.useState<EmployeeRow | null>(null)
  const [deactivateModalOpen, setDeactivateModalOpen] = React.useState(false)
  const [deactivateReason, setDeactivateReason] = React.useState('')
  const [changeManagerModalOpen, setChangeManagerModalOpen] = React.useState(false)
  const [newManagerId, setNewManagerId] = React.useState('')
  const [importModalOpen, setImportModalOpen] = React.useState(false)
  const [csvContent, setCsvContent] = React.useState('')
  const [importResult, setImportResult] = React.useState<{ imported: number; errors: string[] } | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Fetch employees
  const loadEmployees = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await getEmployeesList({
        page,
        pageSize,
        search,
        departmentId,
        status,
        employmentType,
      })
      setEmployees(res.data)
      setTotal(res.total)
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, search, departmentId, status, employmentType])

  React.useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  React.useEffect(() => {
    getDepartmentsList().then(setDepartments)
  }, [])

  // Export to CSV
  const handleExportCSV = () => {
    if (employees.length === 0) return
    const headers = ['Employee Code', 'Full Name', 'Work Email', 'Designation', 'Department', 'Manager', 'Joining Date', 'Status']
    const rows = employees.map((e) => [
      e.employee_code,
      `"${e.full_name}"`,
      e.work_email,
      `"${e.designation}"`,
      `"${e.departmentName}"`,
      `"${e.managerName}"`,
      e.date_of_joining,
      e.employment_status,
    ])
    const csvStr = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Deactivate
  const handleDeactivate = async () => {
    if (!selectedEmp) return
    setIsSubmitting(true)
    try {
      await deactivateEmployee(selectedEmp.id, deactivateReason)
      setDeactivateModalOpen(false)
      setDeactivateReason('')
      loadEmployees()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Change Manager
  const handleChangeManager = async () => {
    if (!selectedEmp || !newManagerId) return
    setIsSubmitting(true)
    try {
      await changeManager(selectedEmp.id, newManagerId, new Date().toISOString().split('T')[0])
      setChangeManagerModalOpen(false)
      setNewManagerId('')
      loadEmployees()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Import CSV
  const handleImport = async () => {
    if (!csvContent.trim()) return
    setIsSubmitting(true)
    try {
      const res = await importEmployeesCSV(csvContent)
      setImportResult(res)
      if (res.imported > 0) {
        loadEmployees()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Table Columns
  const columns: ColumnDef<EmployeeRow>[] = [
    {
      key: 'employee_code',
      header: 'Code',
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.employee_code}
        </span>
      ),
    },
    {
      key: 'full_name',
      header: 'Name',
      cell: (row) => (
        <div>
          <Link
            href={`/hr/employees/${row.id}`}
            className="font-medium text-foreground hover:underline"
          >
            {row.full_name}
          </Link>
          <p className="text-xs text-muted-foreground">{row.work_email}</p>
        </div>
      ),
    },
    {
      key: 'designation',
      header: 'Designation',
      cell: (row) => <span className="text-sm">{row.designation}</span>,
    },
    {
      key: 'departmentName',
      header: 'Department',
      cell: (row) => (
        <Badge variant="outline" className="font-normal text-xs">
          {row.departmentName}
        </Badge>
      ),
    },
    {
      key: 'managerName',
      header: 'Manager',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.managerName}</span>,
    },
    {
      key: 'date_of_joining',
      header: 'Joining Date',
      cell: (row) => <span className="text-xs text-muted-foreground">{row.date_of_joining}</span>,
    },
    {
      key: 'employment_status',
      header: 'Status',
      cell: (row) => (
        <Badge
          className={
            row.employment_status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : 'bg-gray-100 text-gray-700'
          }
        >
          {row.employment_status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/hr/employees/${row.id}`} className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/hr/employees/${row.id}?edit=true`} className="flex items-center gap-2">
                <Edit className="h-4 w-4" /> Edit Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedEmp(row)
                setChangeManagerModalOpen(true)
              }}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" /> Change Manager
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.is_active ? (
              <DropdownMenuItem
                onClick={() => {
                  setSelectedEmp(row)
                  setDeactivateModalOpen(true)
                }}
                className="text-destructive focus:text-destructive flex items-center gap-2"
              >
                <UserX className="h-4 w-4" /> Deactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={async () => {
                  await reactivateEmployee(row.id)
                  loadEmployees()
                }}
                className="text-emerald-600 flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" /> Reactivate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        description="Manage company personnel, designations, department assignments, managers, and employment statuses."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setImportResult(null)
              setCsvContent('')
              setImportModalOpen(true)
            }}
          >
            <Upload className="h-4 w-4 mr-1.5" /> Import CSV
          </Button>
          <Button size="sm" asChild>
            <Link href="/hr/employees/new">
              <UserPlus className="h-4 w-4 mr-1.5" /> Add Employee
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Filter Bar Slot for DataTable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-card p-4 rounded-lg border">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search code, name, email..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Department */}
        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger>
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ON_NOTICE">On Notice</SelectItem>
            <SelectItem value="TERMINATED">Terminated</SelectItem>
          </SelectContent>
        </Select>

        {/* Employment Type */}
        <Select value={employmentType} onValueChange={setEmploymentType}>
          <SelectTrigger>
            <SelectValue placeholder="All Employment Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Employment Types</SelectItem>
            <SelectItem value="FULL_TIME">Full Time</SelectItem>
            <SelectItem value="PART_TIME">Part Time</SelectItem>
            <SelectItem value="CONTRACT">Contract</SelectItem>
            <SelectItem value="INTERN">Intern</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Paginated Data Table */}
      <DataTable
        columns={columns}
        data={employees}
        totalCount={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        emptyMessage="No employees found matching filter criteria."
      />

      {/* Deactivate Dialog */}
      <Dialog open={deactivateModalOpen} onOpenChange={setDeactivateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{' '}
              <span className="font-semibold text-foreground">{selectedEmp?.full_name}</span>?
              They will no longer be able to log in or submit leave requests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Reason for Deactivation</Label>
            <Textarea
              placeholder="e.g., End of employment, sabbatical, retirement..."
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={isSubmitting}>
              {isSubmitting ? 'Deactivating...' : 'Confirm Deactivation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Manager Dialog */}
      <Dialog open={changeManagerModalOpen} onOpenChange={setChangeManagerModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Reporting Manager</DialogTitle>
            <DialogDescription>
              Assign a new primary reporting manager for{' '}
              <span className="font-semibold text-foreground">{selectedEmp?.full_name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select New Manager</Label>
              <Select value={newManagerId} onValueChange={setNewManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.id !== selectedEmp?.id)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.full_name} ({e.designation})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeManagerModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeManager} disabled={!newManagerId || isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Save Manager'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Employees from CSV</DialogTitle>
            <DialogDescription>
              Paste CSV text formatted with headers:{' '}
              <code className="text-xs bg-muted p-0.5 rounded">employee_code,full_name,work_email,designation,date_of_joining</code>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              className="h-48 font-mono text-xs"
              placeholder={`employee_code,full_name,work_email,designation,date_of_joining\nEMP-1050,Alice Smith,alice@abctech.com,QA Engineer,2026-01-15\nEMP-1051,Bob Vance,bob@abctech.com,Account Executive,2026-02-01`}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
            />
            {importResult && (
              <div
                className={`p-3 rounded text-sm ${
                  importResult.imported > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                }`}
              >
                <p className="font-semibold">Imported {importResult.imported} records.</p>
                {importResult.errors.length > 0 && (
                  <ul className="list-disc pl-4 text-xs mt-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModalOpen(false)}>
              Close
            </Button>
            <Button onClick={handleImport} disabled={!csvContent.trim() || isSubmitting}>
              {isSubmitting ? 'Importing...' : 'Upload & Process'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
