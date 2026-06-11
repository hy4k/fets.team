import { getDocumentByVerificationId } from '@/lib/actions/verify'
import { getAdminSettings } from '@/lib/actions/documents'

interface Props { params: Promise<{ verificationId: string }> }

const DOC_TYPE_LABELS: Record<string, string> = {
  offer_letter:         'Offer Letter',
  appointment_letter:   'Appointment Letter',
  experience_letter:    'Experience Letter',
  relieving_letter:     'Relieving Letter',
  salary_certificate:   'Salary Certificate',
  noc:                  'No Objection Certificate',
  promotion_letter:     'Promotion Letter',
  warning_letter:       'Warning Letter',
  increment_letter:     'Increment Letter',
  termination_letter:   'Termination Letter',
  payslip:              'Payslip',
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    generated: { label: 'Active',   color: '#34D399', bg: 'rgba(16,185,129,0.12)' },
    approved:  { label: 'Approved', color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
    draft:     { label: 'Draft',    color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
    rejected:  { label: 'Rejected', color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
    archived:  { label: 'Archived', color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  }
  const s = map[status] ?? { label: status, color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' }
  return (
    <span style={{
      display: 'inline-block', padding: '0.3rem 0.85rem',
      borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700,
      color: s.color, background: s.bg, border: `1px solid ${s.color}30`,
    }}>{s.label}</span>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.3rem 0' }}>
      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, flexShrink: 0, paddingRight: '1rem' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.82rem', color: '#e2e2f0', fontWeight: 500, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

function BrandHeader({ orgName }: { orgName: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: 38, height: 38, borderRadius: '10px',
          background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', fontWeight: 900, color: '#fff',
        }}>F</div>
        <span style={{ color: '#A78BFA', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>{orgName}</span>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Document Verification Portal
      </p>
    </div>
  )
}

function ValidPage({ doc, orgName }: {
  doc: NonNullable<Awaited<ReturnType<typeof getDocumentByVerificationId>>>
  orgName: string
}) {
  const docLabel = DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type.replace(/_/g, ' ')
  const isActive = ['generated', 'approved'].includes(doc.status)

  return (
    <div style={{
      minHeight: '100vh', background: '#0C0C16',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '2rem',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <BrandHeader orgName={orgName} />

        <div style={{
          background: 'linear-gradient(135deg, rgba(20,20,35,0.95), rgba(15,15,28,0.98))',
          border: isActive ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(251,191,36,0.2)',
          borderRadius: '20px', padding: '2rem 2rem 1.75rem',
          boxShadow: isActive
            ? '0 0 40px rgba(52,211,153,0.06), 0 20px 60px rgba(0,0,0,0.4)'
            : '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, borderRadius: '50%',
              background: isActive ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
              border: isActive ? '2px solid rgba(52,211,153,0.3)' : '2px solid rgba(251,191,36,0.3)',
              marginBottom: '1rem',
            }}>
              {isActive ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#fff', marginBottom: '0.3rem' }}>
              {isActive ? 'Document Verified ✓' : 'Document Notice'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)' }}>
              {isActive
                ? `Authentic document issued by ${orgName}`
                : 'This document exists but is not currently active'}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '1.25rem 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Row label="Document Type"  value={docLabel} />
            <Row label="Document No."   value={doc.doc_number} />
            <Row label="Issued To"      value={doc.staff?.full_name ?? '—'} />
            {doc.staff?.designation_text && <Row label="Designation" value={doc.staff.designation_text} />}
            {doc.staff?.centre?.name    && <Row label="Centre"       value={doc.staff.centre.name} />}
            <Row label="Issue Date"     value={fmtDate(doc.created_at)} />
            {doc.approval_date          && <Row label="Approved On"  value={fmtDate(doc.approval_date)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0' }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Status</span>
              <StatusPill status={doc.status} />
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '1.25rem 0' }} />

          <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: '10px', padding: '0.7rem 0.9rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>
              Verification ID
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all' }}>
              {doc.verification_id}
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', marginTop: '1.5rem' }}>
          Verified · fets.team
        </p>
      </div>
    </div>
  )
}

function InvalidPage({ orgName }: { orgName: string }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0C0C16',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '2rem',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
        <BrandHeader orgName={orgName} />
        <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '20px', padding: '2.5rem 2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(244,63,94,0.12)', border: '2px solid rgba(244,63,94,0.3)', marginBottom: '1.25rem',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.6rem' }}>Document Not Found</h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            This verification link is invalid or the document no longer exists.
            If you believe this is an error, contact {orgName} directly.
          </p>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', marginTop: '1.5rem' }}>fets.team · Document Verification Portal</p>
      </div>
    </div>
  )
}

export default async function VerifyPage({ params }: Props) {
  const { verificationId } = await params
  const [doc, settings] = await Promise.all([
    getDocumentByVerificationId(verificationId),
    getAdminSettings().catch(() => ({ company_name: 'FETS' })),
  ])
  const orgName = (settings as Record<string, string>).company_name ?? 'FETS'
  if (!doc) return <InvalidPage orgName={orgName} />
  return <ValidPage doc={doc} orgName={orgName} />
}
