'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Plus, Search, Check, X, Clock, Trash2,
  ChevronLeft, ChevronRight, Users, FileText, CheckCircle,
  AlertCircle, Loader2, CalendarDays, UserCheck,
  RefreshCw, Save, ListFilter,
} from 'lucide-react'
import {
  getLeaveTypes, createLeaveType, updateLeaveType,
  getLeaveRequests, applyLeave, updateLeaveRequest, deleteLeaveRequest,
  getAttendance, upsertAttendance, getLeaveStats, getStaffForLeave,
  type LeaveType, type LeaveRequest, type AttendanceRecord,
} from '@/lib/actions/leave'
import {
  LEAVE_STATUSES, LEAVE_STATUS_LABELS,
  ATTENDANCE_STATUSES, ATTENDANCE_LABELS,
} from '@/lib/utils/leave'
import { cn } from '@/lib/utils'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function calcDays(from: string, to: string): number {
  if (!from || !to) return 0
  const diff = new Date(to).getTime() - new Date(from).getTime()
  return Math.max(1, Math.round(diff / 86400000) + 1)
}

function todayStr() { return new Date().toISOString().split('T')[0] }

function LeaveStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('badge',
      status === 'pending' ? 'badge-pending' :
      status === 'approved' ? 'badge-approved' : 'badge-rejected'
    )}>
      {status === 'pending' && <Clock className="w-3 h-3" />}
      {status === 'approved' && <Check className="w-3 h-3" />}
      {status === 'rejected' && <X className="w-3 h-3" />}
      {LEAVE_STATUS_LABELS[status] || status}
    </span>
  )
}

function AttendanceBadge({ status }: { status: string }) {
  const cls = {
    present: 'badge-present', absent: 'badge-absent',
    late: 'badge-late', half_day: 'badge-half-day', holiday: 'badge-holiday',
  }[status] || 'badge-present'
  return <span className={cn('badge', cls)}>{ATTENDANCE_LABELS[status] || status}</span>
}

// ── Apply Leave Modal ──────────────────────────────────────────────────────────

interface ApplyModalProps {
  staffList: Array<{ id: string; staff_id: string; full_name: string }>
  leaveTypes: LeaveType[]
  onClose: () => void
  onSuccess: () => void
}

function ApplyLeaveModal({ staffList, leaveTypes, onClose, onSuccess }: ApplyModalProps) {
  const [staffId, setStaffId] = useState('')
  const [typeId, setTypeId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const days = calcDays(fromDate, toDate)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffId || !typeId || !fromDate || !toDate) { setError('All required fields must be filled.'); return }
    if (new Date(toDate) < new Date(fromDate)) { setError('To date cannot be before from date.'); return }
    setError(''); setSaving(true)
    const result = await applyLeave({ staff_id: staffId, leave_type_id: typeId, from_date: fromDate, to_date: toDate, days, reason: reason || undefined })
    setSaving(false)
    if ('error' in result) { setError(result.error); return }
    onSuccess()
  }

  return (
    <div className="modal-backdrop animate-in">
      <div className="modal-panel" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#5EEAD4,#0D9488)', boxShadow: '0 4px 16px rgba(168,127,61,0.45)' }}>
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-[15px]">Apply for Leave</h2>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Submit a leave request</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-white/5"
            style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Staff Member <span className="text-red-400">*</span>
              </label>
              <select value={staffId} onChange={e => setStaffId(e.target.value)} className="select-premium w-full" required>
                <option value="">Select staff…</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.staff_id})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Leave Type <span className="text-red-400">*</span>
              </label>
              <select value={typeId} onChange={e => setTypeId(e.target.value)} className="select-premium w-full" required>
                <option value="">Select type…</option>
                {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.is_paid ? 'Paid' : 'Unpaid'})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                From <span className="text-red-400">*</span>
              </label>
              <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); if (!toDate) setToDate(e.target.value) }}
                className="input-premium" required />
            </div>
            <div>
              <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                To <span className="text-red-400">*</span>
              </label>
              <input type="date" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)}
                className="input-premium" required />
            </div>
          </div>
          {fromDate && toDate && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ background: 'rgba(201,163,92,0.1)', border: '1px solid rgba(201,163,92,0.2)' }}>
              <CalendarDays className="w-4 h-4" style={{ color: 'var(--aurora-400)' }} />
              <span className="text-sm font-medium text-white">{days} day{days !== 1 ? 's' : ''}</span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>requested</span>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Reason
            </label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Optional reason for the leave request…"
              className="input-premium resize-none" />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#FB7185' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-clay btn-clay-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-clay btn-clay-violet flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Approve/Reject Modal ───────────────────────────────────────────────────────

