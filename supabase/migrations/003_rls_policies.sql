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
