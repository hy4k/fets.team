'use server'

import { createClient } from '@/lib/supabase/server'
import { createGeneratedDocument } from './documents'
import { calcGross, calcDeductions, calcNet, MONTHS } from '@/lib/utils/salary'

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
  pf_deduction: number
  esi_deduction: number
  leave_deduction: number
  advance_deduction: number
  other_deductions: number
  payment_date: string | null
  payment_mode: string
  is_paid: boolean
  payslip_doc_id: string | null
  admin_notes: string | null
  created_at: string
  staff?: {
    full_name: string
    staff_id: string
    designation_text: string | null
    bank_account: Record<string, string> | null
    centre?: { name: string } | null
    department?: { name: string } | null
  }
}

export interface CreateSalaryInput {
  staff_id: string
  month: number
  year: number
  basic_salary: number
  hra?: number
  transport_allowance?: number
  other_allowances?: number
  incentives?: number
  overtime?: number
  pf_deduction?: number
  esi_deduction?: number
  leave_deduction?: number
  advance_deduction?: number
  other_deductions?: number
  payment_date?: string
  payment_mode?: string
  is_paid?: boolean
  admin_notes?: string
}

export interface StaffForPayroll {
  id: string
  staff_id: string
  full_name: string
  salary: number | null
}

export async function getSalaryRecords(filters?: {
  staffId?: string
  month?: number
  year?: number
  isPaid?: boolean
  limit?: number
}): Promise<SalaryRecord[]> {
  const supabase = await createClient()
  let q = (supabase as any)
    .from('salary_records')
    .select(`*, staff:staff_id(full_name, staff_id, designation_text, bank_account, centre:centre_id(name), department:department_id(name))`)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.staffId) q = q.eq('staff_id', filters.staffId)
  if (filters?.month) q = q.eq('month', filters.month)
  if (filters?.year) q = q.eq('year', filters.year)
  if (filters?.isPaid !== undefined) q = q.eq('is_paid', filters.isPaid)
  if (filters?.limit) q = q.limit(filters.limit)

  const { data, error } = await q
  if (error) { console.error(error); return [] }
  return (data || []) as SalaryRecord[]
}

export async function getSalaryRecord(id: string): Promise<SalaryRecord | null> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('salary_records')
    .select(`*, staff:staff_id(full_name, staff_id, designation_text, bank_account, centre:centre_id(name), department:department_id(name))`)
    .eq('id', id)
    .single()
  if (error) return null
  return data as SalaryRecord
}

export async function createSalaryRecord(input: CreateSalaryInput): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()

  // Check for duplicate month/year for this staff
  const { data: existing } = await (supabase as any)
    .from('salary_records')
    .select('id')
    .eq('staff_id', input.staff_id)
    .eq('month', input.month)
    .eq('year', input.year)
    .single()

  if (existing) {
    return { error: `Salary record already exists for ${MONTHS[input.month - 1]} ${input.year}` }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await (supabase as any)
    .from('salary_records')
    .insert({ ...input, generated_by: user?.id })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { id: data.id }
}

export async function updateSalaryRecord(id: string, updates: Partial<CreateSalaryInput>): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('salary_records')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function markAsPaid(id: string, paymentDate: string, paymentMode: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('salary_records')
    .update({ is_paid: true, payment_date: paymentDate, payment_mode: paymentMode, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function deleteSalaryRecord(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('salary_records').delete().eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function getStaffForPayroll(): Promise<StaffForPayroll[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('staff')
    .select('id, staff_id, full_name, salary')
    .eq('status', 'active')
    .order('full_name')
  return (data || []) as StaffForPayroll[]
}

export async function generatePayslipDoc(recordId: string): Promise<{ docId: string } | { error: string }> {
  const record = await getSalaryRecord(recordId)
  if (!record) return { error: 'Salary record not found' }

  const gross = calcGross(record)
  const deductions = calcDeductions(record)
  const net = gross - deductions
  const staff = record.staff

  const fmtCur = (n: number) => n.toFixed(2)
  const monthName = MONTHS[record.month - 1]

  const fieldValues: Record<string, string> = {
    employee_name: staff?.full_name || '',
    employee_id: staff?.staff_id || '',
    designation: staff?.designation_text || '',
    department: staff?.department?.name || '',
    pay_period: `${monthName} ${record.year}`,
    payment_date: record.payment_date || new Date().toISOString().slice(0, 10),
    payment_mode: record.payment_mode || 'Bank Transfer',
    bank_account: staff?.bank_account?.account_number || '',
    basic_salary: fmtCur(record.basic_salary || 0),
    hra: fmtCur(record.hra || 0),
    transport_allowance: fmtCur(record.transport_allowance || 0),
    other_allowances: fmtCur(record.other_allowances || 0),
    incentives: fmtCur(record.incentives || 0),
    overtime: fmtCur(record.overtime || 0),
    gross_pay: fmtCur(gross),
    pf_deduction: fmtCur(record.pf_deduction || 0),
    esi_deduction: fmtCur(record.esi_deduction || 0),
    leave_deduction: fmtCur(record.leave_deduction || 0),
    advance_deduction: fmtCur(record.advance_deduction || 0),
    other_deductions: fmtCur(record.other_deductions || 0),
    total_deductions: fmtCur(deductions),
    net_pay: fmtCur(net),
  }

  const result = await createGeneratedDocument({
    docType: 'payslip',
    staffId: record.staff_id,
    fieldValues,
    status: 'generated',
  })

  if ('error' in result) return { error: result.error }
  return { docId: result.id }
}

export async function getPayrollSummary(month: number, year: number) {
  const records = await getSalaryRecords({ month, year })
  const total = records.length
  const paid = records.filter(r => r.is_paid).length
  const unpaid = total - paid
  const totalGross = records.reduce((s, r) => s + calcGross(r), 0)
  const totalNet = records.reduce((s, r) => s + calcNet(r), 0)
  return { total, paid, unpaid, totalGross, totalNet }
}
