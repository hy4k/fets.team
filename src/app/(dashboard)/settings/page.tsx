'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  Building2, FileText, Calendar, MapPin, Users, Save,
  Plus, Pencil, Trash2, X, Check, CheckCircle, AlertCircle,
  RefreshCw, Link2, Unlink, ChevronDown, ChevronUp, Zap,
} from 'lucide-react'
import {
  getAdminSettings, upsertAdminSettings,
  getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType, LeaveTypeInput,
  getCentres, createCentre, updateCentre, CentreInput,
  getStaffForLinking, linkStaffToUser, unlinkStaffUser,
} from '@/lib/actions/settings'
import { syncUserToFetsLive } from '@/lib/actions/sync-to-fets-live'

type Tab = 'org' | 'docs' | 'leave' | 'centres' | 'users'

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, ok, onClose }: { msg: string; ok: boolean; onClose: () => void }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl animate-fade-in"
      style={{ background: ok ? 'rgba(16,185,129,0.95)' : 'rgba(244,63,94,0.95)', color: 'white' }}>
      {ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  )
}

// ── Shared field ──────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder, type = 'text' }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-ghost)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1"
        style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,58,237,0.2)',
          color: 'var(--text-primary)', outline: 'none',
        }} />
    </div>
  )
}

function CardBox({ children, title, icon: Icon }: { children: React.ReactNode; title?: string; icon?: any }) {
  return (
    <div className="rounded-2xl p-5 mb-5"
      style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.07),rgba(109,40,217,0.03))', border: '1px solid rgba(124,58,237,0.12)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {Icon && <Icon className="w-4 h-4" style={{ color: 'var(--violet-400)' }} />}
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  )
}

