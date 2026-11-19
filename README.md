# ELMS 360 - Enterprise Leave Management System

ELMS 360 is a full-featured, multi-tenant Employee Leave Management System engineered with Next.js 15, React 19, TypeScript, Tailwind CSS, and Supabase (PostgreSQL 15+).

---

## 1. Prerequisites

Before getting started, make sure your local development environment has:
- **Node.js**: v18.17+ or v20+ (`node -v`)
- **npm**: v9+ or v10+ (`npm -v`)
- **Docker Desktop**: Required if running local Supabase (`docker --version`)
- **Supabase CLI**: Optional for local development (`brew install supabase/tap/supabase` or `npm install -g supabase`)

---

## 2. Clone and Install Dependencies

Navigate to your workspace and install dependencies:

```bash
cd elms360
npm install
```

---

## 3. Supabase Setup

You can run ELMS 360 either against a **local Supabase instance** (via Docker) or against a **Supabase Cloud project**.

### Option A: Local Supabase (Recommended for local dev)
1. Initialize and start the local Supabase containers:
   ```bash
   npx supabase start
   ```
2. Note the generated API URL and keys:
   - API URL: `http://127.0.0.1:54321`
   - Anon key: `<your-local-anon-key>`
   - Service Role key: `<your-local-service-role-key>`
   - Studio URL: `http://127.0.0.1:54323`

### Option B: Supabase Cloud
1. Create a new project at [database.new](https://database.new).
2. Go to **Project Settings > API** to retrieve your Project URL and API Keys.

---

## 4. Run Migrations in Order

Apply the database schema files in numerical order:

```bash
# If using Supabase CLI locally:
npx supabase db reset
# Or execute migrations sequentially:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_indexes_and_functions.sql
# 3. supabase/migrations/003_rls_policies.sql
# 4. supabase/migrations/004_seed_data.sql
```

If using the **Supabase Cloud Dashboard**:
1. Open the **SQL Editor** in your Supabase dashboard.
2. Run `001_initial_schema.sql` (Creates 29 core tables & extensions).
3. Run `002_indexes_and_functions.sql` (Creates indexes, triggers, stored procedures).
4. Run `003_rls_policies.sql` (Enables Row Level Security and security policies).
5. Run `004_seed_data.sql` (Populates ABC Technologies demo organization, 27 employees, leave policies, balances, sample requests, and notifications).

---

## 5. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```ini
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321  # or https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ELMS 360

# Email (Optional - Resend.com)
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=noreply@yourdomain.com

# Organization defaults
DEFAULT_TIMEZONE=Asia/Kolkata
NODE_ENV=development
```

---

## 6. Create Demo Users & Link Auth

To log in with the 27 preloaded employees from `004_seed_data.sql`:
1. Follow the instructions in [DEMO_CREDENTIALS.md](file://./DEMO_CREDENTIALS.md).
2. Run the provided SQL script in the Supabase SQL Editor to provision the demo auth users with password `DemoPassword123!` and link them to the employee records.

---

## 7. Start the Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To verify a production build and type checking:
```bash
npm run build
```

---

## 8. Demo Login Accounts

| Role | Email | Password | Description |
|---|---|---|---|
| **Super Admin** | `superadmin@abc-tech.com` | `DemoPassword123!` | System CTO, full access |
| **HR Admin** | `hr1@abc-tech.com` | `DemoPassword123!` | HR Manager, policy & request approval |
| **Engineering Manager** | `manager.eng@abc-tech.com` | `DemoPassword123!` | Approves team leaves |
| **Senior Engineer** | `arjun.kumar@abc-tech.com` | `DemoPassword123!` | Employee with sample approved leave |
| **Software Engineer** | `rahul.verma@abc-tech.com` | `DemoPassword123!` | Employee with pending leave request |

Refer to [DEMO_CREDENTIALS.md](file://./DEMO_CREDENTIALS.md) for all 27 user profiles across Engineering, HR, Finance, Marketing, and Operations.

---

## 9. Architecture & Documentation

- [ARCHITECTURE.md](file://./ARCHITECTURE.md): Comprehensive system architecture, schema design, state machine, and security model.
- [DEMO_CREDENTIALS.md](file://./DEMO_CREDENTIALS.md): Full credentials table and user linking scripts.
- `supabase/migrations/`: SQL migration files for reproducible schema deployment.
