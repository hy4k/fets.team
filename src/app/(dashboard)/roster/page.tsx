'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, CheckCircle,
  XCircle, AlertCircle, RefreshCw, Users, Loader2,
} from 'lucide-react'
import {
  getLiveStaffProfiles, getRosterSchedules, getAttendanceRecords,
  getOTClaims, getLeaveRequests,
  approveLeaveRequest, rejectLeaveRequest, approveOTClaim, rejectOTClaim,
} from '@/lib/actions/roster'
import type {
  LiveStaffProfile, RosterSchedule, AttendanceRecord, OTClaim, LeaveRequest,
} from '@/lib/actions/roster'

// ─── Shift code colours ───────────────────────────────────────────────────────

const SHIFT_META: Record<string, { label: string; bg: string; text: string }> = {
  D:    { label: 'Day',      bg: 'rgba(34,197,94,0.15)',  text: '#4ade80' },
  E:    { label: 'Evening',  bg: 'rgba(168,85,247,0.15)', text: '#c084fc' },
  HD:   { label: 'Half',     bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  RD:   { label: 'Rest',     bg: 'rgba(100,116,139,0.15)',text: '#94a3b8' },
  L:    { label: 'Leave',    bg: 'rgba(239,68,68,0.15)',  text: '#f87171' },
  OT:   { label: 'OT',       bg: 'rgba(6,182,212,0.15)', text: '#22d3ee' },
  T:    { label: 'Training', bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
  TOIL: { label: 'TOIL',     bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
  TP:   { label: 'TOIL Pay', bg: 'rgba(16,185,129,0.2)',  text: '#6ee7b7' },
  TR:   { label: 'TOIL Red', bg: 'rgba(20,184,166,0.2)',  text: '#2dd4bf' },
}

function shiftMeta(code: string) {
  return SHIFT_META[code?.toUpperCase()] ?? { label: code || '-', bg: 'rgba(201,163,92,0.1)', text: '#5EEAD4' }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function fmt(iso: string | null): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'2-digit' })
}

function fmtTime(t: string | null): string {
  if (!t) return '-'
  return t.slice(0, 5)
}

function statusBadge(status: string) {
  const s = status?.toLowerCase()
  if (s === 'approved') return { bg: 'rgba(34,197,94,0.15)', text: '#4ade80', label: 'Approved' }
  if (s === 'rejected') return { bg: 'rgba(239,68,68,0.15)',  text: '#f87171', label: 'Rejected' }
  return { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', label: 'Pending' }
}

// ─── Components ───────────────────────────────────────────────────────────────

function ShiftPill({ code, ot }: { code: string; ot?: number | null }) {
  const m = shiftMeta(code)
  return (
    <div
      className="flex items-center justify-center rounded-md text-[10px] font-bold leading-none px-1 py-[3px] whitespace-nowrap"
      style={{ background: m.bg, color: m.text, minWidth: 28 }}
    >
      {m.label}
      {ot && ot > 0 ? <span className="ml-0.5 opacity-80">+{ot}h</span> : null}
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const b = statusBadge(status)
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: b.bg, color: b.text }}>
      {b.label}
    </span>
  )
}

function AttBadge({ status }: { status: string }) {
  const s = status?.toLowerCase()
  const configs: Record<string, { bg: string; text: string; label: string }> = {
    present:  { bg: 'rgba(34,197,94,0.15)',  text: '#4ade80', label: 'Present'  },
    late:     { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', label: 'Late'     },
    absent:   { bg: 'rgba(239,68,68,0.15)',  text: '#f87171', label: 'Absent'   },
    half_day: { bg: 'rgba(168,85,247,0.15)', text: '#c084fc', label: 'Half Day' },
  }
  const c = configs[s] ?? { bg: 'rgba(100,116,139,0.1)', text: '#94a3b8', label: s }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: c.bg, color: c.text }}>
      {c.label}
    </span>
  )
}

