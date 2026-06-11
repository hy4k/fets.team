'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  User, FileText, DollarSign, Calendar, Mail, Phone, MapPin,
  Building2, Briefcase, Badge, CheckCircle, Clock, XCircle,
  Download, ExternalLink, AlertCircle, Send, RefreshCw, Star,
} from 'lucide-react'
import {
  getMyProfile, getMyLeaveRequests, getMyLeaveStats,
  getMyDocuments, getMyPayslips, getMyLetterRequests,
  submitLetterRequest, MyProfile,
} from '@/lib/actions/self-service'

// ── Types ──────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'leave' | 'documents' | 'payslips' | 'letters'

const LETTER_TYPES = [
  'experience_letter', 'salary_certificate', 'employment_verification',
  'noc_letter', 'relieving_letter', 'offer_letter',
]
const LETTER_LABELS: Record<string, string> = {
  experience_letter: 'Experience Letter',
  salary_certificate: 'Salary Certificate',
  employment_verification: 'Employment Verification',
  noc_letter: 'No Objection Certificate (NOC)',
  relieving_letter: 'Relieving Letter',
  offer_letter: 'Offer Letter',
}
const DOC_TYPE_LABELS: Record<string, string> = {
  experience_letter: 'Experience Letter', salary_certificate: 'Salary Certificate',
  employment_verification: 'Employment Verification Letter', noc_letter: 'NOC Letter',
  relieving_letter: 'Relieving Letter', offer_letter: 'Offer Letter',
}
const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtMoney(n: number | null) {
  if (n === null || n === undefined) return '—'
  return `₹${Number(n).toLocaleString('en-IN')}`
}

// ── Shared mini-components ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; icon: any }> = {
    active:    { bg: 'rgba(16,185,129,0.15)', text: '#34D399', icon: CheckCircle },
    approved:  { bg: 'rgba(16,185,129,0.15)', text: '#34D399', icon: CheckCircle },
    paid:      { bg: 'rgba(16,185,129,0.15)', text: '#34D399', icon: CheckCircle },
    generated: { bg: 'rgba(16,185,129,0.15)', text: '#34D399', icon: CheckCircle },
    pending:   { bg: 'rgba(245,158,11,0.15)',  text: '#FCD34D', icon: Clock },
    draft:     { bg: 'rgba(245,158,11,0.15)',  text: '#FCD34D', icon: Clock },
    inactive:  { bg: 'rgba(244,63,94,0.12)',   text: '#FB7185', icon: XCircle },
    rejected:  { bg: 'rgba(244,63,94,0.12)',   text: '#FB7185', icon: XCircle },
  }
  const s = map[status?.toLowerCase()] ?? { bg: 'rgba(124,58,237,0.12)', text: '#A78BFA', icon: AlertCircle }
  const Icon = s.icon
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold"
      style={{ background: s.bg, color: s.text }}>
      <Icon className="w-3 h-3" />
      {status?.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
    </span>
  )
}

function CardBox({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(109,40,217,0.03) 100%)',
        border: '1px solid rgba(124,58,237,0.12)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
      {children}
    </div>
  )
}

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="rounded-xl px-4 py-3 text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.1)' }}>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: 'var(--text-ghost)' }}>{label}</div>
    </div>
  )
}

// ── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab({ profile }: { profile: MyProfile }) {
  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) => (
    <div className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: 'rgba(124,58,237,0.06)' }}>
      <Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--violet-400)' }} />
      <span className="text-xs w-32 shrink-0" style={{ color: 'var(--text-ghost)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value || '—'}</span>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Hero card */}
      <CardBox>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(109,40,217,0.2))', border: '2px solid rgba(124,58,237,0.2)' }}>
            {profile.photo_url
              ? <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
              : <User className="w-9 h-9" style={{ color: 'var(--violet-400)' }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{profile.full_name}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--violet-400)' }}>{profile.designation?.title || profile.designation_text || 'Staff'}</p>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={profile.status} />
              <span className="text-xs px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--violet-300)' }}>
                {profile.staff_id}
              </span>
            </div>
          </div>
        </div>
      </CardBox>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal Info */}
        <CardBox>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-ghost)' }}>Personal Information</h3>
          <InfoRow icon={Badge}    label="Employee ID"    value={profile.staff_id} />
          <InfoRow icon={User}     label="Full Name"      value={profile.full_name} />
          <InfoRow icon={Mail}     label="Email"          value={profile.email} />
          <InfoRow icon={Phone}    label="Phone"          value={profile.phone} />
          <InfoRow icon={User}     label="Gender"         value={profile.gender} />
          <InfoRow icon={Calendar} label="Date of Birth"  value={fmtDate(profile.date_of_birth)} />
        </CardBox>
        {/* Employment Info */}
        <CardBox>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-ghost)' }}>Employment Details</h3>
          <InfoRow icon={Building2}  label="Centre"          value={profile.centre?.name ?? null} />
          <InfoRow icon={Briefcase}  label="Department"      value={profile.department?.name ?? null} />
          <InfoRow icon={Badge}      label="Designation"     value={profile.designation?.title || profile.designation_text} />
          <InfoRow icon={CheckCircle}label="Employment Type" value={profile.employment_type?.replace(/_/g, ' ')} />
          <InfoRow icon={Calendar}   label="Joined On"       value={fmtDate(profile.date_of_joining)} />
          <InfoRow icon={MapPin}     label="City"            value={profile.centre?.city ?? null} />
        </CardBox>
      </div>
    </div>
  )
}

// ── Leave Tab ──────────────────────────────────────────────────────────────────

