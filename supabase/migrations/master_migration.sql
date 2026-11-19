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
-- ============================================================
-- ELMS 360 - Indexes, Functions, Triggers & Stored Procedures
-- Migration: 002_indexes_and_functions.sql
-- ============================================================

-- ============================================================
-- SECTION 1: INDEXES
-- ============================================================

-- organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- departments
CREATE INDEX idx_departments_org_id ON departments(organization_id);
CREATE INDEX idx_departments_parent ON departments(parent_department_id);
CREATE INDEX idx_departments_head_emp ON departments(head_employee_id);

-- roles
CREATE INDEX idx_roles_org_id ON roles(organization_id);
CREATE INDEX idx_roles_code ON roles(organization_id, code);

-- user_profiles
CREATE INDEX idx_user_profiles_org_id ON user_profiles(organization_id);

-- employees
CREATE INDEX idx_employees_org_id ON employees(organization_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_employment_status ON employees(employment_status);
CREATE INDEX idx_employees_is_active ON employees(is_active);
CREATE INDEX idx_employees_work_email ON employees(work_email);
CREATE INDEX idx_employees_name_trgm ON employees USING gin (full_name gin_trgm_ops);

-- reporting_relationships
CREATE INDEX idx_reporting_emp_id ON reporting_relationships(employee_id);
CREATE INDEX idx_reporting_manager_id ON reporting_relationships(manager_id);
CREATE INDEX idx_reporting_active ON reporting_relationships(is_active);

-- employee_role_assignments
CREATE INDEX idx_era_employee_id ON employee_role_assignments(employee_id);
CREATE INDEX idx_era_role_id ON employee_role_assignments(role_id);
CREATE INDEX idx_era_active ON employee_role_assignments(is_active);

-- work_schedules
CREATE INDEX idx_work_schedules_org_id ON work_schedules(organization_id);

-- employee_work_schedules
CREATE INDEX idx_ews_employee_id ON employee_work_schedules(employee_id);
CREATE INDEX idx_ews_active ON employee_work_schedules(is_active);

-- holiday_calendars
CREATE INDEX idx_holiday_calendars_org_id ON holiday_calendars(organization_id);
CREATE INDEX idx_holiday_calendars_year ON holiday_calendars(year);

-- holidays
CREATE INDEX idx_holidays_calendar_id ON holidays(calendar_id);
CREATE INDEX idx_holidays_date ON holidays(holiday_date);
CREATE INDEX idx_holidays_org_id ON holidays(organization_id);

-- leave_types
CREATE INDEX idx_leave_types_org_id ON leave_types(organization_id);
CREATE INDEX idx_leave_types_code ON leave_types(organization_id, code);

-- leave_policies
CREATE INDEX idx_leave_policies_org_id ON leave_policies(organization_id);
CREATE INDEX idx_leave_policies_leave_type_id ON leave_policies(leave_type_id);
CREATE INDEX idx_leave_policies_active ON leave_policies(is_active);

-- leave_policy_versions
CREATE INDEX idx_lpv_policy_id ON leave_policy_versions(policy_id);

-- employee_policy_assignments
CREATE INDEX idx_epa_employee_id ON employee_policy_assignments(employee_id);
CREATE INDEX idx_epa_policy_id ON employee_policy_assignments(policy_id);
CREATE INDEX idx_epa_active ON employee_policy_assignments(is_active);

-- leave_balances
CREATE INDEX idx_lb_employee_id ON leave_balances(employee_id);
CREATE INDEX idx_lb_leave_type_id ON leave_balances(leave_type_id);
CREATE INDEX idx_lb_org_id ON leave_balances(organization_id);
CREATE INDEX idx_lb_fiscal_year ON leave_balances(fiscal_year);

-- leave_balance_ledger
CREATE INDEX idx_lbl_employee_id ON leave_balance_ledger(employee_id);
CREATE INDEX idx_lbl_leave_type_id ON leave_balance_ledger(leave_type_id);
CREATE INDEX idx_lbl_org_id ON leave_balance_ledger(organization_id);
CREATE INDEX idx_lbl_fiscal_year ON leave_balance_ledger(fiscal_year);
CREATE INDEX idx_lbl_request_id ON leave_balance_ledger(leave_request_id);
CREATE INDEX idx_lbl_created_at ON leave_balance_ledger(created_at DESC);

-- approval_workflows
CREATE INDEX idx_aw_org_id ON approval_workflows(organization_id);
CREATE INDEX idx_aw_active ON approval_workflows(is_active);

-- approval_workflow_steps
CREATE INDEX idx_aws_workflow_id ON approval_workflow_steps(workflow_id);

-- leave_requests
CREATE INDEX idx_lr_org_id ON leave_requests(organization_id);
CREATE INDEX idx_lr_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_lr_leave_type_id ON leave_requests(leave_type_id);
CREATE INDEX idx_lr_status ON leave_requests(status);
CREATE INDEX idx_lr_start_date ON leave_requests(start_date);
CREATE INDEX idx_lr_end_date ON leave_requests(end_date);
CREATE INDEX idx_lr_current_approver ON leave_requests(current_approver_id);
CREATE INDEX idx_lr_applied_at ON leave_requests(applied_at DESC);
CREATE INDEX idx_lr_created_at ON leave_requests(created_at DESC);

-- leave_request_days
CREATE INDEX idx_lrd_request_id ON leave_request_days(leave_request_id);
CREATE INDEX idx_lrd_date ON leave_request_days(leave_date);

-- approval_actions
CREATE INDEX idx_aa_request_id ON approval_actions(leave_request_id);
CREATE INDEX idx_aa_actor_id ON approval_actions(actor_id);
CREATE INDEX idx_aa_acted_at ON approval_actions(acted_at DESC);

-- approval_delegations
CREATE INDEX idx_ad_delegator_id ON approval_delegations(delegator_id);
CREATE INDEX idx_ad_delegate_id ON approval_delegations(delegate_id);
CREATE INDEX idx_ad_active ON approval_delegations(is_active);
CREATE INDEX idx_ad_dates ON approval_delegations(start_date, end_date);

-- leave_attachments
CREATE INDEX idx_la_request_id ON leave_attachments(leave_request_id);
CREATE INDEX idx_la_employee_id ON leave_attachments(employee_id);

-- notifications
CREATE INDEX idx_notif_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notif_is_read ON notifications(is_read);
CREATE INDEX idx_notif_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notif_request_id ON notifications(leave_request_id);

-- outbox_events
CREATE INDEX idx_outbox_status ON outbox_events(status);
CREATE INDEX idx_outbox_created_at ON outbox_events(created_at ASC);

-- audit_logs
CREATE INDEX idx_audit_org_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- SECTION 2: update_updated_at TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_work_schedules_updated_at
  BEFORE UPDATE ON work_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_holiday_calendars_updated_at
  BEFORE UPDATE ON holiday_calendars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leave_types_updated_at
  BEFORE UPDATE ON leave_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leave_policies_updated_at
  BEFORE UPDATE ON leave_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_approval_workflows_updated_at
  BEFORE UPDATE ON approval_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_approval_delegations_updated_at
  BEFORE UPDATE ON approval_delegations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_organization_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SECTION 3: STORED PROCEDURES
-- ============================================================

-- ------------------------------------------------------------
-- 3.1 calculate_working_days
-- Returns the number of working days between start_date and
-- end_date for a given employee, excluding weekends and holidays
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_working_days(
  p_start_date DATE,
  p_end_date DATE,
  p_employee_id UUID,
  p_day_type TEXT DEFAULT 'FULL_DAY'
)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
  v_working_days INTEGER[];
  v_total NUMERIC := 0;
  v_current DATE;
  v_dow INTEGER; -- day of week (0=Sunday, 6=Saturday)
  v_is_holiday BOOLEAN;
  v_day_value NUMERIC;
BEGIN
  -- Get employee's org and working days
  SELECT e.organization_id
  INTO v_org_id
  FROM employees e
  WHERE e.id = p_employee_id AND e.is_active = TRUE;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Employee not found: %', p_employee_id;
  END IF;

  -- Get active work schedule for employee (fall back to org default)
  SELECT ws.working_days
  INTO v_working_days
  FROM employee_work_schedules ews
  JOIN work_schedules ws ON ws.id = ews.work_schedule_id
  WHERE ews.employee_id = p_employee_id
    AND ews.is_active = TRUE
    AND ews.effective_from <= p_start_date
    AND (ews.effective_to IS NULL OR ews.effective_to >= p_end_date)
  ORDER BY ews.effective_from DESC
  LIMIT 1;

  -- Fallback to org default schedule
  IF v_working_days IS NULL THEN
    SELECT ws.working_days
    INTO v_working_days
    FROM work_schedules ws
    WHERE ws.organization_id = v_org_id
      AND ws.is_default = TRUE
      AND ws.is_active = TRUE
    LIMIT 1;
  END IF;

  -- Final fallback: Mon-Fri
  IF v_working_days IS NULL THEN
    v_working_days := ARRAY[1,2,3,4,5];
  END IF;

  -- Determine day value based on day_type
  v_day_value := CASE p_day_type
    WHEN 'HALF_DAY_AM' THEN 0.5
    WHEN 'HALF_DAY_PM' THEN 0.5
    ELSE 1.0
  END;

  -- Iterate through each date in range
  v_current := p_start_date;
  WHILE v_current <= p_end_date LOOP
    -- PostgreSQL EXTRACT dow: 0=Sunday, 1=Monday, ..., 6=Saturday
    v_dow := EXTRACT(DOW FROM v_current)::INTEGER;

    -- Check if it's a working day
    IF v_dow = ANY(v_working_days) THEN
      -- Check if it's a holiday
      SELECT EXISTS (
        SELECT 1 FROM holidays h
        JOIN holiday_calendars hc ON hc.id = h.calendar_id
        WHERE hc.organization_id = v_org_id
          AND hc.is_active = TRUE
          AND h.holiday_date = v_current
          AND h.is_optional = FALSE
      ) INTO v_is_holiday;

      IF NOT v_is_holiday THEN
        v_total := v_total + v_day_value;
      END IF;
    END IF;

    v_current := v_current + INTERVAL '1 day';
  END LOOP;

  RETURN v_total;
END;
$$;

-- ------------------------------------------------------------
-- 3.2 submit_leave_request
-- Transitions leave request from DRAFT to PENDING_MANAGER_APPROVAL
-- Creates approval_actions record, notification, outbox_event
-- All in one atomic transaction
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION submit_leave_request(
  p_request_id UUID,
  p_employee_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request leave_requests%ROWTYPE;
  v_employee employees%ROWTYPE;
  v_manager_id UUID;
  v_workflow_id UUID;
  v_first_step approval_workflow_steps%ROWTYPE;
  v_notification_id UUID;
  v_idempotency_key TEXT;
BEGIN
  -- Lock and validate the request
  SELECT * INTO v_request
  FROM leave_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leave request not found: %', p_request_id;
  END IF;

  IF v_request.employee_id != p_employee_id THEN
    RAISE EXCEPTION 'Unauthorized: employee % does not own request %', p_employee_id, p_request_id;
  END IF;

  IF v_request.status != 'DRAFT' THEN
    RAISE EXCEPTION 'Request is not in DRAFT status (current: %)', v_request.status;
  END IF;

  -- Get employee info
  SELECT * INTO v_employee FROM employees WHERE id = p_employee_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Employee not found or inactive: %', p_employee_id;
  END IF;

  -- Find applicable workflow (default or leave-type-specific)
  SELECT id INTO v_workflow_id
  FROM approval_workflows
  WHERE organization_id = v_employee.organization_id
    AND is_active = TRUE
    AND (applies_to_all_leave_types = TRUE OR v_request.leave_type_id = ANY(leave_type_ids))
    AND (applies_to_all_departments = TRUE OR v_employee.department_id = ANY(department_ids))
  ORDER BY is_default DESC, applies_to_all_leave_types ASC
  LIMIT 1;

  -- Get first workflow step
  IF v_workflow_id IS NOT NULL THEN
    SELECT * INTO v_first_step
    FROM approval_workflow_steps
    WHERE workflow_id = v_workflow_id
    ORDER BY step_order ASC
    LIMIT 1;
  END IF;

  -- Find primary manager
  SELECT manager_id INTO v_manager_id
  FROM reporting_relationships
  WHERE employee_id = p_employee_id
    AND relationship_type = 'PRIMARY'
    AND is_active = TRUE
  LIMIT 1;

  v_idempotency_key := 'submit_' || p_request_id::TEXT;

  -- Update the leave request
  UPDATE leave_requests SET
    status = 'PENDING_MANAGER_APPROVAL',
    workflow_id = v_workflow_id,
    current_step_order = COALESCE(v_first_step.step_order, 1),
    current_approver_id = v_manager_id,
    applied_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Reserve balance (pending)
  UPDATE leave_balances SET
    pending = pending + v_request.total_days,
    updated_at = NOW()
  WHERE employee_id = p_employee_id
    AND leave_type_id = v_request.leave_type_id
    AND fiscal_year = EXTRACT(YEAR FROM v_request.start_date)::INTEGER;

  -- Ledger entry for pending reserve
  INSERT INTO leave_balance_ledger (
    employee_id, leave_type_id, organization_id, fiscal_year,
    transaction_type, amount, balance_before, balance_after,
    leave_request_id, reason, idempotency_key
  )
  SELECT
    p_employee_id,
    v_request.leave_type_id,
    v_employee.organization_id,
    EXTRACT(YEAR FROM v_request.start_date)::INTEGER,
    'PENDING_RESERVE',
    v_request.total_days,
    lb.available_balance + v_request.total_days,
    lb.available_balance,
    p_request_id,
    'Leave request submitted',
    v_idempotency_key || '_ledger'
  FROM leave_balances lb
  WHERE lb.employee_id = p_employee_id
    AND lb.leave_type_id = v_request.leave_type_id
    AND lb.fiscal_year = EXTRACT(YEAR FROM v_request.start_date)::INTEGER
  ON CONFLICT (idempotency_key) DO NOTHING;

  -- Create approval action record
  INSERT INTO approval_actions (
    leave_request_id, step_order, actor_id, action,
    previous_status, new_status, comments, idempotency_key
  ) VALUES (
    p_request_id,
    COALESCE(v_first_step.step_order, 1),
    p_employee_id,
    'SUBMITTED',
    'DRAFT',
    'PENDING_MANAGER_APPROVAL',
    'Leave request submitted by employee',
    v_idempotency_key || '_action'
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  -- Create notification for manager (if manager exists)
  IF v_manager_id IS NOT NULL THEN
    INSERT INTO notifications (
      organization_id, recipient_id, sender_id, type,
      title, message, leave_request_id, metadata, idempotency_key
    ) VALUES (
      v_employee.organization_id,
      v_manager_id,
      p_employee_id,
      'LEAVE_REQUEST_SUBMITTED',
      'New Leave Request Pending Approval',
      v_employee.full_name || ' has submitted a leave request (' || v_request.request_number || ') from ' ||
        v_request.start_date::TEXT || ' to ' || v_request.end_date::TEXT || ' (' || v_request.total_days || ' days).',
      p_request_id,
      jsonb_build_object(
        'request_number', v_request.request_number,
        'total_days', v_request.total_days,
        'start_date', v_request.start_date,
        'end_date', v_request.end_date
      ),
      v_idempotency_key || '_notif'
    ) ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  -- Create outbox event
  INSERT INTO outbox_events (
    organization_id, event_type, payload, idempotency_key
  ) VALUES (
    v_employee.organization_id,
    'LEAVE_REQUEST_SUBMITTED',
    jsonb_build_object(
      'request_id', p_request_id,
      'request_number', v_request.request_number,
      'employee_id', p_employee_id,
      'employee_name', v_employee.full_name,
      'manager_id', v_manager_id,
      'leave_type_id', v_request.leave_type_id,
      'start_date', v_request.start_date,
      'end_date', v_request.end_date,
      'total_days', v_request.total_days,
      'status', 'PENDING_MANAGER_APPROVAL'
    ),
    v_idempotency_key || '_outbox'
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'status', 'PENDING_MANAGER_APPROVAL',
    'manager_id', v_manager_id
  );
END;
$$;

-- ------------------------------------------------------------
-- 3.3 process_approval_action
-- Handles APPROVED/REJECTED/CLARIFICATION_REQUESTED with:
-- - Proper state machine validation
-- - Concurrent access locking (SELECT FOR UPDATE)
-- - Idempotency deduplication
-- - Notification creation
-- - Outbox event creation
-- - Balance deduction on final approval
-- All in one atomic transaction
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_approval_action(
  p_request_id UUID,
  p_actor_id UUID,
  p_action TEXT,
  p_comments TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request leave_requests%ROWTYPE;
  v_actor employees%ROWTYPE;
  v_new_status TEXT;
  v_previous_status TEXT;
  v_next_step approval_workflow_steps%ROWTYPE;
  v_next_approver_id UUID;
  v_idempotency_key TEXT;
  v_is_final_approval BOOLEAN := FALSE;
  v_step_count INTEGER;
BEGIN
  -- Idempotency check
  v_idempotency_key := COALESCE(p_idempotency_key, 'action_' || p_request_id || '_' || p_actor_id || '_' || p_action);

  IF EXISTS (
    SELECT 1 FROM approval_actions WHERE idempotency_key = v_idempotency_key || '_action'
  ) THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true);
  END IF;

  -- Validate action
  IF p_action NOT IN ('APPROVED','REJECTED','CLARIFICATION_REQUESTED','WITHDRAWN','CANCELLATION_APPROVED') THEN
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  -- Lock the request for concurrent safety
  SELECT * INTO v_request
  FROM leave_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Leave request not found: %', p_request_id;
  END IF;

  v_previous_status := v_request.status;

  -- State machine validation
  CASE p_action
    WHEN 'APPROVED' THEN
      IF v_request.status NOT IN ('PENDING_MANAGER_APPROVAL','PENDING_HR_APPROVAL','PENDING_ADDITIONAL_APPROVAL','CLARIFICATION_REQUESTED') THEN
        RAISE EXCEPTION 'Cannot approve request in status: %', v_request.status;
      END IF;
    WHEN 'REJECTED' THEN
      IF v_request.status NOT IN ('PENDING_MANAGER_APPROVAL','PENDING_HR_APPROVAL','PENDING_ADDITIONAL_APPROVAL','CLARIFICATION_REQUESTED') THEN
        RAISE EXCEPTION 'Cannot reject request in status: %', v_request.status;
      END IF;
    WHEN 'CLARIFICATION_REQUESTED' THEN
      IF v_request.status NOT IN ('PENDING_MANAGER_APPROVAL','PENDING_HR_APPROVAL','PENDING_ADDITIONAL_APPROVAL') THEN
        RAISE EXCEPTION 'Cannot request clarification for request in status: %', v_request.status;
      END IF;
    WHEN 'WITHDRAWN' THEN
      IF v_request.status NOT IN ('DRAFT','PENDING_MANAGER_APPROVAL','PENDING_HR_APPROVAL','PENDING_ADDITIONAL_APPROVAL','CLARIFICATION_REQUESTED') THEN
        RAISE EXCEPTION 'Cannot withdraw request in status: %', v_request.status;
      END IF;
    WHEN 'CANCELLATION_APPROVED' THEN
      IF v_request.status != 'CANCELLATION_REQUESTED' THEN
        RAISE EXCEPTION 'No cancellation request to approve (status: %)', v_request.status;
      END IF;
  END CASE;

  -- Get actor info
  SELECT * INTO v_actor FROM employees WHERE id = p_actor_id AND is_active = TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Actor employee not found: %', p_actor_id;
  END IF;

  -- Check if there are more workflow steps
  IF v_request.workflow_id IS NOT NULL AND p_action = 'APPROVED' THEN
    SELECT COUNT(*) INTO v_step_count
    FROM approval_workflow_steps
    WHERE workflow_id = v_request.workflow_id
      AND step_order > COALESCE(v_request.current_step_order, 0);

    SELECT * INTO v_next_step
    FROM approval_workflow_steps
    WHERE workflow_id = v_request.workflow_id
      AND step_order > COALESCE(v_request.current_step_order, 0)
    ORDER BY step_order ASC
    LIMIT 1;

    IF FOUND THEN
      -- More steps: advance workflow
      v_new_status := CASE v_next_step.approver_type
        WHEN 'HR' THEN 'PENDING_HR_APPROVAL'
        ELSE 'PENDING_ADDITIONAL_APPROVAL'
      END;

      -- Find next approver
      CASE v_next_step.approver_type
        WHEN 'SPECIFIC_EMPLOYEE' THEN
          v_next_approver_id := v_next_step.approver_employee_id;
        WHEN 'DIRECT_MANAGER' THEN
          SELECT manager_id INTO v_next_approver_id
          FROM reporting_relationships
          WHERE employee_id = v_request.employee_id
            AND relationship_type = 'PRIMARY'
            AND is_active = TRUE
          LIMIT 1;
        WHEN 'HR' THEN
          SELECT e.id INTO v_next_approver_id
          FROM employees e
          JOIN employee_role_assignments era ON era.employee_id = e.id
          JOIN roles r ON r.id = era.role_id
          WHERE e.organization_id = v_request.organization_id
            AND r.code = 'HR_ADMIN'
            AND era.is_active = TRUE
            AND e.is_active = TRUE
          LIMIT 1;
        ELSE
          v_next_approver_id := NULL;
      END CASE;

      v_is_final_approval := FALSE;
    ELSE
      -- No more steps: final approval
      v_new_status := 'APPROVED';
      v_is_final_approval := TRUE;
    END IF;
  ELSIF p_action = 'APPROVED' THEN
    -- No workflow, single-step approval
    v_new_status := 'APPROVED';
    v_is_final_approval := TRUE;
  ELSIF p_action = 'REJECTED' THEN
    v_new_status := 'REJECTED';
  ELSIF p_action = 'CLARIFICATION_REQUESTED' THEN
    v_new_status := 'CLARIFICATION_REQUESTED';
  ELSIF p_action = 'WITHDRAWN' THEN
    v_new_status := 'WITHDRAWN';
  ELSIF p_action = 'CANCELLATION_APPROVED' THEN
    v_new_status := 'CANCELLED';
  END IF;

  -- Update the leave request
  UPDATE leave_requests SET
    status = v_new_status,
    current_step_order = CASE
      WHEN v_next_step.id IS NOT NULL THEN v_next_step.step_order
      ELSE current_step_order
    END,
    current_approver_id = CASE
      WHEN v_is_final_approval OR p_action IN ('REJECTED','WITHDRAWN','CANCELLED') THEN NULL
      WHEN v_next_approver_id IS NOT NULL THEN v_next_approver_id
      ELSE current_approver_id
    END,
    rejection_reason = CASE WHEN p_action = 'REJECTED' THEN p_comments ELSE rejection_reason END,
    clarification_message = CASE WHEN p_action = 'CLARIFICATION_REQUESTED' THEN p_comments ELSE clarification_message END,
    cancellation_reason = CASE WHEN p_action = 'CANCELLATION_APPROVED' THEN p_comments ELSE cancellation_reason END,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Handle balance changes
  IF v_is_final_approval THEN
    -- Release pending, add to used
    UPDATE leave_balances SET
      pending = GREATEST(0, pending - v_request.total_days),
      used = used + v_request.total_days,
      updated_at = NOW()
    WHERE employee_id = v_request.employee_id
      AND leave_type_id = v_request.leave_type_id
      AND fiscal_year = EXTRACT(YEAR FROM v_request.start_date)::INTEGER;

    -- Ledger: release pending + deduction
    INSERT INTO leave_balance_ledger (
      employee_id, leave_type_id, organization_id, fiscal_year,
      transaction_type, amount, balance_before, balance_after,
      leave_request_id, performed_by, reason, idempotency_key
    )
    SELECT
      v_request.employee_id, v_request.leave_type_id, v_request.organization_id,
      EXTRACT(YEAR FROM v_request.start_date)::INTEGER,
      'PENDING_RELEASE', v_request.total_days, lb.closing_balance + v_request.total_days, lb.closing_balance,
      p_request_id, p_actor_id, 'Pending released on final approval',
      v_idempotency_key || '_ledger_release'
    FROM leave_balances lb
    WHERE lb.employee_id = v_request.employee_id
      AND lb.leave_type_id = v_request.leave_type_id
      AND lb.fiscal_year = EXTRACT(YEAR FROM v_request.start_date)::INTEGER
    ON CONFLICT (idempotency_key) DO NOTHING;

    INSERT INTO leave_balance_ledger (
      employee_id, leave_type_id, organization_id, fiscal_year,
      transaction_type, amount, balance_before, balance_after,
      leave_request_id, performed_by, reason, idempotency_key
    )
    SELECT
      v_request.employee_id, v_request.leave_type_id, v_request.organization_id,
      EXTRACT(YEAR FROM v_request.start_date)::INTEGER,
      'DEDUCTION', v_request.total_days, lb.closing_balance + v_request.total_days, lb.closing_balance,
      p_request_id, p_actor_id, 'Leave approved and deducted',
      v_idempotency_key || '_ledger_deduct'
    FROM leave_balances lb
    WHERE lb.employee_id = v_request.employee_id
      AND lb.leave_type_id = v_request.leave_type_id
      AND lb.fiscal_year = EXTRACT(YEAR FROM v_request.start_date)::INTEGER
    ON CONFLICT (idempotency_key) DO NOTHING;

  ELSIF p_action IN ('REJECTED','WITHDRAWN','CANCELLATION_APPROVED') THEN
    -- Release pending balance back to available
    UPDATE leave_balances SET
      pending = GREATEST(0, pending - v_request.total_days),
      updated_at = NOW()
    WHERE employee_id = v_request.employee_id
      AND leave_type_id = v_request.leave_type_id
      AND fiscal_year = EXTRACT(YEAR FROM v_request.start_date)::INTEGER;

    INSERT INTO leave_balance_ledger (
      employee_id, leave_type_id, organization_id, fiscal_year,
      transaction_type, amount, balance_before, balance_after,
      leave_request_id, performed_by, reason, idempotency_key
    )
    SELECT
      v_request.employee_id, v_request.leave_type_id, v_request.organization_id,
      EXTRACT(YEAR FROM v_request.start_date)::INTEGER,
      'REVERSAL', v_request.total_days, lb.available_balance - v_request.total_days, lb.available_balance,
      p_request_id, p_actor_id, 'Balance reversed on ' || lower(p_action),
      v_idempotency_key || '_ledger_reversal'
    FROM leave_balances lb
    WHERE lb.employee_id = v_request.employee_id
      AND lb.leave_type_id = v_request.leave_type_id
      AND lb.fiscal_year = EXTRACT(YEAR FROM v_request.start_date)::INTEGER
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  -- Create approval action record
  INSERT INTO approval_actions (
    leave_request_id, workflow_step_id, step_order,
    actor_id, action, previous_status, new_status, comments, idempotency_key
  ) VALUES (
    p_request_id,
    v_next_step.id,
    v_request.current_step_order,
    p_actor_id,
    p_action,
    v_previous_status,
    v_new_status,
    p_comments,
    v_idempotency_key || '_action'
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  -- Notify employee of decision
  INSERT INTO notifications (
    organization_id, recipient_id, sender_id, type,
    title, message, leave_request_id, metadata, idempotency_key
  ) VALUES (
    v_request.organization_id,
    v_request.employee_id,
    p_actor_id,
    'LEAVE_' || p_action,
    CASE p_action
      WHEN 'APPROVED' THEN 'Leave Request Approved'
      WHEN 'REJECTED' THEN 'Leave Request Rejected'
      WHEN 'CLARIFICATION_REQUESTED' THEN 'Clarification Requested on Leave'
      WHEN 'WITHDRAWN' THEN 'Leave Request Withdrawn'
      ELSE 'Leave Request Update'
    END,
    'Your leave request (' || v_request.request_number || ') has been ' || lower(p_action) ||
    CASE WHEN p_comments IS NOT NULL THEN '. Note: ' || p_comments ELSE '' END || '.',
    p_request_id,
    jsonb_build_object(
      'request_number', v_request.request_number,
      'action', p_action,
      'actor_name', v_actor.full_name,
      'new_status', v_new_status
    ),
    v_idempotency_key || '_notif_emp'
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  -- Notify next approver if workflow continues
  IF v_next_approver_id IS NOT NULL AND NOT v_is_final_approval THEN
    INSERT INTO notifications (
      organization_id, recipient_id, sender_id, type,
      title, message, leave_request_id, metadata, idempotency_key
    ) VALUES (
      v_request.organization_id,
      v_next_approver_id,
      p_actor_id,
      'LEAVE_FORWARDED_FOR_APPROVAL',
      'Leave Request Pending Your Approval',
      'A leave request (' || v_request.request_number || ') has been forwarded to you for approval.',
      p_request_id,
      jsonb_build_object(
        'request_number', v_request.request_number,
        'employee_id', v_request.employee_id,
        'new_status', v_new_status
      ),
      v_idempotency_key || '_notif_next'
    ) ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;

  -- Create outbox event
  INSERT INTO outbox_events (
    organization_id, event_type, payload, idempotency_key
  ) VALUES (
    v_request.organization_id,
    'LEAVE_' || p_action,
    jsonb_build_object(
      'request_id', p_request_id,
      'request_number', v_request.request_number,
      'employee_id', v_request.employee_id,
      'actor_id', p_actor_id,
      'actor_name', v_actor.full_name,
      'action', p_action,
      'previous_status', v_previous_status,
      'new_status', v_new_status,
      'comments', p_comments,
      'is_final', v_is_final_approval
    ),
    v_idempotency_key || '_outbox'
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'action', p_action,
    'previous_status', v_previous_status,
    'new_status', v_new_status,
    'is_final_approval', v_is_final_approval,
    'next_approver_id', v_next_approver_id
  );
END;
$$;
-- ============================================================
-- ELMS 360 - Row Level Security Policies
-- Migration: 003_rls_policies.sql
-- ============================================================

-- ============================================================
-- SECTION 1: HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_employee_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM employees WHERE user_id = auth.uid() AND is_active = TRUE LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_hr_or_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM employee_role_assignments era
    JOIN roles r ON r.id = era.role_id
    WHERE era.employee_id = get_my_employee_id()
    AND era.is_active = TRUE
    AND r.code IN ('HR_ADMIN','SUPER_ADMIN')
  );
$$;

CREATE OR REPLACE FUNCTION is_manager_of(target_employee_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM reporting_relationships
    WHERE manager_id = get_my_employee_id()
    AND employee_id = target_employee_id
    AND is_active = TRUE
  );
$$;

-- ============================================================
-- SECTION 2: ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporting_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_policy_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_request_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 3: RLS POLICIES
-- ============================================================

-- -----------------------------------------------
-- organizations
-- -----------------------------------------------
-- Authenticated users can read their own org
CREATE POLICY "organizations_select_own_org"
  ON organizations FOR SELECT
  TO authenticated
  USING (id = get_my_org_id());

-- Only super_admin can update org
CREATE POLICY "organizations_update_super_admin"
  ON organizations FOR UPDATE
  TO authenticated
  USING (id = get_my_org_id() AND is_hr_or_admin());

-- -----------------------------------------------
-- departments
-- -----------------------------------------------
CREATE POLICY "departments_select_same_org"
  ON departments FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id());

CREATE POLICY "departments_insert_hr_admin"
  ON departments FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_my_org_id() AND is_hr_or_admin());

CREATE POLICY "departments_update_hr_admin"
  ON departments FOR UPDATE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

CREATE POLICY "departments_delete_hr_admin"
  ON departments FOR DELETE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- -----------------------------------------------
-- roles
-- -----------------------------------------------
CREATE POLICY "roles_select_same_org"
  ON roles FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id());

CREATE POLICY "roles_insert_hr_admin"
  ON roles FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_my_org_id() AND is_hr_or_admin());

