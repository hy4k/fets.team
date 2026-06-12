'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Shield, Search, Filter, Clock, Users, Calendar,
  ChevronDown, ChevronUp, RefreshCw, Activity,
  CheckCircle, XCircle, Plus, Trash2, Edit3, LogIn,
} from 'lucide-react'
import {
  getAuditLogs, getAuditStats,
  type AuditLog,
} from '@/lib/actions/audit'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Action Badge ───────────────────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  create:  { label: 'Create',  color: '#34D399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(52,211,153,0.25)',  icon: Plus },
  update:  { label: 'Update',  color: '#38BDF8', bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.25)',  icon: Edit3 },
  approve: { label: 'Approve', color: '#34D399', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(52,211,153,0.3)',   icon: CheckCircle },
  reject:  { label: 'Reject',  color: '#FB7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.25)', icon: XCircle },
  delete:  { label: 'Delete',  color: '#FB7185', bg: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.25)',   icon: Trash2 },
  login:   { label: 'Login',   color: '#5EEAD4', bg: 'rgba(226,194,133,0.12)', border: 'rgba(226,194,133,0.25)',  icon: LogIn },
}
const DEFAULT_ACTION_META = {
  label: '—', color: '#A9B5A9', bg: 'rgba(90,86,122,0.12)', border: 'rgba(90,86,122,0.2)', icon: Activity,
}

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_META[action.toLowerCase()] ?? DEFAULT_ACTION_META
  const Icon = meta.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.28rem 0.65rem', borderRadius: '8px',
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em',
      color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
      whiteSpace: 'nowrap',
    }}>
      <Icon size={11} />
      {meta.label}
    </span>
  )
}

// ── Entity Type Pill ───────────────────────────────────────────────────────────

const ENTITY_META: Record<string, { label: string; color: string }> = {
  staff:         { label: 'Staff',         color: '#5EEAD4' },
  leave_request: { label: 'Leave',         color: '#FBBF24' },
  leave_type:    { label: 'Leave Type',    color: '#60A5FA' },
  attendance:    { label: 'Attendance',    color: '#34D399' },
  certification: { label: 'Certification', color: '#E2C285' },
  document:      { label: 'Document',      color: '#38BDF8' },
  payroll:       { label: 'Payroll',       color: '#FB7185' },
}

function EntityPill({ type }: { type: string }) {
  const meta = ENTITY_META[type] ?? { label: type, color: '#A9B5A9' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.55rem', borderRadius: '6px',
      fontSize: '0.7rem', fontWeight: 600,
      color: meta.color,
      background: `${meta.color}18`,
      border: `1px solid ${meta.color}30`,
    }}>
      {meta.label}
    </span>
  )
}

// ── JSON Diff Viewer ───────────────────────────────────────────────────────────

