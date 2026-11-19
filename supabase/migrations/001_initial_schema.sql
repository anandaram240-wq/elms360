-- ============================================================
-- ELMS 360 - Initial Schema
-- Migration: 001_initial_schema.sql
-- Description: Creates all 29 core tables
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  fiscal_year_start INTEGER NOT NULL DEFAULT 1 CHECK (fiscal_year_start BETWEEN 1 AND 12),
  weekly_off_days INTEGER[] NOT NULL DEFAULT ARRAY[0,6],
  logo_url TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  code TEXT,
  parent_department_id UUID REFERENCES departments(id),
  head_employee_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  employee_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  personal_email TEXT,
  phone TEXT,
  designation TEXT,
  department_id UUID REFERENCES departments(id),
  location TEXT,
  date_of_joining DATE NOT NULL,
  date_of_birth DATE,
  employment_type TEXT NOT NULL DEFAULT 'FULL_TIME' CHECK (employment_type IN ('FULL_TIME','PART_TIME','CONTRACT','INTERN')),
  employment_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (employment_status IN ('ACTIVE','INACTIVE','TERMINATED','ON_NOTICE')),
  grade TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, employee_code),
  UNIQUE(organization_id, work_email)
);

CREATE TABLE reporting_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  relationship_type TEXT NOT NULL DEFAULT 'PRIMARY' CHECK (relationship_type IN ('PRIMARY','SECONDARY')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, manager_id, relationship_type)
);

CREATE TABLE employee_role_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  assigned_by UUID REFERENCES employees(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(employee_id, role_id)
);

CREATE TABLE work_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  working_days INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  hours_per_day NUMERIC(4,2) NOT NULL DEFAULT 8,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

CREATE TABLE employee_work_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE RESTRICT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE holiday_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  location TEXT,
  department_id UUID REFERENCES departments(id),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, name, year)
);

CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id UUID NOT NULL REFERENCES holiday_calendars(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  holiday_type TEXT NOT NULL DEFAULT 'NATIONAL' CHECK (holiday_type IN ('NATIONAL','OPTIONAL','REGIONAL','ORGANIZATION')),
  is_optional BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(calendar_id, holiday_date)
);

CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT,
  requires_document BOOLEAN NOT NULL DEFAULT FALSE,
  document_description TEXT,
  allows_half_day BOOLEAN NOT NULL DEFAULT TRUE,
  allows_negative_balance BOOLEAN NOT NULL DEFAULT FALSE,
  is_paid BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

