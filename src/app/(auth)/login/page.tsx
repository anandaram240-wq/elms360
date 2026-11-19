'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from '@/app/actions/auth'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock, Mail, Loader2, AlertCircle, CalendarCheck, ShieldCheck, Tag, Sparkles } from 'lucide-react'
import { RELEASE_IDENTIFIER } from '@/lib/constants'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid work email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean(),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectToParam = searchParams.get('redirectTo')
  const { refreshUser } = useAuth()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeRoleLoggingIn, setActiveRoleLoggingIn] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const rememberMe = watch('rememberMe')

  const executeSignIn = async (email: string, pass: string) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const result = await signIn(email, pass)

      if (!result.success) {
        setErrorMessage(result.error || 'Invalid email or password. Please try again.')
        setIsLoading(false)
        setActiveRoleLoggingIn(null)
        return
      }

      await refreshUser()

      // Redirect to the intended protected route, or the role-specific dashboard
      const destination = redirectToParam || result.redirectTo || '/employee/dashboard'
      window.location.href = destination
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setErrorMessage(message)
      setIsLoading(false)
      setActiveRoleLoggingIn(null)
    }
  }

  const onSubmit = async (values: LoginFormValues) => {
    await executeSignIn(values.email, values.password)
  }

  // Instant 1-Click Demo Login with zero friction
  const handleQuickDemo = async (email: string, roleName: string) => {
    setActiveRoleLoggingIn(roleName)
    setValue('email', email)
    setValue('password', 'CorporateAccess2026!')
    await executeSignIn(email, 'CorporateAccess2026!')
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8FAFC] dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* Container */}
      <div className="w-full max-w-md space-y-6">
        {/* Apple-style Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-[0_2px_10px_rgba(37,99,235,0.25)] mb-1">
            <CalendarCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            ELMS 360
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-normal">
            Enterprise Leave Management System
          </p>
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-mono font-medium">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>{RELEASE_IDENTIFIER}</span>
            </span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Sign in
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              Enter your corporate credentials to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-5 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm font-medium">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Work Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@abctech.com"
                    autoComplete="email"
                    disabled={isLoading}
                    className="pl-10 h-10 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pl-10 h-10 rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setValue('rememberMe', Boolean(checked))}
                  disabled={isLoading}
                  className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-xs font-normal text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Remember this device for 30 days
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-all shadow-[0_1px_2px_rgba(37,99,235,0.2)]"
              >
                {isLoading && !activeRoleLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>

          {/* Quick Demo Roles Section with 1-Click Instant Login */}
          <CardFooter className="flex flex-col border-t border-slate-100 dark:border-slate-800 pt-4 pb-3">
            <div className="w-full">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  One-Click Demo Roles
                </span>
                <span className="text-[11px] text-blue-600 font-medium">Instant Access</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickDemo('arjun.kumar@abc-tech.com', 'Employee')}
                  className="flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-700 font-medium transition-all active:scale-[0.98] disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                >
                  {isLoading && activeRoleLoggingIn === 'Employee' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  ) : (
                    <span>👤</span>
                  )}
                  <span>Employee</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickDemo('manager.eng@abc-tech.com', 'Manager')}
                  className="flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-700 font-medium transition-all active:scale-[0.98] disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                >
                  {isLoading && activeRoleLoggingIn === 'Manager' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  ) : (
                    <span>👥</span>
                  )}
                  <span>Manager</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickDemo('hr1@abc-tech.com', 'HR Admin')}
                  className="flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-700 font-medium transition-all active:scale-[0.98] disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                >
                  {isLoading && activeRoleLoggingIn === 'HR Admin' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  ) : (
                    <span>💼</span>
                  )}
                  <span>HR Admin</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickDemo('superadmin@abc-tech.com', 'Super Admin')}
                  className="flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-700 font-medium transition-all active:scale-[0.98] disabled:opacity-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                >
                  {isLoading && activeRoleLoggingIn === 'Super Admin' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  ) : (
                    <span>👑</span>
                  )}
                  <span>Super Admin</span>
                </button>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Security badge footer */}
        <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Protected with RBAC & Supabase Database Encryption</span>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-900"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <LoginFormContent />
    </React.Suspense>
  )
}
