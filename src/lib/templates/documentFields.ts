// ============================================================
// FETS OS — Document Field Definitions
// Each document type declares its form fields + staff prefill map
// ============================================================

export type FieldType = 'text' | 'date' | 'number' | 'textarea' | 'select' | 'currency'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  required?: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
  prefillFromStaff?: string  // staff property to auto-fill from
  hint?: string
  rows?: number
}

export interface DocTypeDef {
  key: string
  name: string
  category: string
  color: string
  description: string
  fields: FieldDef[]
}

export const DOC_TYPES: Record<string, DocTypeDef> = {
  offer_letter: {
    key: 'offer_letter', name: 'Offer Letter', category: 'HR Letters', color: '#3B82F6',
    description: 'Initial offer of employment',
    fields: [
      { key: 'candidate_name', label: 'Candidate Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'candidate_email', label: 'Candidate Email', type: 'text', prefillFromStaff: 'email' },
      { key: 'position', label: 'Position / Designation', type: 'text', required: true, prefillFromStaff: 'designation_text' },
      { key: 'department', label: 'Department', type: 'text', prefillFromStaff: 'department_name' },
      { key: 'centre', label: 'Centre / Location', type: 'text', prefillFromStaff: 'centre_name' },
      { key: 'date_of_joining', label: 'Expected Joining Date', type: 'date', required: true, prefillFromStaff: 'date_of_joining' },
      { key: 'monthly_salary', label: 'Monthly Salary (₹)', type: 'currency', required: true, prefillFromStaff: 'salary' },
      { key: 'offer_valid_till', label: 'Offer Valid Till', type: 'date', required: true },
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
      { key: 'additional_notes', label: 'Additional Notes / Conditions', type: 'textarea', rows: 3 },
    ],
  },

  appointment_letter: {
    key: 'appointment_letter', name: 'Appointment Letter', category: 'HR Letters', color: '#3B82F6',
    description: 'Formal appointment confirmation',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', required: true, prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation / Position', type: 'text', required: true, prefillFromStaff: 'designation_text' },
      { key: 'department', label: 'Department', type: 'text', prefillFromStaff: 'department_name' },
      { key: 'centre', label: 'Centre / Location', type: 'text', prefillFromStaff: 'centre_name' },
      { key: 'date_of_joining', label: 'Date of Joining', type: 'date', required: true, prefillFromStaff: 'date_of_joining' },
      { key: 'employment_type', label: 'Employment Type', type: 'select', required: true, options: [
        { value: 'Full Time', label: 'Full Time' }, { value: 'Part Time', label: 'Part Time' },
        { value: 'Contract', label: 'Contract' }, { value: 'Intern', label: 'Intern' },
      ]},
      { key: 'monthly_salary', label: 'Monthly Salary (₹)', type: 'currency', required: true, prefillFromStaff: 'salary' },
      { key: 'probation_months', label: 'Probation Period (months)', type: 'number', placeholder: '3' },
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
    ],
  },

  experience_letter: {
    key: 'experience_letter', name: 'Experience Letter', category: 'HR Letters', color: '#3B82F6',
    description: 'Proof of employment experience',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation / Position', type: 'text', required: true, prefillFromStaff: 'designation_text' },
      { key: 'department', label: 'Department', type: 'text', prefillFromStaff: 'department_name' },
      { key: 'date_of_joining', label: 'Date of Joining', type: 'date', required: true, prefillFromStaff: 'date_of_joining' },
      { key: 'last_working_day', label: 'Last Working Day', type: 'date', required: true },
      { key: 'performance_note', label: 'Performance Remark', type: 'select', options: [
        { value: 'excellent', label: 'Excellent' }, { value: 'good', label: 'Good' }, { value: 'satisfactory', label: 'Satisfactory' },
      ]},
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
    ],
  },

  relieving_letter: {
    key: 'relieving_letter', name: 'Relieving Letter', category: 'HR Letters', color: '#3B82F6',
    description: 'Staff exit and relieving confirmation',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation', type: 'text', required: true, prefillFromStaff: 'designation_text' },
      { key: 'department', label: 'Department', type: 'text', prefillFromStaff: 'department_name' },
      { key: 'date_of_joining', label: 'Date of Joining', type: 'date', required: true, prefillFromStaff: 'date_of_joining' },
      { key: 'last_working_day', label: 'Last Working Day', type: 'date', required: true },
      { key: 'relieving_remarks', label: 'Relieving Remarks', type: 'textarea', rows: 2 },
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
    ],
  },

  confirmation_letter: {
    key: 'confirmation_letter', name: 'Confirmation Letter', category: 'HR Letters', color: '#3B82F6',
    description: 'Probation period completion',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation', type: 'text', required: true, prefillFromStaff: 'designation_text' },
      { key: 'date_of_joining', label: 'Date of Joining', type: 'date', required: true, prefillFromStaff: 'date_of_joining' },
      { key: 'confirmation_date', label: 'Confirmation Effective Date', type: 'date', required: true },
      { key: 'new_salary', label: 'Revised Salary (₹)', type: 'currency', prefillFromStaff: 'salary' },
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
    ],
  },

  appreciation_letter: {
    key: 'appreciation_letter', name: 'Appreciation Letter', category: 'HR Letters', color: '#22C55E',
    description: 'Appreciation for good performance',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'position', label: 'Designation', type: 'text', prefillFromStaff: 'designation_text' },
      { key: 'achievement', label: 'Achievement / Reason', type: 'text', required: true, placeholder: 'e.g. excellent performance in Q4 2024' },
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
      { key: 'additional_message', label: 'Additional Message', type: 'textarea', rows: 2 },
    ],
  },

  leave_approval: {
    key: 'leave_approval', name: 'Leave Approval Letter', category: 'HR Letters', color: '#22C55E',
    description: 'Formal leave approval',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'leave_type', label: 'Leave Type', type: 'select', required: true, options: [
        { value: 'Casual Leave', label: 'Casual Leave' }, { value: 'Sick Leave', label: 'Sick Leave' },
        { value: 'Annual Leave', label: 'Annual Leave' }, { value: 'Maternity Leave', label: 'Maternity Leave' },
        { value: 'Paternity Leave', label: 'Paternity Leave' }, { value: 'Unpaid Leave', label: 'Unpaid Leave' },
      ]},
      { key: 'from_date', label: 'From Date', type: 'date', required: true },
      { key: 'to_date', label: 'To Date', type: 'date', required: true },
      { key: 'days', label: 'Number of Days', type: 'number', required: true },
      { key: 'reason', label: 'Reason', type: 'text', required: true },
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
    ],
  },

  warning_letter: {
    key: 'warning_letter', name: 'Warning Letter', category: 'Disciplinary', color: '#EF4444',
    description: 'Formal warning to staff',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation', type: 'text', prefillFromStaff: 'designation_text' },
      { key: 'warning_level', label: 'Warning Level', type: 'select', required: true, options: [
        { value: 'First Warning', label: 'First Warning' },
        { value: 'Second Warning (Final)', label: 'Second Warning (Final)' },
        { value: 'Show Cause Notice', label: 'Show Cause Notice' },
      ]},
      { key: 'incident_date', label: 'Incident Date', type: 'date', required: true },
      { key: 'incident_description', label: 'Incident Description', type: 'textarea', required: true, rows: 4 },
      { key: 'consequence', label: 'Consequence / Action', type: 'textarea', rows: 2 },
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
    ],
  },

  payslip: {
    key: 'payslip', name: 'Pay Slip', category: 'Finance', color: '#F5C518',
    description: 'Monthly salary statement',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', required: true, prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation', type: 'text', prefillFromStaff: 'designation_text' },
      { key: 'department', label: 'Department', type: 'text', prefillFromStaff: 'department_name' },
      { key: 'month_year', label: 'Pay Month', type: 'text', required: true, placeholder: 'e.g. May 2025' },
      { key: 'basic_salary', label: 'Basic Salary (₹)', type: 'currency', required: true, prefillFromStaff: 'salary' },
      { key: 'hra', label: 'HRA (₹)', type: 'currency' },
      { key: 'transport', label: 'Transport Allowance (₹)', type: 'currency' },
      { key: 'other_allowances', label: 'Other Allowances (₹)', type: 'currency' },
      { key: 'incentives', label: 'Incentives (₹)', type: 'currency' },
      { key: 'overtime', label: 'Overtime (₹)', type: 'currency' },
      { key: 'pf_deduction', label: 'PF Deduction (₹)', type: 'currency' },
      { key: 'esi_deduction', label: 'ESI Deduction (₹)', type: 'currency' },
      { key: 'leave_deduction', label: 'Leave Deduction (₹)', type: 'currency' },
      { key: 'advance_deduction', label: 'Advance Deduction (₹)', type: 'currency' },
      { key: 'other_deductions', label: 'Other Deductions (₹)', type: 'currency' },
      { key: 'payment_mode', label: 'Payment Mode', type: 'select', options: [
        { value: 'Bank Transfer', label: 'Bank Transfer' }, { value: 'Cash', label: 'Cash' }, { value: 'Cheque', label: 'Cheque' },
      ]},
    ],
  },

  salary_certificate: {
    key: 'salary_certificate', name: 'Salary Certificate', category: 'Finance', color: '#F5C518',
    description: 'Proof of current salary',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation', type: 'text', prefillFromStaff: 'designation_text' },
      { key: 'department', label: 'Department', type: 'text', prefillFromStaff: 'department_name' },
      { key: 'centre', label: 'Centre', type: 'text', prefillFromStaff: 'centre_name' },
      { key: 'monthly_salary', label: 'Monthly Salary (₹)', type: 'currency', required: true, prefillFromStaff: 'salary' },
      { key: 'date_of_joining', label: 'Date of Joining', type: 'date', prefillFromStaff: 'date_of_joining' },
      { key: 'purpose', label: 'Purpose', type: 'text', required: true, placeholder: 'e.g. Bank Loan Application' },
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
    ],
  },

  increment_letter: {
    key: 'increment_letter', name: 'Increment Letter', category: 'Finance', color: '#F5C518',
    description: 'Salary increment notification',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation', type: 'text', prefillFromStaff: 'designation_text' },
      { key: 'old_salary', label: 'Current Salary (₹)', type: 'currency', required: true, prefillFromStaff: 'salary' },
      { key: 'new_salary', label: 'Revised Salary (₹)', type: 'currency', required: true },
      { key: 'effective_date', label: 'Effective From', type: 'date', required: true },
      { key: 'reason', label: 'Reason for Increment', type: 'text' },
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
    ],
  },

  authorization_letter: {
    key: 'authorization_letter', name: 'Authorization Letter', category: 'Operations', color: '#8B5CF6',
    description: 'Centre visit or task authorization',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation', type: 'text', prefillFromStaff: 'designation_text' },
      { key: 'purpose', label: 'Purpose of Authorization', type: 'textarea', required: true, rows: 2 },
      { key: 'valid_from', label: 'Valid From', type: 'date', required: true },
      { key: 'valid_to', label: 'Valid Till', type: 'date', required: true },
      { key: 'authorized_places', label: 'Authorized For (Places / Tasks)', type: 'text' },
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
    ],
  },

  id_card: {
    key: 'id_card', name: 'Staff ID Card', category: 'Operations', color: '#8B5CF6',
    description: 'Official staff identity card',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', required: true, prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation', type: 'text', required: true, prefillFromStaff: 'designation_text' },
      { key: 'department', label: 'Department', type: 'text', prefillFromStaff: 'department_name' },
      { key: 'phone', label: 'Phone', type: 'text', prefillFromStaff: 'phone' },
      { key: 'blood_group', label: 'Blood Group', type: 'text', placeholder: 'e.g. O+' },
      { key: 'valid_till', label: 'Valid Till Date', type: 'date', required: true },
    ],
  },

  asset_handover: {
    key: 'asset_handover', name: 'Asset Handover Letter', category: 'Operations', color: '#8B5CF6',
    description: 'Asset issuance and handover record',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation', type: 'text', prefillFromStaff: 'designation_text' },
      { key: 'assets_list', label: 'Assets / Items (one per line)', type: 'textarea', required: true, rows: 4,
        placeholder: 'e.g.\nLaptop - Dell Inspiron 15 (S/N: XYZ123)\nWireless Mouse\nStaff ID Card' },
      { key: 'handover_date', label: 'Handover Date', type: 'date', required: true },
      { key: 'purpose', label: 'Purpose', type: 'text', placeholder: 'e.g. New Joining / Centre Use' },
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
    ],
  },

  uniform_issue: {
    key: 'uniform_issue', name: 'Uniform / ID Issue Form', category: 'Operations', color: '#8B5CF6',
    description: 'Uniform and ID card issuance',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation', type: 'text', prefillFromStaff: 'designation_text' },
      { key: 'centre', label: 'Centre', type: 'text', prefillFromStaff: 'centre_name' },
      { key: 'items_issued', label: 'Items Issued (one per line)', type: 'textarea', required: true, rows: 3,
        placeholder: 'e.g.\nUniform Shirt x2 (Size: M)\nUniform Trouser x1 (Size: 32)\nStaff ID Card' },
      { key: 'issue_date', label: 'Issue Date', type: 'date', required: true },
      { key: 'letter_date', label: 'Letter Date', type: 'date', required: true },
    ],
  },

  internship_certificate: {
    key: 'internship_certificate', name: 'Internship Certificate', category: 'Certificates', color: '#F59E0B',
    description: 'Internship completion certificate',
    fields: [
      { key: 'intern_name', label: 'Intern Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'college', label: 'College / Institution', type: 'text', required: true },
      { key: 'course', label: 'Course / Programme', type: 'text', placeholder: 'e.g. BCA, MBA, B.Tech' },
      { key: 'department', label: 'Department', type: 'text', prefillFromStaff: 'department_name' },
      { key: 'from_date', label: 'Internship From', type: 'date', required: true, prefillFromStaff: 'date_of_joining' },
      { key: 'to_date', label: 'Internship To', type: 'date', required: true },
      { key: 'performance', label: 'Performance Grade', type: 'select', options: [
        { value: 'Excellent', label: 'Excellent' }, { value: 'Very Good', label: 'Very Good' },
        { value: 'Good', label: 'Good' }, { value: 'Satisfactory', label: 'Satisfactory' },
      ]},
      { key: 'letter_date', label: 'Certificate Date', type: 'date', required: true },
    ],
  },

  training_certificate: {
    key: 'training_certificate', name: 'Training Certificate', category: 'Certificates', color: '#F59E0B',
    description: 'Training completion certificate',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'training_name', label: 'Training Programme', type: 'text', required: true },
      { key: 'conducted_by', label: 'Conducted By', type: 'text', placeholder: 'e.g. FETS Training Team' },
      { key: 'training_from', label: 'Training From', type: 'date', required: true },
      { key: 'training_to', label: 'Training To', type: 'date', required: true },
      { key: 'duration_hours', label: 'Duration (Hours)', type: 'number', placeholder: '24' },
      { key: 'grade', label: 'Grade / Result', type: 'select', options: [
        { value: 'Distinction', label: 'Distinction' }, { value: 'First Class', label: 'First Class' },
        { value: 'Pass', label: 'Pass' }, { value: 'Completed', label: 'Completed' },
      ]},
      { key: 'letter_date', label: 'Certificate Date', type: 'date', required: true },
    ],
  },

  nda_agreement: {
    key: 'nda_agreement', name: 'NDA / Confidentiality Agreement', category: 'Legal', color: '#6B7280',
    description: 'Non-disclosure and confidentiality',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation', type: 'text', prefillFromStaff: 'designation_text' },
      { key: 'effective_date', label: 'Effective Date', type: 'date', required: true, prefillFromStaff: 'date_of_joining' },
      { key: 'letter_date', label: 'Agreement Date', type: 'date', required: true },
    ],
  },

  cert_record: {
    key: 'cert_record', name: 'Certification Record', category: 'Certifications', color: '#06B6D4',
    description: 'Staff certification completion record',
    fields: [
      { key: 'staff_name', label: 'Staff Name', type: 'text', required: true, prefillFromStaff: 'full_name' },
      { key: 'staff_id', label: 'Staff ID', type: 'text', prefillFromStaff: 'staff_id' },
      { key: 'position', label: 'Designation', type: 'text', prefillFromStaff: 'designation_text' },
      { key: 'certification_name', label: 'Certification Name', type: 'text', required: true },
      { key: 'issuing_body', label: 'Issuing Body', type: 'text', required: true },
      { key: 'exam_date', label: 'Exam Date', type: 'date', required: true },
      { key: 'result', label: 'Result', type: 'select', required: true, options: [
        { value: 'Passed', label: 'Passed' }, { value: 'Failed', label: 'Failed' }, { value: 'In Progress', label: 'In Progress' },
      ]},
      { key: 'certificate_no', label: 'Certificate / Registration No.', type: 'text' },
      { key: 'expiry_date', label: 'Expiry Date (if any)', type: 'date' },
      { key: 'letter_date', label: 'Record Date', type: 'date', required: true },
    ],
  },
}

export function getDocType(key: string): DocTypeDef | undefined {
  return DOC_TYPES[key]
}

export function getDocTitle(key: string): string {
  return DOC_TYPES[key]?.name ?? key.replace(/_/g, ' ').toUpperCase()
}