function JsonDiff({ old_values, new_values }: {
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
}) {
  if (!old_values && !new_values) return null
  const keys = Array.from(new Set([
    ...Object.keys(old_values ?? {}),
    ...Object.keys(new_values ?? {}),
  ]))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
      {old_values && (
        <div style={{ borderRadius: '10px', padding: '0.75rem', background: 'rgba(251,113,133,0.06)', border: '1px solid rgba(251,113,133,0.15)' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#FB7185', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Before</p>
          {keys.map(k => old_values[k] !== undefined ? (
            <div key={k} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: '80px' }}>{k}</span>
              <span style={{ fontSize: '0.72rem', color: '#FB7185' }}>{String(old_values[k])}</span>
            </div>
          ) : null)}
        </div>
      )}
      {new_values && (
        <div style={{ borderRadius: '10px', padding: '0.75rem', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#34D399', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>After</p>
          {keys.map(k => new_values[k] !== undefined ? (
            <div key={k} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: '80px' }}>{k}</span>
              <span style={{ fontSize: '0.72rem', color: '#34D399' }}>{String(new_values[k])}</span>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const ACTIONS    = ['create', 'update', 'approve', 'reject', 'delete', 'login']
const ENTITY_TYPES = ['staff', 'leave_request', 'leave_type', 'attendance', 'certification', 'document', 'payroll']

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState({ total: 0, today: 0, staffChanges: 0, leaveActions: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [logsData, statsData] = await Promise.all([
      getAuditLogs({
        action:     filterAction || undefined,
        entityType: filterEntity || undefined,
        dateFrom:   dateFrom || undefined,
        dateTo:     dateTo || undefined,
        limit: 200,
      }),
      getAuditStats(),
    ])
    setLogs(logsData)
    setStats(statsData)
    setLoading(false)
  }, [filterAction, filterEntity, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const filtered = logs.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      l.action.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      (l.entity_id || '').toLowerCase().includes(q) ||
      (l.actor?.full_name || '').toLowerCase().includes(q)
    )
  })

  const statCards = [
    { label: 'Total Events',   value: stats.total,        cls: 'card-clay-violet', icon: Activity,  color: '#5EEAD4' },
    { label: "Today's Events", value: stats.today,        cls: 'card-clay-sky',    icon: Clock,     color: '#38BDF8' },
    { label: 'Staff Changes',  value: stats.staffChanges, cls: 'card-clay-gold',   icon: Users,     color: '#FBBF24' },
    { label: 'Leave Actions',  value: stats.leaveActions, cls: 'card-clay-emerald',icon: Calendar,  color: '#34D399' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem' }}>

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.8rem', borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(201,163,92,0.2), rgba(168,127,61,0.1))',
            border: '1px solid rgba(201,163,92,0.2)' }}>
            <Shield size={22} color="#5EEAD4" />
          </div>
          <div>
            <h1 className="text-gradient-violet" style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.2rem' }}>
              Audit Log
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Full trail of all system actions — approvals, changes, and events
            </p>
          </div>
        </div>
        <button className="btn-clay-ghost" onClick={load} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.1rem', cursor: 'pointer', fontSize: '0.85rem' }}>
          <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-neuro" style={{ height: '7rem', borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }} />
          ))
        ) : statCards.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className={s.cls} style={{ padding: '1.5rem 1.75rem', borderRadius: '18px', cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.76rem', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    {s.label}
                  </p>
                  <p style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>{s.value}</p>
                </div>
                <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(255,255,255,0.08)' }}>
                  <Icon size={22} color={s.color} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter / Search Bar */}
      <div className="card-neuro" style={{ borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-premium" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search action, entity, actor…"
              style={{ paddingLeft: '2.4rem', width: '100%', boxSizing: 'border-box' }} />
          </div>
          <select className="select-premium" value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ minWidth: '130px' }}>
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
          </select>
          <select className="select-premium" value={filterEntity} onChange={e => setFilterEntity(e.target.value)} style={{ minWidth: '150px' }}>
            <option value="">All Entities</option>
            {ENTITY_TYPES.map(e => <option key={e} value={e}>{ENTITY_META[e]?.label ?? e}</option>)}
          </select>
          <button className="btn-clay-ghost"
            onClick={() => setShowFilters(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.82rem' }}>
            <Filter size={13} /> Date {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {(filterAction || filterEntity || dateFrom || dateTo) && (
            <button className="btn-clay-danger"
              onClick={() => { setFilterAction(''); setFilterEntity(''); setDateFrom(''); setDateTo('') }}
              style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.82rem' }}>
              Clear
            </button>
          )}
        </div>
        {showFilters && (
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', alignItems: 'center' }}>
            <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>From</label>
            <input type="date" className="input-premium" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '160px' }} />
            <label style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>To</label>
            <input type="date" className="input-premium" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '160px' }} />
          </div>
        )}
      </div>

      {/* Log Table */}
      <div className="card-neuro animate-in" style={{ borderRadius: '20px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1.2s linear infinite', opacity: 0.4, marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.9rem' }}>Loading audit trail…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '5rem', textAlign: 'center' }}>
            <Shield size={44} style={{ color: 'var(--text-muted)', opacity: 0.25, marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No audit events match your filters</p>
          </div>
        ) : (
          <>
            <table className="table-premium" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Actor</th>
                  <th>Changes</th>
                  <th style={{ width: '160px' }}>Time</th>
                  <th style={{ width: '48px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const expanded = expandedId === log.id
                  const hasDiff = !!(log.old_values || log.new_values)
                  return (
                    <>
                      <tr key={log.id} style={{ cursor: hasDiff ? 'pointer' : 'default' }}
                        onClick={() => hasDiff && setExpandedId(expanded ? null : log.id)}>
                        <td><ActionBadge action={log.action} /></td>
                        <td><EntityPill type={log.entity_type} /></td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)',
                            background: 'rgba(255,255,255,0.04)', padding: '0.2rem 0.45rem', borderRadius: '5px' }}>
                            {log.entity_id ? log.entity_id.slice(0, 12) + '…' : '—'}
                          </span>
                        </td>
                        <td>
                          {log.actor?.full_name ? (
                            <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.85rem' }}>{log.actor.full_name}</span>
                          ) : log.user_id ? (
                            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.user_id.slice(0, 8)}…</span>
                          ) : (
                            <span style={{ color: 'var(--text-ghost)', fontSize: '0.8rem' }}>System</span>
                          )}
                        </td>
                        <td>
                          {hasDiff ? (
                            <span style={{ fontSize: '0.78rem', color: 'var(--aurora-400)',
                              background: 'rgba(201,163,92,0.08)', padding: '0.2rem 0.55rem', borderRadius: '6px',
                              border: '1px solid rgba(201,163,92,0.15)' }}>
                              {log.old_values && log.new_values ? 'Modified' : log.new_values ? 'Created' : 'Removed'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-ghost)', fontSize: '0.78rem' }}>—</span>
                          )}
                        </td>
                        <td>
                          <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{timeAgo(log.created_at)}</p>
                            <p style={{ color: 'var(--text-ghost)', fontSize: '0.7rem', marginTop: '0.1rem' }}>{fmtTime(log.created_at)}</p>
                          </div>
                        </td>
                        <td>
                          {hasDiff && (
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                              padding: '0.25rem', borderRadius: '6px', transition: 'color 0.15s' }}
                              onClick={e => { e.stopPropagation(); setExpandedId(expanded ? null : log.id) }}>
                              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expanded && hasDiff && (
                        <tr key={log.id + '-expanded'}>
                          <td colSpan={7} style={{ padding: '0 1.25rem 1rem', background: 'rgba(201,163,92,0.03)' }}>
                            <JsonDiff old_values={log.old_values} new_values={log.new_values} />
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>

            <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <span>Showing {filtered.length} of {logs.length} events</span>
              <span style={{ color: 'var(--text-ghost)' }}>Logs are immutable — read only</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
