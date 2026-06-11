'use server'

import { createClient } from '@/lib/supabase/server'
import { createAuditLog } from '@/lib/actions/audit'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LeaveType {
  id: string
  name: string
  days_per_year: number
  is_paid: boolean
  created_at: string
}

export interface LeaveRequest {
  id: string
  staff_id: string
  leave_type_id: string
  from_date: string
  to_date: string
  days: number
  reason: string | null
  status: string
  approved_by: string | null
  approval_date: string | null
  remarks: string | null
  created_at: string
  updated_at: string
  staff?: { full_name: string; staff_id: string }
  leave_type?: { name: string; is_paid: boolean }
}

export interface AttendanceRecord {
  id: string
  staff_id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: string
  shift: string | null
  notes: string | null
  created_at: string
  staff?: { full_name: string; staff_id: string }
}

export interface ApplyLeaveInput {
  staff_id: string
  leave_type_id: string
  from_date: string
  to_date: string
  days: number
  reason?: string
}

// ── Leave Types ───────────────────────────────────────────────────────────────

export async function getLeaveTypes(): Promise<LeaveType[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any).from('leave_types').select('*').order('name')
  return (data || []) as LeaveType[]
}

export async function createLeaveType(input: {
  name: string; days_per_year: number; is_paid: boolean
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('leave_types').insert(input).select('id').single()
  if (error) return { error: error.message }
  await createAuditLog({ action: 'create', entity_type: 'leave_type', entity_id: data.id, new_values: input })
  return { id: data.id }
}

export async function updateLeaveType(
  id: string, updates: { name?: string; days_per_year?: number; is_paid?: boolean }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('leave_types').update(updates).eq('id', id)
  if (error) return { error: error.message }
  await createAuditLog({ action: 'update', entity_type: 'leave_type', entity_id: id, new_values: updates })
  return {}
}

// ── Leave Requests ────────────────────────────────────────────────────────────

export async function getLeaveRequests(filters?: {
  staffId?: string; leaveTypeId?: string; status?: string
}): Promise<LeaveRequest[]> {
  const supabase = await createClient()
  let q = (supabase as any)
    .from('leave_requests')
    .select('*, staff:staff_id(full_name,staff_id), leave_type:leave_type_id(name,is_paid)')
    .order('created_at', { ascending: false })
  if (filters?.staffId)     q = q.eq('staff_id', filters.staffId)
  if (filters?.leaveTypeId) q = q.eq('leave_type_id', filters.leaveTypeId)
  if (filters?.status)      q = q.eq('status', filters.status)
  const { data } = await q
  return (data || []) as LeaveRequest[]
}

export async function applyLeave(
  input: ApplyLeaveInput
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('leave_requests').insert(input).select('id').single()
  if (error) return { error: error.message }
  await createAuditLog({
    action: 'create', entity_type: 'leave_request', entity_id: data.id,
    new_values: { staff_id: input.staff_id, from_date: input.from_date, to_date: input.to_date, days: input.days },
  })
  return { id: data.id }
}

export async function updateLeaveRequest(
  id: string,
  updates: { status?: string; remarks?: string; approved_by?: string; approval_date?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('leave_requests').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: error.message }
  // Log approve / reject distinctly
  const action = updates.status === 'approved' ? 'approve'
               : updates.status === 'rejected' ? 'reject'
               : 'update'
  await createAuditLog({ action, entity_type: 'leave_request', entity_id: id, new_values: updates })
  return {}
}

export async function deleteLeaveRequest(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('leave_requests').delete().eq('id', id)
  if (error) return { error: error.message }
  await createAuditLog({ action: 'delete', entity_type: 'leave_request', entity_id: id })
  return {}
}

// ── Attendance ────────────────────────────────────────────────────────────────

export async function getAttendance(filters?: {
  staffId?: string; date?: string; month?: string; year?: string
}): Promise<AttendanceRecord[]> {
  const supabase = await createClient()
  let q = (supabase as any)
    .from('attendance')
    .select('*, staff:staff_id(full_name,staff_id)')
    .order('date', { ascending: false }).order('created_at', { ascending: false })
  if (filters?.staffId) q = q.eq('staff_id', filters.staffId)
  if (filters?.date)    q = q.eq('date', filters.date)
  if (filters?.month && filters?.year) {
    const start = `${filters.year}-${filters.month.padStart(2,'0')}-01`
    const end   = `${filters.year}-${filters.month.padStart(2,'0')}-31`
    q = q.gte('date', start).lte('date', end)
  }
  const { data } = await q
  return (data || []) as AttendanceRecord[]
}

export async function upsertAttendance(records: {
  staff_id: string; date: string; status: string; check_in?: string; check_out?: string; notes?: string
}[]): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('attendance')
    .upsert(records, { onConflict: 'staff_id,date' })
  if (error) return { error: error.message }
  return {}
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getLeaveStats(): Promise<{
  total: number; pending: number; approvedThisMonth: number; onLeaveToday: number
}> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const monthStart = today.slice(0, 7) + '-01'

  const [all, pending, approvedMonth, onToday] = await Promise.all([
    (supabase as any).from('leave_requests').select('id', { count: 'exact', head: true }),
    (supabase as any).from('leave_requests').select('id', { count: 'exact', head: true }).eq('status','pending'),
    (supabase as any).from('leave_requests').select('id', { count: 'exact', head: true })
      .eq('status','approved').gte('from_date', monthStart),
    (supabase as any).from('leave_requests').select('id', { count: 'exact', head: true })
      .eq('status','approved').lte('from_date', today).gte('to_date', today),
  ])

  return {
    total:             all.count   || 0,
    pending:           pending.count || 0,
    approvedThisMonth: approvedMonth.count || 0,
    onLeaveToday:      onToday.count || 0,
  }
}

export async function getStaffForLeave(): Promise<
  Array<{ id: string; staff_id: string; full_name: string }>
> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('staff').select('id, staff_id, full_name')
    .eq('status','active').order('full_name')
  return (data || []) as Array<{ id: string; staff_id: string; full_name: string }>
}
