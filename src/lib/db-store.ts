import {
  SEED_ORGANIZATION,
  SEED_ORGANIZATION_SETTINGS,
  SEED_DEPARTMENTS,
  SEED_ROLES,
  SEED_LEAVE_TYPES,
  SEED_EMPLOYEES,
  SEED_ROLE_ASSIGNMENTS,
  SEED_REPORTING,
  SEED_HOLIDAYS,
  SEED_LEAVE_BALANCES,
  SEED_LEAVE_REQUESTS,
} from './seed-data'

export interface DbState {
  organizations: any[]
  organization_settings: any[]
  departments: any[]
  roles: any[]
  permissions: any[]
  leave_types: any[]
  leave_policies: any[]
  employees: any[]
  user_profiles: any[]
  employee_role_assignments: any[]
  reporting_relationships: any[]
  holiday_calendars: any[]
  holidays: any[]
  leave_balances: any[]
  leave_balance_ledger: any[]
  leave_requests: any[]
  leave_request_days: any[]
  approval_actions: any[]
  approval_workflows: any[]
  approval_workflow_steps: any[]
  notifications: any[]
  audit_logs: any[]
  outbox_events: any[]
  leave_attachments: any[]
}

// Global persistent in-memory singleton
const globalForDb = globalThis as unknown as { __elms_db?: DbState }

export function getInitialDbState(): DbState {
  const employees = JSON.parse(JSON.stringify(SEED_EMPLOYEES))
  const user_profiles = employees.map((e: any) => ({
    id: e.id,
    organization_id: e.organization_id,
    full_name: e.full_name,
    avatar_url: null,
  }))

  const leave_policies = SEED_LEAVE_TYPES.map((lt: any, idx: number) => ({
    id: `33333333-${String(idx + 1).padStart(4, '0')}-0000-0000-000000000001`,
    organization_id: SEED_ORGANIZATION.id,
    leave_type_id: lt.id,
    name: `${lt.name} Policy`,
    annual_entitlement: lt.code === 'AL' ? 21 : (lt.code === 'SL' ? 10 : (lt.code === 'CL' ? 7 : 15)),
    accrual_type: lt.code === 'AL' || lt.code === 'EL' ? 'MONTHLY' : 'ANNUAL',
    accrual_amount: lt.code === 'AL' ? 1.75 : (lt.code === 'EL' ? 1.25 : 0),
    carry_forward_enabled: lt.code === 'AL' || lt.code === 'EL',
    carry_forward_max_days: lt.code === 'AL' ? 10 : 30,
    carry_forward_expiry_months: 3,
    min_notice_days: lt.code === 'AL' ? 2 : 0,
    max_consecutive_days: lt.code === 'AL' ? 15 : 30,
    allows_backdated: lt.code === 'SL',
    backdated_max_days: 3,
    probation_eligible: lt.code !== 'AL',
    encashment_eligible: lt.code === 'AL',
    applicable_employment_types: ['FULL_TIME', 'PART_TIME'],
    version: 1,
    effective_from: '2026-04-01',
    is_active: true,
  }))

  const approval_workflows = [
    {
      id: '77777777-0001-0000-0000-000000000001',
      organization_id: SEED_ORGANIZATION.id,
      name: 'Standard 2-Step Approval',
      description: 'Manager approval followed by HR approval',
      applies_to_all_leave_types: true,
      applies_to_all_departments: true,
      is_default: true,
      is_active: true,
    },
  ]

  const approval_workflow_steps = [
    {
      id: '88888888-0001-0000-0000-000000000001',
      workflow_id: '77777777-0001-0000-0000-000000000001',
      step_order: 1,
      step_name: 'Manager Approval',
      approver_type: 'DIRECT_MANAGER',
      is_mandatory: true,
    },
    {
      id: '88888888-0002-0000-0000-000000000001',
      workflow_id: '77777777-0001-0000-0000-000000000001',
      step_order: 2,
      step_name: 'HR Approval',
      approver_type: 'HR',
      is_mandatory: true,
    },
  ]

  return {
    organizations: [JSON.parse(JSON.stringify(SEED_ORGANIZATION))],
    organization_settings: [JSON.parse(JSON.stringify(SEED_ORGANIZATION_SETTINGS))],
    departments: JSON.parse(JSON.stringify(SEED_DEPARTMENTS)),
    roles: JSON.parse(JSON.stringify(SEED_ROLES)),
    permissions: [],
    leave_types: JSON.parse(JSON.stringify(SEED_LEAVE_TYPES)),
    leave_policies,
    employees,
    user_profiles,
    employee_role_assignments: JSON.parse(JSON.stringify(SEED_ROLE_ASSIGNMENTS)),
    reporting_relationships: JSON.parse(JSON.stringify(SEED_REPORTING)),
    holiday_calendars: [
      {
        id: 'ffffffff-0001-0000-0000-000000000001',
        organization_id: SEED_ORGANIZATION.id,
        name: 'ABC Technologies Holiday Calendar 2026',
        year: 2026,
        is_default: true,
        is_active: true,
      },
    ],
    holidays: JSON.parse(JSON.stringify(SEED_HOLIDAYS)),
    leave_balances: JSON.parse(JSON.stringify(SEED_LEAVE_BALANCES)),
    leave_balance_ledger: [],
    leave_requests: JSON.parse(JSON.stringify(SEED_LEAVE_REQUESTS)),
    leave_request_days: [],
    approval_actions: [],
    approval_workflows,
    approval_workflow_steps,
    notifications: [],
    audit_logs: [],
    outbox_events: [],
    leave_attachments: [],
  }
}

