'use client'

import * as React from 'react'
import { format, parseISO } from 'date-fns'
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Lock,
  Save,
  Loader2,
  ShieldCheck,
  Camera,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  getEmployeeProfile,
  updateEmployeeProfile,
  changePassword,
  EmployeeProfileData,
} from '@/app/actions/employee/profile-actions'

export default function EmployeeProfilePage() {
  const [profile, setProfile] = React.useState<EmployeeProfileData | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Form states
  const [personalEmail, setPersonalEmail] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [savingProfile, setSavingProfile] = React.useState(false)

  // Password change state
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [changingPassword, setChangingPassword] = React.useState(false)

  // Fetch profile on mount
  React.useEffect(() => {
    let isMounted = true
    getEmployeeProfile()
      .then((data) => {
        if (isMounted && data) {
          setProfile(data)
          setPersonalEmail(data.personalEmail || '')
          setPhone(data.phone || '')
        }
      })
      .catch((err) => {
        toast.error('Failed to load profile details')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email if provided
    if (personalEmail && !personalEmail.includes('@')) {
      toast.error('Please enter a valid personal email address')
      return
    }

    setSavingProfile(true)
    try {
      const res = await updateEmployeeProfile({
        personalEmail: personalEmail.trim() || undefined,
        phone: phone.trim() || undefined,
      })

      if (res.success) {
        toast.success(res.message || 'Profile saved!')
      } else {
        toast.error(res.error || 'Failed to update profile')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error updating profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle password update
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setChangingPassword(true)
    try {
      const res = await changePassword(newPassword)
      if (res.success) {
        toast.success(res.message || 'Password updated successfully')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(res.error || 'Failed to update password')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error changing password')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Loading employee profile...</p>
        </div>
      </div>
    )
  }

  const initials = profile?.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'EM'

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Profile Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-2xl border bg-card shadow-sm">
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-md">
            <AvatarImage src={profile?.avatarUrl || ''} />
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="space-y-1 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {profile?.fullName}
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              {profile?.employeeCode}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {profile?.employmentType?.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {profile?.designation} • {profile?.departmentName}
          </p>
          <p className="text-xs text-muted-foreground">
            Work Email: <span className="font-mono text-foreground">{profile?.workEmail}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Read-Only Employment Information (1 col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Employment Details
              </CardTitle>
              <CardDescription>Managed by Human Resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <p className="text-muted-foreground font-medium">Employee Code</p>
                <p className="font-mono font-semibold text-sm text-foreground mt-0.5">
                  {profile?.employeeCode}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground font-medium">Work Email</p>
                <p className="font-mono text-foreground mt-0.5">
                  {profile?.workEmail}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground font-medium">Department</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {profile?.departmentName}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground font-medium">Designation</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {profile?.designation || 'Not specified'}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground font-medium">Reporting Manager</p>
                <p className="font-semibold text-primary mt-0.5">
                  {profile?.managerName}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground font-medium">Date of Joining</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {profile?.dateOfJoining
                    ? format(parseISO(profile.dateOfJoining), 'PPP')
                    : '—'}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground font-medium">Work Location</p>
                <p className="font-semibold text-foreground mt-0.5">
                  {profile?.location || 'HQ - Bengaluru'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editable Personal Information & Password Section (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          {/* Editable Contact Information */}
          <form onSubmit={handleSaveProfile}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your contact details for notifications and emergency communications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="personalEmail">Personal Email Address</Label>
                  <Input
                    id="personalEmail"
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    placeholder="e.g. personal@example.com"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Alternative email for critical emergency notifications.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end">
                <Button type="submit" disabled={savingProfile} className="gap-2">
                  {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Security & Password
                </CardTitle>
                <CardDescription>
                  Change your Supabase authenticated session password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={changingPassword || !newPassword}
                  className="gap-2"
                >
                  {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