CREATE POLICY "roles_update_hr_admin"
  ON roles FOR UPDATE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- -----------------------------------------------
-- permissions
-- -----------------------------------------------
-- All authenticated users can read permissions (they are global)
CREATE POLICY "permissions_select_authenticated"
  ON permissions FOR SELECT
  TO authenticated
  USING (TRUE);

-- Only service role can insert/update/delete permissions
-- (no policy = blocked for non-service role)

-- -----------------------------------------------
-- role_permissions
-- -----------------------------------------------
CREATE POLICY "role_permissions_select_same_org"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.organization_id = get_my_org_id()
    )
  );

CREATE POLICY "role_permissions_insert_hr_admin"
  ON role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    is_hr_or_admin() AND
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.organization_id = get_my_org_id()
    )
  );

CREATE POLICY "role_permissions_delete_hr_admin"
  ON role_permissions FOR DELETE
  TO authenticated
  USING (
    is_hr_or_admin() AND
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.organization_id = get_my_org_id()
    )
  );

-- -----------------------------------------------
-- user_profiles
-- -----------------------------------------------
-- Users can read their own profile
CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- HR/admin can read all profiles in their org
CREATE POLICY "user_profiles_select_hr_admin"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- Users can update their own profile
CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Service role can insert (created on sign-up via trigger)
CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- -----------------------------------------------
-- employees
-- -----------------------------------------------
-- Own record always readable
CREATE POLICY "employees_select_own"
  ON employees FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Managers can read their direct reports
