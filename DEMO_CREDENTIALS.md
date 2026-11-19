# ELMS 360 - Demo Credentials & Setup Guide

> [!WARNING]
> **Security Notice**: These credentials and scripts are strictly intended for local development, staging environments, and demonstration walkthroughs. **NEVER** use these demo accounts or default passwords in a production environment.

---

## 1. Demo User Accounts (27 Total)

All demo accounts share the rotated evaluation password:
**`CorporateAccess2026!`** (Rotated per V1.2 Security Policy)

### 1.1 Executive & Super Admin
| Employee Code | Name | Role | Email | Department |
|---|---|---|---|---|
| `EMP001` | Rajan Mehta | Super Admin (CTO) | `superadmin@abc-tech.com` | Engineering |

### 1.2 Human Resources
| Employee Code | Name | Role | Email | Department |
|---|---|---|---|---|
| `EMP002` | Priya Sharma | HR Admin / Manager | `hr1@abc-tech.com` | Human Resources |
| `EMP003` | Ankit Joshi | HR Admin / Executive | `hr2@abc-tech.com` | Human Resources |
| `EMP027` | Divya Krishnamurthy | HR Business Partner | `divya.k@abc-tech.com` | Human Resources |

### 1.3 Department Managers
| Employee Code | Name | Role | Email | Department |
|---|---|---|---|---|
| `EMP004` | Vikram Singh | Manager | `manager.eng@abc-tech.com` | Engineering |
| `EMP005` | Deepa Nair | Manager | `manager.fin@abc-tech.com` | Finance |
| `EMP006` | Suresh Patel | Manager | `manager.mkt@abc-tech.com` | Marketing |
| `EMP007` | Kavitha Reddy | Manager | `manager.ops@abc-tech.com` | Operations |

### 1.4 Engineering Team
| Employee Code | Name | Role | Email | Designation |
|---|---|---|---|---|
| `EMP008` | Arjun Kumar | Employee | `arjun.kumar@abc-tech.com` | Senior Software Engineer |
| `EMP009` | Sneha Gupta | Employee | `sneha.gupta@abc-tech.com` | Software Engineer |
| `EMP010` | Rahul Verma | Employee | `rahul.verma@abc-tech.com` | Software Engineer |
| `EMP011` | Meera Pillai | Employee | `meera.pillai@abc-tech.com` | QA Engineer |
| `EMP012` | Rohit Agarwal | Employee | `rohit.agarwal@abc-tech.com` | DevOps Engineer |
| `EMP013` | Pooja Desai | Employee | `pooja.desai@abc-tech.com` | UI/UX Designer |
| `EMP014` | Neeraj Bhatt | Intern | `neeraj.bhatt@abc-tech.com` | Software Engineer Intern |
| `EMP026` | Tejas Patil | Contractor | `tejas.patil@abc-tech.com` | Contract Developer |

### 1.5 Finance Team
| Employee Code | Name | Role | Email | Designation |
|---|---|---|---|---|
| `EMP015` | Sunita Rao | Employee | `sunita.rao@abc-tech.com` | Senior Accountant |
| `EMP016` | Manoj Tiwari | Employee | `manoj.tiwari@abc-tech.com` | Accountant |
| `EMP017` | Lalitha Subramaniam | Employee | `lalitha.s@abc-tech.com` | Financial Analyst |

### 1.6 Marketing Team
| Employee Code | Name | Role | Email | Designation |
|---|---|---|---|---|
| `EMP018` | Gaurav Khanna | Employee | `gaurav.khanna@abc-tech.com` | Senior Marketing Specialist |
| `EMP019` | Ritika Kapoor | Employee | `ritika.kapoor@abc-tech.com` | Content Writer |
| `EMP020` | Amit Chandra | Employee | `amit.chandra@abc-tech.com` | Digital Marketing Analyst |
| `EMP021` | Nisha Malhotra | Employee | `nisha.malhotra@abc-tech.com`| Brand Manager |

### 1.7 Operations Team
| Employee Code | Name | Role | Email | Designation |
|---|---|---|---|---|
| `EMP022` | Sanjay Kulkarni | Employee | `sanjay.k@abc-tech.com` | Operations Analyst |
| `EMP023` | Vandana Mishra | Employee | `vandana.m@abc-tech.com` | Office Administrator |
| `EMP024` | Harish Babu | Employee | `harish.babu@abc-tech.com` | Procurement Specialist |
| `EMP025` | Bhavna Trivedi | Employee | `bhavna.t@abc-tech.com` | Vendor Manager |

---

## 2. Setting Up Demo Auth Users in Supabase

Because Supabase Auth manages `auth.users` through its secure internal authentication schema, you can initialize these users either via the Supabase Dashboard, Supabase CLI, or via a quick SQL script in the Supabase SQL Editor.

### Option A: Automatic Creation & Linking via Supabase SQL Editor
Execute the following script in the Supabase SQL Editor (or psql connected with postgres privileges). It creates the auth users with password `DemoPassword123!` and automatically links them to their employee and profile records:

```sql
DO $$
DECLARE
  v_org_id UUID := 'aaaaaaaa-0000-0000-0000-000000000001';
  v_user_id UUID;
  r RECORD;
BEGIN
  FOR r IN (
    SELECT id, work_email, full_name
    FROM employees
    WHERE organization_id = v_org_id
  ) LOOP
    -- Create user in auth.users if not existing
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      r.work_email,
      -- Encrypted representation of 'DemoPassword123!'
      crypt('DemoPassword123!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', r.full_name),
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_user_id;

    -- If conflict, retrieve existing id
    IF v_user_id IS NULL THEN
      SELECT id INTO v_user_id FROM auth.users WHERE email = r.work_email;
    END IF;

    -- Link employee to auth user
    UPDATE employees
    SET user_id = v_user_id, updated_at = NOW()
    WHERE id = r.id;

    -- Upsert user profile
    INSERT INTO user_profiles (id, organization_id, full_name, is_active)
    VALUES (v_user_id, v_org_id, r.full_name, TRUE)
    ON CONFLICT (id) DO UPDATE
    SET organization_id = v_org_id, full_name = r.full_name, updated_at = NOW();

  END LOOP;
END;
$$;
```

---

## 3. Manual SQL Linker Script

If you create user accounts manually through the Supabase Dashboard UI (`Authentication -> Users -> Add User`), run this SQL snippet anytime to link them by email address:

```sql
-- 1. Link employees table to auth.users based on matching email
UPDATE employees e
SET user_id = u.id,
    updated_at = NOW()
FROM auth.users u
WHERE LOWER(e.work_email) = LOWER(u.email);

-- 2. Populate user_profiles table for each connected user
INSERT INTO user_profiles (id, organization_id, full_name, is_active)
SELECT 
  e.user_id,
  e.organization_id,
  e.full_name,
  e.is_active
FROM employees e
WHERE e.user_id IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET organization_id = EXCLUDED.organization_id,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

-- 3. Verification query
SELECT 
  e.employee_code,
  e.full_name,
  e.work_email,
  e.user_id IS NOT NULL AS has_auth_link,
  r.code AS role_code
FROM employees e
LEFT JOIN employee_role_assignments era ON era.employee_id = e.id AND era.is_active = TRUE
LEFT JOIN roles r ON r.id = era.role_id
ORDER BY e.employee_code;
```