function SaveBtn({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button onClick={onClick} disabled={busy}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all mt-4 hover:opacity-90 disabled:opacity-50"
      style={{ background: 'linear-gradient(135deg,#9B6DFF,#6D28D9)', color: 'white', boxShadow: '0 4px 16px rgba(109,40,217,0.4)' }}>
      {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
      {busy ? 'Saving…' : 'Save Changes'}
    </button>
  )
}

// ── Organisation Tab ──────────────────────────────────────────────────────────

function OrgTab({ settings, onSave }: { settings: Record<string, string>; onSave: (u: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    company_name: settings.company_name ?? '',
    company_short_name: settings.company_short_name ?? '',
    primary_email: settings.primary_email ?? '',
    primary_phone: settings.primary_phone ?? '',
    website: settings.website ?? '',
  })
  const [busy, startTx] = useTransition()
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  return (
    <CardBox title="Organisation Details" icon={Building2}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Company Full Name"  value={form.company_name}       onChange={set('company_name')}       placeholder="Forun Testing & Educational Services" />
        <Field label="Short Name / Abbr"  value={form.company_short_name} onChange={set('company_short_name')} placeholder="FETS" />
        <Field label="Primary Email"      value={form.primary_email}      onChange={set('primary_email')}      type="email" placeholder="info@fets.in" />
        <Field label="Primary Phone"      value={form.primary_phone}      onChange={set('primary_phone')}      placeholder="+91 …" />
        <Field label="Website"            value={form.website}            onChange={set('website')}            placeholder="https://fets.in" />
      </div>
      <SaveBtn busy={busy} onClick={() => startTx(() => onSave(form))} />
    </CardBox>
  )
}

// ── Document Defaults Tab ─────────────────────────────────────────────────────

function DocsTab({ settings, onSave }: { settings: Record<string, string>; onSave: (u: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState({
    doc_number_prefix:  settings.doc_number_prefix  ?? 'FETS',
    doc_number_counter: settings.doc_number_counter ?? '1000',
    logo_url:           settings.logo_url           ?? '',
    letterhead_url:     settings.letterhead_url     ?? '',
    seal_url:           settings.seal_url           ?? '',
    signature_url:      settings.signature_url      ?? '',
  })
  const [busy, startTx] = useTransition()
  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <>
      <CardBox title="Document Numbering" icon={FileText}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Document Number Prefix"  value={form.doc_number_prefix}  onChange={set('doc_number_prefix')}  placeholder="FETS" />
          <Field label="Next Counter Value"       value={form.doc_number_counter} onChange={set('doc_number_counter')} type="number" placeholder="1000" />
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-ghost)' }}>
          Generated documents will be numbered <strong style={{ color: 'var(--violet-300)' }}>{form.doc_number_prefix}/YYYY/{form.doc_number_counter}</strong>
        </p>
      </CardBox>
      <CardBox title="Branding Asset URLs" icon={FileText}>
        <p className="text-xs mb-4" style={{ color: 'var(--text-ghost)' }}>
          Paste public URLs to your hosted images. These are embedded in generated documents.
        </p>
        <div className="space-y-4">
          <Field label="Logo URL"        value={form.logo_url}       onChange={set('logo_url')}       placeholder="https://cdn.fets.in/logo.png" />
          <Field label="Letterhead URL"  value={form.letterhead_url} onChange={set('letterhead_url')} placeholder="https://cdn.fets.in/letterhead.png" />
          <Field label="Company Seal URL"value={form.seal_url}       onChange={set('seal_url')}       placeholder="https://cdn.fets.in/seal.png" />
          <Field label="Signature URL"   value={form.signature_url}  onChange={set('signature_url')}  placeholder="https://cdn.fets.in/signature.png" />
        </div>
        <SaveBtn busy={busy} onClick={() => startTx(() => onSave(form))} />
      </CardBox>
    </>
  )
}

// ── Leave Types Tab ───────────────────────────────────────────────────────────

function LeaveTypesTab({ onToast }: { onToast: (msg: string, ok: boolean) => void }) {
  const [types, setTypes]     = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)   // null = new, obj = edit
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState<LeaveTypeInput>({ name: '', days_per_year: 0, is_paid: true })
  const [busy, startTx]       = useTransition()

  const load = () => { setLoading(true); getLeaveTypes().then(setTypes).finally(() => setLoading(false)) }
  useEffect(load, [])

  const openNew  = () => { setEditing(null); setForm({ name: '', days_per_year: 0, is_paid: true }); setShowForm(true) }
  const openEdit = (t: any) => { setEditing(t); setForm({ name: t.name, days_per_year: t.days_per_year, is_paid: t.is_paid }); setShowForm(true) }
  const close    = () => setShowForm(false)

  const handleSave = () => startTx(async () => {
    const res = editing
      ? await updateLeaveType(editing.id, form)
      : await createLeaveType(form)
    if ('error' in res) { onToast(res.error ?? 'Error', false) }
    else { onToast(editing ? 'Leave type updated' : 'Leave type created', true); close(); load() }
  })

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    startTx(async () => {
      const res = await deleteLeaveType(id)
      if ('error' in res) onToast(res.error ?? 'Error', false)
      else { onToast('Leave type deleted', true); load() }
    })
  }

  return (
    <CardBox title="Leave Types" icon={Calendar}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>{types.length} leave types configured</p>
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--violet-300)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <Plus className="w-3.5 h-3.5" /> Add Leave Type
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Annual Leave" />
            <Field label="Days / Year" value={String(form.days_per_year)} onChange={v => setForm(f => ({ ...f, days_per_year: Number(v) }))} type="number" placeholder="21" />
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-ghost)' }}>Paid Leave?</label>
              <div className="flex items-center gap-3 h-10">
                {['Paid', 'Unpaid'].map(opt => (
                  <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <input type="radio" checked={form.is_paid === (opt === 'Paid')} onChange={() => setForm(f => ({ ...f, is_paid: opt === 'Paid' }))} className="accent-violet-500" />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#9B6DFF,#6D28D9)', color: 'white' }}>
              {busy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              {editing ? 'Update' : 'Create'}
            </button>
            <button onClick={close} className="px-3 py-1.5 rounded-xl text-xs" style={{ color: 'var(--text-ghost)' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-xs py-4 text-center" style={{ color: 'var(--text-ghost)' }}>Loading…</p> : (
        <div className="space-y-2">
          {types.map((t: any) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.08)' }}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: t.is_paid ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: t.is_paid ? '#34D399' : '#FCD34D' }}>
                  {t.is_paid ? 'Paid' : 'Unpaid'}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-ghost)' }}>{t.days_per_year} days/yr</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--violet-400)' }}><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(t.id, t.name)} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: '#FB7185' }}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
          {types.length === 0 && <p className="text-xs py-4 text-center" style={{ color: 'var(--text-ghost)' }}>No leave types yet.</p>}
        </div>
      )}
    </CardBox>
  )
}