CREATE POLICY "employees_select_manager"
  ON employees FOR SELECT
  TO authenticated
  USING (
    organization_id = get_my_org_id() AND
    is_manager_of(employees.id)
  );

-- HR/admin can read all in org
CREATE POLICY "employees_select_hr_admin"
  ON employees FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- HR/admin can insert employees
CREATE POLICY "employees_insert_hr_admin"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_my_org_id() AND is_hr_or_admin());

-- HR/admin can update employees
CREATE POLICY "employees_update_hr_admin"
  ON employees FOR UPDATE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- -----------------------------------------------
-- reporting_relationships
-- -----------------------------------------------
CREATE POLICY "reporting_relationships_select_own_or_manager"
  ON reporting_relationships FOR SELECT
  TO authenticated
  USING (
    employee_id = get_my_employee_id()
    OR manager_id = get_my_employee_id()
    OR is_hr_or_admin()
  );

CREATE POLICY "reporting_relationships_insert_hr_admin"
  ON reporting_relationships FOR INSERT
  TO authenticated
  WITH CHECK (is_hr_or_admin());

CREATE POLICY "reporting_relationships_update_hr_admin"
  ON reporting_relationships FOR UPDATE
  TO authenticated
  USING (is_hr_or_admin());

-- -----------------------------------------------
-- employee_role_assignments
-- -----------------------------------------------
CREATE POLICY "era_select_own_or_hr"
  ON employee_role_assignments FOR SELECT
  TO authenticated
  USING (
    employee_id = get_my_employee_id() OR is_hr_or_admin()
  );

CREATE POLICY "era_insert_hr_admin"
  ON employee_role_assignments FOR INSERT
  TO authenticated
  WITH CHECK (is_hr_or_admin());

CREATE POLICY "era_update_hr_admin"
  ON employee_role_assignments FOR UPDATE
  TO authenticated
  USING (is_hr_or_admin());

-- -----------------------------------------------
-- work_schedules
-- -----------------------------------------------
CREATE POLICY "work_schedules_select_same_org"
  ON work_schedules FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id());

CREATE POLICY "work_schedules_insert_hr_admin"
  ON work_schedules FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_my_org_id() AND is_hr_or_admin());

CREATE POLICY "work_schedules_update_hr_admin"
  ON work_schedules FOR UPDATE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- -----------------------------------------------
-- employee_work_schedules
-- -----------------------------------------------
CREATE POLICY "ews_select_own_or_hr"
  ON employee_work_schedules FOR SELECT
  TO authenticated
  USING (
    employee_id = get_my_employee_id()
    OR is_hr_or_admin()
    OR is_manager_of(employee_work_schedules.employee_id)
  );

CREATE POLICY "ews_insert_hr_admin"
  ON employee_work_schedules FOR INSERT
  TO authenticated
  WITH CHECK (is_hr_or_admin());

-- -----------------------------------------------
-- holiday_calendars
-- -----------------------------------------------
CREATE POLICY "holiday_calendars_select_same_org"
  ON holiday_calendars FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id());

CREATE POLICY "holiday_calendars_insert_hr_admin"
  ON holiday_calendars FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_my_org_id() AND is_hr_or_admin());

CREATE POLICY "holiday_calendars_update_hr_admin"
  ON holiday_calendars FOR UPDATE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- -----------------------------------------------
-- holidays
-- -----------------------------------------------
CREATE POLICY "holidays_select_same_org"
  ON holidays FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id());

CREATE POLICY "holidays_insert_hr_admin"
  ON holidays FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_my_org_id() AND is_hr_or_admin());

CREATE POLICY "holidays_update_hr_admin"
  ON holidays FOR UPDATE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

CREATE POLICY "holidays_delete_hr_admin"
  ON holidays FOR DELETE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- -----------------------------------------------
-- leave_types
-- -----------------------------------------------
CREATE POLICY "leave_types_select_same_org"
  ON leave_types FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id());

CREATE POLICY "leave_types_insert_hr_admin"
  ON leave_types FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_my_org_id() AND is_hr_or_admin());

CREATE POLICY "leave_types_update_hr_admin"
  ON leave_types FOR UPDATE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- -----------------------------------------------
-- leave_policies
-- -----------------------------------------------
CREATE POLICY "leave_policies_select_same_org"
  ON leave_policies FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id());

CREATE POLICY "leave_policies_insert_hr_admin"
  ON leave_policies FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_my_org_id() AND is_hr_or_admin());

CREATE POLICY "leave_policies_update_hr_admin"
  ON leave_policies FOR UPDATE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- -----------------------------------------------
-- leave_policy_versions
-- -----------------------------------------------
CREATE POLICY "lpv_select_hr_admin"
  ON leave_policy_versions FOR SELECT
  TO authenticated
  USING (is_hr_or_admin());

-- -----------------------------------------------
-- employee_policy_assignments
-- -----------------------------------------------
CREATE POLICY "epa_select_own_or_hr"
  ON employee_policy_assignments FOR SELECT
  TO authenticated
  USING (
    employee_id = get_my_employee_id()
    OR is_hr_or_admin()
  );

CREATE POLICY "epa_insert_hr_admin"
  ON employee_policy_assignments FOR INSERT
  TO authenticated
  WITH CHECK (is_hr_or_admin());

-- -----------------------------------------------
-- leave_balances
-- -----------------------------------------------
-- Own record + manager + HR
CREATE POLICY "leave_balances_select_own"
  ON leave_balances FOR SELECT
  TO authenticated
  USING (
    employee_id = get_my_employee_id()
    OR is_manager_of(leave_balances.employee_id)
    OR (is_hr_or_admin() AND organization_id = get_my_org_id())
  );

-- Only HR/admin can insert/update leave balances
CREATE POLICY "leave_balances_insert_hr_admin"
  ON leave_balances FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_my_org_id() AND is_hr_or_admin());

CREATE POLICY "leave_balances_update_hr_admin"
  ON leave_balances FOR UPDATE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- -----------------------------------------------
-- leave_balance_ledger
-- -----------------------------------------------
-- Own + HR only (read-only for employees/managers)
CREATE POLICY "lbl_select_own_or_hr"
  ON leave_balance_ledger FOR SELECT
  TO authenticated
  USING (
    employee_id = get_my_employee_id()
    OR (is_hr_or_admin() AND organization_id = get_my_org_id())
  );

-- No inserts/updates/deletes by regular users - only via stored procedures (SECURITY DEFINER)

-- -----------------------------------------------
-- approval_workflows
-- -----------------------------------------------
CREATE POLICY "aw_select_same_org"
  ON approval_workflows FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id());

CREATE POLICY "aw_insert_hr_admin"
  ON approval_workflows FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_my_org_id() AND is_hr_or_admin());

CREATE POLICY "aw_update_hr_admin"
  ON approval_workflows FOR UPDATE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- -----------------------------------------------
-- approval_workflow_steps
-- -----------------------------------------------
CREATE POLICY "aws_select_same_org"
  ON approval_workflow_steps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM approval_workflows aw
      WHERE aw.id = approval_workflow_steps.workflow_id
        AND aw.organization_id = get_my_org_id()
    )
  );

CREATE POLICY "aws_insert_hr_admin"
  ON approval_workflow_steps FOR INSERT
  TO authenticated
  WITH CHECK (
    is_hr_or_admin() AND
    EXISTS (
      SELECT 1 FROM approval_workflows aw
      WHERE aw.id = approval_workflow_steps.workflow_id
        AND aw.organization_id = get_my_org_id()
    )
  );

-- -----------------------------------------------
-- leave_requests
-- -----------------------------------------------
-- Employees read own requests
CREATE POLICY "lr_select_own"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (employee_id = get_my_employee_id());