export function getDb(): DbState {
  if (!globalForDb.__elms_db) {
    globalForDb.__elms_db = getInitialDbState()
  }
  return globalForDb.__elms_db
}

export class MockQueryBuilder {
  private tableName: keyof DbState
  private filters: Array<(item: any) => boolean> = []
  private sortFn: ((a: any, b: any) => number) | null = null
  private limitCount: number | null = null
  private offsetCount: number = 0
  private selectCols: string = '*'
  private isHead: boolean = false
  private countType: 'exact' | null = null

  constructor(tableName: string) {
    this.tableName = tableName as keyof DbState
  }

  select(cols: string = '*', options?: { count?: 'exact'; head?: boolean }) {
    this.selectCols = cols
    if (options?.count) this.countType = options.count
    if (options?.head) this.isHead = options.head
    return this
  }

  eq(column: string, value: any) {
    this.filters.push((item) => {
      if (item == null) return false
      return item[column] === value || String(item[column]) === String(value)
    })
    return this
  }

  neq(column: string, value: any) {
    this.filters.push((item) => item && item[column] !== value)
    return this
  }

  in(column: string, values: any[]) {
    this.filters.push((item) => item && values.some((v) => String(v) === String(item[column])))
    return this
  }

  is(column: string, value: any) {
    this.filters.push((item) => item && item[column] === value)
    return this
  }

  gte(column: string, value: any) {
    this.filters.push((item) => item && item[column] >= value)
    return this
  }

  lte(column: string, value: any) {
    this.filters.push((item) => item && item[column] <= value)
    return this
  }

  gt(column: string, value: any) {
    this.filters.push((item) => item && item[column] > value)
    return this
  }

  lt(column: string, value: any) {
    this.filters.push((item) => item && item[column] < value)
    return this
  }

  not(column: string, operator: string, value: any) {
    this.filters.push((item) => {
      if (!item) return false
      const itemVal = item[column]

      if (operator === 'in') {
        let list: string[] = []
        if (Array.isArray(value)) {
          list = value.map(String)
        } else if (typeof value === 'string') {
          list = value
            .replace(/^\s*\(\s*|\s*\)\s*$/g, '')
            .split(',')
            .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        }
        return !list.includes(String(itemVal))
      }

      if (operator === 'eq' || operator === 'is') {
        return itemVal !== value && String(itemVal) !== String(value)
      }

      if (operator === 'neq') {
        return itemVal === value || String(itemVal) === String(value)
      }

      if (operator === 'gt') return !(itemVal > value)
      if (operator === 'gte') return !(itemVal >= value)
      if (operator === 'lt') return !(itemVal < value)
      if (operator === 'lte') return !(itemVal <= value)
      if (operator === 'like' || operator === 'ilike') {
        const cleanPat = String(value).replace(/%/g, '').toLowerCase()
        return !String(itemVal).toLowerCase().includes(cleanPat)
      }

      return true
    })
    return this
  }

  ilike(column: string, pattern: string) {
    const clean = String(pattern).replace(/%/g, '').toLowerCase()
    this.filters.push((item) => {
      if (!item || item[column] == null) return false
      return String(item[column]).toLowerCase().includes(clean)
    })
    return this
  }

  like(column: string, pattern: string) {
    const clean = String(pattern).replace(/%/g, '')
    this.filters.push((item) => {
      if (!item || item[column] == null) return false
      return String(item[column]).includes(clean)
    })
    return this
  }

