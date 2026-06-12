import Header from '@/components/layout/Header'
import Link from 'next/link'
import { Users, FileText, Globe, ArrowUpRight } from 'lucide-react'
import { getCentresSummary, getCertBreakdown } from '@/lib/actions/dashboard'

export const dynamic = 'force-dynamic'

// ─── Portal card (adapted glow-card design) ─────────────────────
function PortalCard({
  href, title, sub, icon: Icon, glow, external,
}: {
  href: string
  title: string
  sub: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  glow: string
  external?: boolean
}) {
  const inner = (
    <div className="relative drop-shadow-xl w-full h-52 overflow-hidden rounded-2xl transition-transform duration-300 group-hover:-translate-y-1.5"
      style={{ background: glow }}>
      {/* dark inner layer */}
      <div className="absolute z-[1] opacity-95 rounded-2xl inset-0.5"
        style={{ background: 'linear-gradient(165deg, #0B1612, #060D0A)' }} />
      {/* roaming glow */}
      <div className="absolute w-56 h-48 blur-[55px] -left-1/4 -top-1/3 opacity-60 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glow }} />
      {/* content */}
      <div className="absolute z-[2] inset-0 flex flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(226,194,133,0.07)', border: '1px solid rgba(226,194,133,0.14)' }}>
            <Icon className="w-[18px] h-[18px]" style={{ color: 'var(--brass-400)' }} />
          </div>
          <ArrowUpRight className="w-4 h-4 transition-all duration-300 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
            style={{ color: 'var(--brass-400)' }} />
        </div>
        <div>
          <h2 className="font-display text-[1.65rem] font-semibold tracking-wide text-[#EDEFE9]">{title}</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>
      </div>
    </div>
  )
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group flex-1 min-w-[220px]">{inner}</a>
  ) : (
    <Link href={href} className="group flex-1 min-w-[220px]">{inner}</Link>
  )
}

// ─── Donut chart (server-rendered SVG) ──────────────────────────
function Donut({ segments, total }: {
  segments: Array<{ label: string; value: number; color: string }>
  total: number
}) {
  const R = 54, C = 2 * Math.PI * R
  let offset = 0
  const sum = segments.reduce((a, s) => a + s.value, 0) || 1
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(226,194,133,0.07)" strokeWidth="14" />
        {segments.filter(s => s.value > 0).map(s => {
          const len = (s.value / sum) * (C - segments.filter(x => x.value > 0).length * 4)
          const el = (
            <circle key={s.label} cx="70" cy="70" r={R} fill="none"
              stroke={s.color} strokeWidth="14" strokeLinecap="round"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset} />
          )
          offset += len + 4
          return el
        })}
        <g className="rotate-90" style={{ transformOrigin: '70px 70px' }}>
          <text x="70" y="66" textAnchor="middle" fill="#EDEFE9" fontSize="26" fontWeight="600" fontFamily="var(--font-fraunces), Georgia, serif">{total}</text>
          <text x="70" y="84" textAnchor="middle" fill="#66756A" fontSize="9" letterSpacing="2">TOTAL</text>
        </g>
      </svg>
      <div className="space-y-2">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
            <span className="font-semibold text-[#EDEFE9]">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const [centres, certs] = await Promise.all([
    getCentresSummary(),
    getCertBreakdown(),
  ])

  const activeCentres = centres.filter(c => c.totalStaff > 0)
  const maxStaff = Math.max(...activeCentres.map(c => c.totalStaff), 1)
  const barColors = ['var(--brass-400)', 'var(--aurora-500)', '#5EEAD4', 'var(--brass-600)', '#34D399']

  const certSegments = [
    { label: 'Passed',      value: certs.passed,     color: '#34D399' },
    { label: 'In Progress', value: certs.inProgress, color: 'var(--brass-400)' },
    { label: 'Not Started', value: certs.notStarted, color: '#66756A' },
    { label: 'Expired',     value: certs.expired,    color: '#FB7185' },
  ]

  return (
    <div className="animate-fade-in">
      <Header />

      <div className="px-6 pt-8 pb-4 space-y-6 max-w-[1100px] mx-auto">

        {/* Portal cards */}
        <div className="flex flex-wrap gap-5">
          <PortalCard href="/staff" title="HR" sub="Staff · Roster · Leave · Certifications"
            icon={Users} glow="rgba(201,163,92,0.55)" />
          <PortalCard href="/documents" title="DOX" sub="Generate · Templates · History · Vault"
            icon={FileText} glow="rgba(45,212,191,0.45)" />
          <PortalCard href="https://fets.live" external title="CLIENTS" sub="FETS.Live — candidate platform"
            icon={Globe} glow="rgba(192,132,252,0.40)" />
        </div>

        {/* Compact analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Staff distribution */}
          <div className="card-glass rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="font-display text-sm font-semibold text-[#EDEFE9]">Staff Distribution</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>By centre</p>
            </div>
            <div className="space-y-3">
              {activeCentres.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="w-20 text-right text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                  <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: 'rgba(226,194,133,0.05)' }}>
                    <div className="h-full rounded-md transition-all"
                      style={{ width: `${(c.totalStaff / maxStaff) * 100}%`, background: barColors[i % barColors.length], opacity: 0.9 }} />
                  </div>
                  <span className="w-6 text-xs font-semibold text-[#EDEFE9]">{c.totalStaff}</span>
                </div>
              ))}
              {activeCentres.length === 0 && (
                <p className="text-xs py-6 text-center" style={{ color: 'var(--text-muted)' }}>No staff data yet</p>
              )}
            </div>
          </div>

          {/* Certification status */}
          <div className="card-glass rounded-2xl p-5">
            <div className="mb-2">
              <h3 className="font-display text-sm font-semibold text-[#EDEFE9]">Certification Status</h3>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Overview of all certifications</p>
            </div>
            <Donut segments={certSegments} total={certs.total} />
          </div>
        </div>
      </div>
    </div>
  )
}