-- Managers read their reports' requests
CREATE POLICY "lr_select_manager"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (
    organization_id = get_my_org_id() AND
    is_manager_of(leave_requests.employee_id)
  );

-- HR reads all in org
CREATE POLICY "lr_select_hr_admin"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- Inserts only by the employee themselves
CREATE POLICY "lr_insert_own"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id = get_my_employee_id() AND
    organization_id = get_my_org_id()
  );

-- Employee can update their own DRAFT request
CREATE POLICY "lr_update_own_draft"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    employee_id = get_my_employee_id() AND
    status IN ('DRAFT', 'CLARIFICATION_REQUESTED')
  );

-- Approvers can update requests assigned to them
CREATE POLICY "lr_update_approver"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    organization_id = get_my_org_id() AND
    (
      current_approver_id = get_my_employee_id()
      OR is_hr_or_admin()
    )
  );

-- -----------------------------------------------
-- leave_request_days
-- -----------------------------------------------
CREATE POLICY "lrd_select_via_request"
  ON leave_request_days FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leave_requests lr
      WHERE lr.id = leave_request_days.leave_request_id
        AND (
          lr.employee_id = get_my_employee_id()
          OR is_manager_of(lr.employee_id)
          OR (is_hr_or_admin() AND lr.organization_id = get_my_org_id())
        )
    )
  );

CREATE POLICY "lrd_insert_via_own_request"
  ON leave_request_days FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leave_requests lr
      WHERE lr.id = leave_request_days.leave_request_id
        AND lr.employee_id = get_my_employee_id()
        AND lr.status = 'DRAFT'
    )
  );

-- -----------------------------------------------
-- approval_actions
-- -----------------------------------------------
-- Readable by employee (own requests), managers (their reports), HR
CREATE POLICY "aa_select_own_request"
  ON approval_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM leave_requests lr
      WHERE lr.id = approval_actions.leave_request_id
        AND (
          lr.employee_id = get_my_employee_id()
          OR is_manager_of(lr.employee_id)
          OR (is_hr_or_admin() AND lr.organization_id = get_my_org_id())
        )
    )
  );

-- Approval actions are inserted via SECURITY DEFINER stored procedures only

-- -----------------------------------------------
-- approval_delegations
-- -----------------------------------------------
CREATE POLICY "ad_select_own"
  ON approval_delegations FOR SELECT
  TO authenticated
  USING (
    organization_id = get_my_org_id() AND
    (
      delegator_id = get_my_employee_id()
      OR delegate_id = get_my_employee_id()
      OR is_hr_or_admin()
    )
  );

CREATE POLICY "ad_insert_own_or_hr"
  ON approval_delegations FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = get_my_org_id() AND
    (delegator_id = get_my_employee_id() OR is_hr_or_admin())
  );

CREATE POLICY "ad_update_own_or_hr"
  ON approval_delegations FOR UPDATE
  TO authenticated
  USING (
    organization_id = get_my_org_id() AND
    (delegator_id = get_my_employee_id() OR is_hr_or_admin())
  );

-- -----------------------------------------------
-- leave_attachments
-- -----------------------------------------------
-- Employee (own) + manager (their reports) + HR
CREATE POLICY "la_select_own_or_manager_or_hr"
  ON leave_attachments FOR SELECT
  TO authenticated
  USING (
    employee_id = get_my_employee_id()
    OR is_manager_of(leave_attachments.employee_id)
    OR (is_hr_or_admin() AND organization_id = get_my_org_id())
  );

CREATE POLICY "la_insert_own"
  ON leave_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id = get_my_employee_id() AND
    organization_id = get_my_org_id()
  );

-- -----------------------------------------------
-- notifications
-- -----------------------------------------------
-- Only recipient can read their notifications
CREATE POLICY "notif_select_recipient"
  ON notifications FOR SELECT
  TO authenticated
  USING (recipient_id = get_my_employee_id());

-- Only recipient can update (mark as read)
CREATE POLICY "notif_update_recipient"
  ON notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = get_my_employee_id());

-- Notifications inserted via SECURITY DEFINER stored procedures only

-- -----------------------------------------------
-- outbox_events
-- -----------------------------------------------
-- No direct user access; service role only
-- (No policies = no access for authenticated role)

-- -----------------------------------------------
-- audit_logs
-- -----------------------------------------------
-- HR and admin read-only; no updates/deletes allowed for anyone
CREATE POLICY "audit_logs_select_hr_admin"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

-- No INSERT/UPDATE/DELETE policies for authenticated users
-- Audit logs written only by SECURITY DEFINER functions or service role

-- -----------------------------------------------
-- organization_settings
-- -----------------------------------------------
CREATE POLICY "org_settings_select_same_org"
  ON organization_settings FOR SELECT
  TO authenticated
  USING (organization_id = get_my_org_id());

CREATE POLICY "org_settings_update_hr_admin"
  ON organization_settings FOR UPDATE
  TO authenticated
  USING (organization_id = get_my_org_id() AND is_hr_or_admin());

CREATE POLICY "org_settings_insert_hr_admin"
  ON organization_settings FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_my_org_id() AND is_hr_or_admin());
-- ============================================================
-- ELMS 360 - Seed Data for ABC Technologies
-- Migration: 004_seed_data.sql
-- Uses deterministic UUIDs for repeatability
-- ============================================================

-- ============================================================
-- ORGANIZATION
-- ============================================================
INSERT INTO organizations (id, name, slug, timezone, fiscal_year_start, weekly_off_days, settings, is_active)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'ABC Technologies',
  'abc-technologies',
  'Asia/Kolkata',
  4, -- Fiscal year starts April
  ARRAY[0, 6], -- Sunday=0, Saturday=6
  '{"theme": "light", "currency": "INR", "country": "India"}',
  TRUE
);

-- ============================================================
-- ORGANIZATION SETTINGS
-- ============================================================
INSERT INTO organization_settings (
  id, organization_id, leave_year_type, max_pending_per_employee,
  allow_concurrent_leaves, min_team_coverage_percent,
  require_handover_notes, enable_email_notifications, working_hours_per_day
)
VALUES (
  'aaaaaaaa-0001-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'FISCAL', 3, FALSE, 60, TRUE, FALSE, 8
);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
INSERT INTO departments (id, organization_id, name, code, is_active)
VALUES
  ('bbbbbbbb-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Engineering',       'ENG',  TRUE),
  ('bbbbbbbb-0002-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Human Resources',   'HR',   TRUE),
  ('bbbbbbbb-0003-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Finance',           'FIN',  TRUE),
  ('bbbbbbbb-0004-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Marketing',         'MKT',  TRUE),
  ('bbbbbbbb-0005-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Operations',        'OPS',  TRUE);