function LeaveTab() {
  const [requests, setRequests] = useState<any[]>([])
  const [stats, setStats]       = useState<any>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getMyLeaveRequests(), getMyLeaveStats()])
      .then(([r, s]) => { setRequests(r); setStats(s) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  return (
    <div className="space-y-5">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard value={stats.total}            label="Total Requests"   color="#A78BFA" />
          <StatCard value={stats.approved}          label="Approved"         color="#34D399" />
          <StatCard value={stats.pending}           label="Pending"          color="#FCD34D" />
          <StatCard value={stats.totalApprovedDays} label="Approved Days"    color="#60A5FA" />
        </div>
      )}
      <CardBox>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>My Leave Requests</h3>
        {requests.length === 0
          ? <EmptyState icon={Calendar} msg="No leave requests yet." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
                    {['Leave Type', 'From', 'To', 'Days', 'Status', 'Remarks'].map(h => (
                      <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-ghost)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(124,58,237,0.04)' }}>
                      <td className="py-2.5 pr-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {r.leave_type?.name ?? '—'}
                      </td>
                      <td className="py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>{fmtDate(r.start_date)}</td>
                      <td className="py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>{fmtDate(r.end_date)}</td>
                      <td className="py-2.5 pr-4" style={{ color: 'var(--violet-300)' }}>{r.days ?? '—'}</td>
                      <td className="py-2.5 pr-4"><StatusBadge status={r.status} /></td>
                      <td className="py-2.5 pr-4 max-w-[160px] truncate" style={{ color: 'var(--text-ghost)' }}>{r.hr_notes || r.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </CardBox>
    </div>
  )
}

// ── Documents Tab ─────────────────────────────────────────────────────────────

function DocumentsTab() {
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getMyDocuments().then(setDocs).finally(() => setLoading(false)) }, [])

  if (loading) return <LoadingSpinner />
  return (
    <div className="space-y-5">
      <CardBox>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>My Documents</h3>
        {docs.length === 0
          ? <EmptyState icon={FileText} msg="No documents have been issued yet." />
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {docs.map((d: any) => (
                <div key={d.id} className="rounded-xl p-4 transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.1)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {DOC_TYPE_LABELS[d.doc_type] ?? d.doc_type}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-ghost)' }}>#{d.doc_number}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-ghost)' }}>{fmtDate(d.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={d.status} />
                      {d.status === 'generated' && d.verification_id && (
                        <div className="flex items-center gap-2">
                          <a href={`/documents/${d.id}`} target="_blank"
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                            style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--violet-300)' }}>
                            <Download className="w-3 h-3" /> View
                          </a>
                          <a href={`/verify/${d.verification_id}`} target="_blank"
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#34D399' }}>
                            <ExternalLink className="w-3 h-3" /> Verify
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </CardBox>
    </div>
  )
}

// ── Payslips Tab ──────────────────────────────────────────────────────────────

function PayslipsTab() {
  const [payslips, setPayslips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getMyPayslips().then(setPayslips).finally(() => setLoading(false)) }, [])

  if (loading) return <LoadingSpinner />
  return (
    <div className="space-y-5">
      <CardBox>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Salary & Payslips</h3>
        {payslips.length === 0
          ? <EmptyState icon={DollarSign} msg="No payslip records found." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
                    {['Period', 'Basic Salary', 'Status', 'Payment Date', 'Mode', 'Payslip'].map(h => (
                      <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-ghost)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(124,58,237,0.04)' }}>
                      <td className="py-2.5 pr-4 font-semibold" style={{ color: 'var(--violet-300)' }}>
                        {MONTHS[p.month] ?? p.month} {p.year}
                      </td>
                      <td className="py-2.5 pr-4 font-medium" style={{ color: 'var(--text-primary)' }}>{fmtMoney(p.basic_salary)}</td>
                      <td className="py-2.5 pr-4"><StatusBadge status={p.is_paid ? 'paid' : 'pending'} /></td>
                      <td className="py-2.5 pr-4" style={{ color: 'var(--text-secondary)' }}>{fmtDate(p.payment_date)}</td>
                      <td className="py-2.5 pr-4 capitalize" style={{ color: 'var(--text-secondary)' }}>{p.payment_mode?.replace(/_/g, ' ') ?? '—'}</td>
                      <td className="py-2.5 pr-4">
                        {p.payslip_doc_id
                          ? (
                            <a href={`/documents/${p.payslip_doc_id}`} target="_blank"
                              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg w-fit hover:opacity-80 transition-opacity"
                              style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--violet-300)' }}>
                              <Download className="w-3 h-3" /> Download
                            </a>
                          )
                          : <span className="text-xs" style={{ color: 'var(--text-ghost)' }}>—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </CardBox>
    </div>
  )
}

// ── Letters Tab ───────────────────────────────────────────────────────────────

function LettersTab() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [isPending, startTx]    = useTransition()
  const [form, setForm]         = useState({ letter_type: '', reason: '' })
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)

  const load = () => { setLoading(true); getMyLetterRequests().then(setRequests).finally(() => setLoading(false)) }
  useEffect(load, [])

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSubmit = () => {
    if (!form.letter_type) return showToast('Please select a letter type.', false)
    if (!form.reason.trim()) return showToast('Please provide a reason.', false)
    startTx(async () => {
      const res = await submitLetterRequest(form)
      if ('error' in res) { showToast(res.error, false) }
      else { showToast('Letter request submitted successfully!', true); setForm({ letter_type: '', reason: '' }); load() }
    })
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl flex items-center gap-2 animate-fade-in"
          style={{ background: toast.ok ? 'rgba(16,185,129,0.95)' : 'rgba(244,63,94,0.95)', color: 'white' }}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Request Form */}
      <CardBox>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Request a Letter</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-ghost)' }}>Letter Type</label>
            <select
              value={form.letter_type}
              onChange={e => setForm(f => ({ ...f, letter_type: e.target.value }))}
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.2)',
                color: 'var(--text-primary)', borderRadius: '12px',
              }}
            >
              <option value="" style={{ background: '#1A0A3E' }}>Select letter type…</option>
              {LETTER_TYPES.map(t => (
                <option key={t} value={t} style={{ background: '#1A0A3E' }}>{LETTER_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-ghost)' }}>Purpose / Reason</label>
            <input
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Visa application, bank loan…"
              className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.2)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #9B6DFF, #6D28D9)', color: 'white', boxShadow: '0 4px 16px rgba(109,40,217,0.4)' }}
        >
          {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isPending ? 'Submitting…' : 'Submit Request'}
        </button>
      </CardBox>

      {/* Past requests */}
      <CardBox>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>My Letter Requests</h3>
        {loading ? <LoadingSpinner /> : requests.length === 0
          ? <EmptyState icon={Mail} msg="No letter requests yet." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
                    {['Letter Type', 'Reason', 'Status', 'HR Notes', 'Requested', 'Document'].map(h => (
                      <th key={h} className="text-left pb-3 pr-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-ghost)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgba(124,58,237,0.04)' }}>
                      <td className="py-2.5 pr-4 font-medium" style={{ color: 'var(--text-primary)' }}>{LETTER_LABELS[r.letter_type] ?? r.letter_type}</td>
                      <td className="py-2.5 pr-4 max-w-[140px] truncate" style={{ color: 'var(--text-secondary)' }}>{r.reason || '—'}</td>
                      <td className="py-2.5 pr-4"><StatusBadge status={r.status} /></td>
                      <td className="py-2.5 pr-4 max-w-[160px] truncate" style={{ color: 'var(--text-ghost)' }}>{r.hr_notes || '—'}</td>
                      <td className="py-2.5 pr-4" style={{ color: 'var(--text-ghost)' }}>{fmtDate(r.created_at)}</td>
                      <td className="py-2.5 pr-4">
                        {r.generated_doc_id
                          ? <a href={`/documents/${r.generated_doc_id}`} target="_blank"
                              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg w-fit hover:opacity-80"
                              style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--violet-300)' }}>
                              <Download className="w-3 h-3" /> View
                            </a>
                          : <span className="text-xs" style={{ color: 'var(--text-ghost)' }}>—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </CardBox>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--violet-400)' }} />
    </div>
  )
}

function EmptyState({ icon: Icon, msg }: { icon: any; msg: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Icon className="w-10 h-10 opacity-20" style={{ color: 'var(--text-ghost)' }} />
      <p className="text-sm" style={{ color: 'var(--text-ghost)' }}>{msg}</p>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'profile',   label: 'My Profile',  icon: User },
  { id: 'leave',     label: 'Leave',       icon: Calendar },
  { id: 'documents', label: 'Documents',   icon: FileText },
  { id: 'payslips',  label: 'Payslips',    icon: DollarSign },
  { id: 'letters',   label: 'Letters',     icon: Mail },
]

export default function SelfServicePage() {
  const [tab, setTab]       = useState<Tab>('profile')
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyProfile().then(p => { setProfile(p); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--violet-400)' }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto mt-16">
        <div className="rounded-2xl p-8 text-center"
          style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#FB7185' }} />
          <h2 className="text-lg font-bold mb-2" style={{ color: '#FB7185' }}>Profile Not Linked</h2>
          <p className="text-sm" style={{ color: 'var(--text-ghost)' }}>
            Your login account is not linked to a staff profile yet. Please contact your HR administrator.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(109,40,217,0.2))', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Star className="w-4 h-4" style={{ color: 'var(--violet-400)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>My Portal</h1>
            <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>
              Welcome back, {profile.full_name.split(' ')[0]} · {profile.centre?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1"
        style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all duration-200 whitespace-nowrap"
              style={active ? {
                background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(109,40,217,0.1))',
                borderBottom: '2px solid var(--violet-500)',
                color: 'var(--text-primary)',
              } : {
                background: 'transparent',
                borderBottom: '2px solid transparent',
                color: 'var(--text-ghost)',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {tab === 'profile'   && <ProfileTab profile={profile} />}
      {tab === 'leave'     && <LeaveTab />}
      {tab === 'documents' && <DocumentsTab />}
      {tab === 'payslips'  && <PayslipsTab />}
      {tab === 'letters'   && <LettersTab />}
    </div>
  )
}
