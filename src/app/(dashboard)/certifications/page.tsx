'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Award, Plus, Search, Trash2, Edit2, ExternalLink, RefreshCw,
  X, Loader2, CheckCircle, AlertCircle, BookOpen, Clock,
} from 'lucide-react'
import {
  getCertificationTypes, createCertificationType, updateCertificationType,
  getStaffCertifications, assignCertification, updateStaffCertification,
  removeStaffCertification, getStaffForCerts, getCertStats,
  type CertificationType, type StaffCertification, type AssignCertInput,
} from '@/lib/actions/certifications'
import { CERT_STATUSES, STATUS_LABELS, STATUS_COLORS, CERT_CATEGORIES } from '@/lib/utils/certifications'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isExpiringSoon(date: string | null) {
  if (!date) return false
  const diff = new Date(date).getTime() - Date.now()
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
}

function isExpired(date: string | null) {
  if (!date) return false
  return new Date(date) < new Date()
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] || status
  const color = STATUS_COLORS[status] || 'text-[#66756A] bg-[#12231C]'
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium', color)}>
      {label}
    </span>
  )
}

// ─── Assign / Edit Modal ──────────────────────────────────────────────────────

interface AssignModalProps {
  staffList: Array<{ id: string; staff_id: string; full_name: string }>
  certTypes: CertificationType[]
  existing?: StaffCertification
  onClose: () => void
  onSuccess: () => void
}