-- ============================================================
-- ROLES
-- ============================================================
INSERT INTO roles (id, organization_id, name, code, description, is_system_role)
VALUES
  ('cccccccc-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Super Admin',       'SUPER_ADMIN', 'Full system access',              TRUE),
  ('cccccccc-0002-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'HR Admin',          'HR_ADMIN',    'HR management access',             TRUE),
  ('cccccccc-0003-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Manager',           'MANAGER',     'Team management and approvals',     TRUE),
  ('cccccccc-0004-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Employee',          'EMPLOYEE',    'Standard employee access',          TRUE);

-- ============================================================
-- PERMISSIONS
-- ============================================================
INSERT INTO permissions (id, code, name, module)
VALUES
  ('dddddddd-0001-0000-0000-000000000001', 'leave.apply',          'Apply for Leave',              'LEAVE'),
  ('dddddddd-0002-0000-0000-000000000001', 'leave.approve',        'Approve/Reject Leave',         'LEAVE'),
  ('dddddddd-0003-0000-0000-000000000001', 'leave.view_all',       'View All Leave Requests',      'LEAVE'),
  ('dddddddd-0004-0000-0000-000000000001', 'leave.manage',         'Manage Leave Types/Policies',  'LEAVE'),
  ('dddddddd-0005-0000-0000-000000000001', 'employee.view',        'View Employees',               'EMPLOYEE'),
  ('dddddddd-0006-0000-0000-000000000001', 'employee.manage',      'Manage Employees',             'EMPLOYEE'),
  ('dddddddd-0007-0000-0000-000000000001', 'report.view',          'View Reports',                 'REPORT'),
  ('dddddddd-0008-0000-0000-000000000001', 'report.export',        'Export Reports',               'REPORT'),
  ('dddddddd-0009-0000-0000-000000000001', 'settings.manage',      'Manage Organization Settings', 'SETTINGS'),
  ('dddddddd-0010-0000-0000-000000000001', 'holiday.manage',       'Manage Holidays',              'HOLIDAY');

-- Role-Permission assignments
-- SUPER_ADMIN gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'cccccccc-0001-0000-0000-000000000001', id FROM permissions;

-- HR_ADMIN gets most permissions
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  ('cccccccc-0002-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001'),
  ('cccccccc-0002-0000-0000-000000000001', 'dddddddd-0002-0000-0000-000000000001'),
  ('cccccccc-0002-0000-0000-000000000001', 'dddddddd-0003-0000-0000-000000000001'),
  ('cccccccc-0002-0000-0000-000000000001', 'dddddddd-0004-0000-0000-000000000001'),
  ('cccccccc-0002-0000-0000-000000000001', 'dddddddd-0005-0000-0000-000000000001'),
  ('cccccccc-0002-0000-0000-000000000001', 'dddddddd-0006-0000-0000-000000000001'),
  ('cccccccc-0002-0000-0000-000000000001', 'dddddddd-0007-0000-0000-000000000001'),
  ('cccccccc-0002-0000-0000-000000000001', 'dddddddd-0008-0000-0000-000000000001'),
  ('cccccccc-0002-0000-0000-000000000001', 'dddddddd-0010-0000-0000-000000000001');

-- MANAGER
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  ('cccccccc-0003-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001'),
  ('cccccccc-0003-0000-0000-000000000001', 'dddddddd-0002-0000-0000-000000000001'),
  ('cccccccc-0003-0000-0000-000000000001', 'dddddddd-0005-0000-0000-000000000001'),
  ('cccccccc-0003-0000-0000-000000000001', 'dddddddd-0007-0000-0000-000000000001');

-- EMPLOYEE
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  ('cccccccc-0004-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001'),
  ('cccccccc-0004-0000-0000-000000000001', 'dddddddd-0005-0000-0000-000000000001');

-- ============================================================
-- WORK SCHEDULE
-- ============================================================
INSERT INTO work_schedules (id, organization_id, name, description, working_days, hours_per_day, is_default, is_active)
VALUES (
  'eeeeeeee-0001-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Standard Mon-Fri',
  'Standard 5-day work week, 8 hours per day',
  ARRAY[1,2,3,4,5], -- Mon=1 through Fri=5
  8.00,
  TRUE,
  TRUE
);

-- ============================================================
-- HOLIDAY CALENDAR 2026
-- ============================================================
INSERT INTO holiday_calendars (id, organization_id, name, year, is_default, is_active)
VALUES (
  'ffffffff-0001-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'ABC Technologies Holiday Calendar 2026',
  2026,
  TRUE,
  TRUE
);

INSERT INTO holidays (id, calendar_id, organization_id, name, holiday_date, holiday_type, is_optional)
VALUES
  ('11111111-0001-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Republic Day',       '2026-01-26', 'NATIONAL',      FALSE),
  ('11111111-0002-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Holi',               '2026-03-04', 'NATIONAL',      FALSE),
  ('11111111-0003-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Good Friday',        '2026-04-03', 'NATIONAL',      FALSE),
  ('11111111-0004-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Eid ul-Fitr',        '2026-04-01', 'NATIONAL',      FALSE),
  ('11111111-0005-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Independence Day',   '2026-08-15', 'NATIONAL',      FALSE),
  ('11111111-0006-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Gandhi Jayanti',     '2026-10-02', 'NATIONAL',      FALSE),
  ('11111111-0007-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Dussehra',           '2026-10-22', 'NATIONAL',      FALSE),
  ('11111111-0008-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Diwali',             '2026-11-08', 'NATIONAL',      FALSE),
  ('11111111-0009-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Christmas',          '2026-12-25', 'NATIONAL',      FALSE),
  ('11111111-0010-0000-0000-000000000001', 'ffffffff-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'New Year''s Day',    '2026-01-01', 'NATIONAL',      FALSE);

-- ============================================================
-- LEAVE TYPES (9)
-- ============================================================
INSERT INTO leave_types (id, organization_id, name, code, description, color, allows_half_day, is_paid, is_active, display_order)
VALUES
  ('22222222-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Annual Leave',         'AL',   'Yearly paid leave entitlement',           '#3B82F6', TRUE,  TRUE,  TRUE, 1),
  ('22222222-0002-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Casual Leave',         'CL',   'Short-notice casual absences',            '#10B981', TRUE,  TRUE,  TRUE, 2),
  ('22222222-0003-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Sick Leave',           'SL',   'Medical/health related leave',            '#EF4444', TRUE,  TRUE,  TRUE, 3),
  ('22222222-0004-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Earned Leave',         'EL',   'Leave earned through service',            '#8B5CF6', TRUE,  TRUE,  TRUE, 4),
  ('22222222-0005-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Unpaid Leave',         'UPL',  'Leave without pay',                       '#6B7280', TRUE,  FALSE, TRUE, 5),
  ('22222222-0006-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Compensatory Off',     'CO',   'Compensation for extra hours worked',     '#F59E0B', TRUE,  TRUE,  TRUE, 6),
  ('22222222-0007-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Maternity Leave',      'ML',   'Maternity leave for new mothers',         '#EC4899', FALSE, TRUE,  TRUE, 7),
  ('22222222-0008-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Paternity Leave',      'PL',   'Paternity leave for new fathers',         '#06B6D4', FALSE, TRUE,  TRUE, 8),
  ('22222222-0009-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Bereavement Leave',    'BL',   'Leave for bereavement/family emergency',   '#78716C', FALSE, TRUE,  TRUE, 9);

-- ============================================================
-- LEAVE POLICIES (9 - one per leave type)
-- ============================================================
INSERT INTO leave_policies (
  id, organization_id, leave_type_id, name,
  annual_entitlement, accrual_type, accrual_amount,
  carry_forward_enabled, carry_forward_max_days, carry_forward_expiry_months,
  min_notice_days, max_consecutive_days, allows_backdated, backdated_max_days,
  probation_eligible, encashment_eligible,
  applicable_employment_types, version, effective_from, is_active
)
VALUES
  -- Annual Leave: 21 days, monthly accrual, can carry forward 10 days (expire in 3 months)
  ('33333333-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '22222222-0001-0000-0000-000000000001',
   'Annual Leave Policy', 21, 'MONTHLY', 1.75, TRUE, 10, 3,
   2, 15, FALSE, NULL, FALSE, TRUE,
   ARRAY['FULL_TIME','PART_TIME'], 1, '2026-04-01', TRUE),

  -- Casual Leave: 7 days, annual, no carry forward
  ('33333333-0002-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '22222222-0002-0000-0000-000000000001',
   'Casual Leave Policy', 7, 'ANNUAL', 7, FALSE, NULL, NULL,
   0, 3, TRUE, 3, TRUE, FALSE,
   ARRAY['FULL_TIME','PART_TIME','CONTRACT'], 1, '2026-04-01', TRUE),

  -- Sick Leave: 10 days, annual, no carry forward, requires document >3 days
  ('33333333-0003-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '22222222-0003-0000-0000-000000000001',
   'Sick Leave Policy', 10, 'ANNUAL', 10, FALSE, NULL, NULL,
   0, 30, TRUE, 1, TRUE, FALSE,
   ARRAY['FULL_TIME','PART_TIME','CONTRACT','INTERN'], 1, '2026-04-01', TRUE),

  -- Earned Leave: 15 days, monthly accrual (1.25/month), carry forward max 30
  ('33333333-0004-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '22222222-0004-0000-0000-000000000001',
   'Earned Leave Policy', 15, 'MONTHLY', 1.25, TRUE, 30, 12,
   7, 20, FALSE, NULL, FALSE, TRUE,
   ARRAY['FULL_TIME'], 1, '2026-04-01', TRUE),

  -- Unpaid Leave: unlimited, no accrual
  ('33333333-0005-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '22222222-0005-0000-0000-000000000001',
   'Unpaid Leave Policy', 0, 'NONE', 0, FALSE, NULL, NULL,
   1, NULL, FALSE, NULL, FALSE, FALSE,
   ARRAY['FULL_TIME','PART_TIME','CONTRACT','INTERN'], 1, '2026-04-01', TRUE),

  -- Compensatory Off: granted case by case
  ('33333333-0006-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '22222222-0006-0000-0000-000000000001',
   'Compensatory Off Policy', 0, 'NONE', 0, FALSE, NULL, NULL,
   0, 3, FALSE, NULL, TRUE, FALSE,
   ARRAY['FULL_TIME','PART_TIME'], 1, '2026-04-01', TRUE),

  -- Maternity Leave: 180 days (6 months)
  ('33333333-0007-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '22222222-0007-0000-0000-000000000001',
   'Maternity Leave Policy', 180, 'NONE', 0, FALSE, NULL, NULL,
   30, 180, FALSE, NULL, FALSE, FALSE,
   ARRAY['FULL_TIME','PART_TIME'], 1, '2026-04-01', TRUE),

  -- Paternity Leave: 15 days
  ('33333333-0008-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '22222222-0008-0000-0000-000000000001',
   'Paternity Leave Policy', 15, 'NONE', 0, FALSE, NULL, NULL,
   7, 15, FALSE, NULL, FALSE, FALSE,
   ARRAY['FULL_TIME','PART_TIME'], 1, '2026-04-01', TRUE),

  -- Bereavement Leave: 5 days
  ('33333333-0009-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '22222222-0009-0000-0000-000000000001',
   'Bereavement Leave Policy', 5, 'NONE', 0, FALSE, NULL, NULL,
   0, 5, TRUE, 7, TRUE, FALSE,
   ARRAY['FULL_TIME','PART_TIME','CONTRACT','INTERN'], 1, '2026-04-01', TRUE);

-- ============================================================
-- EMPLOYEES (27 total, user_id = NULL initially)
-- EMP001: Super Admin
-- EMP002-EMP003: HR Admins
-- EMP004-EMP007: Managers
-- EMP008-EMP027: Regular Employees
-- ============================================================

-- Super Admin
INSERT INTO employees (id, organization_id, employee_code, full_name, work_email, designation, department_id, date_of_joining, employment_type, employment_status, grade, is_active)
VALUES ('44444444-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP001', 'Rajan Mehta',         'superadmin@abc-tech.com',   'Chief Technology Officer',    'bbbbbbbb-0001-0000-0000-000000000001', '2020-01-15', 'FULL_TIME', 'ACTIVE', 'L7', TRUE);

-- HR Admins
INSERT INTO employees (id, organization_id, employee_code, full_name, work_email, designation, department_id, date_of_joining, employment_type, employment_status, grade, is_active)
VALUES
  ('44444444-0002-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP002', 'Priya Sharma',        'hr1@abc-tech.com',          'HR Manager',                  'bbbbbbbb-0002-0000-0000-000000000001', '2021-03-01', 'FULL_TIME', 'ACTIVE', 'L5', TRUE),
  ('44444444-0003-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP003', 'Ankit Joshi',         'hr2@abc-tech.com',          'HR Executive',                'bbbbbbbb-0002-0000-0000-000000000001', '2022-06-15', 'FULL_TIME', 'ACTIVE', 'L3', TRUE);

-- Managers
INSERT INTO employees (id, organization_id, employee_code, full_name, work_email, designation, department_id, date_of_joining, employment_type, employment_status, grade, is_active)
VALUES
  ('44444444-0004-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP004', 'Vikram Singh',        'manager.eng@abc-tech.com',  'Engineering Manager',         'bbbbbbbb-0001-0000-0000-000000000001', '2020-07-01', 'FULL_TIME', 'ACTIVE', 'L6', TRUE),
  ('44444444-0005-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP005', 'Deepa Nair',          'manager.fin@abc-tech.com',  'Finance Manager',             'bbbbbbbb-0003-0000-0000-000000000001', '2019-11-10', 'FULL_TIME', 'ACTIVE', 'L6', TRUE),
  ('44444444-0006-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP006', 'Suresh Patel',        'manager.mkt@abc-tech.com',  'Marketing Manager',           'bbbbbbbb-0004-0000-0000-000000000001', '2021-01-15', 'FULL_TIME', 'ACTIVE', 'L6', TRUE),
  ('44444444-0007-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP007', 'Kavitha Reddy',       'manager.ops@abc-tech.com',  'Operations Manager',          'bbbbbbbb-0005-0000-0000-000000000001', '2020-04-20', 'FULL_TIME', 'ACTIVE', 'L6', TRUE);

-- Engineering Team (EMP008-EMP014)
INSERT INTO employees (id, organization_id, employee_code, full_name, work_email, designation, department_id, date_of_joining, employment_type, employment_status, grade, is_active)
VALUES
  ('44444444-0008-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP008', 'Arjun Kumar',         'arjun.kumar@abc-tech.com',  'Senior Software Engineer',    'bbbbbbbb-0001-0000-0000-000000000001', '2021-08-01', 'FULL_TIME', 'ACTIVE', 'L4', TRUE),
  ('44444444-0009-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP009', 'Sneha Gupta',         'sneha.gupta@abc-tech.com',  'Software Engineer',           'bbbbbbbb-0001-0000-0000-000000000001', '2022-02-14', 'FULL_TIME', 'ACTIVE', 'L3', TRUE),
  ('44444444-0010-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP010', 'Rahul Verma',         'rahul.verma@abc-tech.com',  'Software Engineer',           'bbbbbbbb-0001-0000-0000-000000000001', '2022-09-05', 'FULL_TIME', 'ACTIVE', 'L3', TRUE),
  ('44444444-0011-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP011', 'Meera Pillai',        'meera.pillai@abc-tech.com', 'QA Engineer',                 'bbbbbbbb-0001-0000-0000-000000000001', '2023-01-16', 'FULL_TIME', 'ACTIVE', 'L3', TRUE),
  ('44444444-0012-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP012', 'Rohit Agarwal',       'rohit.agarwal@abc-tech.com','DevOps Engineer',             'bbbbbbbb-0001-0000-0000-000000000001', '2021-11-22', 'FULL_TIME', 'ACTIVE', 'L4', TRUE),
  ('44444444-0013-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP013', 'Pooja Desai',         'pooja.desai@abc-tech.com',  'UI/UX Designer',              'bbbbbbbb-0001-0000-0000-000000000001', '2022-05-30', 'FULL_TIME', 'ACTIVE', 'L3', TRUE),
  ('44444444-0014-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP014', 'Neeraj Bhatt',        'neeraj.bhatt@abc-tech.com', 'Software Engineer Intern',    'bbbbbbbb-0001-0000-0000-000000000001', '2026-07-01', 'INTERN',    'ACTIVE', 'L1', TRUE);

-- Finance Team (EMP015-EMP017)
INSERT INTO employees (id, organization_id, employee_code, full_name, work_email, designation, department_id, date_of_joining, employment_type, employment_status, grade, is_active)
VALUES
  ('44444444-0015-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP015', 'Sunita Rao',          'sunita.rao@abc-tech.com',   'Senior Accountant',           'bbbbbbbb-0003-0000-0000-000000000001', '2020-09-01', 'FULL_TIME', 'ACTIVE', 'L4', TRUE),
  ('44444444-0016-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP016', 'Manoj Tiwari',        'manoj.tiwari@abc-tech.com', 'Accountant',                  'bbbbbbbb-0003-0000-0000-000000000001', '2023-03-01', 'FULL_TIME', 'ACTIVE', 'L2', TRUE),
  ('44444444-0017-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP017', 'Lalitha Subramaniam', 'lalitha.s@abc-tech.com',    'Financial Analyst',           'bbbbbbbb-0003-0000-0000-000000000001', '2022-11-07', 'FULL_TIME', 'ACTIVE', 'L3', TRUE);

-- Marketing Team (EMP018-EMP021)
INSERT INTO employees (id, organization_id, employee_code, full_name, work_email, designation, department_id, date_of_joining, employment_type, employment_status, grade, is_active)
VALUES
  ('44444444-0018-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP018', 'Gaurav Khanna',       'gaurav.khanna@abc-tech.com','Senior Marketing Specialist', 'bbbbbbbb-0004-0000-0000-000000000001', '2021-04-01', 'FULL_TIME', 'ACTIVE', 'L4', TRUE),
  ('44444444-0019-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP019', 'Ritika Kapoor',       'ritika.kapoor@abc-tech.com','Content Writer',              'bbbbbbbb-0004-0000-0000-000000000001', '2023-06-01', 'FULL_TIME', 'ACTIVE', 'L2', TRUE),
  ('44444444-0020-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP020', 'Amit Chandra',        'amit.chandra@abc-tech.com', 'Digital Marketing Analyst',   'bbbbbbbb-0004-0000-0000-000000000001', '2022-08-15', 'FULL_TIME', 'ACTIVE', 'L3', TRUE),
  ('44444444-0021-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP021', 'Nisha Malhotra',      'nisha.malhotra@abc-tech.com','Brand Manager',              'bbbbbbbb-0004-0000-0000-000000000001', '2020-12-01', 'FULL_TIME', 'ACTIVE', 'L4', TRUE);

-- Operations Team (EMP022-EMP025)
INSERT INTO employees (id, organization_id, employee_code, full_name, work_email, designation, department_id, date_of_joining, employment_type, employment_status, grade, is_active)
VALUES
  ('44444444-0022-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP022', 'Sanjay Kulkarni',     'sanjay.k@abc-tech.com',     'Operations Analyst',          'bbbbbbbb-0005-0000-0000-000000000001', '2021-06-01', 'FULL_TIME', 'ACTIVE', 'L3', TRUE),
  ('44444444-0023-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP023', 'Vandana Mishra',      'vandana.m@abc-tech.com',    'Office Administrator',        'bbbbbbbb-0005-0000-0000-000000000001', '2022-01-10', 'FULL_TIME', 'ACTIVE', 'L2', TRUE),
  ('44444444-0024-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP024', 'Harish Babu',         'harish.babu@abc-tech.com',  'Procurement Specialist',      'bbbbbbbb-0005-0000-0000-000000000001', '2023-02-20', 'FULL_TIME', 'ACTIVE', 'L2', TRUE),
  ('44444444-0025-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP025', 'Bhavna Trivedi',      'bhavna.t@abc-tech.com',     'Vendor Manager',              'bbbbbbbb-0005-0000-0000-000000000001', '2021-09-15', 'FULL_TIME', 'ACTIVE', 'L4', TRUE);

-- Cross-department / Contract
INSERT INTO employees (id, organization_id, employee_code, full_name, work_email, designation, department_id, date_of_joining, employment_type, employment_status, grade, is_active)
VALUES
  ('44444444-0026-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP026', 'Tejas Patil',         'tejas.patil@abc-tech.com',  'Contract Software Developer', 'bbbbbbbb-0001-0000-0000-000000000001', '2026-04-01', 'CONTRACT',  'ACTIVE', 'L3', TRUE),
  ('44444444-0027-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'EMP027', 'Divya Krishnamurthy', 'divya.k@abc-tech.com',      'HR Business Partner',         'bbbbbbbb-0002-0000-0000-000000000001', '2024-01-02', 'FULL_TIME', 'ACTIVE', 'L4', TRUE);

-- ============================================================
-- EMPLOYEE ROLE ASSIGNMENTS
-- ============================================================
INSERT INTO employee_role_assignments (id, employee_id, role_id, is_active)
VALUES
  -- Super Admin
  ('55555555-0001-0000-0000-000000000001', '44444444-0001-0000-0000-000000000001', 'cccccccc-0001-0000-0000-000000000001', TRUE),
  -- HR Admins
  ('55555555-0002-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', 'cccccccc-0002-0000-0000-000000000001', TRUE),
  ('55555555-0003-0000-0000-000000000001', '44444444-0003-0000-0000-000000000001', 'cccccccc-0002-0000-0000-000000000001', TRUE),
  ('55555555-0027-0000-0000-000000000001', '44444444-0027-0000-0000-000000000001', 'cccccccc-0002-0000-0000-000000000001', TRUE),
  -- Managers
  ('55555555-0004-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'cccccccc-0003-0000-0000-000000000001', TRUE),
  ('55555555-0005-0000-0000-000000000001', '44444444-0005-0000-0000-000000000001', 'cccccccc-0003-0000-0000-000000000001', TRUE),
  ('55555555-0006-0000-0000-000000000001', '44444444-0006-0000-0000-000000000001', 'cccccccc-0003-0000-0000-000000000001', TRUE),
  ('55555555-0007-0000-0000-000000000001', '44444444-0007-0000-0000-000000000001', 'cccccccc-0003-0000-0000-000000000001', TRUE),
  -- Regular Employees (EMP008-EMP027)
  ('55555555-0008-0000-0000-000000000001', '44444444-0008-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0009-0000-0000-000000000001', '44444444-0009-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0010-0000-0000-000000000001', '44444444-0010-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0011-0000-0000-000000000001', '44444444-0011-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0012-0000-0000-000000000001', '44444444-0012-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0013-0000-0000-000000000001', '44444444-0013-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0014-0000-0000-000000000001', '44444444-0014-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0015-0000-0000-000000000001', '44444444-0015-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0016-0000-0000-000000000001', '44444444-0016-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0017-0000-0000-000000000001', '44444444-0017-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0018-0000-0000-000000000001', '44444444-0018-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0019-0000-0000-000000000001', '44444444-0019-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0020-0000-0000-000000000001', '44444444-0020-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0021-0000-0000-000000000001', '44444444-0021-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0022-0000-0000-000000000001', '44444444-0022-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0023-0000-0000-000000000001', '44444444-0023-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0024-0000-0000-000000000001', '44444444-0024-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0025-0000-0000-000000000001', '44444444-0025-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE),
  ('55555555-0026-0000-0000-000000000001', '44444444-0026-0000-0000-000000000001', 'cccccccc-0004-0000-0000-000000000001', TRUE);

-- ============================================================
-- REPORTING RELATIONSHIPS
-- ============================================================
-- Engineering team reports to EMP004 (Vikram Singh - Eng Manager)
INSERT INTO reporting_relationships (id, employee_id, manager_id, relationship_type, is_active)
VALUES
  ('66666666-0001-0000-0000-000000000001', '44444444-0008-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0002-0000-0000-000000000001', '44444444-0009-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0003-0000-0000-000000000001', '44444444-0010-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0004-0000-0000-000000000001', '44444444-0011-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0005-0000-0000-000000000001', '44444444-0012-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0006-0000-0000-000000000001', '44444444-0013-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0007-0000-0000-000000000001', '44444444-0014-0000-0000-000000000001', '44444444-0008-0000-0000-000000000001', 'PRIMARY', TRUE), -- Intern reports to senior
  ('66666666-0008-0000-0000-000000000001', '44444444-0026-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'PRIMARY', TRUE);
-- Finance team reports to EMP005 (Deepa Nair)
INSERT INTO reporting_relationships (id, employee_id, manager_id, relationship_type, is_active)
VALUES
  ('66666666-0009-0000-0000-000000000001', '44444444-0015-0000-0000-000000000001', '44444444-0005-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0010-0000-0000-000000000001', '44444444-0016-0000-0000-000000000001', '44444444-0005-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0011-0000-0000-000000000001', '44444444-0017-0000-0000-000000000001', '44444444-0005-0000-0000-000000000001', 'PRIMARY', TRUE);
-- Marketing team reports to EMP006 (Suresh Patel)
INSERT INTO reporting_relationships (id, employee_id, manager_id, relationship_type, is_active)
VALUES
  ('66666666-0012-0000-0000-000000000001', '44444444-0018-0000-0000-000000000001', '44444444-0006-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0013-0000-0000-000000000001', '44444444-0019-0000-0000-000000000001', '44444444-0006-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0014-0000-0000-000000000001', '44444444-0020-0000-0000-000000000001', '44444444-0006-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0015-0000-0000-000000000001', '44444444-0021-0000-0000-000000000001', '44444444-0006-0000-0000-000000000001', 'PRIMARY', TRUE);
-- Operations team reports to EMP007 (Kavitha Reddy)
INSERT INTO reporting_relationships (id, employee_id, manager_id, relationship_type, is_active)
VALUES
  ('66666666-0016-0000-0000-000000000001', '44444444-0022-0000-0000-000000000001', '44444444-0007-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0017-0000-0000-000000000001', '44444444-0023-0000-0000-000000000001', '44444444-0007-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0018-0000-0000-000000000001', '44444444-0024-0000-0000-000000000001', '44444444-0007-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0019-0000-0000-000000000001', '44444444-0025-0000-0000-000000000001', '44444444-0007-0000-0000-000000000001', 'PRIMARY', TRUE);
-- HR team
INSERT INTO reporting_relationships (id, employee_id, manager_id, relationship_type, is_active)
VALUES
  ('66666666-0020-0000-0000-000000000001', '44444444-0003-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0021-0000-0000-000000000001', '44444444-0027-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', 'PRIMARY', TRUE);
-- Managers report to CTO (EMP001)
INSERT INTO reporting_relationships (id, employee_id, manager_id, relationship_type, is_active)
VALUES
  ('66666666-0022-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', '44444444-0001-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0023-0000-0000-000000000001', '44444444-0005-0000-0000-000000000001', '44444444-0001-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0024-0000-0000-000000000001', '44444444-0006-0000-0000-000000000001', '44444444-0001-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0025-0000-0000-000000000001', '44444444-0007-0000-0000-000000000001', '44444444-0001-0000-0000-000000000001', 'PRIMARY', TRUE),
  ('66666666-0026-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', '44444444-0001-0000-0000-000000000001', 'PRIMARY', TRUE);

-- ============================================================
-- EMPLOYEE WORK SCHEDULE ASSIGNMENTS (all employees on standard schedule)
-- ============================================================
INSERT INTO employee_work_schedules (employee_id, work_schedule_id, effective_from, is_active)
SELECT e.id, 'eeeeeeee-0001-0000-0000-000000000001', '2026-01-01', TRUE
FROM employees e
WHERE e.organization_id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- ============================================================
-- APPROVAL WORKFLOW
-- ============================================================
INSERT INTO approval_workflows (id, organization_id, name, description, applies_to_all_leave_types, applies_to_all_departments, is_default, is_active)
VALUES (
  '77777777-0001-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Standard 2-Step Approval',
  'Manager approval followed by HR approval for leaves > 5 days',
  TRUE, TRUE, TRUE, TRUE
);

INSERT INTO approval_workflow_steps (id, workflow_id, step_order, step_name, approver_type, is_mandatory)
VALUES
  ('88888888-0001-0000-0000-000000000001', '77777777-0001-0000-0000-000000000001', 1, 'Manager Approval', 'DIRECT_MANAGER', TRUE),
  ('88888888-0002-0000-0000-000000000001', '77777777-0001-0000-0000-000000000001', 2, 'HR Approval',      'HR',             TRUE);

-- ============================================================
-- LEAVE BALANCES (fiscal year 2026 - April to March)
-- Only for full-time + part-time employees (not interns/contractors for most types)
-- ============================================================

-- AL (Annual Leave) balances - all full-time employees
INSERT INTO leave_balances (employee_id, leave_type_id, organization_id, fiscal_year, opening_balance, accrued, used, pending, adjusted, carried_forward, expired)
SELECT
  e.id,
  '22222222-0001-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  2026,
  0.00,
  CASE
    WHEN e.employee_code IN ('EMP001','EMP002','EMP003','EMP004','EMP005','EMP006','EMP007') THEN 14.00  -- Sr employees, more accrued
    WHEN e.employment_type = 'INTERN' THEN 0
    WHEN e.employment_type = 'CONTRACT' THEN 0
    ELSE 10.50
  END,
  CASE
    WHEN e.employee_code IN ('EMP001','EMP004','EMP006') THEN 5.00
    WHEN e.employee_code IN ('EMP008','EMP015','EMP018') THEN 3.00
    ELSE 0.00
  END,
  CASE WHEN e.employee_code IN ('EMP009','EMP017') THEN 2.00 ELSE 0.00 END,
  0.00,
  CASE
    WHEN e.employee_code IN ('EMP001','EMP002','EMP005') THEN 3.00
    ELSE 0.00
  END,
  0.00
FROM employees e
WHERE e.organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  AND e.employment_type IN ('FULL_TIME', 'PART_TIME');

-- SL (Sick Leave) balances
INSERT INTO leave_balances (employee_id, leave_type_id, organization_id, fiscal_year, opening_balance, accrued, used, pending, adjusted, carried_forward, expired)
SELECT
  e.id,
  '22222222-0003-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  2026,
  0.00,
  10.00,
  CASE
    WHEN e.employee_code = 'EMP010' THEN 3.00
    WHEN e.employee_code = 'EMP013' THEN 1.00
    ELSE 0.00
  END,
  0.00, 0.00, 0.00, 0.00
FROM employees e
WHERE e.organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  AND e.employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');

-- CL (Casual Leave) balances
INSERT INTO leave_balances (employee_id, leave_type_id, organization_id, fiscal_year, opening_balance, accrued, used, pending, adjusted, carried_forward, expired)
SELECT
  e.id,
  '22222222-0002-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  2026,
  0.00,
  7.00,
  CASE
    WHEN e.employee_code IN ('EMP009','EMP011','EMP019') THEN 1.00
    WHEN e.employee_code = 'EMP022' THEN 2.00
    ELSE 0.00
  END,
  CASE WHEN e.employee_code = 'EMP009' THEN 1.00 ELSE 0.00 END,
  0.00, 0.00, 0.00
FROM employees e
WHERE e.organization_id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- EL (Earned Leave) balances - full-time only
INSERT INTO leave_balances (employee_id, leave_type_id, organization_id, fiscal_year, opening_balance, accrued, used, pending, adjusted, carried_forward, expired)
SELECT
  e.id,
  '22222222-0004-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  2026,
  CASE WHEN e.date_of_joining < '2024-01-01' THEN 5.00 ELSE 0.00 END,
  8.75,
  CASE WHEN e.employee_code = 'EMP012' THEN 2.00 ELSE 0.00 END,
  0.00, 0.00, 0.00, 0.00
FROM employees e
WHERE e.organization_id = 'aaaaaaaa-0000-0000-0000-000000000001'
  AND e.employment_type = 'FULL_TIME';

-- ============================================================
-- LEAVE REQUESTS (15+ with varied statuses)
-- ============================================================

-- Request 1: APPROVED - Arjun Kumar (EMP008), Annual Leave Nov 3-7, 2026
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, applied_at, policy_id)
VALUES (
  '99999999-0001-0000-0000-000000000001',
  'LR-2026-001000',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0008-0000-0000-000000000001',
  '22222222-0001-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 2, 'APPROVED',
  '2026-11-03', '2026-11-07', 5.00, 'FULL_DAY',
  'Family trip to Coorg - annual family vacation planned months in advance.',
  '2026-10-20 10:00:00+05:30',
  '33333333-0001-0000-0000-000000000001'
);

-- Request 2: APPROVED - Sneha Gupta (EMP009), Casual Leave Nov 10, 2026
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, applied_at, policy_id)
VALUES (
  '99999999-0002-0000-0000-000000000001',
  'LR-2026-001001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0009-0000-0000-000000000001',
  '22222222-0002-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 2, 'APPROVED',
  '2026-11-10', '2026-11-10', 1.00, 'FULL_DAY',
  'Personal errand - bank documentation.',
  '2026-11-07 09:30:00+05:30',
  '33333333-0002-0000-0000-000000000001'
);

-- Request 3: PENDING_MANAGER_APPROVAL - Rahul Verma (EMP010), Annual Leave Dec 22-31, 2026
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, applied_at, current_approver_id, policy_id)
VALUES (
  '99999999-0003-0000-0000-000000000001',
  'LR-2026-001002',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0010-0000-0000-000000000001',
  '22222222-0001-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 1, 'PENDING_MANAGER_APPROVAL',
  '2026-12-22', '2026-12-31', 8.00, 'FULL_DAY',
  'Year-end vacation with family. All my tasks will be handed over to Arjun.',
  '2026-11-15 11:00:00+05:30',
  '44444444-0004-0000-0000-000000000001',
  '33333333-0001-0000-0000-000000000001'
);

-- Request 4: PENDING_HR_APPROVAL - Meera Pillai (EMP011), Sick Leave Nov 11-13, 2026
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, applied_at, current_approver_id, policy_id)
VALUES (
  '99999999-0004-0000-0000-000000000001',
  'LR-2026-001003',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0011-0000-0000-000000000001',
  '22222222-0003-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 2, 'PENDING_HR_APPROVAL',
  '2026-11-11', '2026-11-13', 3.00, 'FULL_DAY',
  'Down with viral fever. Doctor advised rest for 3 days. Medical certificate attached.',
  '2026-11-11 08:30:00+05:30',
  '44444444-0002-0000-0000-000000000001',
  '33333333-0003-0000-0000-000000000001'
);

-- Request 5: REJECTED - Rohit Agarwal (EMP012), Annual Leave Nov 4-6, 2026 (team conflict)
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, rejection_reason, applied_at, policy_id)
VALUES (
  '99999999-0005-0000-0000-000000000001',
  'LR-2026-001004',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0012-0000-0000-000000000001',
  '22222222-0001-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 1, 'REJECTED',
  '2026-11-04', '2026-11-06', 3.00, 'FULL_DAY',
  'Personal travel plans.',
  'Team critical delivery scheduled. Minimum team coverage not met. Please reschedule after Dec 1.',
  '2026-10-28 14:00:00+05:30',
  '33333333-0001-0000-0000-000000000001'
);

-- Request 6: WITHDRAWN - Pooja Desai (EMP013), Casual Leave Nov 5, 2026
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, applied_at, policy_id)
VALUES (
  '99999999-0006-0000-0000-000000000001',
  'LR-2026-001005',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0013-0000-0000-000000000001',
  '22222222-0002-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 1, 'WITHDRAWN',
  '2026-11-05', '2026-11-05', 1.00, 'FULL_DAY',
  'Personal work. Withdrawing as work became urgent.',
  '2026-11-03 09:00:00+05:30',
  '33333333-0002-0000-0000-000000000001'
);

