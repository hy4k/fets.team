'use server'

import { createClient } from '@/lib/supabase/server'
import { createAuditLog } from '@/lib/actions/audit'

// ── Admin Settings (key-value store) ─────────────────────────────────────────

export async function getAdminSettings(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data } = await (supabase as any).from('admin_settings').select('key, value')
  if (!data) return {}
  return Object.fromEntries(data.map((r: any) => [r.key, r.value ?? '']))
}

export async function upsertAdminSettings(
  updates: Record<string, string>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const rows = Object.entries(updates).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }))
    const { error } = await (supabase as any)
      .from('admin_settings')
      .upsert(rows, { onConflict: 'key' })
    if (error) return { ok: false, error: error.message }
    await createAuditLog({ action: 'update', entity_type: 'admin_settings', entity_id: 'global', new_values: updates })
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e.message } }
}

// ── Leave Types ────────────────────────────────────────────────────────────────

export interface LeaveTypeInput { name: string; days_per_year: number; is_paid: boolean }

export async function getLeaveTypes() {
  const supabase = await createClient()
  const { data } = await (supabase as any).from('leave_types').select('*').order('name')
  return data ?? []
}

export async function createLeaveType(input: LeaveTypeInput): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase as any)
      .from('leave_types').insert(input).select('id').single()
    if (error) return { error: error.message }
    await createAuditLog({ action: 'create', entity_type: 'leave_type', entity_id: data.id, new_values: input as Record<string, unknown> })
    return { id: data.id }
  } catch (e: any) { return { error: e.message } }
}

export async function updateLeaveType(id: string, input: LeaveTypeInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase as any).from('leave_types').update(input).eq('id', id)
    if (error) return { ok: false, error: error.message }
    await createAuditLog({ action: 'update', entity_type: 'leave_type', entity_id: id, new_values: input as Record<string, unknown> })
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e.message } }
}

export async function deleteLeaveType(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase as any).from('leave_types').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    await createAuditLog({ action: 'delete', entity_type: 'leave_type', entity_id: id })
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e.message } }
}

// ── Centres ────────────────────────────────────────────────────────────────────

export interface CentreInput { name: string; city: string; address?: string; phone?: string; email?: string }

export async function getCentres() {
  const supabase = await createClient()
  const { data } = await (supabase as any).from('centres').select('*').order('name')
  return data ?? []
}

export async function createCentre(input: CentreInput): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase as any).from('centres').insert(input).select('id').single()
    if (error) return { error: error.message }
    await createAuditLog({ action: 'create', entity_type: 'centre', entity_id: data.id, new_values: input as Record<string, unknown> })
    return { id: data.id }
  } catch (e: any) { return { error: e.message } }
}

export async function updateCentre(id: string, input: CentreInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase as any).from('centres').update(input).eq('id', id)
    if (error) return { ok: false, error: error.message }
    await createAuditLog({ action: 'update', entity_type: 'centre', entity_id: id, new_values: input as Record<string, unknown> })
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e.message } }
}

// ── User Account Linking ───────────────────────────────────────────────────────

export async function getStaffForLinking() {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('staff')
    .select('id, staff_id, full_name, user_id, designation_text, centre:centre_id(name), status')
    .order('full_name')
  return data ?? []
}

export async function linkStaffToUser(
  staffId: string, email: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase as any)
      .rpc('link_staff_to_auth_user', { p_staff_id: staffId, p_email: email })
    if (error) return { ok: false, error: error.message }
    if (data?.error) return { ok: false, error: data.error }
    await createAuditLog({ action: 'update', entity_type: 'staff', entity_id: staffId, new_values: { linked_email: email } })
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e.message } }
}

export async function unlinkStaffUser(staffId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await (supabase as any)
      .from('staff').update({ user_id: null }).eq('id', staffId)
    if (error) return { ok: false, error: error.message }
    await createAuditLog({ action: 'update', entity_type: 'staff', entity_id: staffId, new_values: { user_id: null } })
    return { ok: true }
  } catch (e: any) { return { ok: false, error: e.message } }
}
