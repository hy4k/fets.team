'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DOC_TYPES, getDocType, FieldDef } from '@/lib/templates/documentFields'
import { renderDocument } from '@/lib/templates/documentRenderer'
import { createGeneratedDocument, getAdminSettings } from '@/lib/actions/documents'
import { getStaffList } from '@/lib/actions/staff'
import type { Staff } from '@/lib/types'

// ─── Icon helpers ─────────────────────────────────────────────
const Icon = ({ path, size = 18 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
)
const ICONS = {
  doc:     'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
  chevron: 'M19 9l-7 7-7-7',
  print:   'M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z',
  save:    'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z M17 21v-8H7v8 M7 3v5h8',
  back:    'M19 12H5 M12 19l-7-7 7-7',
  eye:     'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  search:  'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
}

// ─── Category colors ──────────────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  'Employment':    '#3B82F6',
  'Separation':    '#EF4444',
  'Recognition':   '#F59E0B',
  'Leave':         '#10B981',
  'Finance':       '#8B5CF6',
  'Authorization': '#06B6D4',
  'ID & Assets':   '#F97316',
  'Training':      '#EC4899',
  'Legal':         '#6366F1',
  'Certification': '#14B8A6',
}

// ─── Field renderer ───────────────────────────────────────────
function FormField({ field, value, onChange }: {
  field: FieldDef
  value: string
  onChange: (val: string) => void
}) {
  const base = 'w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#3A3A4E] focus:outline-none focus:border-[#F5C518] transition-colors'

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#8A8AA0] uppercase tracking-wider">
        {field.label}
        {field.required && <span className="text-[#EF4444] ml-1">*</span>}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          className={`${base} resize-none`}
          rows={field.rows || 3}
          placeholder={field.placeholder || ''}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : field.type === 'select' && field.options ? (
        <select
          className={base}
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Select {field.label}</option>
          {field.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : field.type === 'date' ? (
        <input
          type="date"
          className={`${base} [color-scheme:dark]`}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : field.type === 'currency' ? (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8AA0] text-sm">₹</span>
          <input
            type="number"
            className={`${base} pl-7`}
            placeholder={field.placeholder || '0.00'}
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      ) : field.type === 'number' ? (
        <input
          type="number"
          className={base}
          placeholder={field.placeholder || ''}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={base}
          placeholder={field.placeholder || ''}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      )}

      {field.hint && (
        <p className="text-[10px] text-[#5A5A72]">{field.hint}</p>
      )}
    </div>
  )
}

