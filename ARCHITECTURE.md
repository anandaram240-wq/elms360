# ELMS 360 - System Architecture & Design Documentation

## 1. System Overview
**ELMS 360** is an enterprise-grade Employee Leave Management System engineered for modern organizations. Built on a resilient, multi-tenant architecture with PostgreSQL and Next.js, ELMS 360 manages the full lifecycle of leave operations—entitlements, automated accruals, tiered approval workflows, calendar synchronizations, balance ledger auditing, and real-time alerts.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | Next.js 15+ (App Router), React 19, TypeScript |
| **Styling & UI Components** | Tailwind CSS, Radix UI primitives, Lucide React, Sonner (Toasts) |
| **State & Data Fetching** | TanStack React Query v5, Supabase SSR client |
| **Forms & Validation** | React Hook Form, Zod schema validation |
| **Data Visualization & Export**| Recharts, date-fns, PapaParse (CSV), jsPDF & autotable (PDF), ical-generator |
| **Database & Auth** | Supabase (PostgreSQL 15+), PostgREST, Row-Level Security (RLS) |
| **Communication / Async** | PostgreSQL Outbox Pattern, Realtime publication, Resend (Email) |

---

## 3. Database Architecture (29 Tables)

The schema is partitioned into cohesive domain models:

### 3.1 Organization & Structural Domain
1. `organizations`: Root tenant entity with localized timezone, fiscal year settings, and weekly off rules.
2. `departments`: Organizational hierarchy supporting parent-child department trees and department heads.
3. `roles`: RBAC roles scoped to organizations with system-level immutability flags.
4. `permissions`: Granular system capabilities organized by functional module.
5. `role_permissions`: Many-to-many junction mapping roles to system permissions.
6. `organization_settings`: Policy switches (coverage requirements, auto-approval thresholds, concurrent leave policies).

### 3.2 Identity & Employment Domain
7. `user_profiles`: Extends `auth.users` with personal profile metadata and organization tenancy link.
8. `employees`: Core worker master containing employment status, type, designation, and code.
9. `reporting_relationships`: Dynamic manager-report hierarchy with effective date windows.
10. `employee_role_assignments`: Role bindings per employee.
11. `work_schedules`: Working day arrays (e.g. Mon–Fri) and required hours per day.
12. `employee_work_schedules`: Effective schedule assignments for rotational or shift workers.
13. `holiday_calendars`: Year-based calendar groupings.
14. `holidays`: Specific holiday dates with optional or mandatory status.

### 3.3 Leave Configuration & Ledger Domain
15. `leave_types`: Category metadata (Annual, Casual, Sick, etc.) with color tags and document rules.
16. `leave_policies`: Entitlement rules, accrual rates (monthly/quarterly/annual), notice periods, carry-forward caps.
17. `leave_policy_versions`: Audit trail snapshots of policy configurations across revisions.
18. `employee_policy_assignments`: Explicit assignment of policy variants to employees.
19. `leave_balances`: Materialized balances with computed `closing_balance` and `available_balance`.
20. `leave_balance_ledger`: Immutable append-only double-entry financial ledger recording all balance changes.

### 3.4 Request & Workflow Processing Domain
21. `approval_workflows`: Multi-step workflow definitions conditional on duration and department.
22. `approval_workflow_steps`: Ordered stages (Manager -> HR -> Exec) with approver resolution rules.
23. `leave_requests`: Primary transaction capturing leave dates, day counts, reasons, and state.
24. `leave_request_days`: Itemized daily breakdown accounting for half-days, weekends, and holidays.
25. `approval_actions`: Immutable chronological log of approval events, comments, and delegations.
26. `approval_delegations`: Temporary out-of-office approver proxy assignments with date limits.
27. `leave_attachments`: Document proofs (medical certificates, travel plans) tied to requests.

### 3.5 Communications & Audit Domain
28. `notifications`: In-app event alerts with read status tracking and deep metadata.
29. `outbox_events`: Reliable transactional outbox table for event dispatch and async integrations.
30. `audit_logs`: Tamper-resistant compliance trail recording security and operational actions.

---

## 4. Role-Permission Matrix

| Permission Code | Description | Module | SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE |
|---|---|---|:---:|:---:|:---:|:---:|
| `leave.apply` | Submit leave requests | LEAVE |  |  |  |  |
| `leave.approve` | Approve/reject assigned leaves | LEAVE |  |  |  | ❌ |
| `leave.view_all` | View all org leave requests | LEAVE |  |  | ❌ | ❌ |
| `leave.manage` | Configure types & policies | LEAVE |  |  | ❌ | ❌ |
| `employee.view` | Directory & profiles view | EMPLOYEE |  |  |  |  |
| `employee.manage`| Create/edit employee data | EMPLOYEE |  |  | ❌ | ❌ |
| `report.view` | Access analytics dashboards | REPORT |  |  |  | ❌ |
| `report.export` | Download CSV/PDF summaries | REPORT |  |  | ❌ | ❌ |
| `settings.manage`| Configure company parameters| SETTINGS |  | ❌ | ❌ | ❌ |
| `holiday.manage` | Add/modify holiday calendar | HOLIDAY |  |  | ❌ | ❌ |