-- Request 7: PENDING_MANAGER_APPROVAL - Sunita Rao (EMP015), Earned Leave Dec 15-19, 2026
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, applied_at, current_approver_id, policy_id)
VALUES (
  '99999999-0007-0000-0000-000000000001',
  'LR-2026-001006',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0015-0000-0000-000000000001',
  '22222222-0004-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 1, 'PENDING_MANAGER_APPROVAL',
  '2026-12-15', '2026-12-19', 5.00, 'FULL_DAY',
  'Year-end break and child''s school functions.',
  '2026-11-18 10:00:00+05:30',
  '44444444-0005-0000-0000-000000000001',
  '33333333-0004-0000-0000-000000000001'
);

-- Request 8: APPROVED - Gaurav Khanna (EMP018), Annual Leave Nov 17-21, 2026
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, applied_at, policy_id)
VALUES (
  '99999999-0008-0000-0000-000000000001',
  'LR-2026-001007',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0018-0000-0000-000000000001',
  '22222222-0001-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 2, 'APPROVED',
  '2026-11-17', '2026-11-21', 5.00, 'FULL_DAY',
  'Wedding anniversary trip.',
  '2026-11-01 10:00:00+05:30',
  '33333333-0001-0000-0000-000000000001'
);

-- Request 9: PENDING_MANAGER_APPROVAL - Ritika Kapoor (EMP019), Casual Leave Nov 20, 2026 half-day
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, applied_at, current_approver_id, policy_id)
VALUES (
  '99999999-0009-0000-0000-000000000001',
  'LR-2026-001008',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0019-0000-0000-000000000001',
  '22222222-0002-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 1, 'PENDING_MANAGER_APPROVAL',
  '2026-11-20', '2026-11-20', 0.50, 'HALF_DAY_AM',
  'Dental appointment in the morning.',
  '2026-11-18 16:00:00+05:30',
  '44444444-0006-0000-0000-000000000001',
  '33333333-0002-0000-0000-000000000001'
);

