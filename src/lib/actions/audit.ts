'use server'

import { createClient } from '@/lib/supabase/server'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  actor?: { id: string; full_name: string | null } | null
}

export interface CreateAuditLogInput {
  action: string
  entity_type: string
  entity_id?: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
}

// ── Write ──────────────────────────────────────────────────────────────────────

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await (supabase as any).from('audit_logs').insert({
      user_id: user?.id ?? null,
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id ?? null,
      old_values: input.old_values ?? null,
      new_values: input.new_values ?? null,
    })
  } catch {
    // Audit log failures must never break the main operation
  }
}

// ── Read ───────────────────────────────────────────────────────────────────────

export async function getAuditLogs(filters?: {
  action?: string
  entityType?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
  offset?: number
}): Promise<AuditLog[]> {
  const supabase = await createClient()
  const limit = filters?.limit ?? 100

  let q = (supabase as any)
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (filters?.action)     q = q.eq('action', filters.action)
  if (filters?.entityType) q = q.eq('entity_type', filters.entityType)
  if (filters?.dateFrom)   q = q.gte('created_at', filters.dateFrom)
  if (filters?.dateTo)     q = q.lte('created_at', filters.dateTo + 'T23:59:59')
  if (filters?.offset)     q = q.range(filters.offset, filters.offset + limit - 1)

  const { data } = await q
  const logs: AuditLog[] = (data || []) as AuditLog[]

  // Enrich with actor names from profiles
  const userIds = [...new Set(logs.filter(l => l.user_id).map(l => l.user_id!))]
  if (userIds.length > 0) {
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)
    const map: Record<string, { id: string; full_name: string | null }> =
      Object.fromEntries((profiles || []).map((p: any) => [p.id, p]))
    return logs.map(l => ({ ...l, actor: l.user_id ? (map[l.user_id] ?? null) : null }))
  }
  return logs
}

// ── Stats ──────────────────────────────────────────────────────────────────────

export async function getAuditStats(): Promise<{
  total: number
  today: number
  staffChanges: number
  leaveActions: number
}> {
  const supabase = await createClient()
  const todayStart = new Date().toISOString().split('T')[0]

  const [all, today, staff, leave] = await Promise.all([
    (supabase as any).from('audit_logs').select('id', { count: 'exact', head: true }),
    (supabase as any).from('audit_logs').select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart),
    (supabase as any).from('audit_logs').select('id', { count: 'exact', head: true })
      .eq('entity_type', 'staff'),
    (supabase as any).from('audit_logs').select('id', { count: 'exact', head: true })
      .eq('entity_type', 'leave_request'),
  ])

  return {
    total:        all.count   ?? 0,
    today:        today.count ?? 0,
    staffChanges: staff.count ?? 0,
    leaveActions: leave.count ?? 0,
  }
}
