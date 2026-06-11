'use server'

import { createClient } from '@/lib/supabase/server'

// ── Current staff record ───────────────────────────────────────────────────────

export interface MyProfile {
  id: string; staff_id: string; full_name: string; photo_url: string | null
  phone: string | null; email: string | null; gender: string | null
  date_of_birth: string | null; date_of_joining: string | null
  designation_text: string | null; employment_type: string; status: string
  notes: string | null; user_id: string | null
  centre: { id: string; name: string; city: string | null } | null
  department: { id: string; name: string } | null
  designation: { id: string; title: string } | null
}

export async function getMyProfile(): Promise<MyProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await (supabase as any)
    .from('staff')
    .select('*, centre:centre_id(id,name,city), department:department_id(id,name), designation:designation_id(id,title)')
    .eq('user_id', user.id)
    .single()
  return data ?? null
}

// ── Leave ──────────────────────────────────────────────────────────────────────

export async function getMyLeaveRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const me = await getMyProfile()
  if (!me) return []
  const { data } = await (supabase as any)
    .from('leave_requests')
    .select('*, leave_type:leave_type_id(name, is_paid)')
    .eq('staff_id', me.id)
    .order('created_at', { ascending: false })
    .limit(50)
  return data ?? []
}

export async function getMyLeaveStats() {
  const requests = await getMyLeaveRequests()
  const approved = requests.filter((r: any) => r.status === 'approved')
  const pending  = requests.filter((r: any) => r.status === 'pending')
  const rejected = requests.filter((r: any) => r.status === 'rejected')
  const totalApprovedDays = approved.reduce((sum: number, r: any) => sum + (r.days || 0), 0)
  return { total: requests.length, approved: approved.length, pending: pending.length, rejected: rejected.length, totalApprovedDays }
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getMyDocuments() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const me = await getMyProfile()
  if (!me) return []
  const { data } = await (supabase as any)
    .from('generated_documents')
    .select('id, doc_number, doc_type, status, verification_id, created_at, approval_date')
    .eq('staff_id', me.id)
    .order('created_at', { ascending: false })
    .limit(30)
  return data ?? []
}

// ── Payslips ──────────────────────────────────────────────────────────────────

export async function getMyPayslips() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const me = await getMyProfile()
  if (!me) return []
  const { data } = await (supabase as any)
    .from('salary_records')
    .select('id, month, year, basic_salary, is_paid, payment_date, payment_mode, payslip_doc_id, created_at')
    .eq('staff_id', me.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(24)
  return data ?? []
}

// ── Letter Requests ───────────────────────────────────────────────────────────

export async function getMyLetterRequests() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const me = await getMyProfile()
  if (!me) return []
  const { data } = await (supabase as any)
    .from('letter_requests')
    .select('id, letter_type, reason, status, hr_notes, created_at, updated_at, generated_doc_id')
    .eq('staff_id', me.id)
    .order('created_at', { ascending: false })
    .limit(20)
  return data ?? []
}

export async function submitLetterRequest(input: {
  letter_type: string; reason: string
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }
    const me = await getMyProfile()
    if (!me) return { error: 'Staff profile not linked to this account' }
    const { data, error } = await (supabase as any)
      .from('letter_requests')
      .insert({ staff_id: me.id, letter_type: input.letter_type, reason: input.reason, status: 'pending' })
      .select('id').single()
    if (error) return { error: error.message }
    return { id: data.id }
  } catch (e: any) { return { error: e.message } }
}

// ── Attendance summary (current month) ────────────────────────────────────────

export async function getMyAttendanceSummary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const me = await getMyProfile()
  if (!me) return null
  const now = new Date()
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const { data } = await (supabase as any)
    .from('attendance')
    .select('date, status')
    .eq('staff_id', me.id)
    .gte('date', from)
    .order('date', { ascending: false })
  const rows = data ?? []
  const counts: Record<string, number> = {}
  rows.forEach((r: any) => { counts[r.status] = (counts[r.status] || 0) + 1 })
  return { rows, counts, total: rows.length }
}
