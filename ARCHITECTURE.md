# ELMS 360 - System Architecture & Design Documentation

## 1. System Overview
**ELMS 360** is an enterprise-grade Employee Leave Management System engineered for modern organizations. Built on a resilient, multi-tenant architecture with PostgreSQL and Next.js, ELMS 360 manages the full lifecycle of leave operations—entitlements, automated accruals, tiered approval workflows, calendar synchronizations, balance ledger auditing, and real-time alerts.

---

## 2. Dual-Mode Database Architecture & Dev Persistence

ELMS 360 is engineered with a **zero-dependency, dual-mode data layer**:

```
                       ┌─────────────────────────────────────┐
                       │        Supabase Client Factory      │
                       │     (server.ts / client.ts)         │
                       └──────────────────┬──────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
    [Real Supabase Mode]                                [Mock In-Memory + File DB Mode]
  (Activated when actual URL & keys                 (Default when no cloud credentials
   configured in `.env.local`)                       or Docker daemon available)
                  │                                               │
                  ▼                                               ▼
     PostgreSQL 15+ (Cloud/Local)                    In-Memory Singleton (`globalThis`)
    - 29 Tables with RLS                                          │
    - Stored Procedures & Triggers                                ▼
    - Realtime Event Publications                     `.elms360_dev_db.json` (Local Root)
                                                      - File-based persistence
                                                      - Survives dev server reboots
                                                      - Fast sub-millisecond unit tests
```

### 2.1 Dual-Mode Operation
1. **Mock Dev Mode (Default)**:
   - When `NEXT_PUBLIC_SUPABASE_URL` contains placeholder credentials (e.g. `your-project.supabase.co` or unconfigured keys), the application seamlessly runs against an in-memory mock query engine (`src/lib/db-store.ts`).
   - Seeds realistic data for 27 employees across 5 departments with approval workflows, leave balances, requests, and notifications.
   - Provides 100% PostgREST-compatible chainable query builders (`.from().select().eq().order().limit().single()`) and RPC procedure emulations.

2. **Real Supabase Mode (Production & Staging)**:
   - When real Supabase credentials are provided in `.env.local`, the client factory binds directly to Supabase via `@supabase/ssr`.
   - Enforces PostgreSQL Row Level Security (RLS) on all 29 tables.
   - Executes ACID transactions in `SECURITY DEFINER` stored procedures.

