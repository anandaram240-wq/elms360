'use client'

import * as React from 'react'
import { useEffect, useState, useTransition } from 'react'
import {
  getAdminUsers,
  toggleAdminUserStatus,
  assignUserRoles,
  type AdminUserItem,
} from '@/app/actions/admin/admin-actions'
import { forgotPassword } from '@/app/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Search,
  Users,
  ShieldCheck,
  KeyRound,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  UserCheck,
} from 'lucide-react'
import { formatDate, getInitials } from '@/lib/utils'

const AVAILABLE_ROLES = [
  { code: 'SUPER_ADMIN', label: 'Super Administrator', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { code: 'HR_ADMIN', label: 'HR Administrator', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { code: 'MANAGER', label: 'Manager', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { code: 'EMPLOYEE', label: 'Employee', color: 'bg-slate-100 text-slate-800 border-slate-200' },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Manage Roles Modal state
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const data = await getAdminUsers()
      setUsers(data)
    } catch {
      toast.error('Failed to load user directory')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = (user: AdminUserItem) => {
    if (!user.employeeId) return
    const nextStatus = !user.isActive

    startTransition(async () => {
      const res = await toggleAdminUserStatus(user.employeeId!, nextStatus)
      if (res.success) {
        toast.success(`Account ${nextStatus ? 'activated' : 'deactivated'} for ${user.fullName}`)
        loadUsers()
      } else {
        toast.error(res.error || 'Failed to update user status')
      }
    })
  }

  const handleResetPassword = async (email: string) => {
    try {
      const res = await forgotPassword(email)
      if (res.success) {
        toast.success(`Password reset email dispatched to ${email}`)
      } else {
        toast.error(res.error || 'Failed to dispatch password reset')
      }
    } catch {
      toast.error('Failed to send reset link')
    }
  }

  const openRoleModal = (user: AdminUserItem) => {
    setSelectedUser(user)
    setSelectedRoles([...user.roles])
    setIsRoleModalOpen(true)
  }

  const handleRoleToggle = (code: string) => {
    setSelectedRoles((prev) =>
      prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]
    )
  }

  const handleSaveRoles = () => {
    if (!selectedUser?.employeeId) return
    if (selectedRoles.length === 0) {
      toast.error('User must have at least one assigned role')
      return
    }

    startTransition(async () => {
      const res = await assignUserRoles(selectedUser.employeeId!, selectedRoles)
      if (res.success) {
        toast.success(`Roles updated for ${selectedUser.fullName}`)
        setIsRoleModalOpen(false)
        loadUsers()
      } else {
        toast.error(res.error || 'Failed to update roles')
      }
    })
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.departmentName && u.departmentName.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesRole =
      roleFilter === 'ALL' || u.roles.includes(roleFilter)

    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">User Account Directory</h1>
          <p className="text-muted-foreground mt-1">
            Manage user authorization credentials, role mappings, account status, and password resets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-900 px-3 py-1">
            Total Users: {users.length}
          </Badge>
          <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 px-3 py-1">
            Active: {users.filter((u) => u.isActive).length}
          </Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <Input
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE'].map((rf) => (
              <Button
                key={rf}
                variant={roleFilter === rf ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRoleFilter(rf)}
                className={`text-xs h-8 ${roleFilter === rf ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
              >
                {rf === 'ALL' ? 'All Roles' : rf.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 dark:bg-slate-900/50">
              <TableHead>User Details</TableHead>
              <TableHead>Department & Designation</TableHead>
              <TableHead>Assigned Roles</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    <span className="text-sm text-muted-foreground">Loading users...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-sm">
                  No users found matching your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                  {/* Name & Email */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                        {getInitials(user.fullName)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{user.fullName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Dept & Designation */}
                  <TableCell>
                    <div className="text-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{user.designation || 'Staff'}</div>
                      <div className="text-muted-foreground">{user.departmentName}</div>
                    </div>
                  </TableCell>

                  {/* Roles */}
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((r) => {
                        const roleMeta = AVAILABLE_ROLES.find((ar) => ar.code === r)
                        return (
                          <Badge
                            key={r}
                            variant="outline"
                            className={`text-[10px] py-0 px-2 font-medium ${roleMeta?.color || 'bg-slate-100 text-slate-700'}`}
                          >
                            {r.replace('_', ' ')}
                          </Badge>
                        )
                      })}
                    </div>
                  </TableCell>

                  {/* Status Toggle */}
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        user.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                          : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Suspended
                        </>
                      )}
                    </button>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRoleModal(user)}
                        className="text-xs h-7 px-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Edit Roles
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetPassword(user.email)}
                        className="text-xs h-7 px-2 text-slate-600 hover:text-slate-900"
                        title="Send Password Reset"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Role Assignment Modal */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Roles</DialogTitle>
            <DialogDescription className="text-xs">
              Select all authorized roles for <span className="font-semibold text-foreground">{selectedUser?.fullName}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {AVAILABLE_ROLES.map((role) => {
              const isChecked = selectedRoles.includes(role.code)
              return (
                <div
                  key={role.code}
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    isChecked
                      ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                  onClick={() => handleRoleToggle(role.code)}
                >
                  <Checkbox
                    id={`role-${role.code}`}
                    checked={isChecked}
                    onCheckedChange={() => handleRoleToggle(role.code)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5 flex-1">
                    <Label htmlFor={`role-${role.code}`} className="font-semibold text-sm cursor-pointer">
                      {role.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {role.code === 'SUPER_ADMIN' && 'Full tenant administration & security bypass'}
                      {role.code === 'HR_ADMIN' && 'Policy creation, balances, and reports'}
                      {role.code === 'MANAGER' && 'Department requests and approval queue'}
                      {role.code === 'EMPLOYEE' && 'Leave applications and balance review'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsRoleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRoles}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Role Assignments'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