// ── Centres Tab ───────────────────────────────────────────────────────────────

function CentresTab({ onToast }: { onToast: (msg: string, ok: boolean) => void }) {
  const [centres, setCentres] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState<CentreInput>({ name: '', city: '', address: '', phone: '', email: '' })
  const [busy, startTx]       = useTransition()

  const load = () => { setLoading(true); getCentres().then(setCentres).finally(() => setLoading(false)) }
  useEffect(load, [])

  const openNew  = () => { setEditing(null); setForm({ name: '', city: '', address: '', phone: '', email: '' }); setShowForm(true) }
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, city: c.city, address: c.address ?? '', phone: c.phone ?? '', email: c.email ?? '' }); setShowForm(true) }
  const close    = () => setShowForm(false)
  const set      = (k: keyof CentreInput) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => startTx(async () => {
    const res = editing ? await updateCentre(editing.id, form) : await createCentre(form)
    if ('error' in res) { onToast(res.error ?? 'Error', false) }
    else { onToast(editing ? 'Centre updated' : 'Centre created', true); close(); load() }
  })

  return (
    <CardBox title="Test Centres" icon={MapPin}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>{centres.length} centres</p>
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-90"
          style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--violet-300)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <Plus className="w-3.5 h-3.5" /> Add Centre
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Field label="Centre Name" value={form.name}    onChange={set('name')}    placeholder="Calicut Centre" />
            <Field label="City"        value={form.city}    onChange={set('city')}    placeholder="Calicut" />
            <Field label="Address"     value={form.address ?? ''} onChange={set('address')} placeholder="Full address" />
            <Field label="Phone"       value={form.phone ?? ''}   onChange={set('phone')}   placeholder="+91 …" />
            <Field label="Email"       value={form.email ?? ''}   onChange={set('email')}   type="email" placeholder="centre@fets.in" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#9B6DFF,#6D28D9)', color: 'white' }}>
              {busy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              {editing ? 'Update' : 'Create'}
            </button>
            <button onClick={close} className="px-3 py-1.5 rounded-xl text-xs" style={{ color: 'var(--text-ghost)' }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <p className="text-xs py-4 text-center" style={{ color: 'var(--text-ghost)' }}>Loading…</p> : (
        <div className="space-y-2">
          {centres.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(124,58,237,0.08)' }}>
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                <span className="ml-2 text-xs" style={{ color: 'var(--text-ghost)' }}>{c.city}{c.address ? ` · ${c.address}` : ''}</span>
              </div>
              <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:opacity-80" style={{ color: 'var(--violet-400)' }}>
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {centres.length === 0 && <p className="text-xs py-4 text-center" style={{ color: 'var(--text-ghost)' }}>No centres yet.</p>}
        </div>
      )}
    </CardBox>
  )
}

// ── User Accounts Tab ─────────────────────────────────────────────────────────

type SyncState = 'idle' | 'loading' | 'done' | 'exists' | 'error'