### 2.2 How to Switch to Real Supabase
To connect ELMS 360 to a real Supabase instance (Cloud or Local CLI):
1. Obtain your Project URL and API Keys from [Supabase Dashboard](https://app.supabase.com) or local `supabase start`.
2. Update `/Users/ananda/Downloads/EMPLOYEE LEAVE/elms360/.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   SUPABASE_JWT_SECRET=your-jwt-secret
   ```
3. Run the migrations sequentially (see Section 3). The application automatically switches to live PostgREST queries with zero code changes.

### 2.3 File-Based Development Persistence System
To prevent data loss during hot-reloading or local development restarts when working without Docker:
- State is serialized to `.elms360_dev_db.json` in the project root on every mutation (`insert`, `update`, `upsert`, `delete`, and `rpc`).
- On server startup, `loadPersistedDb()` re-hydrates the in-memory singleton from `.elms360_dev_db.json` if present.
- Safe dynamic server loading prevents Node `fs` APIs from bundling into client components.
- `.elms360_dev_db.json` is automatically ignored in `.gitignore`.

---

## 3. Database Schema & Migration Architecture (4 Migration Files)

All PostgreSQL schema definitions reside in `supabase/migrations/`:

### 3.1 Migration File Breakdown
1. **`001_initial_schema.sql`** (All 29 Core Tables & Extensions):
   - Installs `uuid-ossp` and `pg_trgm` (trigram fuzzy search) extensions.
   - Creates organizational core: `organizations`, `departments`, `roles`, `permissions`, `role_permissions`, `organization_settings`.
   - Creates employee & identity master: `user_profiles`, `employees`, `reporting_relationships`, `employee_role_assignments`, `work_schedules`, `employee_work_schedules`, `holiday_calendars`, `holidays`.
   - Creates policy & ledger tables: `leave_types`, `leave_policies`, `leave_policy_versions`, `employee_policy_assignments`, `leave_balances`, `leave_balance_ledger`.
   - Creates transaction & workflow tables: `approval_workflows`, `approval_workflow_steps`, `leave_requests`, `leave_request_days`, `approval_actions`, `approval_delegations`, `leave_attachments`.
   - Creates comms & auditing: `notifications`, `outbox_events`, `audit_logs`.
   - Sets up sequence `leave_request_seq` for automated human-readable codes (`LR-2026-001000`).

2. **`002_indexes_and_functions.sql`** (Indexes, Triggers, & Stored Procedures):
   - Trigram GIN index on employee full name for instant search.
   - Foreign key and status B-tree indexes across all foreign references.
   - `update_updated_at()` trigger function attached to all mutable tables.
   - Stored procedure `calculate_working_days(start_date, end_date, employee_id, day_type)` accounting for weekend arrays and holiday calendars.
   - ACID stored procedure `submit_leave_request(p_request_id, p_employee_id)` transitioning DRAFT -> PENDING with balance locking.
   - ACID stored procedure `process_approval_action(p_request_id, p_actor_id, p_action, p_comments, p_idempotency_key)` with `SELECT FOR UPDATE` concurrency locks.

3. **`003_rls_policies.sql`** (Row Level Security):
   - Enables RLS on all 29 tables.
   - Defines security definer helper functions: `get_my_employee_id()`, `get_my_org_id()`, `is_hr_or_admin()`, and `is_manager_of()`.
   - Implements tenant data isolation (`organization_id = get_my_org_id()`) and role scoping.

4. **`004_seed_data.sql`** (Deterministic Seed Dataset):
   - Deterministic UUIDs for repeatable testing.
   - ABC Technologies organization (`aaaaaaaa-0000-0000-0000-000000000001`).
   - 5 Departments: Engineering, Human Resources, Finance, Marketing, Operations.
   - 4 System Roles: `SUPER_ADMIN`, `HR_ADMIN`, `MANAGER`, `EMPLOYEE`.
   - 2026 Holiday Calendar (10 national holidays).
   - 9 Leave Types with complete entitlements: Annual (21d), Sick (10d), Casual (7d), Earned (15d), Unpaid, Comp Off, Maternity (180d), Paternity (15d), Bereavement (5d).
   - 27 Employees (EMP001–EMP027) with reporting relationships.
   - Realistic 2026 leave balances and 15+ leave requests across all state machine phases.

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

## 7. Timezone-Safe Date Engine

To eliminate UTC-shift bugs where a date selected as "2026-11-21" shifts to "2026-11-20" across international boundaries:
- All calendar arithmetic uses dedicated ISO string parsing (`YYYY-MM-DD`).
- Days of the week are calculated from pure calendar date integers rather than localized Date objects.
- `calculateWorkingDays` accurately factors in custom weekly-off days (`weekly_off_days: [0, 6]` for Sat/Sun or `[0]` for Sun only) and public holiday intersections.

---

## 8. Security & Secret Management

1. **Credential Redaction**: Zero plaintext passwords committed to source control.
2. **Local Environment Variables**: Demo authentication credentials driven by `.env.local` / `.env.local.example`.
3. **Row Level Security (RLS)**: Enforced across all 29 database tables. Standard queries via PostgREST cannot leak data across tenants or unpermitted roles.
4. **Security Definer Helpers**: Privileged SQL helper functions check access context without exposing system tables.
5. **Strict Column & Trigger Immutability**: `audit_logs` and `leave_balance_ledger` cannot be modified or deleted by user roles.
6. **Idempotency Guarantees**: Approval and submission endpoints require or generate unique composite keys to eliminate double-clicks and replay issues.
