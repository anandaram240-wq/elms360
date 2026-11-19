'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  User,
  Building,
  Calendar,
  Shield,
  Clock,
  Save,
  UserX,
  UserCheck,
  History,
  PieChart,
  FileText,
  CheckCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LeaveStatusBadge } from '@/components/shared/status-badge'
import {
  updateEmployee,
  deactivateEmployee,
  reactivateEmployee,
  transferDepartment,
  changeManager,
  assignRole,
  removeRole,
} from '@/app/actions/hr/hr-actions'
import {
  getDepartmentsList,
  getEmployeesList,
  getLeaveBalances,
  getLeaveRequests,
  getAuditLogs,
} from '@/app/actions/hr/hr-queries'
import type { RoleCode, EmploymentType, EmploymentStatus } from '@/types/app'

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.id as string

  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Options
  const [departments, setDepartments] = React.useState<any[]>([])
  const [allEmployees, setAllEmployees] = React.useState<any[]>([])

  // Employee details state
  const [employee, setEmployee] = React.useState<any>({
    id: employeeId,
    employee_code: 'EMP-1001',
    full_name: 'Sarah Connor',
    work_email: 'sarah.connor@abctech.com',
    personal_email: 'sarah.connor@gmail.com',
    phone: '+91 98765 43210',
    designation: 'Engineering Lead',
    department_id: 'dept-1',
    location: 'Bangalore HQ',
    date_of_joining: '2022-03-15',
    date_of_birth: '1990-05-12',
    employment_type: 'FULL_TIME' as EmploymentType,
    employment_status: 'ACTIVE' as EmploymentStatus,
    grade: 'L4',
    is_active: true,
    manager_id: 'emp-mgr',
    roles: ['EMPLOYEE', 'MANAGER'] as RoleCode[],
  })

  // Transfer & Manager state
  const [newDepartmentId, setNewDepartmentId] = React.useState('')
  const [newManagerId, setNewManagerId] = React.useState('')

  // Balance & Leave data
  const [balances, setBalances] = React.useState<any[]>([])
  const [requests, setRequests] = React.useState<any[]>([])
  const [auditLogs, setAuditLogs] = React.useState<any[]>([])

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [depts, emps, bals, reqs, logs] = await Promise.all([
          getDepartmentsList(),
          getEmployeesList({ pageSize: 100 }),
          getLeaveBalances({ employeeId }),
          getLeaveRequests({ employeeId }),
          getAuditLogs({ pageSize: 20 }),
        ])
        setDepartments(depts)
        setAllEmployees(emps.data)
        setBalances(bals)
        setRequests(reqs.data)
        setAuditLogs(logs.data)

        // Try to match employee
        const matched = emps.data.find((e: any) => e.id === employeeId)
        if (matched) {
          setEmployee((prev: any) => ({
            ...prev,
            ...matched,
            department_id: matched.department_id || depts[0]?.id,
          }))
          setNewDepartmentId(matched.department_id || depts[0]?.id)
        }
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [employeeId])

  // Save profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setStatusMessage(null)
    try {
      const res = await updateEmployee(employeeId, {
        fullName: employee.full_name,
        workEmail: employee.work_email,
        personalEmail: employee.personal_email,
        phone: employee.phone,
        designation: employee.designation,
        location: employee.location,
        grade: employee.grade,
        employmentType: employee.employment_type,
        employmentStatus: employee.employment_status,
      })
      if (res.success) {
        setStatusMessage({ text: 'Profile changes saved successfully.', type: 'success' })
        toast.success('Profile changes saved successfully')
      } else {
        setStatusMessage({ text: res.error || 'Failed to save changes.', type: 'error' })
        toast.error(res.error || 'Failed to save changes')
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message, type: 'error' })
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Transfer department
  const handleTransferDepartment = async () => {
    if (!newDepartmentId) return
    setIsSaving(true)
    try {
      const res = await transferDepartment(employeeId, newDepartmentId, new Date().toISOString().split('T')[0])
      if (res.success) {
        setEmployee({ ...employee, department_id: newDepartmentId })
        setStatusMessage({ text: 'Department transfer recorded successfully.', type: 'success' })
        toast.success('Department transfer recorded successfully')
      } else {
        toast.error(res.error || 'Transfer failed')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Change manager
  const handleChangeManager = async () => {
    if (!newManagerId) return
    setIsSaving(true)
    try {
      const res = await changeManager(employeeId, newManagerId, new Date().toISOString().split('T')[0])
      if (res.success) {
        setEmployee({ ...employee, manager_id: newManagerId })
        setStatusMessage({ text: 'Reporting manager updated successfully.', type: 'success' })
        toast.success('Reporting manager updated successfully')
      } else {
        toast.error(res.error || 'Failed to update manager')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle active status
  const handleToggleActive = async () => {
    setIsSaving(true)
    try {
      if (employee.is_active) {
        await deactivateEmployee(employeeId, 'Deactivated by HR administrator')
        setEmployee({ ...employee, is_active: false, employment_status: 'INACTIVE' })
        toast.success('Employee deactivated')
      } else {
        await reactivateEmployee(employeeId)
        setEmployee({ ...employee, is_active: true, employment_status: 'ACTIVE' })
        toast.success('Employee reactivated')
      }
      setStatusMessage({ text: `Employee ${employee.is_active ? 'deactivated' : 'reactivated'}.`, type: 'success' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/hr/employees" className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Employees
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {employee.is_active ? (
            <Button variant="destructive" size="sm" onClick={handleToggleActive} disabled={isSaving}>
              <UserX className="h-4 w-4 mr-1.5" /> Deactivate Employee
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleToggleActive} disabled={isSaving}>
              <UserCheck className="h-4 w-4 mr-1.5 text-emerald-600" /> Reactivate Employee
            </Button>
          )}
        </div>
      </div>

      {/* Header Profile summary */}
      <div className="bg-card p-6 rounded-lg border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
            {employee.full_name?.charAt(0) || 'E'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{employee.full_name}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {employee.employee_code}
              </Badge>
              <Badge
                className={
                  employee.is_active
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-gray-100 text-gray-700'
                }
              >
                {employee.employment_status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {employee.designation} • {employee.location || 'Headquarters'} • Joined {employee.date_of_joining}
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-md text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Tabs Layout */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1">
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="history">Leave Requests</TabsTrigger>
          <TabsTrigger value="transfers">Transfer & Manager</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile View / Edit */}
        <TabsContent value="profile">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal & Employment Details</CardTitle>
                <CardDescription>Update employee records and operational credentials</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={employee.full_name}
                    onChange={(e) => setEmployee({ ...employee, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Work Email</Label>
                  <Input
                    value={employee.work_email}
                    onChange={(e) => setEmployee({ ...employee, work_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Personal Email</Label>
                  <Input
                    value={employee.personal_email || ''}
                    onChange={(e) => setEmployee({ ...employee, personal_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={employee.phone || ''}
                    onChange={(e) => setEmployee({ ...employee, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input
                    value={employee.designation}
                    onChange={(e) => setEmployee({ ...employee, designation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grade / Level</Label>
                  <Input
                    value={employee.grade || ''}
                    onChange={(e) => setEmployee({ ...employee, grade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Work Location</Label>
                  <Input
                    value={employee.location || ''}
                    onChange={(e) => setEmployee({ ...employee, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employment Status</Label>
                  <Select
                    value={employee.employment_status}
                    onValueChange={(val: EmploymentStatus) =>
                      setEmployee({ ...employee, employment_status: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="ON_NOTICE">On Notice</SelectItem>
                      <SelectItem value="TERMINATED">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t p-4">
                <Button type="submit" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1.5" />
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* Tab 2: Leave Balances Overview */}
        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Leave Entitlements & Balances</CardTitle>
                <CardDescription>Fiscal year breakdown across leave types</CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/hr/leave-balances">Manage Adjustments</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {balances.map((b) => (
                  <div key={b.id} className="p-4 rounded-lg border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: b.leaveTypeColor || '#3B82F6' }}
                        />
                        {b.leaveTypeName}
                      </span>
                      <Badge variant="secondary" className="font-bold text-xs">
                        {b.available} Days Left
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 text-center text-xs text-muted-foreground pt-2 border-t">
                      <div>
                        <p className="font-bold text-foreground text-sm">{b.accrued}</p>
                        <p>Accrued</p>
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{b.used}</p>
                        <p>Used</p>
                      </div>
                      <div>
                        <p className="font-bold text-amber-600 text-sm">{b.pending}</p>
                        <p>Pending</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Leave History */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leave Application History</CardTitle>
              <CardDescription>All historical leave requests submitted by this employee</CardDescription>
            </CardHeader>
            <CardContent>
              {requests.length > 0 ? (
                <div className="divide-y border rounded-lg overflow-hidden">
                  {requests.map((r) => (
                    <div key={r.id} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold">{r.requestNumber}</span>
                          <span className="font-medium text-sm">{r.leaveTypeName}</span>
                          <LeaveStatusBadge status={r.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {r.startDate} to {r.endDate} ({r.totalDays} {r.totalDays === 1 ? 'day' : 'days'})
                        </p>
                        <p className="text-xs italic text-muted-foreground mt-0.5">&ldquo;{r.reason}&rdquo;</p>
                      </div>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/hr/leave-requests/${r.id}`}>Review</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-sm text-muted-foreground">No leave history found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Transfer & Manager */}
        <TabsContent value="transfers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transfer Department</CardTitle>
              <CardDescription>
                Transfer employee to another business unit and record change in audit ledger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Destination Department</Label>
                <Select value={newDepartmentId} onValueChange={setNewDepartmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleTransferDepartment} disabled={isSaving || !newDepartmentId}>
                Execute Department Transfer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Reporting Line</CardTitle>
              <CardDescription>Assign a new supervisor in reporting_relationships</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>New Reporting Manager</Label>
                <Select value={newManagerId} onValueChange={setNewManagerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {allEmployees
                      .filter((e) => e.id !== employeeId)
                      .map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.full_name} ({e.designation})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleChangeManager} disabled={isSaving || !newManagerId}>
                Update Reporting Manager
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Audit Log */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Trail</CardTitle>
              <CardDescription>Administrative change history for this employee record</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="p-3 border rounded text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span>{log.action}</span>
                      <span className="text-muted-foreground font-mono">{log.created_at?.slice(0, 16)}</span>
                    </div>
                    <p className="text-muted-foreground">Actor: {log.actor_name || log.actor_email}</p>
                    {log.reason && <p className="italic text-foreground">Reason: {log.reason}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