function AssignModal({ staffList, certTypes, existing, onClose, onSuccess }: AssignModalProps) {
  const [staffId, setStaffId] = useState(existing?.staff_id || '')
  const [certId, setCertId] = useState(existing?.certification_id || '')
  const [status, setStatus] = useState(existing?.status || 'not_started')
  const [takenDate, setTakenDate] = useState(existing?.taken_date || '')
  const [expiryDate, setExpiryDate] = useState(existing?.expiry_date || '')
  const [certUrl, setCertUrl] = useState(existing?.certificate_url || '')
  const [remarks, setRemarks] = useState(existing?.remarks || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffId || !certId) { setError('Staff member and certification are required.'); return }
    setError(''); setSaving(true)
    const payload: AssignCertInput = {
      staff_id: staffId, certification_id: certId, status,
      taken_date: takenDate || undefined, expiry_date: expiryDate || undefined,
      certificate_url: certUrl || undefined, remarks: remarks || undefined,
    }
    const result = existing
      ? await updateStaffCertification(existing.id, payload)
      : await assignCertification(payload)
    setSaving(false)
    if (result && 'error' in result) { setError((result as any).error); return }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0A130F] border border-[#1B2A22] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1B2A22]">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C9A35C]" />
            <h2 className="text-[#EDEFE9] font-semibold text-[15px]">
              {existing ? 'Update Certification' : 'Assign Certification'}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#3D4B42] hover:text-[#EDEFE9] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Staff Member <span className="text-red-400">*</span></label>
              <select value={staffId} onChange={e => setStaffId(e.target.value)} disabled={!!existing}
                className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm focus:outline-none focus:border-[#C9A35C]/50 disabled:opacity-60" required>
                <option value="">Select staff…</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.staff_id})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Certification <span className="text-red-400">*</span></label>
              <select value={certId} onChange={e => setCertId(e.target.value)} disabled={!!existing}
                className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm focus:outline-none focus:border-[#C9A35C]/50 disabled:opacity-60" required>
                <option value="">Select cert…</option>
                {certTypes.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm focus:outline-none focus:border-[#C9A35C]/50">
              {CERT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Date Taken</label>
              <input type="date" value={takenDate} onChange={e => setTakenDate(e.target.value)}
                className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm focus:outline-none focus:border-[#C9A35C]/50" />
            </div>
            <div>
              <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Expiry Date</label>
              <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm focus:outline-none focus:border-[#C9A35C]/50" />
            </div>
          </div>
          <div>
            <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Certificate URL</label>
            <input value={certUrl} onChange={e => setCertUrl(e.target.value)} placeholder="https://…"
              className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm placeholder-[#3D4B42] focus:outline-none focus:border-[#C9A35C]/50" />
          </div>
          <div>
            <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Remarks</label>
            <input value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional notes…"
              className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm placeholder-[#3D4B42] focus:outline-none focus:border-[#C9A35C]/50" />
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[#27392E] text-[#66756A] text-sm hover:text-[#C4CDC2] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-[#C9A35C] text-[#040A08] text-sm font-semibold hover:bg-[#C9A35C]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : (existing ? 'Update' : 'Assign')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Add Cert Type Modal ──────────────────────────────────────────────────────

function AddCertTypeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [issuingBody, setIssuingBody] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) { setError('Name is required.'); return }
    setError(''); setSaving(true)
    const result = await createCertificationType({
      name, issuing_body: issuingBody || undefined, category: category || undefined,
    })
    setSaving(false)
    if ('error' in result) { setError(result.error); return }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0A130F] border border-[#1B2A22] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1B2A22]">
          <h2 className="text-[#EDEFE9] font-semibold text-[15px] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C9A35C]" />Add Certification Type
          </h2>
          <button onClick={onClose} className="text-[#3D4B42] hover:text-[#EDEFE9] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Name <span className="text-red-400">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Prometric — IELTS Invigilator Cert"
              className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm placeholder-[#3D4B42] focus:outline-none focus:border-[#C9A35C]/50" required />
          </div>
          <div>
            <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Issuing Body</label>
            <input value={issuingBody} onChange={e => setIssuingBody(e.target.value)}
              placeholder="e.g. Prometric, Pearson VUE, ETS, IELTS…"
              className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm placeholder-[#3D4B42] focus:outline-none focus:border-[#C9A35C]/50" />
          </div>
          <div>
            <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm focus:outline-none focus:border-[#C9A35C]/50">
              <option value="">Select category…</option>
              {CERT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[#27392E] text-[#66756A] text-sm hover:text-[#C4CDC2] transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-[#C9A35C] text-[#040A08] text-sm font-semibold hover:bg-[#C9A35C]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Add Certification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CertificationsPage() {
  const [tab, setTab] = useState<'staff' | 'types'>('staff')
  const [staffCerts, setStaffCerts] = useState<StaffCertification[]>([])
  const [certTypes, setCertTypes] = useState<CertificationType[]>([])
  const [staffList, setStaffList] = useState<Array<{ id: string; staff_id: string; full_name: string }>>([])
  const [stats, setStats] = useState({ total: 0, passed: 0, expiringIn30Days: 0, expired: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStaff, setFilterStaff] = useState('')
  const [filterCert, setFilterCert] = useState('')
  const [showAssign, setShowAssign] = useState(false)
  const [editCert, setEditCert] = useState<StaffCertification | null>(null)
  const [showAddType, setShowAddType] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [certs, types, staff, statsData] = await Promise.all([
      getStaffCertifications({
        staffId: filterStaff || undefined,
        certificationId: filterCert || undefined,
        status: filterStatus || undefined,
      }),
      getCertificationTypes(),
      getStaffForCerts(),
      getCertStats(),
    ])
    setStaffCerts(certs)
    setCertTypes(types)
    setStaffList(staff)
    setStats(statsData)
    setLoading(false)
  }, [filterStaff, filterCert, filterStatus])

  useEffect(() => { load() }, [load])

  const handleDelete = async (sc: StaffCertification) => {
    if (!confirm(`Remove ${sc.certification?.name} from ${sc.staff?.full_name}?`)) return
    setDeletingId(sc.id)
    const result = await removeStaffCertification(sc.id)
    setDeletingId(null)
    if (result.error) { showToast(result.error, 'error'); return }
    showToast('Certification removed')
    load()
  }

  const handleToggleActive = async (ct: CertificationType) => {
    setTogglingId(ct.id)
    await updateCertificationType(ct.id, { is_active: !ct.is_active })
    setTogglingId(null)
    setCertTypes(prev => prev.map(c => c.id === ct.id ? { ...c, is_active: !c.is_active } : c))
  }

  const filtered = staffCerts.filter(sc => {
    if (!search) return true
    const q = search.toLowerCase()
    return sc.staff?.full_name.toLowerCase().includes(q) ||
           sc.certification?.name.toLowerCase().includes(q) ||
           (sc.staff?.staff_id || '').toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen bg-[#080810] text-[#EDEFE9]">
      {toast && (
        <div className={cn(
          'fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium',
          toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        )}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
      {(showAssign || editCert) && (
        <AssignModal staffList={staffList} certTypes={certTypes} existing={editCert || undefined}
          onClose={() => { setShowAssign(false); setEditCert(null) }}
          onSuccess={() => { setShowAssign(false); setEditCert(null); showToast(editCert ? 'Certification updated' : 'Certification assigned'); load() }}
        />
      )}
      {showAddType && (
        <AddCertTypeModal onClose={() => setShowAddType(false)}
          onSuccess={() => { setShowAddType(false); showToast('Certification type added'); load() }} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/5">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Certification Tracker</h1>
          <p className="text-[#66756A] text-sm mt-1">Manage staff certifications and compliance requirements</p>
        </div>
        {tab === 'staff' ? (
          <button onClick={() => setShowAssign(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Assign Certification
          </button>
        ) : (
          <button onClick={() => setShowAddType(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Cert Type
          </button>
        )}
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Certifications', value: stats.total, icon: Award, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Passed', value: stats.passed, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Expiring in 30 Days', value: stats.expiringIn30Days, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
              { label: 'Expired', value: stats.expired, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.bg)}>
                  <stat.icon className={cn('w-5 h-5', stat.color)} />
                </div>
                <div className="font-display text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-[#66756A] text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1 w-fit">
          {(['staff', 'types'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-colors',
                tab === t ? 'bg-white/10 text-white' : 'text-[#66756A] hover:text-white')}>
              {t === 'staff' ? 'Staff Certifications' : 'Certification Types'}
            </button>
          ))}
        </div>

        {/* Staff Certifications Tab */}
        {tab === 'staff' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#66756A]" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by staff or certification…"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-[#66756A] focus:outline-none focus:border-indigo-500/50" />
              </div>
              <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
                className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-[#EDEFE9] focus:outline-none focus:border-indigo-500/50 min-w-[160px]">
                <option value="">All Staff</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
              <select value={filterCert} onChange={e => setFilterCert(e.target.value)}
                className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-[#EDEFE9] focus:outline-none focus:border-indigo-500/50 min-w-[180px]">
                <option value="">All Certifications</option>
                {certTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-[#EDEFE9] focus:outline-none focus:border-indigo-500/50 min-w-[150px]">
                <option value="">All Statuses</option>
                {CERT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-[#66756A]">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <Award className="w-10 h-10 text-[#283A2F] mx-auto mb-3" />
                  <p className="text-[#66756A] text-sm">No certifications found</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Staff', 'Certification', 'Status', 'Date Taken', 'Expiry', 'Actions'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#66756A] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filtered.map(sc => (
                      <tr key={sc.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-4">
                          <div className="text-sm font-medium text-white">{sc.staff?.full_name}</div>
                          <div className="text-xs text-[#66756A]">{sc.staff?.staff_id}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-white">{sc.certification?.name}</div>
                          {sc.certification?.issuing_body && (
                            <div className="text-xs text-[#66756A]">{sc.certification.issuing_body}</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={sc.status} />
                            {isExpiringSoon(sc.expiry_date) && sc.status !== 'expired' && (
                              <span className="text-xs text-orange-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Soon
                              </span>
                            )}
                            {isExpired(sc.expiry_date) && sc.status !== 'expired' && (
                              <span className="text-xs text-red-400">Expired</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#9FAEA2]">
                          {sc.taken_date ? fmtDate(sc.taken_date) : <span className="text-[#3A4A3F]">—</span>}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#9FAEA2]">
                          {sc.expiry_date ? (
                            <span className={isExpired(sc.expiry_date) ? 'text-red-400' : isExpiringSoon(sc.expiry_date) ? 'text-orange-400' : ''}>
                              {fmtDate(sc.expiry_date)}
                            </span>
                          ) : <span className="text-[#3A4A3F]">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {sc.certificate_url && (
                              <a href={sc.certificate_url} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-[#66756A] hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                title="View Certificate">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button onClick={() => setEditCert(sc)}
                              className="p-1.5 rounded-lg text-[#66756A] hover:text-white hover:bg-white/10 transition-colors"
                              title="Edit">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(sc)} disabled={deletingId === sc.id}
                              className="p-1.5 rounded-lg text-[#66756A] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                              title="Remove">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Certification Types Tab */}
        {tab === 'types' && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-[#66756A]">Loading…</div>
            ) : certTypes.length === 0 ? (
              <div className="p-12 text-center">
                <Award className="w-10 h-10 text-[#283A2F] mx-auto mb-3" />
                <p className="text-[#66756A] text-sm">No certification types yet</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Name', 'Issuing Body', 'Category', 'Status'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[#66756A] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {certTypes.map(ct => (
                    <tr key={ct.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-white">{ct.name}</td>
                      <td className="px-5 py-4 text-sm text-[#9FAEA2]">
                        {ct.issuing_body || <span className="text-[#3A4A3F]">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        {ct.category ? (
                          <span className="px-2 py-1 bg-white/[0.06] rounded-lg text-xs text-[#9FAEA2]">
                            {ct.category}
                          </span>
                        ) : <span className="text-[#3A4A3F] text-sm">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => handleToggleActive(ct)} disabled={togglingId === ct.id}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors disabled:opacity-40',
                            ct.is_active
                              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                              : 'bg-white/[0.06] text-[#66756A] hover:bg-white/10'
                          )}>
                          {ct.is_active ? <><CheckCircle className="w-3.5 h-3.5" /> Active</> : <><X className="w-3.5 h-3.5" /> Inactive</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
