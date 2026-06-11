'use server'

import { getFetsLiveClient } from '@/lib/fets-live'
import { revalidatePath } from 'next/cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveStaffProfile {
  id: string
  user_id: string
  full_name: string
  role: string | null
  branch_assigned: string | null
  is_active: boolean | null
  hourly_rate: number | null
  daily_rate: number | null
}

export interface RosterSchedule {
  id: string
  profile_id: string
  date: string
  shift_code: string
  overtime_hours: number | null
  status: string | null
  branch_location: string | null
  staff: Pick<LiveStaffProfile, 'id' | 'full_name' | 'role' | 'branch_assigned'> | null
}

export interface AttendanceRecord {
  id: string
  staff_id: string   // references staff_profiles.id
  staff_name: string | null
  date: string
  check_in: string | null
  check_out: string | null
  status: 'present' | 'absent' | 'late' | 'half_day'
  notes: string | null
  branch_location: string | null
  created_at: string | null
}

export interface OTClaim {
  id: string
  profile_id: string
  date: string
  ot_hours: number
  toil_payout: boolean
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
  start_time: string | null
  end_time: string | null
  created_at: string | null
  staff: Pick<LiveStaffProfile, 'id' | 'full_name' | 'role' | 'branch_assigned'> | null
}

export interface LeaveRequest {
  id: string
  user_id: string      // references auth.users (= staff_profiles.user_id)
  request_type: 'leave' | 'shift_swap' | 'toil'
  requested_date: string
  swap_with_user_id: string | null
  swap_date: string | null
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  approved_at: string | null
  created_at: string | null
  requestor: Pick<LiveStaffProfile, 'full_name' | 'branch_assigned'> | null
  target: Pick<LiveStaffProfile, 'full_name'> | null
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function monthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

// ─── Fetch functions ──────────────────────────────────────────────────────────

export async function getLiveStaffProfiles(): Promise<LiveStaffProfile[]> {
  const db = getFetsLiveClient()
  const { data, error } = await db
    .from('staff_profiles')
    .select('id, user_id, full_name, role, branch_assigned, is_active, hourly_rate, daily_rate')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('[roster] getLiveStaffProfiles:', error.message)
    return []
  }
  return (data ?? []) as LiveStaffProfile[]
}

export async function getRosterSchedules(
  year: number,
  month: number,
): Promise<RosterSchedule[]> {
  const db = getFetsLiveClient()
  const { start, end } = monthRange(year, month)

  const { data, error } = await db
    .from('roster_schedules')
    .select(`
      id, profile_id, date, shift_code, overtime_hours, status, branch_location,
      staff:staff_profiles!roster_schedules_profile_id_fkey(id, full_name, role, branch_assigned)
    `)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })

  if (error) {
    console.error('[roster] getRosterSchedules:', error.message)
    return []
  }
  return (data ?? []) as RosterSchedule[]
}

export async function getAttendanceRecords(
  year: number,
  month: number,
): Promise<AttendanceRecord[]> {
  const db = getFetsLiveClient()
  const { start, end } = monthRange(year, month)

  const { data, error } = await db
    .from('staff_attendance')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })

  if (error) {
    console.error('[roster] getAttendanceRecords:', error.message)
    return []
  }
  return (data ?? []) as AttendanceRecord[]
}

export async function getOTClaims(
  year: number,
  month: number,
): Promise<OTClaim[]> {
  const db = getFetsLiveClient()
  const { start, end } = monthRange(year, month)

  const { data, error } = await db
    .from('staff_ot_claims')
    .select(`
      id, profile_id, date, ot_hours, toil_payout, status, notes,
      start_time, end_time, created_at,
      staff:staff_profiles!staff_ot_claims_profile_id_fkey(id, full_name, role, branch_assigned)
    `)
    .gte('date', start)
    .lte('date', end)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[roster] getOTClaims:', error.message)
    return []
  }
  return (data ?? []) as OTClaim[]
}

export async function getLeaveRequests(
  year: number,
  month: number,
): Promise<LeaveRequest[]> {
  const db = getFetsLiveClient()
  const { start, end } = monthRange(year, month)

  const { data, error } = await db
    .from('leave_requests')
    .select(`
      id, user_id, request_type, requested_date, swap_with_user_id, swap_date,
      reason, status, approved_by, approved_at, created_at,
      requestor:staff_profiles!leave_requests_user_id_fkey(full_name, branch_assigned),
      target:staff_profiles!leave_requests_swap_with_user_id_fkey(full_name)
    `)
    .gte('requested_date', start)
    .lte('requested_date', end)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[roster] getLeaveRequests:', error.message)
    return []
  }
  return (data ?? []) as LeaveRequest[]
}

// ─── Mutations (write back to fets.live) ─────────────────────────────────────

export async function approveLeaveRequest(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = getFetsLiveClient()

  const { error } = await db
    .from('leave_requests')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/roster')
  return { ok: true }
}

export async function rejectLeaveRequest(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = getFetsLiveClient()

  const { error } = await db
    .from('leave_requests')
    .update({ status: 'rejected', approved_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/roster')
  return { ok: true }
}

export async function approveOTClaim(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = getFetsLiveClient()

  const { error } = await db
    .from('staff_ot_claims')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/roster')
  return { ok: true }
}

export async function rejectOTClaim(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const db = getFetsLiveClient()

  const { error } = await db
    .from('staff_ot_claims')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/roster')
  return { ok: true }
}
