// ============================================================
// DATABASE TYPE DEFINITIONS
// Mirrors exactly the 29 tables from supabase/migrations/001_initial_schema.sql
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ---- Enums / union types from CHECK constraints ----

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'
export type EmploymentStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_NOTICE'
export type DayType = 'FULL_DAY' | 'HALF_DAY_AM' | 'HALF_DAY_PM' | 'PARTIAL'
export type LeaveStatus =
  | 'DRAFT'
  | 'PENDING_MANAGER_APPROVAL'
  | 'PENDING_HR_APPROVAL'
  | 'PENDING_ADDITIONAL_APPROVAL'
  | 'CLARIFICATION_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'CANCELLATION_REQUESTED'
  | 'CANCELLED'
export type ApprovalAction =
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLARIFICATION_REQUESTED'
  | 'FORWARDED'
  | 'WITHDRAWN'
  | 'CANCELLATION_APPROVED'
  | 'DELEGATED'
export type RelationshipType = 'PRIMARY' | 'SECONDARY'
export type HolidayType = 'NATIONAL' | 'OPTIONAL' | 'REGIONAL' | 'ORGANIZATION'
export type AccrualType = 'ANNUAL' | 'MONTHLY' | 'QUARTERLY' | 'NONE'
export type ApproverType = 'DIRECT_MANAGER' | 'DEPARTMENT_HEAD' | 'HR' | 'SPECIFIC_EMPLOYEE' | 'ROLE'
export type LedgerTransactionType =
  | 'OPENING'
  | 'ACCRUAL'
  | 'DEDUCTION'
  | 'REVERSAL'
  | 'CARRY_FORWARD'
  | 'EXPIRY'
  | 'MANUAL_ADJUSTMENT'
  | 'PENDING_RESERVE'
  | 'PENDING_RELEASE'