-- Request 10: APPROVED - Sanjay Kulkarni (EMP022), Compensatory Off Nov 14, 2026
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, applied_at, policy_id)
VALUES (
  '99999999-0010-0000-0000-000000000001',
  'LR-2026-001009',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0022-0000-0000-000000000001',
  '22222222-0006-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 2, 'APPROVED',
  '2026-11-14', '2026-11-14', 1.00, 'FULL_DAY',
  'Compensatory off for working on Nov 8 (Diwali) for client deliverable.',
  '2026-11-10 09:00:00+05:30',
  '33333333-0006-0000-0000-000000000001'
);

-- Request 11: DRAFT - Vandana Mishra (EMP023), Annual Leave Dec 24-26, 2026
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, status, start_date, end_date, total_days, day_type, reason, policy_id)
VALUES (
  '99999999-0011-0000-0000-000000000001',
  'LR-2026-001010',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0023-0000-0000-000000000001',
  '22222222-0001-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 'DRAFT',
  '2026-12-24', '2026-12-26', 3.00, 'FULL_DAY',
  'Christmas holiday with family.',
  '33333333-0001-0000-0000-000000000001'
);

-- Request 12: CLARIFICATION_REQUESTED - Lalitha Subramaniam (EMP017), Sick Leave Nov 18-19, 2026
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, clarification_message, applied_at, current_approver_id, policy_id)
VALUES (
  '99999999-0012-0000-0000-000000000001',
  'LR-2026-001011',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0017-0000-0000-000000000001',
  '22222222-0003-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 1, 'CLARIFICATION_REQUESTED',
  '2026-11-18', '2026-11-19', 2.00, 'FULL_DAY',
  'Not feeling well.',
  'Please attach a medical certificate or prescription slip as this is 2+ days sick leave.',
  '2026-11-17 08:00:00+05:30',
  '44444444-0005-0000-0000-000000000001',
  '33333333-0003-0000-0000-000000000001'
);

-- Request 13: APPROVED - Rohit Agarwal (EMP012), Earned Leave Nov 24-25, 2026 (after rejection above, different dates)
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, applied_at, policy_id)
VALUES (
  '99999999-0013-0000-0000-000000000001',
  'LR-2026-001012',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0012-0000-0000-000000000001',
  '22222222-0004-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 2, 'APPROVED',
  '2026-11-24', '2026-11-25', 2.00, 'FULL_DAY',
  'Personal work rescheduled.',
  '2026-11-14 10:00:00+05:30',
  '33333333-0004-0000-0000-000000000001'
);

-- Request 14: PENDING_MANAGER_APPROVAL - Harish Babu (EMP024), Annual Leave Dec 1-5, 2026
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, applied_at, current_approver_id, policy_id)
VALUES (
  '99999999-0014-0000-0000-000000000001',
  'LR-2026-001013',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0024-0000-0000-000000000001',
  '22222222-0001-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 1, 'PENDING_MANAGER_APPROVAL',
  '2026-12-01', '2026-12-05', 5.00, 'FULL_DAY',
  'Wedding in family.',
  '2026-11-17 11:30:00+05:30',
  '44444444-0007-0000-0000-000000000001',
  '33333333-0001-0000-0000-000000000001'
);

-- Request 15: APPROVED - Amit Chandra (EMP020), Bereavement Leave Nov 3-5, 2026
INSERT INTO leave_requests (id, request_number, organization_id, employee_id, leave_type_id, workflow_id, current_step_order, status, start_date, end_date, total_days, day_type, reason, applied_at, policy_id)
VALUES (
  '99999999-0015-0000-0000-000000000001',
  'LR-2026-001014',
  'aaaaaaaa-0000-0000-0000-000000000001',
  '44444444-0020-0000-0000-000000000001',
  '22222222-0009-0000-0000-000000000001',
  '77777777-0001-0000-0000-000000000001', 2, 'APPROVED',
  '2026-11-03', '2026-11-05', 3.00, 'FULL_DAY',
  'Grandfather passed away. Need to attend last rites.',
  '2026-11-03 06:00:00+05:30',
  '33333333-0009-0000-0000-000000000001'
);

-- ============================================================
-- APPROVAL ACTIONS (history for requests above)
-- ============================================================

-- LR-001 (Approved): Submitted + Manager Approved + HR Approved
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, acted_at)
VALUES
  ('aaaaaaaa-0101-0000-0000-000000000001', '99999999-0001-0000-0000-000000000001', 1, '44444444-0008-0000-0000-000000000001', 'SUBMITTED',  'DRAFT',                      'PENDING_MANAGER_APPROVAL', '2026-10-20 10:00:00+05:30'),
  ('aaaaaaaa-0102-0000-0000-000000000001', '99999999-0001-0000-0000-000000000001', 1, '44444444-0004-0000-0000-000000000001', 'APPROVED',   'PENDING_MANAGER_APPROVAL',   'PENDING_HR_APPROVAL',      '2026-10-21 14:00:00+05:30'),
  ('aaaaaaaa-0103-0000-0000-000000000001', '99999999-0001-0000-0000-000000000001', 2, '44444444-0002-0000-0000-000000000001', 'APPROVED',   'PENDING_HR_APPROVAL',        'APPROVED',                 '2026-10-22 09:30:00+05:30');

-- LR-002 (Approved): Submitted + Manager + HR approved
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, comments, acted_at)
VALUES
  ('aaaaaaaa-0201-0000-0000-000000000001', '99999999-0002-0000-0000-000000000001', 1, '44444444-0009-0000-0000-000000000001', 'SUBMITTED',  'DRAFT',                      'PENDING_MANAGER_APPROVAL', NULL,              '2026-11-07 09:30:00+05:30'),
  ('aaaaaaaa-0202-0000-0000-000000000001', '99999999-0002-0000-0000-000000000001', 1, '44444444-0004-0000-0000-000000000001', 'APPROVED',   'PENDING_MANAGER_APPROVAL',   'PENDING_HR_APPROVAL',      'No issue.',       '2026-11-07 14:00:00+05:30'),
  ('aaaaaaaa-0203-0000-0000-000000000001', '99999999-0002-0000-0000-000000000001', 2, '44444444-0002-0000-0000-000000000001', 'APPROVED',   'PENDING_HR_APPROVAL',        'APPROVED',                 'Approved.',       '2026-11-07 16:00:00+05:30');

-- LR-003 (Pending Manager): Submitted
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, acted_at)
VALUES
  ('aaaaaaaa-0301-0000-0000-000000000001', '99999999-0003-0000-0000-000000000001', 1, '44444444-0010-0000-0000-000000000001', 'SUBMITTED', 'DRAFT', 'PENDING_MANAGER_APPROVAL', '2026-11-15 11:00:00+05:30');

-- LR-004 (Pending HR): Submitted + Manager Approved
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, comments, acted_at)
VALUES
  ('aaaaaaaa-0401-0000-0000-000000000001', '99999999-0004-0000-0000-000000000001', 1, '44444444-0011-0000-0000-000000000001', 'SUBMITTED',  'DRAFT',                     'PENDING_MANAGER_APPROVAL', NULL,              '2026-11-11 08:30:00+05:30'),
  ('aaaaaaaa-0402-0000-0000-000000000001', '99999999-0004-0000-0000-000000000001', 1, '44444444-0004-0000-0000-000000000001', 'APPROVED',   'PENDING_MANAGER_APPROVAL',  'PENDING_HR_APPROVAL',      'Feel better.',    '2026-11-11 10:00:00+05:30');

-- LR-005 (Rejected): Submitted + Manager Rejected
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, comments, acted_at)
VALUES
  ('aaaaaaaa-0501-0000-0000-000000000001', '99999999-0005-0000-0000-000000000001', 1, '44444444-0012-0000-0000-000000000001', 'SUBMITTED',  'DRAFT',                     'PENDING_MANAGER_APPROVAL', NULL,                                                                              '2026-10-28 14:00:00+05:30'),
  ('aaaaaaaa-0502-0000-0000-000000000001', '99999999-0005-0000-0000-000000000001', 1, '44444444-0004-0000-0000-000000000001', 'REJECTED',   'PENDING_MANAGER_APPROVAL',  'REJECTED',                 'Team critical delivery scheduled. Minimum team coverage not met.',  '2026-10-29 09:00:00+05:30');

-- LR-006 (Withdrawn): Submitted + Withdrawn
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, acted_at)
VALUES
  ('aaaaaaaa-0601-0000-0000-000000000001', '99999999-0006-0000-0000-000000000001', 1, '44444444-0013-0000-0000-000000000001', 'SUBMITTED', 'DRAFT',                     'PENDING_MANAGER_APPROVAL', '2026-11-03 09:00:00+05:30'),
  ('aaaaaaaa-0602-0000-0000-000000000001', '99999999-0006-0000-0000-000000000001', 1, '44444444-0013-0000-0000-000000000001', 'WITHDRAWN', 'PENDING_MANAGER_APPROVAL',  'WITHDRAWN',                '2026-11-03 11:30:00+05:30');

-- LR-007 (Pending Manager): Submitted
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, acted_at)
VALUES
  ('aaaaaaaa-0701-0000-0000-000000000001', '99999999-0007-0000-0000-000000000001', 1, '44444444-0015-0000-0000-000000000001', 'SUBMITTED', 'DRAFT', 'PENDING_MANAGER_APPROVAL', '2026-11-18 10:00:00+05:30');

-- LR-008 (Approved)
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, acted_at)
VALUES
  ('aaaaaaaa-0801-0000-0000-000000000001', '99999999-0008-0000-0000-000000000001', 1, '44444444-0018-0000-0000-000000000001', 'SUBMITTED', 'DRAFT',                    'PENDING_MANAGER_APPROVAL', '2026-11-01 10:00:00+05:30'),
  ('aaaaaaaa-0802-0000-0000-000000000001', '99999999-0008-0000-0000-000000000001', 1, '44444444-0006-0000-0000-000000000001', 'APPROVED',  'PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL',      '2026-11-02 09:00:00+05:30'),
  ('aaaaaaaa-0803-0000-0000-000000000001', '99999999-0008-0000-0000-000000000001', 2, '44444444-0002-0000-0000-000000000001', 'APPROVED',  'PENDING_HR_APPROVAL',      'APPROVED',                 '2026-11-03 10:00:00+05:30');

