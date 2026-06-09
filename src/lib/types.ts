export type UserRole = 'super_admin' | 'hr_admin' | 'centre_manager' | 'accountant' | 'staff' | 'viewer'
export type EmploymentType = 'full_time' | 'part_time' | 'intern' | 'contract'
export type StaffStatus = 'active' | 'probation' | 'on_leave' | 'resigned' | 'terminated'
export type DocStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'generated' | 'archived'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type CertStatus = 'not_started' | 'in_progress' | 'taken' | 'passed' | 'failed' | 'expired'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  staff_id: string | null
  centre_id: string | null
  avatar_url: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Centre {
  id: string
  name: string
  city: string
  address: string | null
  phone: string | null
  email: string | null
}

export interface Department {
  id: string
  name: string
}

export interface Designation {
  id: string
  title: string
  department_id: string | null
}

export interface Staff {
  id: string
  staff_id: string
  full_name: string
  email: string | null
  phone: string | null
  gender: string | null
  date_of_birth: string | null
  address: Record<string, string> | null
  emergency_contact: Record<string, string> | null
  designation_id: string | null
  designation_text: string | null
  department_id: string | null
  centre_id: string
  employment_type: EmploymentType
  status: StaffStatus
  date_of_joining: string | null
  date_of_leaving: string | null
  salary: number | null
  bank_account: Record<string, string> | null
  aadhaar_number: string | null
  pan_number: string | null
  photo_url: string | null
  documents: Record<string, unknown>[] | null
  user_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  centre?: Centre
  department?: Department
  designation?: Designation
}

export interface SalaryRecord {
  id: string
  staff_id: string
  month: number
  year: number
  basic_salary: number
  hra: number
  transport_allowance: number
  other_allowances: number
  incentives: number
  overtime: number
  gross_salary: number
  pf_deduction: number
  esi_deduction: number
  leave_deduction: number
  advance_deduction: number
  other_deductions: number
  total_deductions: number
  net_salary: number
  payment_date: string | null
  payment_mode: string
  is_paid: boolean
  payslip_url: string | null
  admin_notes: string | null
  created_at: string
  staff?: Staff
}

export interface DocumentTemplate {
  id: string
  name: string
  category: string
  template_key: string
  description: string | null
  html_content: string | null
  placeholders: string[]
  has_letterhead: boolean
  has_signature: boolean
  has_seal: boolean
  has_qr: boolean
  is_active: boolean
  created_at: string
}

export interface GeneratedDocument {
  id: string
  doc_number: string
  template_id: string | null
  doc_type: string
  staff_id: string | null
  status: DocStatus
  field_values: Record<string, string>
  pdf_url: string | null
  verification_id: string
  approved_by: string | null
  approval_date: string | null
  approval_remarks: string | null
  version: number
  created_at: string
  staff?: Staff
}

export interface Certification {
  id: string
  name: string
  issuing_body: string | null
  category: string | null
  is_active: boolean
}

export interface StaffCertification {
  id: string
  staff_id: string
  certification_id: string
  status: CertStatus
  taken_date: string | null
  expiry_date: string | null
  certificate_url: string | null
  remarks: string | null
  created_at: string
  certification?: Certification
  staff?: Staff
}

export interface LeaveRequest {
  id: string
  staff_id: string
  leave_type_id: string
  from_date: string
  to_date: string
  days: number
  reason: string | null
  status: LeaveStatus
  approved_by: string | null
  approval_date: string | null
  remarks: string | null
  created_at: string
  staff?: Staff
}

// Supabase Database type (simplified)
export type Database = {
  public: {
    Tables: {
      profiles:             { Row: Profile;             Insert: Partial<Profile>;             Update: Partial<Profile>             }
      staff:                { Row: Staff;               Insert: Partial<Staff>;               Update: Partial<Staff>               }
      salary_records:       { Row: SalaryRecord;        Insert: Partial<SalaryRecord>;        Update: Partial<SalaryRecord>        }
      document_templates:   { Row: DocumentTemplate;    Insert: Partial<DocumentTemplate>;    Update: Partial<DocumentTemplate>    }
      generated_documents:  { Row: GeneratedDocument;   Insert: Partial<GeneratedDocument>;   Update: Partial<GeneratedDocument>   }
      staff_certifications: { Row: StaffCertification;  Insert: Partial<StaffCertification>;  Update: Partial<StaffCertification>  }
      leave_requests:       { Row: LeaveRequest;        Insert: Partial<LeaveRequest>;        Update: Partial<LeaveRequest>        }
      centres:              { Row: Centre;              Insert: Partial<Centre>;              Update: Partial<Centre>              }
      departments:          { Row: Department;          Insert: Partial<Department>;          Update: Partial<Department>          }
      designations:         { Row: Designation;         Insert: Partial<Designation>;         Update: Partial<Designation>         }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      employment_type: EmploymentType
      staff_status: StaffStatus
    }
  }
}
