'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Save, Building, Briefcase, Calendar, Shield, Clock } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createEmployee,
  getNextEmployeeCode,
} from '@/app/actions/hr/hr-actions'
import {
  getDepartmentsList,
  getEmployeesList,
  getLeavePolicies,
  getWorkSchedules,
} from '@/app/actions/hr/hr-queries'
import type { RoleCode, EmploymentType } from '@/types/app'

export default function NewEmployeePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  // Options
  const [departments, setDepartments] = React.useState<any[]>([])
  const [managers, setManagers] = React.useState<any[]>([])
  const [policies, setPolicies] = React.useState<any[]>([])
  const [schedules, setSchedules] = React.useState<any[]>([])

  // Form State
  const [formData, setFormData] = React.useState({
    employeeCode: '',
    fullName: '',
    workEmail: '',
    personalEmail: '',
    phone: '',
    designation: '',
    departmentId: '',
    location: 'Headquarters (Bangalore)',
    dateOfJoining: new Date().toISOString().split('T')[0],
    dateOfBirth: '',
    employmentType: 'FULL_TIME' as EmploymentType,
    grade: 'L3',
    managerId: '',
    policyId: '',
    workScheduleId: '',
    roleCode: 'EMPLOYEE' as RoleCode,
  })

  React.useEffect(() => {
    // Auto-suggest code & load selects
    getNextEmployeeCode().then((code) => {
      setFormData((prev) => ({ ...prev, employeeCode: code }))
    })
    getDepartmentsList().then(setDepartments)
    getEmployeesList({ pageSize: 100 }).then((res) => setManagers(res.data))
    getLeavePolicies().then(setPolicies)
    getWorkSchedules().then(setSchedules)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.fullName.trim() || !formData.workEmail.trim() || !formData.designation.trim()) {
      setErrorMsg('Please complete all required fields.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await createEmployee({
        employeeCode: formData.employeeCode,
        fullName: formData.fullName,
        workEmail: formData.workEmail,
        personalEmail: formData.personalEmail || undefined,
        phone: formData.phone || undefined,
        designation: formData.designation,
        departmentId: formData.departmentId || undefined,
        location: formData.location || undefined,
        dateOfJoining: formData.dateOfJoining,
        dateOfBirth: formData.dateOfBirth || undefined,
        employmentType: formData.employmentType,
        grade: formData.grade || undefined,
        managerId: formData.managerId || undefined,
        roleCode: formData.roleCode,
        workScheduleId: formData.workScheduleId || undefined,
        policyId: formData.policyId || undefined,
      })

      if (res.success) {
        router.push('/hr/employees')
      } else {
        setErrorMsg(res.error || 'Failed to create employee')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/hr/employees" className="flex items-center gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Employees
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Add New Employee"
        description="Onboard an employee into ELMS 360 with organizational attributes, leave policy, reporting hierarchy, and access role."
      />

      {errorMsg && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" /> Basic Information
            </CardTitle>
            <CardDescription>Primary identification and employment contact info</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employeeCode">Employee Code *</Label>
              <Input
                id="employeeCode"
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">Suggested sequential organizational code</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="e.g. Jane Doe"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workEmail">Work Email *</Label>
              <Input
                id="workEmail"
                type="email"
                placeholder="jane.doe@abctech.com"
                value={formData.workEmail}
                onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalEmail">Personal Email</Label>
              <Input
                id="personalEmail"
                type="email"
                placeholder="jane@gmail.com"
                value={formData.personalEmail}
                onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation *</Label>
              <Input
                id="designation"
                placeholder="e.g. Software Engineer II"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Department & Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" /> Department & Hierarchy
            </CardTitle>
            <CardDescription>Reporting lines and organizational placement</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(val) => setFormData({ ...formData, departmentId: val })}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select Department" />
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

            <div className="space-y-2">
              <Label htmlFor="manager">Reporting Manager</Label>
              <Select
                value={formData.managerId}
                onValueChange={(val) => setFormData({ ...formData, managerId: val })}
              >
                <SelectTrigger id="manager">
                  <SelectValue placeholder="Select Manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name} ({m.designation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Work Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade / Band</Label>
              <Input
                id="grade"
                placeholder="e.g. L3, M1, Lead"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Dates & Employment Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Dates & Employment Type
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfJoining">Date of Joining *</Label>
              <Input
                id="dateOfJoining"
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select
                value={formData.employmentType}
                onValueChange={(val: EmploymentType) => setFormData({ ...formData, employmentType: val })}
              >
                <SelectTrigger id="employmentType">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="INTERN">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleCode">Assigned System Role</Label>
              <Select
                value={formData.roleCode}
                onValueChange={(val: RoleCode) => setFormData({ ...formData, roleCode: val })}
              >
                <SelectTrigger id="roleCode">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee (Standard User)</SelectItem>
                  <SelectItem value="MANAGER">Manager (Approver)</SelectItem>
                  <SelectItem value="HR_ADMIN">HR Administrator</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Policy & Schedule Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Policy & Work Schedule Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="policyId">Initial Leave Policy</Label>
              <Select
                value={formData.policyId}
                onValueChange={(val) => setFormData({ ...formData, policyId: val })}
              >
                <SelectTrigger id="policyId">
                  <SelectValue placeholder="Select Policy (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {policies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.leave_types?.name || 'General'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleId">Work Schedule</Label>
              <Select
                value={formData.workScheduleId}
                onValueChange={(val) => setFormData({ ...formData, workScheduleId: val })}
              >
                <SelectTrigger id="scheduleId">
                  <SelectValue placeholder="Select Schedule (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.hours_per_day}h/day)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t p-4">
            <Button variant="outline" asChild>
              <Link href="/hr/employees">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-1.5" />
              {isSubmitting ? 'Creating Employee...' : 'Save & Onboard Employee'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