function UsersTab({ onToast }: { onToast: (msg: string, ok: boolean) => void }) {
  const [staff, setStaff]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [linking, setLinking]   = useState<string | null>(null)  // staffId being linked
  const [emailInput, setEmailInput] = useState('')
  const [syncState, setSyncState] = useState<Record<string, SyncState>>({})
  const [busy, startTx]         = useTransition()

  const load = () => { setLoading(true); getStaffForLinking().then(setStaff).finally(() => setLoading(false)) }
  useEffect(load, [])

  const handleLink = (staffId: string) => startTx(async () => {
    if (!emailInput.trim()) return
    const res = await linkStaffToUser(staffId, emailInput.trim())
    if (!res.ok) { onToast(res.error ?? 'Link failed', false) }
    else { onToast('Account linked successfully', true); setLinking(null); setEmailInput(''); load() }
  })

  const handleUnlink = (staffId: string, name: string) => {
    if (!confirm(`Unlink ${name}'s account? They will lose portal access.`)) return
    startTx(async () => {
      const res = await unlinkStaffUser(staffId)
      if (!res.ok) onToast(res.error ?? 'Unlink failed', false)
      else { onToast('Account unlinked', true); load() }
    })
  }

  const handleSync = (s: any) => {
    setSyncState(st => ({ ...st, [s.id]: 'loading' }))
    syncUserToFetsLive({
      email: s.email ?? null,
      full_name: s.full_name,
      designation: s.designation_text ?? null,
      centre_name: s.centre?.name ?? null,
    }).then(res => {
      if (res.ok) {
        setSyncState(st => ({ ...st, [s.id]: res.status === 'already_exists' ? 'exists' : 'done' }))
        onToast(res.message, true)
      } else {
        setSyncState(st => ({ ...st, [s.id]: 'error' }))
        onToast(res.message, false)
      }
    })
  }

  const syncLabel = (state: SyncState) => {
    if (state === 'loading') return <><RefreshCw className="w-3 h-3 animate-spin" /> Syncing…</>
    if (state === 'done')    return <><Check className="w-3 h-3" /> Synced</>
    if (state === 'exists')  return <><CheckCircle className="w-3 h-3" /> On fets.live</>
    if (state === 'error')   return <><AlertCircle className="w-3 h-3" /> Failed</>
    return <><Zap className="w-3 h-3" /> Sync to fets.live</>
  }

  const syncColor = (state: SyncState): React.CSSProperties => {
    if (state === 'done' || state === 'exists') return { background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }
    if (state === 'error')  return { background: 'rgba(244,63,94,0.1)', color: '#FB7185', border: '1px solid rgba(244,63,94,0.2)' }
    return { background: 'rgba(234,179,8,0.1)', color: '#FCD34D', border: '1px solid rgba(234,179,8,0.25)' }
  }

  const linked   = staff.filter(s => s.user_id)
  const unlinked = staff.filter(s => !s.user_id)

  return (
    <CardBox title="Staff Account Linking" icon={Users}>
      <p className="text-xs mb-5" style={{ color: 'var(--text-ghost)' }}>
        Link each staff member to their login account so they can access the Self-Service Portal.
        Create accounts first via Supabase Auth → Invite User, then link them here.
      </p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <div className="text-2xl font-bold" style={{ color: '#34D399' }}>{linked.length}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-ghost)' }}>Linked</div>
        </div>
        <div className="rounded-xl px-4 py-3 text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="text-2xl font-bold" style={{ color: '#FCD34D' }}>{unlinked.length}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-ghost)' }}>Unlinked</div>
        </div>
      </div>

      {loading ? <p className="text-xs py-4 text-center" style={{ color: 'var(--text-ghost)' }}>Loading…</p> : (
        <div className="space-y-2">
          {staff.map((s: any) => (
            <div key={s.id} className="rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.user_id ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.08)'}` }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.full_name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--violet-300)' }}>{s.staff_id}</span>
                    {s.user_id && <CheckCircle className="w-3.5 h-3.5" style={{ color: '#34D399' }} />}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-ghost)' }}>
                    {s.centre?.name ?? '—'} · {s.designation_text ?? '—'}
                    {s.user_id && <span className="ml-2 font-mono text-[10px]">{s.user_id.slice(0, 8)}…</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {s.user_id
                    ? <button onClick={() => handleUnlink(s.id, s.full_name)} disabled={busy}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium hover:opacity-80 disabled:opacity-40"
                        style={{ background: 'rgba(244,63,94,0.1)', color: '#FB7185', border: '1px solid rgba(244,63,94,0.2)' }}>
                        <Unlink className="w-3 h-3" /> Unlink
                      </button>
                    : <button onClick={() => { setLinking(l => l === s.id ? null : s.id); setEmailInput('') }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium hover:opacity-80"
                        style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--violet-300)', border: '1px solid rgba(124,58,237,0.25)' }}>
                        <Link2 className="w-3 h-3" /> Link Account
                      </button>
                  }
                  <button
                    onClick={() => handleSync(s)}
                    disabled={syncState[s.id] === 'loading' || syncState[s.id] === 'done' || syncState[s.id] === 'exists'}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium hover:opacity-80 disabled:opacity-50"
                    style={syncColor(syncState[s.id] ?? 'idle')}
                    title={s.email ? `Sync ${s.email} to fets.live` : 'No email on file'}
                  >
                    {syncLabel(syncState[s.id] ?? 'idle')}
                  </button>
                </div>
              </div>
              {linking === s.id && (
                <div className="mt-3 flex items-center gap-2">
                  <input value={emailInput} onChange={e => setEmailInput(e.target.value)}
                    placeholder="Enter staff member's login email…"
                    onKeyDown={e => e.key === 'Enter' && handleLink(s.id)}
                    className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.25)', color: 'var(--text-primary)' }} />
                  <button onClick={() => handleLink(s.id)} disabled={busy || !emailInput.trim()}
                    className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#9B6DFF,#6D28D9)', color: 'white' }}>
                    {busy ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Link'}
                  </button>
                  <button onClick={() => setLinking(null)} className="px-2 py-2 rounded-xl text-xs" style={{ color: 'var(--text-ghost)' }}>✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </CardBox>
  )
}

// ── Main Settings Page ────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'org',     label: 'Organisation',      icon: Building2 },
  { id: 'docs',    label: 'Document Defaults', icon: FileText  },
  { id: 'leave',   label: 'Leave Types',       icon: Calendar  },
  { id: 'centres', label: 'Centres',           icon: MapPin    },
  { id: 'users',   label: 'User Accounts',     icon: Users     },
]

export default function SettingsPage() {
  const [tab, setTab]           = useState<Tab>('org')
  const [settings, setSettings] = useState<Record<string, string> | null>(null)
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => { getAdminSettings().then(setSettings) }, [])

  const handleSave = async (updates: Record<string, string>) => {
    const res = await upsertAdminSettings(updates)
    if (!res.ok) showToast(res.error ?? 'Save failed', false)
    else { showToast('Settings saved', true); setSettings(s => ({ ...s, ...updates })) }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(109,40,217,0.2))', border: '1px solid rgba(124,58,237,0.2)' }}>
          <Building2 className="w-4 h-4" style={{ color: 'var(--violet-400)' }} />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Admin Settings</h1>
          <p className="text-xs" style={{ color: 'var(--text-ghost)' }}>Company details, document config, leave types, centres, user accounts</p>
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
                background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(109,40,217,0.1))',
                borderBottom: '2px solid var(--violet-500)', color: 'var(--text-primary)',
              } : {
                background: 'transparent', borderBottom: '2px solid transparent', color: 'var(--text-ghost)',
              }}>
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {settings === null ? (
        <div className="flex items-center justify-center py-24">
          <RefreshCw className="w-6 h-6 animate-spin" style={{ color: 'var(--violet-400)' }} />
        </div>
      ) : (
        <>
          {tab === 'org'     && <OrgTab     settings={settings} onSave={handleSave} />}
          {tab === 'docs'    && <DocsTab    settings={settings} onSave={handleSave} />}
          {tab === 'leave'   && <LeaveTypesTab onToast={showToast} />}
          {tab === 'centres' && <CentresTab    onToast={showToast} />}
          {tab === 'users'   && <UsersTab       onToast={showToast} />}
        </>
      )}
    </div>
  )
}
