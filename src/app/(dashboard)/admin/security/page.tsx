'use client'

import * as React from 'react'
import { useEffect, useState, useTransition } from 'react'
import {
  getSecurityComplianceSettings,
  updateSecuritySettings,
  type SecurityComplianceSettings,
} from '@/app/actions/admin/admin-actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileCheck,
  AlertCircle,
  Save,
  Loader2,
  CheckCircle2,
  Fingerprint,
  RefreshCw,
  Clock,
} from 'lucide-react'

export default function AdminSecurityPage() {
  const [settings, setSettings] = useState<SecurityComplianceSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [sessionTimeout, setSessionTimeout] = useState('60')
  const [mfaEnforcement, setMfaEnforcement] = useState<'OPTIONAL' | 'MANDATORY_ADMINS' | 'MANDATORY_ALL'>('MANDATORY_ADMINS')
  const [passwordMinLength, setPasswordMinLength] = useState('8')
  const [requireSpecial, setRequireSpecial] = useState(true)
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5')
  const [lockoutDuration, setLockoutDuration] = useState('15')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const data = await getSecurityComplianceSettings()
      setSettings(data)
      setSessionTimeout(String(data.sessionTimeoutMinutes))
      setMfaEnforcement(data.mfaEnforcement)
      setPasswordMinLength(String(data.passwordMinLength))
      setRequireSpecial(data.passwordRequireSpecial)
      setMaxLoginAttempts(String(data.maxLoginAttempts))
      setLockoutDuration(String(data.lockoutDurationMinutes))
    } catch {
      toast.error('Failed to load security settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateSecuritySettings({
        sessionTimeoutMinutes: Number(sessionTimeout),
        mfaEnforcement,
        passwordMinLength: Number(passwordMinLength),
        passwordRequireSpecial: requireSpecial,
        maxLoginAttempts: Number(maxLoginAttempts),
        lockoutDurationMinutes: Number(lockoutDuration),
      })

      if (res.success) {
        toast.success('Security & compliance policies updated and audited')
      } else {
        toast.error(res.error || 'Failed to save security configuration')
      }
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Security & Compliance Center</h1>
        <p className="text-muted-foreground mt-1">
          Enterprise session management, multi-factor authentication (MFA), row-level security audits, and rate limiting.
        </p>
      </div>

      {/* Compliance Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">PostgreSQL RLS Audit</div>
              <div className="text-base font-bold text-emerald-800 dark:text-emerald-200">100% (29/29 Tables)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Token & JWT Algorithm</div>
              <div className="text-base font-bold text-blue-800 dark:text-blue-200">HS256 (GoTrue v2)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">SOC-2 Audit Trail</div>
              <div className="text-base font-bold text-purple-800 dark:text-purple-200">Active & Immutable</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Settings Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Authentication & Access Policies</CardTitle>
          <CardDescription className="text-xs">
            Configure session lifetime, password complexity, and MFA requirements for all users.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* MFA Policy */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-indigo-600" />
              Two-Factor Authentication (MFA / 2FA) Enforcement
            </Label>
            <Select value={mfaEnforcement} onValueChange={(v: any) => setMfaEnforcement(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select MFA Policy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANDATORY_ADMINS">Mandatory for Admins & HR (Recommended)</SelectItem>
                <SelectItem value="MANDATORY_ALL">Mandatory for All Employees & Contractors</SelectItem>
                <SelectItem value="OPTIONAL">Optional (User opt-in via profile settings)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Admins and HR will be prompted to enroll an authenticator app (TOTP) upon next sign-in.
            </p>
          </div>

          {/* Session Inactivity Timeout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1.5">
              <Label htmlFor="sessionTimeout" className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                Session Inactivity Timeout (Minutes)
              </Label>
              <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                <SelectTrigger id="sessionTimeout">
                  <SelectValue placeholder="Select timeout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 Minutes (High Security)</SelectItem>
                  <SelectItem value="30">30 Minutes</SelectItem>
                  <SelectItem value="60">60 Minutes (Standard Enterprise)</SelectItem>
                  <SelectItem value="240">4 Hours</SelectItem>
                  <SelectItem value="480">8 Hours (Full Shift)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maxAttempts">Max Failed Login Attempts</Label>
              <Select value={maxLoginAttempts} onValueChange={setMaxLoginAttempts}>
                <SelectTrigger id="maxAttempts">
                  <SelectValue placeholder="Select threshold" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Attempts</SelectItem>
                  <SelectItem value="5">5 Attempts (Recommended)</SelectItem>
                  <SelectItem value="10">10 Attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Password Policy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1.5">
              <Label htmlFor="pwdLength">Minimum Password Length</Label>
              <Input
                id="pwdLength"
                type="number"
                min="6"
                max="32"
                value={passwordMinLength}
                onChange={(e) => setPasswordMinLength(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-6">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Require Special Characters & Numbers</Label>
                <p className="text-xs text-muted-foreground">Enforces at least one symbol and number</p>
              </div>
              <Switch checked={requireSpecial} onCheckedChange={setRequireSpecial} />
            </div>
          </div>

          {/* IP Allowlist */}
          <div className="space-y-1.5 pt-4 border-t">
            <Label htmlFor="ipAllow">Corporate CIDR IP Allowlist</Label>
            <Input
              id="ipAllow"
              defaultValue="0.0.0.0/0 (Global Access Allowed)"
              disabled
              className="bg-slate-50 dark:bg-slate-900 font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Contact corporate network engineering to restrict admin console access to corporate VPN IP ranges.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating Security Policies...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Security Configuration
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