type Tab = 'roster' | 'attendance' | 'ot' | 'leave'

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RosterPage() {
  const now = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [tab,   setTab]   = useState<Tab>('roster')

  const [staff,      setStaff]      = useState<LiveStaffProfile[]>([])
  const [schedules,  setSchedules]  = useState<RosterSchedule[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [otClaims,   setOtClaims]   = useState<OTClaim[]>([])
  const [leaves,     setLeaves]     = useState<LeaveRequest[]>([])

  const [loading,  setLoading]  = useState(true)
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null)
  const [busy,     setBusy]     = useState<string | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [s, r, a, ot, l] = await Promise.all([
      getLiveStaffProfiles(),
      getRosterSchedules(year, month),
      getAttendanceRecords(year, month),
      getOTClaims(year, month),
      getLeaveRequests(year, month),
    ])
    setStaff(s)
    setSchedules(r)
    setAttendance(a)
    setOtClaims(ot)
    setLeaves(l)
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Build lookup: profile_id -> { [day]: schedule }
  const schedMap: Record<string, Record<number, RosterSchedule>> = {}
  for (const s of schedules) {
    if (!schedMap[s.profile_id]) schedMap[s.profile_id] = {}
    const d = parseInt(s.date.split('-')[2], 10)
    schedMap[s.profile_id][d] = s
  }

  const days = daysInMonth(year, month)
  const dayNums = Array.from({ length: days }, (_, i) => i + 1)

  const handleApproveLeave = async (id: string) => {
    setBusy(id)
    const res = await approveLeaveRequest(id)
    setBusy(null)
    if (res.ok) { showToast('Leave approved'); load() }
    else showToast(res.error ?? 'Failed', false)
  }
  const handleRejectLeave = async (id: string) => {
    setBusy(id)
    const res = await rejectLeaveRequest(id)
    setBusy(null)
    if (res.ok) { showToast('Leave rejected'); load() }
    else showToast(res.error ?? 'Failed', false)
  }
  const handleApproveOT = async (id: string) => {
    setBusy(id)
    const res = await approveOTClaim(id)
    setBusy(null)
    if (res.ok) { showToast('OT claim approved'); load() }
    else showToast(res.error ?? 'Failed', false)
  }
  const handleRejectOT = async (id: string) => {
    setBusy(id)
    const res = await rejectOTClaim(id)
    setBusy(null)
    if (res.ok) { showToast('OT claim rejected'); load() }
    else showToast(res.error ?? 'Failed', false)
  }

  const pendingLeaves = leaves.filter(l => l.status === 'pending').length
  const pendingOT     = otClaims.filter(c => c.status === 'pending').length

  return (
    <div className="min-h-screen p-6 space-y-5" style={{ background: 'var(--bg-base)' }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-xl"
          style={{
            background: toast.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${toast.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            color: toast.ok ? '#4ade80' : '#f87171',
          }}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Operations Roster
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Live data from fets.live &middot; {staff.length} active staff
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
          style={{
            background: 'rgba(201,163,92,0.1)',
            border: '1px solid rgba(201,163,92,0.2)',
            color: '#5EEAD4',
          }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Month Nav */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth}
          className="rounded-xl p-2 transition-all"
          style={{ background: 'rgba(201,163,92,0.08)', border: '1px solid rgba(201,163,92,0.15)', color: '#5EEAD4' }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="rounded-xl px-5 py-2 font-semibold text-base"
          style={{ background: 'rgba(201,163,92,0.08)', border: '1px solid rgba(201,163,92,0.15)', color: 'var(--text-primary)', minWidth: 160, textAlign: 'center' }}>
          {MONTHS[month - 1]} {year}
        </div>
        <button onClick={nextMonth}
          className="rounded-xl p-2 transition-all"
          style={{ background: 'rgba(201,163,92,0.08)', border: '1px solid rgba(201,163,92,0.15)', color: '#5EEAD4' }}>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl p-1 w-fit"
        style={{ background: 'rgba(201,163,92,0.06)', border: '1px solid rgba(201,163,92,0.1)' }}>
        {([
          { id: 'roster' as Tab,     label: 'Roster',  icon: CalendarDays },
          { id: 'attendance' as Tab, label: 'Attendance', icon: Users },
          { id: 'ot' as Tab,         label: `OT / TOIL${pendingOT > 0 ? ` (${pendingOT})` : ''}`, icon: Clock },
          { id: 'leave' as Tab,      label: `Leave${pendingLeaves > 0 ? ` (${pendingLeaves})` : ''}`, icon: AlertCircle },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={tab === t.id
              ? { background: 'rgba(201,163,92,0.2)', color: 'var(--text-primary)', border: '1px solid rgba(201,163,92,0.3)' }
              : { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid transparent' }}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#5EEAD4' }} />
        </div>
      ) : (

        /* ── Roster Calendar ───────────────────────────────────────────────── */
        tab === 'roster' ? (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,163,92,0.12)' }}>
            {staff.length === 0 ? (
              <EmptyState text="No active staff found. Check FETS_LIVE_SERVICE_ROLE_KEY is set on the server." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs" style={{ minWidth: `${days * 44 + 180}px` }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(201,163,92,0.15)' }}>
                      <th className="sticky left-0 z-10 text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-wider"
                        style={{ background: 'rgba(12,10,31,0.98)', color: 'var(--text-secondary)', width: 180, minWidth: 180 }}>
                        Staff
                      </th>
                      {dayNums.map(d => {
                        const dow = new Date(year, month - 1, d).getDay()
                        const isWeekend = dow === 0 || dow === 6
                        return (
                          <th key={d} className="text-center px-1 py-2 font-semibold"
                            style={{
                              color: isWeekend ? '#5EEAD4' : 'var(--text-secondary)',
                              background: isWeekend ? 'rgba(201,163,92,0.06)' : 'transparent',
                              width: 44, minWidth: 44,
                            }}>
                            <div className="text-[10px] uppercase" style={{ color: 'var(--text-ghost)' }}>
                              {['Su','Mo','Tu','We','Th','Fr','Sa'][dow]}
                            </div>
                            <div className="font-bold">{d}</div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((s, si) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(201,163,92,0.06)', background: si % 2 === 0 ? 'transparent' : 'rgba(201,163,92,0.02)' }}>
                        <td className="sticky left-0 z-10 px-4 py-2"
                          style={{ background: si % 2 === 0 ? 'rgba(12,10,31,0.98)' : 'rgba(15,12,36,0.98)' }}>
                          <div className="font-medium truncate" style={{ color: 'var(--text-primary)', maxWidth: 160 }}>
                            {s.full_name}
                          </div>
                          <div className="text-[10px] capitalize" style={{ color: 'var(--text-ghost)' }}>
                            {s.branch_assigned ?? '-'}
                          </div>
                        </td>
                        {dayNums.map(d => {
                          const sched = schedMap[s.id]?.[d]
                          const dow = new Date(year, month - 1, d).getDay()
                          const isWeekend = dow === 0 || dow === 6
                          return (
                            <td key={d} className="text-center px-1 py-1.5"
                              style={{ background: isWeekend ? 'rgba(201,163,92,0.04)' : 'transparent' }}>
                              {sched
                                ? <ShiftPill code={sched.shift_code} ot={sched.overtime_hours} />
                                : <span style={{ color: 'var(--text-ghost)', opacity: 0.3 }}>&#183;</span>
                              }
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Legend */}
            <div className="flex flex-wrap gap-3 px-4 py-3 border-t" style={{ borderColor: 'rgba(201,163,92,0.1)' }}>
              {Object.entries(SHIFT_META).map(([, m]) => (
                <div key={m.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: m.text }} />
                  <span className="text-[11px]" style={{ color: 'var(--text-ghost)' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

        /* ── Attendance ────────────────────────────────────────────────────── */
        ) : tab === 'attendance' ? (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,163,92,0.12)' }}>
            {attendance.length === 0 ? (
              <EmptyState text="No attendance records for this month." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm" style={{ minWidth: 700 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(201,163,92,0.15)', background: 'rgba(201,163,92,0.04)' }}>
                      {['Date','Staff','Branch','Check In','Check Out','Status','Notes'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                          style={{ color: 'var(--text-secondary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((a, i) => {
                      const staffName = staff.find(s => s.id === a.staff_id)?.full_name ?? a.staff_name ?? '-'
                      return (
                        <tr key={a.id} style={{ borderBottom: '1px solid rgba(201,163,92,0.06)', background: i % 2 === 0 ? 'transparent' : 'rgba(201,163,92,0.02)' }}>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{fmt(a.date)}</td>
                          <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{staffName}</td>
                          <td className="px-4 py-3 capitalize text-xs" style={{ color: 'var(--text-secondary)' }}>{a.branch_location ?? '-'}</td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: '#4ade80' }}>{fmtTime(a.check_in)}</td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: '#94a3b8' }}>{fmtTime(a.check_out)}</td>
                          <td className="px-4 py-3"><AttBadge status={a.status} /></td>
                          <td className="px-4 py-3 text-xs max-w-[160px] truncate" style={{ color: 'var(--text-ghost)' }}>{a.notes ?? '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        /* ── OT / TOIL ─────────────────────────────────────────────────────── */
        ) : tab === 'ot' ? (
          <div className="space-y-3">
            {otClaims.length === 0 ? (
              <div className="rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,163,92,0.12)' }}>
                <EmptyState text="No OT / TOIL claims for this month." />
              </div>
            ) : otClaims.map(c => {
              const isBusy = busy === c.id
              return (
                <div key={c.id} className="rounded-2xl p-4 flex items-start gap-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,163,92,0.12)' }}>
                  <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Field label="Staff"    value={c.staff?.full_name ?? '-'} />
                    <Field label="Date"     value={fmt(c.date)} />
                    <Field label="OT Hours" value={`${c.ot_hours}h`} />
                    <Field label="Type"     value={c.toil_payout ? 'TOIL Payout' : 'OT Pay'} />
                    {c.notes && (
                      <div className="col-span-2 md:col-span-4">
                        <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-ghost)' }}>Notes</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.notes}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusDot status={c.status} />
                    {c.status === 'pending' && (
                      <div className="flex gap-2">
                        <ActionBtn label="Approve" color="#4ade80" busy={isBusy} onClick={() => handleApproveOT(c.id)} />
                        <ActionBtn label="Reject"  color="#f87171" busy={isBusy} onClick={() => handleRejectOT(c.id)}  />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

        /* ── Leave Requests ────────────────────────────────────────────────── */
        ) : (
          <div className="space-y-3">
            {leaves.length === 0 ? (
              <div className="rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,163,92,0.12)' }}>
                <EmptyState text="No leave requests for this month." />
              </div>
            ) : leaves.map(l => {
              const isBusy = busy === l.id
              const typeLabel = l.request_type === 'shift_swap' ? 'Shift Swap' : l.request_type === 'toil' ? 'TOIL Redemption' : 'Leave'
              return (
                <div key={l.id} className="rounded-2xl p-4 flex items-start gap-4"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,163,92,0.12)' }}>
                  <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Field label="Requestor" value={l.requestor?.full_name ?? '-'} />
                    <Field label="Type"      value={typeLabel} />
                    <Field label="Date"      value={fmt(l.requested_date)} />
                    {l.request_type === 'shift_swap' && l.target && (
                      <Field label="Swap With" value={l.target.full_name ?? '-'} />
                    )}
                    {l.swap_date && (
                      <Field label="Swap Date" value={fmt(l.swap_date)} />
                    )}
                    {l.reason && (
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-ghost)' }}>Reason</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{l.reason}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusDot status={l.status} />
                    {l.status === 'pending' && (
                      <div className="flex gap-2">
                        <ActionBtn label="Approve" color="#4ade80" busy={isBusy} onClick={() => handleApproveLeave(l.id)} />
                        <ActionBtn label="Reject"  color="#f87171" busy={isBusy} onClick={() => handleRejectLeave(l.id)}  />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

// ─── Mini components ──────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-ghost)' }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}

function ActionBtn({ label, color, busy, onClick }: { label: string; color: string; busy: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={busy}
      className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
      style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}>
      {busy ? <Loader2 className="w-3 h-3 animate-spin inline" /> : label}
    </button>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <CalendarDays className="w-12 h-12 mb-3 opacity-20" style={{ color: '#5EEAD4' }} />
      <p className="text-sm" style={{ color: 'var(--text-ghost)' }}>{text}</p>
    </div>
  )
}