---

## 5. Leave Request State Machine

```
                  +--------------+
                  |    DRAFT     |
                  +-------+------+
                          |
                  [submit_leave_request]
                          |
                          v
         +----------------------------------+
         |     PENDING_MANAGER_APPROVAL     | <---------------+
         +----+--------------+-------------+                 |
              |              |                               |
       [Manager Approve]  [Manager Reject]             [Resubmit /
              |              |                         Clarify]
              v              v                               |
         +----+------+  +----+-----+                         |
    +--->| PENDING_  |  | REJECTED |                         |
    |    | HR_APPR.  |  +----------+                         |
    |    +----+------+                                       |
    |         |                                              |
    |   [HR Approve]                                         |
    |         |                                              |
    |         v                                              |
    |    +----+-----+       [Clarification Needed]           |
    |    | APPROVED |----------------------------------------+
    |    +----+-----+
    |         |
    |    [Cancellation Request]
    |         v
    |    +------------------------+
    |    | CANCELLATION_REQUESTED |
    |    +------------+-----------+
    |                 |
    |          [Approve Cancel]
    |                 v
    |            +----+-----+
    |            | CANCELLED|
    |            +----------+
    |
    +---- (Or PENDING_ADDITIONAL_APPROVAL in multi-step workflows)
```

---

## 6. Financial Ledger & Balance Engine

To guarantee zero race conditions and financial integrity:
1. **Materialized View + Ledger Pattern**: `leave_balances` contains the cached current state (`opening_balance`, `accrued`, `used`, `pending`, `carried_forward`). `leave_balance_ledger` is append-only.
2. **Reservation on Submission**: When an employee submits a leave, `pending` increases immediately, locking `available_balance = opening + accrued + adjusted + carried_forward - used - pending - expired`.
3. **Double-Entry on Final Approval**:
   - `pending` is reduced by $N$.
   - `used` is incremented by $N$.
   - A `PENDING_RELEASE` ledger entry and a `DEDUCTION` ledger entry are committed in the same database transaction.
4. **Reversal on Rejection / Withdrawal**:
   - `pending` is reduced by $N$.
   - A `REVERSAL` ledger entry restores available balance.

---

## 7. Approval & Stored Procedure Execution

Critical transactions are delegated to PostgreSQL `SECURITY DEFINER` stored procedures:
- `calculate_working_days(start_date, end_date, employee_id, day_type)`: Performs calendar math by joining employee shift schedules and holiday calendars, filtering weekends and national holidays.
- `submit_leave_request(p_request_id, p_employee_id)`: Atomic state transition from `DRAFT` to `PENDING_MANAGER_APPROVAL`, locks balance, creates ledger records, and pushes to `outbox_events` and `notifications`.
- `process_approval_action(p_request_id, p_actor_id, p_action, p_comments, p_idempotency_key)`:
  - Uses `SELECT ... FOR UPDATE` row locking to prevent concurrent double-approvals.
  - Verifies idempotency keys.
  - Handles workflow stage progression or final approval deductions.

---

## 8. Real-time & Event Architecture

```
[User Action] 
     │
     ▼
[PostgreSQL Stored Proc] ──(atomic transaction)──► [Insert outbox_events]
     │                                            [Insert notifications]
     ▼                                                      │
[Database State Updated]                                    ▼
     │                                           [Supabase Realtime Bus]
     ▼                                                      │
[Row Level Security]                                       ▼
     │                                           [Connected Client Toasts]
     ▼
[React Query Cache Invalidation]
```

- **Transactional Outbox**: Decouples external services (e.g., SMTP email delivery via Resend) from API responses.
- **Supabase Realtime**: Clients subscribe to the `notifications` table filtered by `recipient_id=eq.{employee_id}`, allowing instant badge updates and popups.

---

## 9. Security & Access Control Decisions

1. **Row Level Security (RLS)**: Enforced across all 29 database tables. Standard queries via PostgREST cannot leak data across tenants or unpermitted roles.
2. **Security Definer Helpers**: `get_my_employee_id()`, `get_my_org_id()`, `is_hr_or_admin()`, and `is_manager_of()` execute as privileged SQL to check context without opening arbitrary table permissions.
3. **Strict Column & Trigger Immutability**: `audit_logs` and `leave_balance_ledger` cannot be modified or deleted by user roles.
4. **Idempotency Guarantees**: Approval and submission endpoints require or generate unique composite keys to eliminate double-clicks and replay issues.

---

## 10. Known Limitations & Roadmap

- **Multi-Tenant Routing**: Current iteration scopes by database row isolation (`organization_id`). Future multi-tenancy can support subdomains (`tenant.elms360.com`).
- **Complex Flexi-Rotas**: Highly non-standard rotating shift rosters (e.g., 4 days on, 4 days off) currently default to Mon–Fri schedules; custom shift rotation algorithms are slated for Phase 2.
- **Offline Mode**: Form caching via IndexedDB is planned for progressive web app (PWA) field workers.
