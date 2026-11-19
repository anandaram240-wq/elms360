'use client'

import React from 'react'
import Link from 'next/link'
import {
  CalendarCheck,
  ShieldCheck,
  ArrowRight,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  BarChart3,
  Calendar,
  Lock,
  Workflow,
  Sparkles,
  Building2,
  UserCheck,
  Layers,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/providers/auth-provider'
import { ROUTE_BY_ROLE } from '@/lib/constants'

export default function HomePage() {
  const { currentUser } = useAuth()
  const primaryRole = currentUser?.roles?.[0] || 'EMPLOYEE'
  const dashboardHref = ROUTE_BY_ROLE[primaryRole] || '/employee/dashboard'
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Announcement Bar */}
      <div className="bg-indigo-600 text-white text-xs font-medium py-2 px-4 text-center flex items-center justify-center space-x-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>ELMS 360 v1.1 Active: Multi-Tier Approval Workflows, Double-Entry Balance Ledger &amp; Real-Time Synchronization</span>
        <span className="hidden sm:inline bg-indigo-700/80 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold">Production Ready</span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">ELMS 360</span>
                <Badge variant="outline" className="text-[10px] border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/50">
                  Enterprise
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                <span>ABC Technologies Organization</span>
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Architecture</a>
            <a href="#workflows" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Workflows</a>
            <a href="#portals" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Role Portals</a>
            <a href="#demo" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Demo Credentials</a>
          </div>

          <div className="flex items-center space-x-3">
            {currentUser ? (
              <Link href={dashboardHref}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30">
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  <span>Dashboard ({primaryRole})</span>
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30">
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Full-Stack Next.js 16 • Supabase PostgreSQL • Strict RLS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Enterprise Employee Leave Management System
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Automate the complete employee lifecycle from leave applications, intelligent working-day calculations, multi-stage manager &amp; HR approvals, to double-entry balance ledgers and real-time calendar synchronization.
            </p>

            {/* Main Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {currentUser ? (
                <Link href={dashboardHref} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-6 text-base shadow-lg shadow-indigo-600/25">
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    <span>Go to {primaryRole} Dashboard</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-6 text-base shadow-lg shadow-indigo-600/25">
                    <span>Enter Application</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              )}
              <a href="#demo" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-6 py-6 text-base">
                  <UserCheck className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  <span>View Role Credentials</span>
                </Button>
              </a>
            </div>

            {/* Quick Status Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 text-left">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-semibold text-2xl">
                  <span>9</span>
                  <Layers className="w-4 h-4 opacity-75" />
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Leave Categories</div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold text-2xl">
                  <span>100%</span>
                  <CheckCircle2 className="w-4 h-4 opacity-75" />
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Auditable Ledger</div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-semibold text-2xl">
                  <span>Multi-Tier</span>
                  <Workflow className="w-4 h-4 opacity-75" />
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Approval Engine</div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-semibold text-2xl">
                  <span>29 Tables</span>
                  <ShieldCheck className="w-4 h-4 opacity-75" />
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Postgres RLS Enforced</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Portals Section */}
      <section id="portals" className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Role-Based Access Control Architecture
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Granular access separation configured for employees, reporting managers, HR administrators, and system super administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Employee Portal Card */}
            <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                  <Users className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Employee Portal</CardTitle>
                <CardDescription>Self-service leave operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Apply for 9 leave categories</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Real-time balance calculations</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Supporting document attachments</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Withdrawals &amp; cancellation requests</li>
                </ul>
                <Link href="/login" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full text-blue-600 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                    <span>Access Portal</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Manager Portal Card */}
            <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <UserCheck className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Reporting Manager</CardTitle>
                <CardDescription>Team approvals &amp; conflict tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Direct reports approval queue</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Team calendar conflict detector</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Approve, reject or request clarify</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Temporary delegation engine</li>
                </ul>
                <Link href="/login" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full text-emerald-600 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                    <span>Access Portal</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* HR Admin Card */}
            <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                  <Building2 className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">HR Administration</CardTitle>
                <CardDescription>Policy governance &amp; roster controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> Leave policies &amp; carry-forward rules</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> Organization holiday calendars</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> HR stage multi-level approvals</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-500" /> Department reports &amp; CSV exports</li>
                </ul>
                <Link href="/login" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full text-purple-600 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50">
                    <span>Access Portal</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Super Admin Card */}
            <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                  <Lock className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">Super Administrator</CardTitle>
                <CardDescription>Global tenant &amp; security governance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Tenant &amp; department setup</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> RBAC roles &amp; permissions matrix</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Immutable audit log browser</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Security parameters &amp; session locks</li>
                </ul>
                <Link href="/login" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/50">
                    <span>Access Portal</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Architectural Highlights */}
      <section id="features" className="py-16 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Enterprise Engineering Architecture
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Built on verified relational integrity and strict business constraints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Double-Entry Balance Ledger</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Opening balances, monthly accruals, pending reservations, approval deductions, and cancellation reversals are stored as append-only transaction records. Zero silent mutations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Smart Working Days Calculator</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Automatically reconciles organizational weekly offs (Saturdays &amp; Sundays) and gazetted holiday calendars. Half-day and shift boundaries are precisely accounted for.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">PostgreSQL Row-Level Security</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                100% RLS policies enabled. Tamper-proof security ensures employees only see their own requests and managers only access assigned direct reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Credentials Reference */}
      <section id="demo" className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="outline" className="mb-2 text-indigo-600 border-indigo-200 dark:border-indigo-800">
              Evaluation &amp; QA Credentials
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Demonstration Roster (ABC Technologies)
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Use these standard accounts to log into the respective portal tiers.
            </p>
          </div>

          <div className="max-w-4xl mx-auto overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Work Email</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">Super Admin</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">Rajan Mehta (CTO)</td>
                    <td className="py-3 px-4 font-mono text-xs">superadmin@abc-tech.com</td>
                    <td className="py-3 px-4">Executive / Engineering</td>
                    <td className="py-3 px-4 text-right">
                      <Link href="/login">
                        <Button size="sm" variant="ghost" className="text-indigo-600 text-xs">Sign In &rarr;</Button>
                      </Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-purple-600 dark:text-purple-400">HR Admin</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">Priya Sharma</td>
                    <td className="py-3 px-4 font-mono text-xs">hr1@abc-tech.com</td>
                    <td className="py-3 px-4">Human Resources</td>
                    <td className="py-3 px-4 text-right">
                      <Link href="/login">
                        <Button size="sm" variant="ghost" className="text-purple-600 text-xs">Sign In &rarr;</Button>
                      </Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">Manager</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">Vikram Singh</td>
                    <td className="py-3 px-4 font-mono text-xs">manager.eng@abc-tech.com</td>
                    <td className="py-3 px-4">Engineering</td>
                    <td className="py-3 px-4 text-right">
                      <Link href="/login">
                        <Button size="sm" variant="ghost" className="text-emerald-600 text-xs">Sign In &rarr;</Button>
                      </Link>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">Employee</td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">Arjun Kumar</td>
                    <td className="py-3 px-4 font-mono text-xs">arjun.kumar@abc-tech.com</td>
                    <td className="py-3 px-4">Engineering (Direct Report)</td>
                    <td className="py-3 px-4 text-right">
                      <Link href="/login">
                        <Button size="sm" variant="ghost" className="text-blue-600 text-xs">Sign In &rarr;</Button>
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">ELMS 360</span>
            <span>&copy; {new Date().getFullYear()} ABC Technologies. All rights reserved.</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Powered by Next.js 16 &amp; Supabase</span>
            <span>•</span>
            <Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400">Portal Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
