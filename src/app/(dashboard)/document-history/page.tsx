import Link from 'next/link'
import Header from '@/components/layout/Header'
import { getGeneratedDocuments } from '@/lib/actions/documents'
import { getDocTitle } from '@/lib/templates/documentFields'
import type { GeneratedDocument } from '@/lib/types'

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-[#2A2A3E] text-[#6A6A8A]',
  generated: 'bg-[#1E3A2E] text-[#34D399]',
  approved:  'bg-[#1B3A1B] text-[#4ADE80]',
  rejected:  'bg-[#3A1B1B] text-[#F87171]',
  archived:  'bg-[#2A2A1E] text-[#FBBF24]',
  submitted: 'bg-[#1E2A3E] text-[#60A5FA]',
}

const CAT_COLORS: Record<string, string> = {
  offer: '#3B82F6', appointment: '#3B82F6', confirmation: '#3B82F6', experience: '#10B981',
  relieving: '#EF4444', appreciation: '#F59E0B', leave: '#10B981', warning: '#EF4444',
  payslip: '#8B5CF6', salary: '#8B5CF6', increment: '#8B5CF6',
  authorization: '#06B6D4', id_card: '#F97316', asset: '#F97316', uniform: '#F97316',
  internship: '#EC4899', training: '#EC4899', nda: '#6366F1', cert: '#14B8A6',
}

function getColor(docType: string) {
  for (const [key, color] of Object.entries(CAT_COLORS)) {
    if (docType.startsWith(key)) return color
  }
  return '#F5C518'
}

function DocRow({ doc }: { doc: GeneratedDocument }) {
  const title = getDocTitle(doc.doc_type)
  const date = new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const color = getColor(doc.doc_type)

  return (
    <Link href={`/documents/${doc.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#14141C] transition-colors border-b border-[#1A1A28] last:border-0">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ backgroundColor: color + '22', color }}
      >
        {title.charAt(0)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{title}</div>
        <div className="text-xs text-[#5A5A72] mt-0.5">
          {doc.doc_number}
          {doc.staff && <span> · {doc.staff.full_name} ({doc.staff.staff_id})</span>}
        </div>
      </div>

      <div className="hidden sm:block text-xs text-[#5A5A72] w-24 text-right flex-shrink-0">{date}</div>

      <div className="flex-shrink-0">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[doc.status] || STATUS_BADGE.generated}`}>
          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
        </span>
      </div>

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#3A3A4E] flex-shrink-0">
        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}

export default async function DocumentHistoryPage() {
  const docs = await getGeneratedDocuments({ limit: 100 })

  const stats = {
    total: docs.length,
    generated: docs.filter(d => d.status === 'generated').length,
    approved: docs.filter(d => d.status === 'approved').length,
    draft: docs.filter(d => d.status === 'draft').length,
  }

  return (
    <div className="animate-fade-in">
      <Header title="Document History" subtitle="All generated documents and approval status" />
      <div className="p-6 max-w-5xl mx-auto space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: '#F5C518' },
            { label: 'Generated', value: stats.generated, color: '#34D399' },
            { label: 'Approved', value: stats.approved, color: '#4ADE80' },
            { label: 'Draft', value: stats.draft, color: '#6A6A8A' },
          ].map(s => (
            <div key={s.label} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-[#5A5A72] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">All Documents</h3>
          <Link
            href="/documents/new"
            className="flex items-center gap-2 px-4 py-2 bg-[#F5C518] text-black rounded-xl text-sm font-semibold hover:bg-[#E0B416] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            New Document
          </Link>
        </div>

        {/* Document list */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden">
          {docs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-[#5A5A72] text-sm">No documents generated yet</p>
              <Link href="/documents/new" className="inline-block mt-4 px-4 py-2 bg-[#F5C518] text-black rounded-lg text-sm font-semibold hover:bg-[#E0B416] transition-colors">
                Generate First Document
              </Link>
            </div>
          ) : (
            docs.map(doc => <DocRow key={doc.id} doc={doc} />)
          )}
        </div>
      </div>
    </div>
  )
}
