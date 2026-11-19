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