  or(filters: string) {
    if (!filters || typeof filters !== 'string') return this
    const conditions = filters.split(',').map((cond) => {
      const parts = cond.split('.')
      return { col: parts[0]?.trim(), op: parts[1]?.trim(), val: parts[2]?.trim() }
    })

    this.filters.push((item) => {
      if (!item) return false
      return conditions.some(({ col, op, val }) => {
        if (!col || !op) return false
        const actual = item[col]
        if (op === 'eq') return String(actual) === String(val)
        if (op === 'neq') return String(actual) !== String(val)
        if (op === 'gt') return Number(actual) > Number(val)
        if (op === 'gte') return Number(actual) >= Number(val)
        if (op === 'lt') return Number(actual) < Number(val)
        if (op === 'lte') return Number(actual) <= Number(val)
        if (op === 'ilike') return String(actual).toLowerCase().includes((val || '').toLowerCase())
        return false
      })
    })
    return this
  }

  filter(column: string, operator: string, value: any) {
    if (operator === 'eq') return this.eq(column, value)
    if (operator === 'neq') return this.neq(column, value)
    if (operator === 'in') return this.in(column, value)
    if (operator === 'not') return this.not(column, 'eq', value)
    if (operator === 'gt') return this.gt(column, value)
    if (operator === 'gte') return this.gte(column, value)
    if (operator === 'lt') return this.lt(column, value)
    if (operator === 'lte') return this.lte(column, value)
    if (operator === 'ilike') return this.ilike(column, value)
    if (operator === 'like') return this.like(column, value)
    return this
  }

  contains(column: string, value: any) {
    this.filters.push((item) => {
      if (!item || item[column] == null) return false
      const colVal = item[column]
      if (Array.isArray(colVal)) {
        if (Array.isArray(value)) return value.every((v) => colVal.includes(v))
        return colVal.includes(value)
      }
      return String(colVal).includes(String(value))
    })
    return this
  }

  containedBy(column: string, value: any) {
    this.filters.push((item) => {
      if (!item || item[column] == null) return false
      const colVal = item[column]
      if (Array.isArray(value)) {
        if (Array.isArray(colVal)) return colVal.every((v) => value.includes(v))
        return value.includes(colVal)
      }
      return false
    })
    return this
  }

