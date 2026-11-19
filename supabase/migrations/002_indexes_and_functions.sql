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
