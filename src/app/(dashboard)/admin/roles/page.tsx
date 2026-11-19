'use client'

import * as React from 'react'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import {
  getAdminRoles,
  getAdminPermissions,
  type AdminRoleItem,
  type AdminPermissionItem,
} from '@/app/actions/admin/admin-actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  ShieldCheck,
  Shield,
  Plus,
  Users,
  Key,
  Lock,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRoleItem[]>([])
  const [permissions, setPermissions] = useState<AdminPermissionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // New Custom Role Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleCode, setNewRoleCode] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [rData, pData] = await Promise.all([getAdminRoles(), getAdminPermissions()])
      setRoles(rData)
      setPermissions(pData)
    } catch {
      toast.error('Failed to load roles and permissions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePerm = (id: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleCreateRole = () => {
    if (!newRoleName.trim() || !newRoleCode.trim()) {
      toast.error('Please enter a role name and unique code')
      return
    }

    startTransition(async () => {
      // Simulate creation
      const newRole: AdminRoleItem = {
        id: `role-custom-${Date.now()}`,
        name: newRoleName,
        code: newRoleCode.toUpperCase().replace(/\s+/g, '_'),
        description: newRoleDesc || 'Custom defined organizational role',
        isSystemRole: false,
        assignedCount: 0,
        permissionCount: selectedPermIds.length,
      }

      setRoles((prev) => [...prev, newRole])
      toast.success(`Custom role "${newRoleName}" created successfully!`)
      setIsCreateOpen(false)
      setNewRoleName('')
      setNewRoleCode('')
      setNewRoleDesc('')
      setSelectedPermIds([])
    })
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Access Control Roles</h1>
          <p className="text-muted-foreground mt-1">
            Standard system roles and custom fine-grained permission bundles governing enterprise access.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Role
        </Button>
      </div>

      {/* Roles Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`border transition-all ${
                role.isSystemRole
                  ? 'border-slate-200 dark:border-slate-800'
                  : 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/10'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        role.code === 'SUPER_ADMIN'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          : role.code === 'HR_ADMIN'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : role.code === 'MANAGER'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        {role.name}
                        {role.isSystemRole && (
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            SYSTEM
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono mt-0.5">
                        CODE: {role.code}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 min-h-[36px]">
                  {role.description || 'No description provided.'}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Assigned Users:</span>
                    <span className="text-xs font-bold">{role.assignedCount}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Permissions:</span>
                    <span className="text-xs font-bold">{role.permissionCount} rules</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-3 pb-3">
                <span className="text-[11px] text-muted-foreground">
                  {role.isSystemRole ? 'Immutable system role' : 'Custom defined'}
                </span>
                <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                  <Link href="/admin/permissions">View Permissions Matrix</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Custom Role Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Create Custom Role
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define a new enterprise role with specific granular authorization permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cRoleName">Role Name</Label>
              <Input
                id="cRoleName"
                placeholder="e.g. Payroll Auditor"
                value={newRoleName}
                onChange={(e) => {
                  setNewRoleName(e.target.value)
                  if (!newRoleCode) {
                    setNewRoleCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cRoleCode">Role Code</Label>
              <Input
                id="cRoleCode"
                placeholder="e.g. PAYROLL_AUDITOR"
                value={newRoleCode}
                onChange={(e) => setNewRoleCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                className="font-mono text-xs uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cRoleDesc">Description</Label>
              <Textarea
                id="cRoleDesc"
                placeholder="Describe the responsibilities and scope of this role..."
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                rows={2}
              />
            </div>

            {/* Permissions Selection Checklist */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assign Permissions ({selectedPermIds.length} selected)
              </Label>
              <div className="max-h-48 overflow-y-auto divide-y rounded-md border p-2 space-y-1">
                {permissions.map((p) => {
                  const checked = selectedPermIds.includes(p.id)
                  return (
                    <div
                      key={p.id}
                      className="flex items-center space-x-2 py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded cursor-pointer"
                      onClick={() => handleTogglePerm(p.id)}
                    >
                      <Checkbox
                        id={`perm-${p.id}`}
                        checked={checked}
                        onCheckedChange={() => handleTogglePerm(p.id)}
                      />
                      <div className="flex-1 text-xs">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground ml-2 font-mono text-[10px]">({p.code})</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] py-0">
                        {p.module}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateRole}
              disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
