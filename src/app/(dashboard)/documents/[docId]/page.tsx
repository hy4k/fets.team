import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getGeneratedDocument } from '@/lib/actions/documents'
import { getDocTitle } from '@/lib/templates/documentFields'
import DocumentActions from './DocumentActions'

interface Props { params: Promise<{ docId: string }> }

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-[#3A3A4E] text-[#8A8AA0]',
  generated: 'bg-[#1E3A2E] text-[#34D399]',
  approved:  'bg-[#1B3A1B] text-[#4ADE80]',
  rejected:  'bg-[#3A1B1B] text-[#F87171]',
  archived:  'bg-[#2A2A1E] text-[#FBBF24]',
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex py-2.5 border-b border-[#1E1E2E] last:border-0">
      <dt className="w-44 text-xs text-[#5A5A72] flex-shrink-0 pt-0.5">{label}</dt>
      <dd className="text-sm text-white">{value || '—'}</dd>
    </div>
  )
}

export default async function DocumentViewPage({ params }: Props) {
  const { docId } = await params
  const doc = await getGeneratedDocument(docId)
  if (!doc) notFound()

  const title = getDocTitle(doc.doc_type)
  const staff = doc.staff
  const fv = doc.field_values

  // Build field display list
  const displayFields = Object.entries(fv).filter(([k]) => k !== 'letter_date')

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/document-history" className="p-2 hover:bg-[#1E1E2E] rounded-lg text-[#8A8AA0] hover:text-white transition-colors mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[doc.status] || STATUS_STYLES.generated}`}>
                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
              </span>
            </div>
            <p className="text-sm text-[#5A5A72] mt-1">
              {doc.doc_number} &nbsp;·&nbsp; Generated {new Date(doc.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <DocumentActions doc={doc} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Staff info */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#5A5A72] uppercase tracking-wider mb-4">Staff</h3>
          {staff ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F5C518] flex items-center justify-center text-black font-bold text-sm">
                  {staff.full_name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{staff.full_name}</div>
                  <div className="text-xs text-[#5A5A72]">{staff.staff_id}</div>
                </div>
              </div>
              {staff.designation_text && <div className="text-xs text-[#8A8AA0]">{staff.designation_text}</div>}
              {staff.centre && <div className="text-xs text-[#5A5A72]">{staff.centre.name}</div>}
            </div>
          ) : (
            <p className="text-sm text-[#3A3A4E]">No staff linked</p>
          )}
        </div>

        {/* Document info */}
        <div className="lg:col-span-2 bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
          <h3 className="text-xs font-semibold text-[#5A5A72] uppercase tracking-wider mb-4">Document Fields</h3>
          <dl>
            <Row label="Document Date" value={fv.letter_date || '—'} />
            {displayFields.map(([k, v]) => (
              <Row key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={String(v)} />
            ))}
          </dl>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
        <h3 className="text-xs font-semibold text-[#5A5A72] uppercase tracking-wider mb-4">Metadata</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2">
          <Row label="Document Number" value={doc.doc_number} />
          <Row label="Document Type" value={doc.doc_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
          <Row label="Status" value={doc.status} />
          <Row label="Version" value={String(doc.version)} />
          <Row label="Verification ID" value={doc.verification_id} />
          {doc.approval_date && <Row label="Approved On" value={new Date(doc.approval_date).toLocaleString('en-IN')} />}
          {doc.approval_remarks && <Row label="Remarks" value={doc.approval_remarks} />}
        </dl>
      </div>
    </div>
  )
}