function ReviewModal({ req, onClose, onSuccess }: { req: LeaveRequest; onClose: () => void; onSuccess: () => void }) {
  const [action, setAction] = useState<'approved' | 'rejected'>('approved')
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await updateLeaveRequest(req.id, {
      status: action, remarks: remarks || undefined,
      approval_date: new Date().toISOString(),
    })
    setSaving(false)
    onSuccess()
  }

  return (
    <div className="modal-backdrop animate-in">
      <div className="modal-panel" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2 className="text-white font-semibold text-[15px]">Review Leave Request</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-soft)' }}>
            <p className="font-semibold text-white">{req.staff?.full_name}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{req.leave_type?.name} — {req.days} day{req.days !== 1 ? 's' : ''}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{fmtDate(req.from_date)} → {fmtDate(req.to_date)}</p>
            {req.reason && <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>"{req.reason}"</p>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(['approved', 'rejected'] as const).map(a => (
                <button key={a} type="button" onClick={() => setAction(a)}
                  className={cn('py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                    action === a ? 'text-white' : 'text-[#66756A]'
                  )}
                  style={action === a ? {
                    background: a === 'approved'
                      ? 'linear-gradient(135deg,#34D399,#059669)'
                      : 'linear-gradient(135deg,#FB7185,#DC2626)',
                    boxShadow: a === 'approved'
                      ? '0 6px 20px rgba(5,150,105,0.4)'
                      : '0 6px 20px rgba(220,38,38,0.4)',
                    border: '1px solid transparent',
                  } : { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-soft)' }}>
                  {a === 'approved' ? '✓ Approve' : '✕ Reject'}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Remarks (optional)</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
                placeholder="Add a note for the staff member…" className="input-premium resize-none" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-clay btn-clay-ghost flex-1">Cancel</button>
              <button type="submit" disabled={saving}
                className={cn('btn-clay flex-1', action === 'approved' ? 'btn-clay-emerald' : 'btn-clay-danger')}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : `Confirm ${action === 'approved' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Add Leave Type Modal ───────────────────────────────────────────────────────

function AddLeaveTypeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [daysPerYear, setDaysPerYear] = useState(12)
  const [isPaid, setIsPaid] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) { setError('Name is required.'); return }
    setError(''); setSaving(true)
    const result = await createLeaveType({ name, days_per_year: daysPerYear, is_paid: isPaid })
    setSaving(false)
    if ('error' in result) { setError(result.error); return }
    onSuccess()
  }

  return (
    <div className="modal-backdrop animate-in">
      <div className="modal-panel" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2 className="text-white font-semibold text-[15px] flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: 'var(--aurora-400)' }} /> Add Leave Type
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Name <span className="text-red-400">*</span>
            </label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Casual Leave, Sick Leave…" className="input-premium" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Days / Year</label>
              <input type="number" min={0} max={365} value={daysPerYear}
                onChange={e => setDaysPerYear(+e.target.value)} className="input-premium" />
            </div>
            <div>
              <label className="block text-[11px] font-600 uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Type</label>
              <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                {[{ v: true, label: 'Paid' }, { v: false, label: 'Unpaid' }].map(opt => (
                  <button key={String(opt.v)} type="button" onClick={() => setIsPaid(opt.v)}
                    className={cn('py-2 rounded-xl text-xs font-semibold transition-all')}
                    style={isPaid === opt.v ? {
                      background: opt.v ? 'linear-gradient(135deg,#34D399,#059669)' : 'linear-gradient(135deg,#FB7185,#DC2626)',
                      color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      border: '1px solid transparent',
                    } : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border-soft)' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#FB7185' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-clay btn-clay-ghost flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-clay btn-clay-violet flex-1">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Add Leave Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function LeavePage() {
  const [tab, setTab] = useState<'requests' | 'attendance' | 'types'>('requests')
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [staffList, setStaffList] = useState<Array<{ id: string; staff_id: string; full_name: string }>>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approvedThisMonth: 0, onLeaveToday: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStaff, setFilterStaff] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(todayStr())
  const [showApply, setShowApply] = useState(false)
  const [reviewReq, setReviewReq] = useState<LeaveRequest | null>(null)
  const [showAddType, setShowAddType] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, string>>({})

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [reqs, attn, types, staff, statsData] = await Promise.all([
      getLeaveRequests({ staffId: filterStaff || undefined, status: filterStatus || undefined }),
      getAttendance({ date: attendanceDate }),
      getLeaveTypes(),
      getStaffForLeave(),
      getLeaveStats(),
    ])
    setRequests(reqs)
    setAttendance(attn)
    setLeaveTypes(types)
    setStaffList(staff)
    setStats(statsData)
    const draft: Record<string, string> = {}
    attn.forEach(a => { draft[a.staff_id] = a.status })
    setAttendanceDraft(draft)
    setLoading(false)
  }, [filterStaff, filterStatus, attendanceDate])

  useEffect(() => { load() }, [load])

  const handleDelete = async (r: LeaveRequest) => {
    if (!confirm(`Delete leave request for ${r.staff?.full_name}?`)) return
    setDeletingId(r.id)
    const result = await deleteLeaveRequest(r.id)
    setDeletingId(null)
    if (result.error) { showToast(result.error, false); return }
    showToast('Leave request deleted')
    load()
  }

  const handleSaveAttendance = async () => {
    setSavingAttendance(true)
    const records = staffList.map(s => ({
      staff_id: s.id, date: attendanceDate,
      status: attendanceDraft[s.id] || 'present',
    }))
    const result = await upsertAttendance(records)
    setSavingAttendance(false)
    if (result.error) { showToast(result.error, false); return }
    showToast('Attendance saved for ' + attendanceDate)
    load()
  }

  const filtered = requests.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.staff?.full_name.toLowerCase().includes(q) ||
           (r.staff?.staff_id || '').toLowerCase().includes(q) ||
           (r.leave_type?.name || '').toLowerCase().includes(q)
  })

  const statCards = [
    { label: 'Total Requests',   value: stats.total,             cls: 'card-clay-violet', icon: Calendar,    color: '#5EEAD4' },
    { label: 'Pending Approval', value: stats.pending,           cls: 'card-clay-amber',  icon: Clock,       color: '#FBBF24' },
    { label: 'Approved (Month)', value: stats.approvedThisMonth, cls: 'card-clay-emerald',icon: CheckCircle, color: '#34D399' },
    { label: 'On Leave Today',   value: stats.onLeaveToday,      cls: 'card-clay-sky',    icon: UserCheck,   color: '#38BDF8' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '2rem' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '0.85rem 1.5rem', borderRadius: '14px', fontWeight: 600, fontSize: '0.9rem',
          background: toast.ok
            ? 'linear-gradient(135deg, #065F46, #047857)'
            : 'linear-gradient(135deg, #7F1D1D, #991B1B)',
          color: '#fff',
          boxShadow: toast.ok
            ? '0 8px 24px rgba(5,150,105,0.45)'
            : '0 8px 24px rgba(220,38,38,0.45)',
          border: '1px solid rgba(255,255,255,0.12)',
          animation: 'slideIn 0.3s ease',
        }}>
          {toast.ok ? '✓ ' : '✗ '}{toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="text-gradient-violet" style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Leave & Attendance
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Manage staff leave requests, daily attendance, and leave type configuration
          </p>
        </div>
        <button className="btn-clay-violet" onClick={() => setShowApply(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem', cursor: 'pointer' }}>
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-neuro" style={{ padding: '1.5rem', borderRadius: '18px', height: '7rem',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }} />
          ))
        ) : statCards.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className={s.cls} style={{ padding: '1.5rem 1.75rem', borderRadius: '18px', cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    {s.label}
                  </p>
                  <p style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 800, lineHeight: 1 }}>
                    {s.value}
                  </p>
                </div>
                <div style={{ padding: '0.65rem', borderRadius: '12px', background: 'rgba(255,255,255,0.08)' }}>
                  <Icon size={22} color={s.color} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tab Switcher */}
      <div className="tabs-premium" style={{ marginBottom: '1.5rem' }}>
        {([
          { key: 'requests',   label: 'Leave Requests', icon: FileText },
          { key: 'attendance', label: 'Attendance',      icon: CalendarDays },
          { key: 'types',      label: 'Leave Types',     icon: ListFilter },
        ] as const).map(t => {
          const Icon = t.icon
          return (
            <button key={t.key}
              className={`tab-item${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Leave Requests Tab ─────────────────────────────────────────────── */}
      {tab === 'requests' && (
        <div className="card-neuro animate-in" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input-premium" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search staff, leave type…"
                style={{ paddingLeft: '2.4rem', width: '100%', boxSizing: 'border-box' }} />
            </div>
            <select className="select-premium" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {LEAVE_STATUSES.map(s => <option key={s} value={s}>{LEAVE_STATUS_LABELS[s]}</option>)}
            </select>
            <select className="select-premium" value={filterStaff} onChange={e => setFilterStaff(e.target.value)}>
              <option value="">All Staff</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading requests…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.4 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No leave requests found</p>
            </div>
          ) : (
            <table className="table-premium" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Staff</th><th>Leave Type</th><th>From</th><th>To</th>
                  <th>Days</th><th>Reason</th><th>Status</th><th>Applied</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.staff?.full_name || '—'}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{r.staff?.staff_id}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.leave_type?.name || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{fmtDate(r.from_date)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{fmtDate(r.to_date)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--aurora-400)' }}>{r.days}</td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem',
                        maxWidth: '160px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={r.reason || ''}>
                        {r.reason || '—'}
                      </span>
                    </td>
                    <td><LeaveStatusBadge status={r.status} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{fmtDate(r.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {r.status === 'pending' && (
                          <button onClick={() => setReviewReq(r)} className="btn-clay-emerald"
                            style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Check size={13} /> Review
                          </button>
                        )}
                        <button onClick={() => handleDelete(r)} disabled={deletingId === r.id}
                          className="btn-clay-danger"
                          style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            <span>{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
            <span>{requests.filter(r => r.status === 'pending').length} pending</span>
          </div>
        </div>
      )}

      {/* ── Attendance Tab ─────────────────────────────────────────────────── */}
      {tab === 'attendance' && (
        <div className="animate-in">
          <div className="card-neuro" style={{ borderRadius: '16px', padding: '1.25rem 1.5rem',
            marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.88rem' }}>Date</label>
            <input type="date" className="input-premium" value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)} style={{ width: '180px' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{staffList.length} staff members</span>
            <button className="btn-clay-violet" onClick={handleSaveAttendance} disabled={savingAttendance}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.2rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              {savingAttendance
                ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                : <><Save size={15} /> Save All</>
              }
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginRight: '0.25rem' }}>Mark all as:</span>
            {ATTENDANCE_STATUSES.map(s => (
              <button key={s}
                className={s === 'present' ? 'btn-clay-emerald' : s === 'absent' ? 'btn-clay-danger' : 'btn-clay-ghost'}
                onClick={() => {
                  const draft: Record<string, string> = {}
                  staffList.forEach(st => { draft[st.id] = s })
                  setAttendanceDraft(draft)
                }}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                {ATTENDANCE_LABELS[s]}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ color: 'var(--text-muted)', padding: '3rem', textAlign: 'center' }}>Loading staff…</div>
          ) : staffList.length === 0 ? (
            <div className="card-neuro" style={{ padding: '4rem', textAlign: 'center', borderRadius: '16px' }}>
              <p style={{ color: 'var(--text-muted)' }}>No staff found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {staffList.map(s => {
                const status = attendanceDraft[s.id] || 'present'
                const attnRecord = attendance.find(a => a.staff_id === s.id)
                const statusColors: Record<string, string> = {
                  present: '#34D399', absent: '#F87171', late: '#FBBF24',
                  half_day: '#60A5FA', holiday: '#5EEAD4',
                }
                return (
                  <div key={s.id} className="card-neuro" style={{ borderRadius: '14px', padding: '1.1rem 1.25rem',
                    borderLeft: `3px solid ${statusColors[status] || 'transparent'}`,
                    transition: 'all 0.2s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div>
                        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.92rem' }}>{s.full_name}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{s.staff_id}</p>
                      </div>
                      {attnRecord?.check_in && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)',
                          padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                          In: {attnRecord.check_in.slice(0, 5)}
                        </span>
                      )}
                    </div>
                    <select className="select-premium" value={status}
                      onChange={e => setAttendanceDraft(prev => ({ ...prev, [s.id]: e.target.value }))}
                      style={{ width: '100%', color: statusColors[status] || 'inherit', fontWeight: 600 }}>
                      {ATTENDANCE_STATUSES.map(as => (
                        <option key={as} value={as}>{ATTENDANCE_LABELS[as]}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Leave Types Tab ────────────────────────────────────────────────── */}
      {tab === 'types' && (
        <div className="card-neuro animate-in" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 }}>Leave Types</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                Configure leave categories and annual entitlement
              </p>
            </div>
            <button className="btn-clay-violet" onClick={() => setShowAddType(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.6rem 1.2rem',
                cursor: 'pointer', fontSize: '0.85rem' }}>
              <Plus size={14} /> Add Type
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading leave types…</div>
          ) : leaveTypes.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <ListFilter size={36} style={{ color: 'var(--text-muted)', opacity: 0.4, marginBottom: '1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No leave types yet — add one</p>
            </div>
          ) : (
            <table className="table-premium" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Leave Type</th><th>Days / Year</th><th>Paid?</th><th>Created</th>
                </tr>
              </thead>
              <tbody>
                {leaveTypes.map(lt => (
                  <tr key={lt.id}>
                    <td><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lt.name}</span></td>
                    <td><span style={{ fontWeight: 700, color: 'var(--aurora-400)', fontSize: '1.05rem' }}>{lt.days_per_year ?? '—'}</span></td>
                    <td>
                      {lt.is_paid
                        ? <span className="badge-success">Paid</span>
                        : <span className="badge-neutral">Unpaid</span>
                      }
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                      {lt.created_at ? fmtDate(lt.created_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)',
            color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            {leaveTypes.length} type{leaveTypes.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Modals */}
      {showApply && (
        <ApplyLeaveModal
          staffList={staffList}
          leaveTypes={leaveTypes}
          onClose={() => setShowApply(false)}
          onSuccess={() => { setShowApply(false); showToast('Leave request submitted'); load() }}
        />
      )}
      {reviewReq && (
        <ReviewModal
          req={reviewReq}
          onClose={() => setReviewReq(null)}
          onSuccess={() => { setReviewReq(null); showToast('Leave request updated'); load() }}
        />
      )}
      {showAddType && (
        <AddLeaveTypeModal
          onClose={() => setShowAddType(false)}
          onSuccess={() => { setShowAddType(false); showToast('Leave type created'); load() }}
        />
      )}
    </div>
  )
}