  overlaps(column: string, value: any) {
    this.filters.push((item) => {
      if (!item || item[column] == null) return false
      const colVal = item[column]
      if (Array.isArray(colVal) && Array.isArray(value)) {
        return colVal.some((v) => value.includes(v))
      }
      return false
    })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending ?? true
    this.sortFn = (a, b) => {
      const valA = a[column]
      const valB = b[column]
      if (valA === valB) return 0
      if (valA == null) return asc ? -1 : 1
      if (valB == null) return asc ? 1 : -1
      if (asc) return valA > valB ? 1 : -1
      return valA < valB ? 1 : -1
    }
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  range(from: number, to: number) {
    this.offsetCount = from
    this.limitCount = to - from + 1
    return this
  }

  async insert(data: any | any[]) {
    const db = getDb()
    const table = db[this.tableName] || []
    const items = Array.isArray(data) ? data : [data]
    const created: any[] = []

    for (const item of items) {
      const newItem = {
        id: item.id || `gen-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        ...item,
      }
      table.push(newItem)
      created.push(newItem)
    }

    return {
      data: Array.isArray(data) ? created : created[0],
      error: null,
    }
  }

  async update(data: any) {
    const db = getDb()
    const table = db[this.tableName] || []
    const updated: any[] = []

    for (let i = 0; i < table.length; i++) {
      const item = table[i]
      const matches = this.filters.every((fn) => fn(item))
      if (matches) {
        table[i] = {
          ...item,
          ...data,
          updated_at: new Date().toISOString(),
        }
        updated.push(table[i])
      }
    }

    return {
      data: updated.length === 1 ? updated[0] : updated,
      error: null,
    }
  }

  async delete() {
    const db = getDb()
    const table = db[this.tableName] || []
    const remaining: any[] = []
    const deleted: any[] = []

    for (const item of table) {
      const matches = this.filters.every((fn) => fn(item))
      if (matches) {
        deleted.push(item)
      } else {
        remaining.push(item)
      }
    }

    db[this.tableName] = remaining
    return { data: deleted, error: null }
  }

  private resolveRelationships(row: any): any {
    const db = getDb()
    const result = { ...row }

    // Join leave_types on leave_type_id
    if (row.leave_type_id && !row.leave_types) {
      const lt = db.leave_types.find((t) => t.id === row.leave_type_id)
      if (lt) {
        result.leave_types = {
          name: lt.name,
          code: lt.code,
          color: lt.color,
          allows_negative_balance: lt.allows_negative_balance,
          requires_document: lt.requires_document,
          allows_half_day: lt.allows_half_day,
        }
      }
    }

    // Join roles on role_id
    if (row.role_id && !row.roles) {
      const r = db.roles.find((role) => role.id === row.role_id)
      if (r) {
        result.roles = { code: r.code, name: r.name }
      }
    }

    // Join departments on department_id
    if (row.department_id && !row.departments) {
      const d = db.departments.find((dept) => dept.id === row.department_id)
      if (d) {
        result.departments = { name: d.name, code: d.code }
      }
    }

    // Join employees on employee_id
    if (row.employee_id && !row.employees) {
      const e = db.employees.find((emp) => emp.id === row.employee_id)
      if (e) {
        result.employees = {
          id: e.id,
          full_name: e.full_name,
          work_email: e.work_email,
          employee_code: e.employee_code,
          designation: e.designation,
          department_id: e.department_id,
        }
      }
    }

    return result
  }

  private executeQuery(): { data: any; count: number | null; error: any } {
    const db = getDb()
    const table = db[this.tableName] || []

    let filtered = table.filter((item) => this.filters.every((fn) => fn(item)))
    const count = filtered.length

    if (this.sortFn) {
      filtered = [...filtered].sort(this.sortFn)
    }

    if (this.offsetCount > 0) {
      filtered = filtered.slice(this.offsetCount)
    }

    if (this.limitCount !== null) {
      filtered = filtered.slice(0, this.limitCount)
    }

    const data = filtered.map((item) => this.resolveRelationships(item))

    return {
      data: this.isHead ? null : data,
      count: this.countType === 'exact' ? count : null,
      error: null,
    }
  }

  async then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; count: number | null; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const res = this.executeQuery()
    if (onfulfilled) {
      return onfulfilled(res)
    }
    return res as any
  }

  async single() {
    const res = this.executeQuery()
    const item = res.data && res.data.length > 0 ? res.data[0] : null
    return {
      data: item,
      error: item ? null : { message: 'Row not found', code: 'PGRST116' },
    }
  }

  async maybeSingle() {
    const res = this.executeQuery()
    const item = res.data && res.data.length > 0 ? res.data[0] : null
    return {
      data: item,
      error: null,
    }
  }
}

export function createMockSupabaseClient(activeUser?: any) {
  const db = getDb()

  return {
    from(tableName: string) {
      return new MockQueryBuilder(tableName)
    },
    auth: {
      async getUser() {
        if (!activeUser) {
          return { data: { user: null }, error: null }
        }
        return {
          data: {
            user: {
              id: activeUser.id,
              email: activeUser.email,
              user_metadata: { full_name: activeUser.fullName },
            },
          },
          error: null,
        }
      },
      async getSession() {
        if (!activeUser) {
          return { data: { session: null }, error: null }
        }
        return {
          data: {
            session: {
              user: { id: activeUser.id, email: activeUser.email },
              access_token: 'mock-session-token',
            },
          },
          error: null,
        }
      },
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        const emp = db.employees.find(
          (e) => e.work_email.toLowerCase() === email.toLowerCase() && e.is_active
        )
        if (!emp) {
          return { data: { user: null, session: null }, error: { message: 'Invalid email or password' } }
        }

        // Standard test/demo password
        return {
          data: {
            user: {
              id: emp.id,
              email: emp.work_email,
              user_metadata: { full_name: emp.full_name },
            },
            session: {
              access_token: 'mock-token-' + emp.id,
              user: { id: emp.id, email: emp.work_email },
            },
          },
          error: null,
        }
      },
      onAuthStateChange(callback: (event: string, session: any) => void) {
        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        }
      },
      async updateUser(data: any) {
        return { data: { user: activeUser }, error: null }
      },
      async resetPasswordForEmail(email: string) {
        return { data: {}, error: null }
      },
      async exchangeCodeForSession(code: string) {
        return { data: { session: null }, error: null }
      },
      async signOut() {
        return { error: null }
      },
    },
    channel(name: string, _opts?: any) {
      const ch: any = {
        on(_type: string, _optsOrCb: any, _callback?: any) {
          return ch
        },
        subscribe(callback?: (status: string, err?: any) => void) {
          if (callback) {
            setTimeout(() => callback('SUBSCRIBED'), 0)
          }
          return ch
        },
        unsubscribe() {
          return Promise.resolve('ok')
        },
        send() {
          return Promise.resolve('ok')
        },
      }
      return ch
    },
    removeChannel(_channel: any) {
      return Promise.resolve('ok')
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, file: any) {
            return { data: { path }, error: null }
          },
          getPublicUrl(path: string) {
            return { data: { publicUrl: `/uploads/${path}` } }
          },
        }
      },
    },
  }
}
