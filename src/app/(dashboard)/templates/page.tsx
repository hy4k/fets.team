'use client'

import { useState, useTransition, useEffect } from 'react'
import Header from '@/components/layout/Header'
import {
  Folder, FileText, CheckCircle, XCircle, Edit2, Save,
  X, ToggleLeft, ToggleRight, Stamp, PenLine, QrCode, BookOpen,
  ChevronDown, ChevronRight,
} from 'lucide-react'
import { getAllTemplates, toggleTemplateActive, updateTemplateMeta } from '@/lib/actions/templates'
import type { DocumentTemplate } from '@/lib/types'

const CAT_COLOR: Record<string, string> = {
  'HR Letters':    '#3B82F6',
  'Finance':       '#8B5CF6',
  'Operations':    '#F59E0B',
  'Certificates':  '#10B981',
  'Certifications':'#14B8A6',
  'Disciplinary':  '#EF4444',
  'Legal':         '#6366F1',
}

function getCatColor(cat: string) {
  return CAT_COLOR[cat] ?? '#F5C518'
}

interface EditState {
  name: string
  description: string
  has_letterhead: boolean
  has_signature: boolean
  has_seal: boolean
  has_qr: boolean
}

function TemplateCard({
  tpl,
  onToggle,
  onSaveMeta,
}: {
  tpl: DocumentTemplate
  onToggle: (id: string, val: boolean) => void
  onSaveMeta: (id: string, data: EditState) => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditState>({
    name: tpl.name,
    description: tpl.description ?? '',
    has_letterhead: tpl.has_letterhead,
    has_signature: tpl.has_signature,
    has_seal: tpl.has_seal,
    has_qr: tpl.has_qr,
  })

  const color = getCatColor(tpl.category)

  return (
    <div className={`bg-[#12121A] border rounded-xl overflow-hidden transition-all ${tpl.is_active ? 'border-[#1E1E2E]' : 'border-[#1A1A1A] opacity-60'}`}>
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + '18' }}
        >
          <FileText className="w-4 h-4" style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              className="w-full bg-[#0D0D15] border border-[#2A2A3E] rounded-lg px-3 py-1.5 text-sm text-[#F0F0F5] focus:outline-none focus:border-[#F5C518]/50"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          ) : (
            <div className="text-sm font-semibold text-[#F0F0F5] truncate">{tpl.name}</div>
          )}
          <div className="text-[10px] text-[#3A3A55] mt-0.5 font-mono">{tpl.template_key}</div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Edit / Save / Cancel */}
          {editing ? (
            <>
              <button
                onClick={() => { onSaveMeta(tpl.id, form); setEditing(false) }}
                className="p-1.5 rounded-lg bg-[#F5C518]/10 hover:bg-[#F5C518]/20 text-[#F5C518] transition-colors"
                title="Save"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setForm({ name: tpl.name, description: tpl.description ?? '', has_letterhead: tpl.has_letterhead, has_signature: tpl.has_signature, has_seal: tpl.has_seal, has_qr: tpl.has_qr }); setEditing(false) }}
                className="p-1.5 rounded-lg bg-[#2A2A3E] hover:bg-[#3A3A4E] text-[#6A6A8A] transition-colors"
                title="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg bg-[#1E1E2E] hover:bg-[#2A2A3E] text-[#5A5A72] hover:text-[#F5C518] transition-colors"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Active toggle */}
          <button
            onClick={() => onToggle(tpl.id, !tpl.is_active)}
            className={`p-1.5 rounded-lg transition-colors ${tpl.is_active ? 'bg-[#22C55E]/10 hover:bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#2A2A3E] hover:bg-[#3A3A4E] text-[#5A5A72]'}`}
            title={tpl.is_active ? 'Deactivate' : 'Activate'}
          >
            {tpl.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Description row */}
      {editing ? (
        <div className="px-4 pb-3">
          <input
            placeholder="Description..."
            className="w-full bg-[#0D0D15] border border-[#2A2A3E] rounded-lg px-3 py-1.5 text-xs text-[#8B8BA0] focus:outline-none focus:border-[#F5C518]/50 placeholder-[#3A3A55]"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          />
        </div>
      ) : tpl.description ? (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-xs text-[#5A5A72]">{tpl.description}</p>
        </div>
      ) : null}

      {/* Features row */}
      <div className="px-4 pb-4 flex flex-wrap gap-2">
        {(
          [
            { key: 'has_letterhead', label: 'Letterhead', icon: BookOpen },
            { key: 'has_signature',  label: 'Signature',  icon: PenLine },
            { key: 'has_seal',       label: 'Seal',       icon: Stamp },
            { key: 'has_qr',         label: 'QR Code',    icon: QrCode },
          ] as const
        ).map(({ key, label, icon: Icon }) => {
          const active = editing ? form[key] : tpl[key]
          return editing ? (
            <button
              key={key}
              onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                form[key]
                  ? 'bg-[#F5C518]/10 border-[#F5C518]/30 text-[#F5C518]'
                  : 'bg-[#1A1A28] border-[#1E1E2E] text-[#3A3A55]'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ) : active ? (
            <span key={key} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-[#F5C518]/8 border border-[#F5C518]/15 text-[#F5C518]/80">
              <Icon className="w-3 h-3" />
              {label}
            </span>
          ) : null
        })}
        {!editing && !tpl.has_letterhead && !tpl.has_signature && !tpl.has_seal && !tpl.has_qr && (
          <span className="text-[10px] text-[#2A2A3E]">No special features</span>
        )}
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({})

  useEffect(() => {
    getAllTemplates().then(data => {
      setTemplates(data)
      // Expand all categories by default
      const cats = Array.from(new Set(data.map(t => t.category)))
      const expanded: Record<string, boolean> = {}
      cats.forEach(c => { expanded[c] = true })
      setExpandedCats(expanded)
      setLoading(false)
    })
  }, [])

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  function handleToggle(id: string, val: boolean) {
    startTransition(async () => {
      const res = await toggleTemplateActive(id, val)
      if (res.ok) {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: val } : t))
        showToast(val ? 'Template activated' : 'Template deactivated', true)
      } else {
        showToast(res.error ?? 'Error', false)
      }
    })
  }

  function handleSaveMeta(id: string, data: EditState) {
    startTransition(async () => {
      const res = await updateTemplateMeta(id, data)
      if (res.ok) {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
        showToast('Template updated', true)
      } else {
        showToast(res.error ?? 'Error', false)
      }
    })
  }

  // Group by category
  const grouped: Record<string, DocumentTemplate[]> = {}
  for (const t of templates) {
    if (!grouped[t.category]) grouped[t.category] = []
    grouped[t.category].push(t)
  }

  const totalActive = templates.filter(t => t.is_active).length

  return (
    <div className="animate-fade-in">
      <Header
        title="Template Library"
        subtitle={loading ? 'Loading...' : `${templates.length} templates · ${totalActive} active`}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all ${
          toast.ok ? 'bg-[#1B3A1B] border border-[#22C55E]/30 text-[#34D399]' : 'bg-[#3A1B1B] border border-[#EF4444]/30 text-[#F87171]'
        }`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="p-6 max-w-[1400px] mx-auto space-y-5">

        {/* Info banner */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 flex items-start gap-3">
          <Folder className="w-5 h-5 text-[#F5C518] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-[#8B8BA0]">
              These are the document types available in the Generator. Toggle a template off to hide it from the generator. 
              Edit metadata to update names, descriptions, and rendering options (letterhead, signature, seal, QR).
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#F5C518]/30 border-t-[#F5C518] rounded-full animate-spin" />
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => {
            const isExpanded = expandedCats[category] ?? true
            const color = getCatColor(category)
            const activeCount = items.filter(t => t.is_active).length
            return (
              <div key={category} className="space-y-3">
                {/* Category header */}
                <button
                  onClick={() => setExpandedCats(p => ({ ...p, [category]: !isExpanded }))}
                  className="flex items-center gap-3 w-full text-left group"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color + '18' }}>
                    <Folder className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <span className="text-sm font-semibold text-[#F0F0F5]">{category}</span>
                  <span className="text-xs text-[#3A3A55] font-mono ml-1">{activeCount}/{items.length}</span>
                  <div className="flex-1 h-px bg-[#1E1E2E] ml-2" />
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#3A3A55] group-hover:text-[#5A5A72] transition-colors" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#3A3A55] group-hover:text-[#5A5A72] transition-colors" />
                  )}
                </button>

                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pl-0">
                    {items.map(tpl => (
                      <TemplateCard
                        key={tpl.id}
                        tpl={tpl}
                        onToggle={handleToggle}
                        onSaveMeta={handleSaveMeta}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