// ─── Staff search dropdown ────────────────────────────────────
function StaffSelector({ staff, selected, onSelect }: {
  staff: Staff[]
  selected: Staff | null
  onSelect: (s: Staff | null) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = staff.filter(s =>
    s.full_name.toLowerCase().includes(query.toLowerCase()) ||
    s.staff_id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8)

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-[#8A8AA0] uppercase tracking-wider mb-1.5">
        Staff Member <span className="text-[#5A5A72] normal-case">(optional — for auto-fill)</span>
      </label>
      <div
        className="flex items-center gap-2 bg-[#0A0A0F] border border-[#1E1E2E] rounded-lg px-3 py-2.5 cursor-pointer hover:border-[#2E2E3E] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {selected ? (
          <>
            <div className="w-7 h-7 rounded-full bg-[#F5C518] flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
              {selected.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white font-medium truncate">{selected.full_name}</div>
              <div className="text-[10px] text-[#5A5A72]">{selected.staff_id} · {selected.designation_text || ''}</div>
            </div>
            <button
              className="text-[#5A5A72] hover:text-white ml-auto"
              onClick={e => { e.stopPropagation(); onSelect(null); setQuery('') }}
            >×</button>
          </>
        ) : (
          <>
            <Icon path={ICONS.search} size={15} />
            <span className="text-[#3A3A4E] text-sm">Search staff by name or ID…</span>
          </>
        )}
        <Icon path={ICONS.chevron} size={14} />
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-[#12121A] border border-[#1E1E2E] rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[#1E1E2E]">
            <input
              autoFocus
              type="text"
              className="w-full bg-[#0A0A0F] border border-[#1E1E2E] rounded px-3 py-1.5 text-sm text-white placeholder-[#3A3A4E] focus:outline-none focus:border-[#F5C518]"
              placeholder="Search…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#5A5A72]">No staff found</div>
            ) : filtered.map(s => (
              <div
                key={s.id}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#1E1E2E] cursor-pointer"
                onClick={() => { onSelect(s); setOpen(false); setQuery('') }}
              >
                <div className="w-7 h-7 rounded-full bg-[#F5C518] flex items-center justify-center text-black font-bold text-xs flex-shrink-0">
                  {s.full_name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm text-white">{s.full_name}</div>
                  <div className="text-[10px] text-[#5A5A72]">{s.staff_id} · {s.designation_text || (s.designation?.title || '')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function NewDocumentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'select' | 'fill'>('select')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [catFilter, setCatFilter] = useState<string | null>(null)

  useEffect(() => {
    getStaffList({ status: 'active' }).then(s => setStaffList(s))
    getAdminSettings().then(s => setSettings(s))
    // Auto-select type from query param (e.g. /documents/new?type=offer_letter)
    const typeParam = searchParams.get('type')
    if (typeParam && getDocType(typeParam)) {
      handleSelectType(typeParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const docDef = selectedType ? getDocType(selectedType) : null

  // Auto-fill fields from selected staff
  useEffect(() => {
    if (!docDef || !selectedStaff) return
    setFields(prev => {
      const next = { ...prev }
      for (const f of docDef.fields) {
        if (f.prefillFromStaff) {
          const key = f.prefillFromStaff as keyof Staff
          let val = ''
          if (key === 'full_name') val = selectedStaff.full_name || ''
          else if (key === 'staff_id') val = selectedStaff.staff_id || ''
          else if (key === 'phone') val = selectedStaff.phone || ''
          else if (key === 'email') val = selectedStaff.email || ''
          else if (key === 'date_of_joining') val = selectedStaff.date_of_joining || ''
          else if (key === 'salary') val = selectedStaff.salary ? String(selectedStaff.salary) : ''
          else if (key === 'designation_text') val = selectedStaff.designation_text || selectedStaff.designation?.title || ''
          else if (key === 'department') val = selectedStaff.department?.name || ''
          else if (key === 'centre') val = selectedStaff.centre?.name || ''
          if (val && (!next[f.key] || next[f.key] === '')) next[f.key] = val
        }
      }
      return next
    })
  }, [selectedStaff, docDef])

  // Rebuild preview
  const rebuildPreview = useCallback(() => {
    if (!selectedType || !docDef) return
    const today = new Date().toISOString().slice(0, 10)
    const html = renderDocument({
      docType: selectedType,
      fields: { letter_date: today, ...fields },
      docNumber: 'FETS/PREVIEW',
      companyName: settings.company_name,
      companyEmail: settings.company_email,
      companyPhone: settings.company_phone,
      companyWebsite: settings.company_website,
    })
    setPreviewHtml(html)
  }, [selectedType, docDef, fields, settings])

  useEffect(() => {
    rebuildPreview()
  }, [rebuildPreview])

  function handleSelectType(key: string) {
    setSelectedType(key)
    setFields({ letter_date: new Date().toISOString().slice(0, 10) })
    setSelectedStaff(null)
    setStep('fill')
    setShowPreview(false)
  }

  async function handleSave(openPrint = false) {
    if (!selectedType) return
    setSaving(true)
    const res = await createGeneratedDocument({
      docType: selectedType,
      staffId: selectedStaff?.id || null,
      fieldValues: fields,
      status: 'generated',
    })
    setSaving(false)
    if ('error' in res) {
      alert('Error: ' + res.error)
      return
    }
    if (openPrint) {
      window.open(`/print/documents/${res.id}`, '_blank')
    }
    router.push(`/documents/${res.id}`)
  }

  // Group doc types by category
  const categories = Array.from(new Set(Object.values(DOC_TYPES).map(d => d.category)))
  const filteredTypes = Object.values(DOC_TYPES).filter(d =>
    !catFilter || d.category === catFilter
  )

  // ── Step 1: Select document type
  if (step === 'select') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#1E1E2E] rounded-lg text-[#8A8AA0] hover:text-white transition-colors">
            <Icon path={ICONS.back} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Generate Document</h1>
            <p className="text-sm text-[#5A5A72] mt-0.5">Select a document type to get started</p>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setCatFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!catFilter ? 'bg-[#F5C518] text-black' : 'bg-[#1E1E2E] text-[#8A8AA0] hover:text-white'}`}
          >All</button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat === catFilter ? null : cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${catFilter === cat ? 'text-black' : 'bg-[#1E1E2E] text-[#8A8AA0] hover:text-white'}`}
              style={catFilter === cat ? { backgroundColor: CAT_COLORS[cat] || '#F5C518' } : {}}
            >{cat}</button>
          ))}
        </div>

        {/* Doc type grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredTypes.map(doc => (
            <button
              key={doc.key}
              onClick={() => handleSelectType(doc.key)}
              className="text-left p-4 bg-[#12121A] border border-[#1E1E2E] rounded-xl hover:border-[#2E2E3E] hover:bg-[#16161F] transition-all group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-sm font-bold"
                style={{ backgroundColor: (CAT_COLORS[doc.category] || '#F5C518') + '22', color: CAT_COLORS[doc.category] || '#F5C518' }}
              >
                {doc.name.charAt(0)}
              </div>
              <div className="text-sm font-semibold text-white group-hover:text-[#F5C518] transition-colors leading-tight mb-1">{doc.name}</div>
              <div className="text-[10px] text-[#5A5A72]">{doc.category}</div>
              <div className="text-[10px] text-[#3A3A4E] mt-1.5 leading-relaxed">{doc.description}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Step 2: Fill form + preview
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1E1E2E] bg-[#0D0D15]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('select')}
            className="p-2 hover:bg-[#1E1E2E] rounded-lg text-[#8A8AA0] hover:text-white transition-colors"
          >
            <Icon path={ICONS.back} />
          </button>
          <div>
            <h2 className="text-white font-semibold">{docDef?.name}</h2>
            <p className="text-xs text-[#5A5A72]">{docDef?.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(p => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${showPreview ? 'bg-[#F5C518] text-black' : 'bg-[#1E1E2E] text-[#8A8AA0] hover:text-white'}`}
          >
            <Icon path={ICONS.eye} size={15} />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 bg-[#1E1E2E] text-[#8A8AA0] hover:text-white rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <Icon path={ICONS.print} size={15} />
            Save & Print
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[#F5C518] text-black rounded-lg text-sm font-semibold hover:bg-[#E0B416] transition-colors disabled:opacity-50"
          >
            <Icon path={ICONS.save} size={15} />
            {saving ? 'Saving…' : 'Save Document'}
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className={`flex-1 overflow-hidden flex ${showPreview ? 'divide-x divide-[#1E1E2E]' : ''}`}>
        {/* Form panel */}
        <div className={`overflow-y-auto p-6 space-y-5 ${showPreview ? 'w-1/2' : 'max-w-2xl mx-auto w-full'}`}>
          {/* Staff selector */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
            <StaffSelector
              staff={staffList}
              selected={selectedStaff}
              onSelect={setSelectedStaff}
            />
            {selectedStaff && (
              <p className="text-[10px] text-[#F5C518] mt-2">
                ✓ Auto-filled {docDef?.fields.filter(f => f.prefillFromStaff).length || 0} fields from staff record
              </p>
            )}
          </div>

          {/* Document fields */}
          {docDef && (
            <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 space-y-4">
              <h3 className="text-xs font-semibold text-[#8A8AA0] uppercase tracking-wider">Document Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {docDef.fields.map(field => (
                  <div key={field.key} className={field.type === 'textarea' ? 'col-span-full' : ''}>
                    <FormField
                      field={field}
                      value={fields[field.key] || ''}
                      onChange={val => setFields(prev => ({ ...prev, [field.key]: val }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live preview panel */}
        {showPreview && (
          <div className="w-1/2 overflow-y-auto bg-[#0A0A0F] p-4">
            <div className="text-xs text-[#5A5A72] mb-3 font-medium uppercase tracking-wider">Live Preview — A4</div>
            <div
              className="bg-white rounded-lg shadow-xl mx-auto overflow-hidden"
              style={{ width: '210mm', minHeight: '297mm', transformOrigin: 'top left', transform: 'scale(0.6)', marginBottom: '-40%' }}
            >
              <iframe
                srcDoc={previewHtml}
                className="w-full border-none"
                style={{ height: '297mm' }}
                title="Document preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
