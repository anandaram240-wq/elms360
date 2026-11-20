# ELMS 360 V6.0 — Live Route Manifest

**Base Domain:** `https://elms360.vercel.app`  
**Local Development:** `http://localhost:3000`  
**Engine:** Next.js 16 + React 19 + Supabase Cloud PostgreSQL (`addyqmoyiiqksvgfwjyu`)

---

## Complete Route Manifest

| Page Name | Portal Scope | Actual File Path | Public Live URL | Authentication Required | Verification Status |
|---|---|---|---|---|---|
| **Landing & Entry** | Public | `src/app/page.tsx` | `https://elms360.vercel.app/` | No (Redirects to /login or dashboard) | **VERIFIED (PASS)** |
| **Login Portal** | Public | `src/app/(auth)/login/page.tsx` | `https://elms360.vercel.app/login` | No (Public Auth Surface) | **VERIFIED (PASS)** |
| **Forgot Password** | Public | `src/app/(auth)/forgot-password/page.tsx` | `https://elms360.vercel.app/forgot-password` | No (Public Auth Surface) | **VERIFIED (PASS)** |
| **Reset Password** | Public | `src/app/(auth)/reset-password/page.tsx` | `https://elms360.vercel.app/reset-password` | No (Token Auth Surface) | **VERIFIED (PASS)** |
| **Employee Dashboard** | Employee | `src/app/(dashboard)/employee/dashboard/page.tsx` | `https://elms360.vercel.app/employee/dashboard` | Yes (Role: EMPLOYEE) | **VERIFIED (PASS)** |
| **Apply Leave** | Employee | `src/app/(dashboard)/employee/apply-leave/page.tsx` | `https://elms360.vercel.app/employee/apply-leave` | Yes (Role: EMPLOYEE) | **VERIFIED (PASS)** |
| **My Leaves** | Employee | `src/app/(dashboard)/employee/my-leaves/page.tsx` | `https://elms360.vercel.app/employee/my-leaves` | Yes (Role: EMPLOYEE) | **VERIFIED (PASS)** |
| **Leave Detail** | Employee | `src/app/(dashboard)/employee/my-leaves/[id]/page.tsx` | `https://elms360.vercel.app/employee/my-leaves/[id]` | Yes (Role: EMPLOYEE) | **VERIFIED (PASS)** |
| **Leave Balance** | Employee | `src/app/(dashboard)/employee/leave-balance/page.tsx` | `https://elms360.vercel.app/employee/leave-balance` | Yes (Role: EMPLOYEE) | **VERIFIED (PASS)** |
| **Leave Calendar** | Employee | `src/app/(dashboard)/employee/leave-calendar/page.tsx` | `https://elms360.vercel.app/employee/leave-calendar` | Yes (Role: EMPLOYEE) | **VERIFIED (PASS)** |
| **Employee Notifications** | Employee | `src/app/(dashboard)/employee/notifications/page.tsx` | `https://elms360.vercel.app/employee/notifications` | Yes (Role: EMPLOYEE) | **VERIFIED (PASS)** |
| **Employee Profile** | Employee | `src/app/(dashboard)/employee/profile/page.tsx` | `https://elms360.vercel.app/employee/profile` | Yes (Role: EMPLOYEE) | **VERIFIED (PASS)** |
| **Manager Dashboard** | Manager | `src/app/(dashboard)/manager/dashboard/page.tsx` | `https://elms360.vercel.app/manager/dashboard` | Yes (Role: MANAGER, HR, ADMIN) | **VERIFIED (PASS)** |
| **Pending Approvals** | Manager | `src/app/(dashboard)/manager/approvals/page.tsx` | `https://elms360.vercel.app/manager/approvals` | Yes (Role: MANAGER, HR, ADMIN) | **VERIFIED (PASS)** |
| **Approval Detail View** | Manager | `src/app/(dashboard)/manager/approvals/[id]/page.tsx` | `https://elms360.vercel.app/manager/approvals/[id]` | Yes (Role: MANAGER, HR, ADMIN) | **VERIFIED (PASS)** |
| **Manager Request History** | Manager | `src/app/(dashboard)/manager/history/page.tsx` | `https://elms360.vercel.app/manager/history` | Yes (Role: MANAGER, HR, ADMIN) | **VERIFIED (PASS)** |
| **Team Directory** | Manager | `src/app/(dashboard)/manager/team/page.tsx` | `https://elms360.vercel.app/manager/team` | Yes (Role: MANAGER, HR, ADMIN) | **VERIFIED (PASS)** |
| **Team Calendar** | Manager | `src/app/(dashboard)/manager/team-calendar/page.tsx` | `https://elms360.vercel.app/manager/team-calendar` | Yes (Role: MANAGER, HR, ADMIN) | **VERIFIED (PASS)** |
| **Approval Delegations** | Manager | `src/app/(dashboard)/manager/delegations/page.tsx` | `https://elms360.vercel.app/manager/delegations` | Yes (Role: MANAGER, HR, ADMIN) | **VERIFIED (PASS)** |
| **Manager Notifications** | Manager | `src/app/(dashboard)/manager/notifications/page.tsx` | `https://elms360.vercel.app/manager/notifications` | Yes (Role: MANAGER, HR, ADMIN) | **VERIFIED (PASS)** |
| **HR Dashboard** | HR Admin | `src/app/(dashboard)/hr/dashboard/page.tsx` | `https://elms360.vercel.app/hr/dashboard` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Employee Directory** | HR Admin | `src/app/(dashboard)/hr/employees/page.tsx` | `https://elms360.vercel.app/hr/employees` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Employee Details** | HR Admin | `src/app/(dashboard)/hr/employees/[id]/page.tsx` | `https://elms360.vercel.app/hr/employees/[id]` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Add New Employee** | HR Admin | `src/app/(dashboard)/hr/employees/new/page.tsx` | `https://elms360.vercel.app/hr/employees/new` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Department Management** | HR Admin | `src/app/(dashboard)/hr/departments/page.tsx` | `https://elms360.vercel.app/hr/departments` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **HR Leave Queue** | HR Admin | `src/app/(dashboard)/hr/approvals/page.tsx` | `https://elms360.vercel.app/hr/approvals` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Organization Leave Requests** | HR Admin | `src/app/(dashboard)/hr/leave-requests/page.tsx` | `https://elms360.vercel.app/hr/leave-requests` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Leave Policies & Quotas** | HR Admin | `src/app/(dashboard)/hr/policies/page.tsx` | `https://elms360.vercel.app/hr/policies` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Holiday Calendars** | HR Admin | `src/app/(dashboard)/hr/holidays/page.tsx` | `https://elms360.vercel.app/hr/holidays` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **HR Reports & Ledger** | HR Admin | `src/app/(dashboard)/hr/reports/page.tsx` | `https://elms360.vercel.app/hr/reports` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **HR Audit Logs** | HR Admin | `src/app/(dashboard)/hr/audit-logs/page.tsx` | `https://elms360.vercel.app/hr/audit-logs` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **HR System Settings** | HR Admin | `src/app/(dashboard)/hr/settings/page.tsx` | `https://elms360.vercel.app/hr/settings` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Work Schedules** | HR Admin | `src/app/(dashboard)/hr/work-schedules/page.tsx` | `https://elms360.vercel.app/hr/work-schedules` | Yes (Role: HR_ADMIN, SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Super Admin Dashboard** | Super Admin | `src/app/(dashboard)/admin/dashboard/page.tsx` | `https://elms360.vercel.app/admin/dashboard` | Yes (Role: SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Tenant Organizations** | Super Admin | `src/app/(dashboard)/admin/organizations/page.tsx` | `https://elms360.vercel.app/admin/organizations` | Yes (Role: SUPER_ADMIN) | **VERIFIED (PASS)** |
| **User Access Management** | Super Admin | `src/app/(dashboard)/admin/users/page.tsx` | `https://elms360.vercel.app/admin/users` | Yes (Role: SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Role Hierarchy** | Super Admin | `src/app/(dashboard)/admin/roles/page.tsx` | `https://elms360.vercel.app/admin/roles` | Yes (Role: SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Permission Scopes** | Super Admin | `src/app/(dashboard)/admin/permissions/page.tsx` | `https://elms360.vercel.app/admin/permissions` | Yes (Role: SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Security Controls** | Super Admin | `src/app/(dashboard)/admin/security/page.tsx` | `https://elms360.vercel.app/admin/security` | Yes (Role: SUPER_ADMIN) | **VERIFIED (PASS)** |
| **System Audit Logs** | Super Admin | `src/app/(dashboard)/admin/audit-logs/page.tsx` | `https://elms360.vercel.app/admin/audit-logs` | Yes (Role: SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Admin System Settings** | Super Admin | `src/app/(dashboard)/admin/system-settings/page.tsx` | `https://elms360.vercel.app/admin/system-settings` | Yes (Role: SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Admin Settings (Alias)** | Super Admin | `src/app/(dashboard)/admin/settings/page.tsx` | `https://elms360.vercel.app/admin/settings` | Yes (Role: SUPER_ADMIN) | **VERIFIED (PASS)** |
| **Health Check API** | System | `src/app/api/health/route.ts` | `https://elms360.vercel.app/api/health` | No (Public Status Probe) | **VERIFIED (PASS)** |
| **Store Sync API** | Core API | `src/app/api/store/sync/route.ts` | `https://elms360.vercel.app/api/store/sync` | Yes (Session Cookie) | **VERIFIED (PASS)** |
| **Store Mutate API** | Core API | `src/app/api/store/mutate/route.ts` | `https://elms360.vercel.app/api/store/mutate` | Yes (Session Cookie) | **VERIFIED (PASS)** |
