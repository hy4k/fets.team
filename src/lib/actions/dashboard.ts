'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Types ─────────────────────────────────────────────────────
export interface DashboardStats {
  totalStaff: number
  activeStaff: number
  docsThisMonth: number
  pendingLeave: number
  certsExpiring: number
  pendingApprovals: number
}

export interface CentreSummary {
  id: string
  name: string
  city: string
  totalStaff: number
  activeStaff: number
}

export interface RecentStaffMember {
  id: string
  staff_id: string
  full_name: string
  designation_text: string | null
  status: string
}

export interface RecentActivity {
  id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  created_at: string
  details: Record<string, unknown> | null
}

// ─── Main stats ─────────────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    staffResult,
    activeResult,
    docsResult,
    leaveResult,
    certsResult,
    approvalsResult,
  ] = await Promise.all([
    supabase.from('staff').select('id', { count: 'exact', head: true }),
    supabase.from('staff').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase
      .from('generated_documents')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', firstOfMonth),
    supabase
      .from('leave_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('certifications')
      .select('id', { count: 'exact', head: true })
      .lte('expiry_date', in30Days)
      .gte('expiry_date', now.toISOString().split('T')[0])
      .eq('status', 'active'),
    supabase
      .from('generated_documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted'),
  ])

  return {
    totalStaff: staffResult.count ?? 0,
    activeStaff: activeResult.count ?? 0,
    docsThisMonth: docsResult.count ?? 0,
    pendingLeave: leaveResult.count ?? 0,
    certsExpiring: certsResult.count ?? 0,
    pendingApprovals: approvalsResult.count ?? 0,
  }
}

// ─── Centres with staff counts ──────────────────────────────────
export async function getCentresSummary(): Promise<CentreSummary[]> {
  const supabase = await createClient()

  const { data: centres, error } = await supabase
    .from('centres')
    .select('id, name, city')
    .order('name', { ascending: true })

  if (error || !centres) return []

  const results: CentreSummary[] = await Promise.all(
    centres.map(async (centre) => {
      const [total, active] = await Promise.all([
        supabase
          .from('staff')
          .select('id', { count: 'exact', head: true })
          .eq('centre_id', centre.id),
        supabase
          .from('staff')
          .select('id', { count: 'exact', head: true })
          .eq('centre_id', centre.id)
          .eq('status', 'active'),
      ])
      return {
        id: centre.id,
        name: centre.name,
        city: centre.city,
        totalStaff: total.count ?? 0,
        activeStaff: active.count ?? 0,
      }
    })
  )

  return results
}

// ─── Recent staff (last 6 by joining date) ──────────────────────
export async function getRecentStaff(): Promise<RecentStaffMember[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('staff')
    .select('id, staff_id, full_name, designation_text, status')
    .order('date_of_joining', { ascending: false })
    .limit(6)

  if (error || !data) return []
  return data as RecentStaffMember[]
}

// ─── Recent audit activity ───────────────────────────────────────
export async function getRecentActivity(): Promise<RecentActivity[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, created_at, details')
    .order('created_at', { ascending: false })
    .limit(8)

  if (error || !data) return []
  return data as RecentActivity[]
}