export type OutboxEventStatus = 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'FAILED'
export type LeaveYearType = 'CALENDAR' | 'FISCAL'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          timezone: string
          fiscal_year_start: number
          weekly_off_days: number[]
          logo_url: string | null
          settings: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          timezone?: string
          fiscal_year_start?: number
          weekly_off_days?: number[]
          logo_url?: string | null
          settings?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          timezone?: string
          fiscal_year_start?: number
          weekly_off_days?: number[]
          logo_url?: string | null
          settings?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      departments: {
        Row: {
          id: string
          organization_id: string
          name: string
          code: string | null
          parent_department_id: string | null
          head_employee_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          code?: string | null
          parent_department_id?: string | null
          head_employee_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          code?: string | null
          parent_department_id?: string | null
          head_employee_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      roles: {
        Row: {
          id: string
          organization_id: string
          name: string
          code: string
          description: string | null
          is_system_role: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          code: string
          description?: string | null
          is_system_role?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          code?: string
          description?: string | null
          is_system_role?: boolean
          created_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      permissions: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          module: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          module: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          module?: string
          created_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      role_permissions: {
        Row: {
          role_id: string
          permission_id: string
        }
        Insert: {
          role_id: string
          permission_id: string
        }
        Update: {
          role_id?: string
          permission_id?: string
        
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'role_permissions_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'role_permissions_permission_id_fkey'
            columns: ['permission_id']
            isOneToOne: false
            referencedRelation: 'permissions'
            referencedColumns: ['id']
          }
        ]
      }

      user_profiles: {
        Row: {
          id: string
          organization_id: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      employees: {
        Row: {
          id: string
          user_id: string | null
          organization_id: string
          employee_code: string
          full_name: string
          work_email: string
          personal_email: string | null
          phone: string | null
          designation: string | null
          department_id: string | null
          location: string | null
          date_of_joining: string
          date_of_birth: string | null
          employment_type: EmploymentType | string
          employment_status: EmploymentStatus | string
          grade: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          organization_id: string
          employee_code: string
          full_name: string
          work_email: string
          personal_email?: string | null
          phone?: string | null
          designation?: string | null
          department_id?: string | null
          location?: string | null
          date_of_joining: string
          date_of_birth?: string | null
          employment_type?: EmploymentType
          employment_status?: EmploymentStatus
          grade?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          organization_id?: string
          employee_code?: string
          full_name?: string
          work_email?: string
          personal_email?: string | null
          phone?: string | null
          designation?: string | null
          department_id?: string | null
          location?: string | null
          date_of_joining?: string
          date_of_birth?: string | null
          employment_type?: EmploymentType
          employment_status?: EmploymentStatus
          grade?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      reporting_relationships: {
        Row: {
          id: string
          employee_id: string
          manager_id: string
          relationship_type: RelationshipType
          is_active: boolean
          effective_from: string
          effective_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          manager_id: string
          relationship_type?: RelationshipType
          is_active?: boolean
          effective_from?: string
          effective_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          manager_id?: string
          relationship_type?: RelationshipType
          is_active?: boolean
          effective_from?: string
          effective_to?: string | null
          created_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      employee_role_assignments: {
        Row: {
          id: string
          employee_id: string
          role_id: string
          assigned_by: string | null
          assigned_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          employee_id: string
          role_id: string
          assigned_by?: string | null
          assigned_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          employee_id?: string
          role_id?: string
          assigned_by?: string | null
          assigned_at?: string
          is_active?: boolean
        
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'employee_role_assignments_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employee_role_assignments_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          }
        ]
      }

      work_schedules: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          working_days: number[]
          hours_per_day: number
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          working_days?: number[]
          hours_per_day?: number
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          working_days?: number[]
          hours_per_day?: number
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      employee_work_schedules: {
        Row: {
          id: string
          employee_id: string
          work_schedule_id: string
          effective_from: string
          effective_to: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          work_schedule_id: string
          effective_from?: string
          effective_to?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          work_schedule_id?: string
          effective_from?: string
          effective_to?: string | null
          is_active?: boolean
          created_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      holiday_calendars: {
        Row: {
          id: string
          organization_id: string
          name: string
          year: number
          location: string | null
          department_id: string | null
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          year: number
          location?: string | null
          department_id?: string | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          year?: number
          location?: string | null
          department_id?: string | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      holidays: {
        Row: {
          id: string
          calendar_id: string
          organization_id: string
          name: string
          holiday_date: string
          date: string
          holiday_type: HolidayType
          is_optional: boolean
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          calendar_id: string
          organization_id: string
          name: string
          holiday_date: string
          date?: string
          holiday_type?: HolidayType
          is_optional?: boolean
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          calendar_id?: string
          organization_id?: string
          name?: string
          holiday_date?: string
          holiday_type?: HolidayType
          is_optional?: boolean
          description?: string | null
          created_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      leave_types: {
        Row: {
          id: string
          organization_id: string
          name: string
          code: string
          description: string | null
          color: string
          icon: string | null
          requires_document: boolean
          document_description: string | null
          allows_half_day: boolean
          allows_negative_balance: boolean
          is_paid: boolean
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          code: string
          description?: string | null
          color?: string
          icon?: string | null
          requires_document?: boolean
          document_description?: string | null
          allows_half_day?: boolean
          allows_negative_balance?: boolean
          is_paid?: boolean
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          code?: string
          description?: string | null
          color?: string
          icon?: string | null
          requires_document?: boolean
          document_description?: string | null
          allows_half_day?: boolean
          allows_negative_balance?: boolean
          is_paid?: boolean
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      leave_policies: {
        Row: {
          id: string
          organization_id: string
          leave_type_id: string
          name: string
          annual_entitlement: number
          accrual_type: AccrualType
          accrual_amount: number
          accrual_start_month: number | null
          probation_eligible: boolean
          probation_days: number | null
          carry_forward_enabled: boolean
          carry_forward_max_days: number | null
          carry_forward_expiry_months: number | null
          max_consecutive_days: number | null
          min_notice_days: number
          max_advance_days: number | null
          allows_backdated: boolean
          backdated_max_days: number | null
          encashment_eligible: boolean
          applicable_employment_types: string[]
          applicable_grades: string[] | null
          applicable_department_ids: string[] | null
          version: number
          effective_from: string
          effective_to: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          leave_type_id: string
          name: string
          annual_entitlement?: number
          accrual_type?: AccrualType
          accrual_amount?: number
          accrual_start_month?: number | null
          probation_eligible?: boolean
          probation_days?: number | null
          carry_forward_enabled?: boolean
          carry_forward_max_days?: number | null
          carry_forward_expiry_months?: number | null
          max_consecutive_days?: number | null
          min_notice_days?: number
          max_advance_days?: number | null
          allows_backdated?: boolean
          backdated_max_days?: number | null
          encashment_eligible?: boolean
          applicable_employment_types?: string[]
          applicable_grades?: string[] | null
          applicable_department_ids?: string[] | null
          version?: number
          effective_from: string
          effective_to?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          leave_type_id?: string
          name?: string
          annual_entitlement?: number
          accrual_type?: AccrualType
          accrual_amount?: number
          accrual_start_month?: number | null
          probation_eligible?: boolean
          probation_days?: number | null
          carry_forward_enabled?: boolean
          carry_forward_max_days?: number | null
          carry_forward_expiry_months?: number | null
          max_consecutive_days?: number | null
          min_notice_days?: number
          max_advance_days?: number | null
          allows_backdated?: boolean
          backdated_max_days?: number | null
          encashment_eligible?: boolean
          applicable_employment_types?: string[]
          applicable_grades?: string[] | null
          applicable_department_ids?: string[] | null
          version?: number
          effective_from?: string
          effective_to?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      leave_policy_versions: {
        Row: {
          id: string
          policy_id: string
          version: number
          policy_snapshot: Json
          changed_by: string | null
          change_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          policy_id: string
          version: number
          policy_snapshot: Json
          changed_by?: string | null
          change_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          policy_id?: string
          version?: number
          policy_snapshot?: Json
          changed_by?: string | null
          change_reason?: string | null
          created_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      employee_policy_assignments: {
        Row: {
          id: string
          employee_id: string
          policy_id: string
          effective_from: string
          effective_to: string | null
          assigned_by: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          policy_id: string
          effective_from?: string
          effective_to?: string | null
          assigned_by?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          policy_id?: string
          effective_from?: string
          effective_to?: string | null
          assigned_by?: string | null
          is_active?: boolean
          created_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      leave_balances: {
        Row: {
          id: string
          employee_id: string
          leave_type_id: string
          organization_id: string
          fiscal_year: number
          opening_balance: number
          accrued: number
          used: number
          pending: number
          adjusted: number
          carried_forward: number
          expired: number
          closing_balance: number
          available_balance: number
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          leave_type_id: string
          organization_id: string
          fiscal_year: number
          opening_balance?: number
          accrued?: number
          used?: number
          pending?: number
          adjusted?: number
          carried_forward?: number
          expired?: number
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          leave_type_id?: string
          organization_id?: string
          fiscal_year?: number
          opening_balance?: number
          accrued?: number
          used?: number
          pending?: number
          adjusted?: number
          carried_forward?: number
          expired?: number
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      leave_balance_ledger: {
        Row: {
          id: string
          employee_id: string
          leave_type_id: string
          organization_id: string
          fiscal_year: number
          transaction_type: LedgerTransactionType
          entry_type?: string
          amount: number
          days?: number
          balance_before: number
          balance_after: number
          running_balance?: number
          leave_request_id: string | null
          performed_by: string | null
          reason: string | null
          reference: string | null
          idempotency_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          leave_type_id: string
          organization_id: string
          fiscal_year: number
          transaction_type: LedgerTransactionType
          entry_type?: string
          amount: number
          days?: number
          balance_before: number
          balance_after: number
          running_balance?: number
          leave_request_id?: string | null
          performed_by?: string | null
          reason?: string | null
          reference?: string | null
          idempotency_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          leave_type_id?: string
          organization_id?: string
          fiscal_year?: number
          transaction_type?: LedgerTransactionType
          amount?: number
          balance_before?: number
          balance_after?: number
          leave_request_id?: string | null
          performed_by?: string | null
          reason?: string | null
          reference?: string | null
          idempotency_key?: string | null
          created_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      approval_workflows: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          leave_type_ids: string[] | null
          applies_to_all_leave_types: boolean
          department_ids: string[] | null
          applies_to_all_departments: boolean
          min_duration_days: number | null
          max_duration_days: number | null
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          leave_type_ids?: string[] | null
          applies_to_all_leave_types?: boolean
          department_ids?: string[] | null
          applies_to_all_departments?: boolean
          min_duration_days?: number | null
          max_duration_days?: number | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          leave_type_ids?: string[] | null
          applies_to_all_leave_types?: boolean
          department_ids?: string[] | null
          applies_to_all_departments?: boolean
          min_duration_days?: number | null
          max_duration_days?: number | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      approval_workflow_steps: {
        Row: {
          id: string
          workflow_id: string
          approval_workflow_id?: string
          step_order: number
          step_name: string
          approver_type: ApproverType
          approver_role_id: string | null
          approver_employee_id: string | null
          is_mandatory: boolean
          can_skip_conditions: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          workflow_id: string
          approval_workflow_id?: string
          step_order: number
          step_name: string
          approver_type: ApproverType
          approver_role_id?: string | null
          approver_employee_id?: string | null
          is_mandatory?: boolean
          can_skip_conditions?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          workflow_id?: string
          step_order?: number
          step_name?: string
          approver_type?: ApproverType
          approver_role_id?: string | null
          approver_employee_id?: string | null
          is_mandatory?: boolean
          can_skip_conditions?: Json | null
          created_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      leave_requests: {
        Row: {
          id: string
          request_number: string
          organization_id: string
          employee_id: string
          leave_type_id: string
          workflow_id: string | null
          current_step_order: number | null
          current_step?: number
          status: LeaveStatus | string
          start_date: string
          end_date: string
          total_days: number
          day_type: DayType
          partial_hours: number | null
          reason: string
          handover_notes: string | null
          emergency_contact: string | null
          contact_during_leave: string | null
          policy_id: string | null
          applied_at: string | null
          current_approver_id: string | null
          clarification_message: string | null
          rejection_reason: string | null
          cancellation_reason: string | null
          idempotency_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_number?: string
          organization_id: string
          employee_id: string
          leave_type_id: string
          workflow_id?: string | null
          current_step_order?: number | null
          current_step?: number
          status?: LeaveStatus
          start_date: string
          end_date: string
          total_days: number
          day_type?: DayType
          partial_hours?: number | null
          reason: string
          handover_notes?: string | null
          emergency_contact?: string | null
          contact_during_leave?: string | null
          policy_id?: string | null
          applied_at?: string | null
          current_approver_id?: string | null
          clarification_message?: string | null
          rejection_reason?: string | null
          cancellation_reason?: string | null
          idempotency_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_number?: string
          organization_id?: string
          employee_id?: string
          leave_type_id?: string
          workflow_id?: string | null
          current_step_order?: number | null
          status?: LeaveStatus
          start_date?: string
          end_date?: string
          total_days?: number
          day_type?: DayType
          partial_hours?: number | null
          reason?: string
          handover_notes?: string | null
          emergency_contact?: string | null
          contact_during_leave?: string | null
          policy_id?: string | null
          applied_at?: string | null
          current_approver_id?: string | null
          clarification_message?: string | null
          rejection_reason?: string | null
          cancellation_reason?: string | null
          idempotency_key?: string | null
          created_at?: string
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: [
          {
            foreignKeyName: 'leave_requests_leave_type_id_fkey'
            columns: ['leave_type_id']
            isOneToOne: false
            referencedRelation: 'leave_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_current_approver_id_fkey'
            columns: ['current_approver_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leave_requests_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          }
        ]
      }

      leave_request_days: {
        Row: {
          id: string
          leave_request_id: string
          leave_date: string
          day_value: number
          is_holiday: boolean
          is_weekend: boolean
        }
        Insert: {
          id?: string
          leave_request_id: string
          leave_date: string
          day_value?: number
          is_holiday?: boolean
          is_weekend?: boolean
        }
        Update: {
          id?: string
          leave_request_id?: string
          leave_date?: string
          day_value?: number
          is_holiday?: boolean
          is_weekend?: boolean
        
          [key: string]: unknown
        }
        Relationships: []
      }

      approval_actions: {
        Row: {
          id: string
          leave_request_id: string
          workflow_step_id: string | null
          step_order: number | null
          actor_id: string
          actor_employee_id?: string
          action: ApprovalAction | string
          previous_status: string | null
          new_status: string
          comments: string | null
          acted_at: string
          idempotency_key: string | null
        }
        Insert: {
          id?: string
          leave_request_id: string
          workflow_step_id?: string | null
          step_order?: number | null
          actor_id?: string
          actor_employee_id?: string
          action: ApprovalAction
          previous_status?: string | null
          new_status: string
          comments?: string | null
          acted_at?: string
          idempotency_key?: string | null
        }
        Update: {
          id?: string
          leave_request_id?: string
          workflow_step_id?: string | null
          step_order?: number | null
          actor_id?: string
          action?: ApprovalAction
          previous_status?: string | null
          new_status?: string
          comments?: string | null
          acted_at?: string
          idempotency_key?: string | null
        
          [key: string]: unknown
        }
        Relationships: []
      }

      approval_delegations: {
        Row: {
          id: string
          organization_id: string
          delegator_id: string
          delegate_id: string
          department_ids: string[] | null
          applies_to_all_departments: boolean
          start_date: string
          end_date: string
          reason: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          delegator_id: string
          delegate_id: string
          department_ids?: string[] | null
          applies_to_all_departments?: boolean
          start_date: string
          end_date: string
          reason?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          delegator_id?: string
          delegate_id?: string
          department_ids?: string[] | null
          applies_to_all_departments?: boolean
          start_date?: string
          end_date?: string
          reason?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      leave_attachments: {
        Row: {
          id: string
          leave_request_id: string
          organization_id: string
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          leave_request_id: string
          organization_id: string
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          mime_type: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          leave_request_id?: string
          organization_id?: string
          employee_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          uploaded_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      notifications: {
        Row: {
          id: string
          organization_id: string
          recipient_id: string
          recipient_employee_id?: string
          sender_id: string | null
          type: string
          title: string
          message: string
          reference_id?: string | null
          reference_type?: string | null
          leave_request_id: string | null
          is_read: boolean
          read_at: string | null
          metadata: Json
          idempotency_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          recipient_id?: string
          recipient_employee_id?: string
          sender_id?: string | null
          type: string
          title: string
          message: string
          reference_id?: string | null
          reference_type?: string | null
          leave_request_id?: string | null
          is_read?: boolean
          read_at?: string | null
          metadata?: Json
          idempotency_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          recipient_id?: string
          sender_id?: string | null
          type?: string
          title?: string
          message?: string
          leave_request_id?: string | null
          is_read?: boolean
          read_at?: string | null
          metadata?: Json
          idempotency_key?: string | null
          created_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      outbox_events: {
        Row: {
          id: string
          organization_id: string
          event_type: string
          payload: Json
          status: OutboxEventStatus
          attempts: number
          max_attempts: number
          processed_at: string | null
          error_message: string | null
          idempotency_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          event_type: string
          payload: Json
          status?: OutboxEventStatus
          attempts?: number
          max_attempts?: number
          processed_at?: string | null
          error_message?: string | null
          idempotency_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          event_type?: string
          payload?: Json
          status?: OutboxEventStatus
          attempts?: number
          max_attempts?: number
          processed_at?: string | null
          error_message?: string | null
          idempotency_key?: string | null
          created_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      audit_logs: {
        Row: {
          id: string
          organization_id: string | null
          actor_id: string
          actor_employee_id?: string | null
          actor_email: string | null
          action: string
          resource_type: string
          resource_id: string | null
          previous_state: Json | null
          new_state: Json | null
          reason: string | null
          ip_address: string | null
          user_agent: string | null
          correlation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          actor_id?: string | null
          actor_email?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          previous_state?: Json | null
          new_state?: Json | null
          reason?: string | null
          ip_address?: string | null
          user_agent?: string | null
          correlation_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          actor_id?: string | null
          actor_email?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          previous_state?: Json | null
          new_state?: Json | null
          reason?: string | null
          ip_address?: string | null
          user_agent?: string | null
          correlation_id?: string | null
          created_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }

      organization_settings: {
        Row: {
          id: string
          organization_id: string
          leave_year_type: LeaveYearType
          max_pending_per_employee: number
          allow_concurrent_leaves: boolean
          overlap_policy?: "BLOCK" | "WARN_AND_ALLOW" | "ALLOW" | null
          min_team_coverage_percent: number
          require_handover_notes: boolean
          auto_approve_after_days: number | null
          enable_email_notifications: boolean
          enable_push_notifications: boolean
          working_hours_per_day: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          leave_year_type?: LeaveYearType
          max_pending_per_employee?: number
          allow_concurrent_leaves?: boolean
          overlap_policy?: "BLOCK" | "WARN_AND_ALLOW" | "ALLOW" | null
          min_team_coverage_percent?: number
          require_handover_notes?: boolean
          auto_approve_after_days?: number | null
          enable_email_notifications?: boolean
          enable_push_notifications?: boolean
          working_hours_per_day?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          leave_year_type?: LeaveYearType
          max_pending_per_employee?: number
          allow_concurrent_leaves?: boolean
          min_team_coverage_percent?: number
          require_handover_notes?: boolean
          auto_approve_after_days?: number | null
          enable_email_notifications?: boolean
          enable_push_notifications?: boolean
          working_hours_per_day?: number
          created_at?: string
          updated_at?: string
        
          [key: string]: unknown
        }
        Relationships: []
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      process_approval_action: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      submit_leave_request: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      calculate_working_days: {
        Args: Record<string, unknown>
        Returns: unknown
      }
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }

    Enums: {
      employment_type: EmploymentType | string
      employment_status: EmploymentStatus | string
      day_type: DayType
      leave_status: LeaveStatus | string
      approval_action: ApprovalAction | string
      relationship_type: RelationshipType
      holiday_type: HolidayType
      accrual_type: AccrualType
      approver_type: ApproverType
      ledger_transaction_type: LedgerTransactionType
      outbox_event_status: OutboxEventStatus
      leave_year_type: LeaveYearType
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}
