'use server'

import { createClient } from '@/lib/supabase/server'

export interface CertificationType {
  id: string
  name: string
  issuing_body: string | null
  category: string | null
  is_active: boolean
  created_at: string
}

export interface StaffCertification {
  id: string
  staff_id: string
  certification_id: string
  status: string
  taken_date: string | null
  expiry_date: string | null
  certificate_url: string | null
  remarks: string | null
  centre_id: string | null
  created_at: string
  updated_at: string
  staff?: { full_name: string; staff_id: string; centre?: { name: string } | null }
  certification?: { name: string; issuing_body: string | null; category: string | null }
}

export interface AssignCertInput {
  staff_id: string
  certification_id: string
  status?: string
  taken_date?: string
  expiry_date?: string
  certificate_url?: string
  remarks?: string
  centre_id?: string
}

export async function getCertificationTypes(activeOnly = false): Promise<CertificationType[]> {
  const supabase = await createClient()
  let q = (supabase as any).from('certifications').select('*').order('name')
  if (activeOnly) q = q.eq('is_active', true)
  const { data } = await q
  return (data || []) as CertificationType[]
}

export async function createCertificationType(input: {
  name: string
  issuing_body?: string
  category?: string
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('certifications').insert(input).select('id').single()
  if (error) return { error: error.message }
  return { id: data.id }
}

export async function updateCertificationType(
  id: string,
  updates: { name?: string; issuing_body?: string; category?: string; is_active?: boolean }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('certifications').update(updates).eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function getStaffCertifications(filters?: {
  staffId?: string
  certificationId?: string
  status?: string
  expiringDays?: number
}): Promise<StaffCertification[]> {
  const supabase = await createClient()
  let q = (supabase as any)
    .from('staff_certifications')
    .select(`*, staff:staff_id(full_name, staff_id, centre:centre_id(name)),
      certification:certification_id(name, issuing_body, category)`)
    .order('updated_at', { ascending: false })

  if (filters?.staffId) q = q.eq('staff_id', filters.staffId)
  if (filters?.certificationId) q = q.eq('certification_id', filters.certificationId)
  if (filters?.status) q = q.eq('status', filters.status)
  if (filters?.expiringDays) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + filters.expiringDays)
    const today = new Date().toISOString().slice(0, 10)
    q = q.lte('expiry_date', cutoff.toISOString().slice(0, 10)).gte('expiry_date', today)
  }

  const { data, error } = await q
  if (error) { console.error('getStaffCertifications:', error); return [] }
  return (data || []) as StaffCertification[]
}

export async function assignCertification(input: AssignCertInput): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data, error } = await (supabase as any)
    .from('staff_certifications')
    .insert({ ...input, status: input.status || 'not_started' })
    .select('id').single()
  if (error) return { error: error.message }
  return { id: data.id }
}

export async function updateStaffCertification(
  id: string,
  updates: Partial<AssignCertInput> & { status?: string }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('staff_certifications')
    .update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function removeStaffCertification(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any).from('staff_certifications').delete().eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function getStaffForCerts(): Promise<Array<{ id: string; staff_id: string; full_name: string }>> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('staff').select('id, staff_id, full_name').eq('status', 'active').order('full_name')
  return data || []
}

export async function getCertStats(): Promise<{
  total: number; passed: number; expiringIn30Days: number; expired: number
}> {
  const supabase = await createClient()
  const { data } = await (supabase as any).from('staff_certifications').select('status, expiry_date')
  const today = new Date().toISOString().slice(0, 10)
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const rows = (data || []) as Array<{ status: string; expiry_date: string | null }>
  return {
    total: rows.length,
    passed: rows.filter(r => r.status === 'passed').length,
    expiringIn30Days: rows.filter(r => r.expiry_date && r.expiry_date >= today && r.expiry_date <= in30).length,
    expired: rows.filter(r => r.expiry_date && r.expiry_date < today && r.status !== 'renewed').length,
  }
}