CREATE TABLE leave_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  annual_entitlement NUMERIC(6,2) NOT NULL DEFAULT 0,
  accrual_type TEXT NOT NULL DEFAULT 'ANNUAL' CHECK (accrual_type IN ('ANNUAL','MONTHLY','QUARTERLY','NONE')),
  accrual_amount NUMERIC(6,2) NOT NULL DEFAULT 0,
  accrual_start_month INTEGER CHECK (accrual_start_month BETWEEN 1 AND 12),
  probation_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  probation_days INTEGER,
  carry_forward_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  carry_forward_max_days NUMERIC(6,2),
  carry_forward_expiry_months INTEGER,
  max_consecutive_days INTEGER,
  min_notice_days INTEGER NOT NULL DEFAULT 0,
  max_advance_days INTEGER,
  allows_backdated BOOLEAN NOT NULL DEFAULT FALSE,
  backdated_max_days INTEGER,
  encashment_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  applicable_employment_types TEXT[] NOT NULL DEFAULT ARRAY['FULL_TIME'],
  applicable_grades TEXT[],
  applicable_department_ids UUID[],
  version INTEGER NOT NULL DEFAULT 1,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE leave_policy_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES leave_policies(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL,
  policy_snapshot JSONB NOT NULL,
  changed_by UUID REFERENCES employees(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(policy_id, version)
);

CREATE TABLE employee_policy_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL REFERENCES leave_policies(id) ON DELETE RESTRICT,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  assigned_by UUID REFERENCES employees(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE leave_request_seq START 1000;

CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  fiscal_year INTEGER NOT NULL,
  opening_balance NUMERIC(8,2) NOT NULL DEFAULT 0,
  accrued NUMERIC(8,2) NOT NULL DEFAULT 0,
  used NUMERIC(8,2) NOT NULL DEFAULT 0,
  pending NUMERIC(8,2) NOT NULL DEFAULT 0,
  adjusted NUMERIC(8,2) NOT NULL DEFAULT 0,
  carried_forward NUMERIC(8,2) NOT NULL DEFAULT 0,
  expired NUMERIC(8,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(8,2) GENERATED ALWAYS AS (opening_balance + accrued + adjusted + carried_forward - used - expired) STORED,
  available_balance NUMERIC(8,2) GENERATED ALWAYS AS (opening_balance + accrued + adjusted + carried_forward - used - pending - expired) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, leave_type_id, fiscal_year)
);

CREATE TABLE leave_balance_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  fiscal_year INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('OPENING','ACCRUAL','DEDUCTION','REVERSAL','CARRY_FORWARD','EXPIRY','MANUAL_ADJUSTMENT','PENDING_RESERVE','PENDING_RELEASE')),
  amount NUMERIC(8,2) NOT NULL,
  balance_before NUMERIC(8,2) NOT NULL,
  balance_after NUMERIC(8,2) NOT NULL,
  leave_request_id UUID,
  performed_by UUID REFERENCES employees(id),
  reason TEXT,
  reference TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  leave_type_ids UUID[],
  applies_to_all_leave_types BOOLEAN NOT NULL DEFAULT TRUE,
  department_ids UUID[],
  applies_to_all_departments BOOLEAN NOT NULL DEFAULT TRUE,
  min_duration_days NUMERIC(6,2),
  max_duration_days NUMERIC(6,2),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE approval_workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  approver_type TEXT NOT NULL CHECK (approver_type IN ('DIRECT_MANAGER','DEPARTMENT_HEAD','HR','SPECIFIC_EMPLOYEE','ROLE')),
  approver_role_id UUID REFERENCES roles(id),
  approver_employee_id UUID REFERENCES employees(id),
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  can_skip_conditions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workflow_id, step_order)
);

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT UNIQUE NOT NULL DEFAULT ('LR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('leave_request_seq')::TEXT, 6, '0')),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
  workflow_id UUID REFERENCES approval_workflows(id),
  current_step_order INTEGER,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT','PENDING_MANAGER_APPROVAL','PENDING_HR_APPROVAL',
    'PENDING_ADDITIONAL_APPROVAL','CLARIFICATION_REQUESTED',
    'APPROVED','REJECTED','WITHDRAWN','CANCELLATION_REQUESTED','CANCELLED'
  )),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days NUMERIC(6,2) NOT NULL,
  day_type TEXT NOT NULL DEFAULT 'FULL_DAY' CHECK (day_type IN ('FULL_DAY','HALF_DAY_AM','HALF_DAY_PM','PARTIAL')),
  partial_hours NUMERIC(4,2),
  reason TEXT NOT NULL,
  handover_notes TEXT,
  emergency_contact TEXT,
  contact_during_leave TEXT,
  policy_id UUID REFERENCES leave_policies(id),
  applied_at TIMESTAMPTZ,
  current_approver_id UUID REFERENCES employees(id),
  clarification_message TEXT,
  rejection_reason TEXT,
  cancellation_reason TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE TABLE leave_request_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  day_value NUMERIC(4,2) NOT NULL DEFAULT 1 CHECK (day_value > 0 AND day_value <= 1),
  is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
  is_weekend BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(leave_request_id, leave_date)
);

CREATE TABLE approval_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE RESTRICT,
  workflow_step_id UUID REFERENCES approval_workflow_steps(id),
  step_order INTEGER,
  actor_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('SUBMITTED','APPROVED','REJECTED','CLARIFICATION_REQUESTED','FORWARDED','WITHDRAWN','CANCELLATION_APPROVED','DELEGATED')),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  comments TEXT,
  acted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idempotency_key TEXT UNIQUE
);

CREATE TABLE approval_delegations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  delegator_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  delegate_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  department_ids UUID[],
  applies_to_all_departments BOOLEAN NOT NULL DEFAULT FALSE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date),
  CHECK (delegator_id != delegate_id)
);

CREATE TABLE leave_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  recipient_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES employees(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  leave_request_id UUID REFERENCES leave_requests(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE outbox_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','DELIVERED','FAILED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  previous_state JSONB,
  new_state JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  correlation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  leave_year_type TEXT NOT NULL DEFAULT 'CALENDAR' CHECK (leave_year_type IN ('CALENDAR','FISCAL')),
  max_pending_per_employee INTEGER NOT NULL DEFAULT 3,
  allow_concurrent_leaves BOOLEAN NOT NULL DEFAULT FALSE,
  min_team_coverage_percent INTEGER NOT NULL DEFAULT 60,
  require_handover_notes BOOLEAN NOT NULL DEFAULT FALSE,
  auto_approve_after_days INTEGER,
  enable_email_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  enable_push_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  working_hours_per_day NUMERIC(4,2) NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