-- LR-009 (Pending Manager): Submitted
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, acted_at)
VALUES
  ('aaaaaaaa-0901-0000-0000-000000000001', '99999999-0009-0000-0000-000000000001', 1, '44444444-0019-0000-0000-000000000001', 'SUBMITTED', 'DRAFT', 'PENDING_MANAGER_APPROVAL', '2026-11-18 16:00:00+05:30');

-- LR-010 (Approved)
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, acted_at)
VALUES
  ('aaaaaaaa-1001-0000-0000-000000000001', '99999999-0010-0000-0000-000000000001', 1, '44444444-0022-0000-0000-000000000001', 'SUBMITTED', 'DRAFT',                    'PENDING_MANAGER_APPROVAL', '2026-11-10 09:00:00+05:30'),
  ('aaaaaaaa-1002-0000-0000-000000000001', '99999999-0010-0000-0000-000000000001', 1, '44444444-0007-0000-0000-000000000001', 'APPROVED',  'PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL',      '2026-11-10 11:00:00+05:30'),
  ('aaaaaaaa-1003-0000-0000-000000000001', '99999999-0010-0000-0000-000000000001', 2, '44444444-0002-0000-0000-000000000001', 'APPROVED',  'PENDING_HR_APPROVAL',      'APPROVED',                 '2026-11-10 14:00:00+05:30');

-- LR-012 (Clarification Requested): Submitted + Clarification Requested
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, comments, acted_at)
VALUES
  ('aaaaaaaa-1201-0000-0000-000000000001', '99999999-0012-0000-0000-000000000001', 1, '44444444-0017-0000-0000-000000000001', 'SUBMITTED',               'DRAFT',                     'PENDING_MANAGER_APPROVAL', NULL,                                                                       '2026-11-17 08:00:00+05:30'),
  ('aaaaaaaa-1202-0000-0000-000000000001', '99999999-0012-0000-0000-000000000001', 1, '44444444-0005-0000-0000-000000000001', 'CLARIFICATION_REQUESTED', 'PENDING_MANAGER_APPROVAL',  'CLARIFICATION_REQUESTED',  'Please attach a medical certificate or prescription slip as this is 2+ days sick leave.', '2026-11-17 14:00:00+05:30');

-- LR-013 (Approved)
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, acted_at)
VALUES
  ('aaaaaaaa-1301-0000-0000-000000000001', '99999999-0013-0000-0000-000000000001', 1, '44444444-0012-0000-0000-000000000001', 'SUBMITTED', 'DRAFT',                    'PENDING_MANAGER_APPROVAL', '2026-11-14 10:00:00+05:30'),
  ('aaaaaaaa-1302-0000-0000-000000000001', '99999999-0013-0000-0000-000000000001', 1, '44444444-0004-0000-0000-000000000001', 'APPROVED',  'PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL',      '2026-11-14 15:00:00+05:30'),
  ('aaaaaaaa-1303-0000-0000-000000000001', '99999999-0013-0000-0000-000000000001', 2, '44444444-0002-0000-0000-000000000001', 'APPROVED',  'PENDING_HR_APPROVAL',      'APPROVED',                 '2026-11-15 09:30:00+05:30');

-- LR-014 (Pending Manager): Submitted
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, acted_at)
VALUES
  ('aaaaaaaa-1401-0000-0000-000000000001', '99999999-0014-0000-0000-000000000001', 1, '44444444-0024-0000-0000-000000000001', 'SUBMITTED', 'DRAFT', 'PENDING_MANAGER_APPROVAL', '2026-11-17 11:30:00+05:30');

-- LR-015 (Approved - Bereavement)
INSERT INTO approval_actions (id, leave_request_id, step_order, actor_id, action, previous_status, new_status, comments, acted_at)
VALUES
  ('aaaaaaaa-1501-0000-0000-000000000001', '99999999-0015-0000-0000-000000000001', 1, '44444444-0020-0000-0000-000000000001', 'SUBMITTED', 'DRAFT',                    'PENDING_MANAGER_APPROVAL', NULL,                             '2026-11-03 06:00:00+05:30'),
  ('aaaaaaaa-1502-0000-0000-000000000001', '99999999-0015-0000-0000-000000000001', 1, '44444444-0006-0000-0000-000000000001', 'APPROVED',  'PENDING_MANAGER_APPROVAL', 'PENDING_HR_APPROVAL',      'Sincere condolences. Approved.', '2026-11-03 09:00:00+05:30'),
  ('aaaaaaaa-1503-0000-0000-000000000001', '99999999-0015-0000-0000-000000000001', 2, '44444444-0002-0000-0000-000000000001', 'APPROVED',  'PENDING_HR_APPROVAL',      'APPROVED',                 'Approved with condolences.',     '2026-11-03 10:30:00+05:30');

-- ============================================================
-- NOTIFICATIONS (20+)
-- ============================================================
INSERT INTO notifications (id, organization_id, recipient_id, sender_id, type, title, message, leave_request_id, is_read, created_at)
VALUES
  -- To Vikram Singh (manager) - Rahul's pending request
  ('bbbbbbbb-1001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', '44444444-0010-0000-0000-000000000001', 'LEAVE_REQUEST_SUBMITTED',
   'New Leave Request: Rahul Verma',
   'Rahul Verma has submitted Annual Leave from Dec 22 to Dec 31, 2026 (8 days). Awaiting your approval.',
   '99999999-0003-0000-0000-000000000001', FALSE, '2026-11-15 11:00:00+05:30'),

  -- To Deepa Nair (manager) - Sunita's pending request
  ('bbbbbbbb-1002-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0005-0000-0000-000000000001', '44444444-0015-0000-0000-000000000001', 'LEAVE_REQUEST_SUBMITTED',
   'New Leave Request: Sunita Rao',
   'Sunita Rao has submitted Earned Leave from Dec 15 to Dec 19, 2026 (5 days). Awaiting your approval.',
   '99999999-0007-0000-0000-000000000001', FALSE, '2026-11-18 10:00:00+05:30'),

  -- To Priya Sharma (HR) - Meera's pending HR approval
  ('bbbbbbbb-1003-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'LEAVE_APPROVED',
   'Leave Forwarded for HR Approval: Meera Pillai',
   'Meera Pillai''s Sick Leave (Nov 11-13, 3 days) has been approved by manager. Awaiting your final approval.',
   '99999999-0004-0000-0000-000000000001', FALSE, '2026-11-11 10:00:00+05:30'),

  -- To Meera - Sick leave clarification requested (UNREAD)
  ('bbbbbbbb-1004-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0011-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'LEAVE_CLARIFICATION',
   'Clarification Requested on Sick Leave',
   'Manager has requested clarification on your Sick Leave (Nov 11-13): Please attach medical certificate.', 
   '99999999-0004-0000-0000-000000000001', FALSE, '2026-11-11 10:00:00+05:30'),

  -- To Arjun - his leave approved
  ('bbbbbbbb-1005-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0008-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', 'LEAVE_APPROVED',
   'Your Leave Request has been Approved',
   'Your Annual Leave from Nov 03 to Nov 07, 2026 (5 days) has been approved. Enjoy your vacation!',
   '99999999-0001-0000-0000-000000000001', TRUE, '2026-10-22 09:30:00+05:30'),

  -- To Sneha - leave approved
  ('bbbbbbbb-1006-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0009-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', 'LEAVE_APPROVED',
   'Your Leave Request has been Approved',
   'Your Casual Leave on Nov 10, 2026 (1 day) has been approved.',
   '99999999-0002-0000-0000-000000000001', TRUE, '2026-11-07 16:00:00+05:30'),

  -- To Rohit - leave rejected
  ('bbbbbbbb-1007-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0012-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'LEAVE_REJECTED',
   'Your Leave Request has been Rejected',
   'Your Annual Leave from Nov 04 to Nov 06, 2026 has been rejected. Reason: Team critical delivery scheduled.',
   '99999999-0005-0000-0000-000000000001', TRUE, '2026-10-29 09:00:00+05:30'),

  -- To Gaurav - approved
  ('bbbbbbbb-1008-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0018-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', 'LEAVE_APPROVED',
   'Your Leave Request has been Approved',
   'Your Annual Leave from Nov 17 to Nov 21, 2026 (5 days) has been approved. Happy anniversary!',
   '99999999-0008-0000-0000-000000000001', TRUE, '2026-11-03 10:00:00+05:30'),

  -- To Suresh Patel (manager) - Ritika's pending request
  ('bbbbbbbb-1009-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0006-0000-0000-000000000001', '44444444-0019-0000-0000-000000000001', 'LEAVE_REQUEST_SUBMITTED',
   'New Leave Request: Ritika Kapoor',
   'Ritika Kapoor has submitted Casual Leave on Nov 20, 2026 (0.5 day, AM). Awaiting your approval.',
   '99999999-0009-0000-0000-000000000001', FALSE, '2026-11-18 16:00:00+05:30'),

  -- To Sanjay - comp off approved
  ('bbbbbbbb-1010-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0022-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', 'LEAVE_APPROVED',
   'Your Compensatory Off has been Approved',
   'Your Compensatory Off on Nov 14, 2026 has been approved.',
   '99999999-0010-0000-0000-000000000001', FALSE, '2026-11-10 14:00:00+05:30'),

  -- To Deepa (manager) - Lalitha clarification
  ('bbbbbbbb-1011-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0017-0000-0000-000000000001', '44444444-0005-0000-0000-000000000001', 'LEAVE_CLARIFICATION_REQUESTED',
   'Clarification Needed for Your Sick Leave',
   'Your manager has requested clarification on your Sick Leave (Nov 18-19): Please attach medical certificate.',
   '99999999-0012-0000-0000-000000000001', FALSE, '2026-11-17 14:00:00+05:30'),

  -- To Kavitha (manager) - Harish's pending
  ('bbbbbbbb-1012-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0007-0000-0000-000000000001', '44444444-0024-0000-0000-000000000001', 'LEAVE_REQUEST_SUBMITTED',
   'New Leave Request: Harish Babu',
   'Harish Babu has submitted Annual Leave from Dec 1 to Dec 5, 2026 (5 days). Awaiting your approval.',
   '99999999-0014-0000-0000-000000000001', FALSE, '2026-11-17 11:30:00+05:30'),

  -- To Amit - bereavement approved
  ('bbbbbbbb-1013-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0020-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', 'LEAVE_APPROVED',
   'Your Bereavement Leave has been Approved',
   'Your Bereavement Leave from Nov 03 to Nov 05, 2026 has been approved. Our sincere condolences.',
   '99999999-0015-0000-0000-000000000001', TRUE, '2026-11-03 10:30:00+05:30'),

  -- To Rohit - earned leave approved
  ('bbbbbbbb-1014-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0012-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', 'LEAVE_APPROVED',
   'Your Earned Leave has been Approved',
   'Your Earned Leave on Nov 24-25, 2026 (2 days) has been approved.',
   '99999999-0013-0000-0000-000000000001', FALSE, '2026-11-15 09:30:00+05:30'),

  -- To HR (Priya) - bereavement forwarded
  ('bbbbbbbb-1015-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', '44444444-0006-0000-0000-000000000001', 'LEAVE_FORWARDED_FOR_APPROVAL',
   'Bereavement Leave Needs HR Approval: Amit Chandra',
   'Amit Chandra''s Bereavement Leave (Nov 3-5) is awaiting your approval.',
   '99999999-0015-0000-0000-000000000001', TRUE, '2026-11-03 09:00:00+05:30'),

  -- System notification: year-end leave planning reminder
  ('bbbbbbbb-1016-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0001-0000-0000-000000000001', NULL, 'SYSTEM_REMINDER',
   'Year-End Leave Planning',
   'Reminder: Annual leave balances will lapse on March 31, 2027. Encourage employees to plan and apply leaves before year-end.',
   NULL, FALSE, '2026-11-15 09:00:00+05:30'),

  -- To HR - Rohit earned leave forwarded for HR
  ('bbbbbbbb-1017-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'LEAVE_FORWARDED_FOR_APPROVAL',
   'Leave Request: Rohit Agarwal',
   'Rohit Agarwal''s Earned Leave (Nov 24-25) has been approved by manager and needs your approval.',
   '99999999-0013-0000-0000-000000000001', TRUE, '2026-11-14 15:00:00+05:30'),

  -- To HR - Gaurav's leave forwarded  
  ('bbbbbbbb-1018-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', '44444444-0006-0000-0000-000000000001', 'LEAVE_FORWARDED_FOR_APPROVAL',
   'Leave Request: Gaurav Khanna',
   'Gaurav Khanna''s Annual Leave (Nov 17-21) has been approved by manager and is pending your approval.',
   '99999999-0008-0000-0000-000000000001', TRUE, '2026-11-02 09:00:00+05:30'),

  -- To Arjun (manager of intern) - no pending leaves, general reminder
  ('bbbbbbbb-1019-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0008-0000-0000-000000000001', NULL, 'SYSTEM_REMINDER',
   'Team Leave Calendar Update',
   'Your team member Rahul Verma has applied for leave Dec 22-31. Please ensure coverage is planned.',
   '99999999-0003-0000-0000-000000000001', FALSE, '2026-11-15 12:00:00+05:30'),

  -- To HR Priya - Arjun's leave forwarded at time
  ('bbbbbbbb-1020-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '44444444-0002-0000-0000-000000000001', '44444444-0004-0000-0000-000000000001', 'LEAVE_FORWARDED_FOR_APPROVAL',
   'Leave Request: Arjun Kumar (Oct)',
   'Arjun Kumar''s Annual Leave (Nov 3-7) was forwarded for your final approval.',
   '99999999-0001-0000-0000-000000000001', TRUE, '2026-10-21 14:00:00+05:30');
