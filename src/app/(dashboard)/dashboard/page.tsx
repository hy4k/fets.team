import Header from '@/components/layout/Header'
import Link from 'next/link'
import {
  Users, FileText, Award, Calendar, CheckCircle,
  Building2, TrendingUp, UserPlus, DollarSign, Clock,
  ArrowRight, Zap, Activity,
} from 'lucide-react'
import {
  getDashboardStats,
  getCentresSummary,
  getRecentStaff,
  getRecentActivity,
} from '@/lib/actions/dashboard'

const quickActions = [
  { label: 'Add Staff',         icon: UserPlus,   href: '/staff/new',            color: '#22C55E', bg: '#22C55E15' },
  { label: 'Generate Document', icon: FileText,   href: '/documents/new',        color: '#F5C518', bg: '#F5C51815' },
  { label: 'Process Payslip',   icon: DollarSign, href: '/payroll/new',          color: '#3B82F6', bg: '#3B82F615' },
  { label: 'Approve Leave',     icon: Calendar,   href: '/leave?status=pending', color: '#8B5CF6', bg: '#8B5CF615' },
]

function formatAction(action: string, entityType: string | null): string {
  const label = action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const entity = entityType ? entityType.replace(/_/g, ' ') : ''
  return entity ? `${label} · ${entity}` : label
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default async function DashboardPage() {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Fetch all dashboard data in parallel
  const [stats, centres, recentStaff, activity] = await Promise.all([
    getDashboardStats(),
    getCentresSummary(),
    getRecentStaff(),
    getRecentActivity(),
  ])

  const activecentres = centres.filter(c => c.totalStaff > 0).length

  const statCards = [
    { label: 'Total Staff',       value: String(stats.totalStaff),      sub: 'All centres',       icon: Users,        color: '#3B82F6', href: '/staff' },
    { label: 'Active Staff',      value: String(stats.activeStaff),     sub: 'Currently working', icon: CheckCircle,  color: '#22C55E', href: '/staff?status=active' },
    { label: 'Docs This Month',   value: String(stats.docsThisMonth),   sub: 'Generated',         icon: FileText,     color: '#F5C518', href: '/document-history' },
    { label: 'Pending Approvals', value: String(stats.pendingApprovals),sub: 'Awaiting review',   icon: Clock,        color: '#F59E0B', href: '/documents?status=submitted' },
    { label: 'Certs Expiring',    value: String(stats.certsExpiring),   sub: 'Next 30 days',      icon: Award,        color: '#EF4444', href: '/certifications' },
    { label: 'Leave Requests',    value: String(stats.pendingLeave),    sub: 'Pending review',    icon: Calendar,     color: '#8B5CF6', href: '/leave' },
  ]

  return (
    <div className="animate-fade-in">
      <Header title="Dashboard" subtitle="Forun Testing & Educational Services" />

      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#F5C518]/12 via-[#F5C518]/6 to-transparent border border-[#F5C518]/15 rounded-2xl p-6">
          <div className="absolute right-0 top-0 w-48 h-48 bg-[#F5C518]/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F5C518] rounded-xl flex items-center justify-center shadow-lg shadow-[#F5C518]/20 shrink-0">
              <TrendingUp className="w-6 h-6 text-[#0A0A0F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F0F0F5]">{greeting}, Admin</h2>
              <p className="text-[#8B8BA0] text-sm mt-0.5">
                FETS Internal Operating System &mdash; {stats.activeStaff} active staff across {activecentres} centres
              </p>
            </div>
            <div className="ml-auto hidden md:flex items-center gap-2 text-xs text-[#5A5A72]">
              <Zap className="w-3 h-3 text-[#F5C518]" />
              System Active
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="group bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4 hover:border-[#2A2A3E] hover:bg-[#14141E] transition-all duration-200"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${stat.color}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div className="text-2xl font-bold text-[#F0F0F5] mb-0.5 group-hover:text-white transition-colors">
                  {stat.value}
                </div>
                <div className="text-[#5A5A72] text-xs font-medium">{stat.label}</div>
                <div className="text-[#3A3A55] text-[10px] mt-0.5">{stat.sub}</div>
              </Link>
            )
          })}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Quick Actions */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-[#5A5A72] uppercase tracking-wider">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex flex-col items-center gap-2.5 p-3.5 bg-[#0D0D15] border border-[#1E1E2E] rounded-xl hover:border-[#F5C518]/20 hover:bg-[#111118] transition-all group"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: action.bg }}
                    >
                      <Icon className="w-5 h-5" style={{ color: action.color }} />
                    </div>
                    <span className="text-[11px] font-medium text-[#5A5A72] group-hover:text-[#8B8BA0] text-center leading-tight transition-colors">
                      {action.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Centres Overview */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-[#5A5A72] uppercase tracking-wider">Centres</h3>
              <Link href="/settings" className="text-[#3A3A55] hover:text-[#F5C518] transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {centres.length === 0 ? (
                <p className="text-[#3A3A55] text-xs text-center py-4">No centres configured</p>
              ) : centres.map((centre) => (
                <div
                  key={centre.id}
                  className="flex items-center gap-3 p-3 bg-[#0D0D15] rounded-xl border border-[#1E1E2E]"
                >
                  <div className="w-8 h-8 bg-[#F5C518]/10 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-[#F5C518]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#F0F0F5] truncate">{centre.name}</div>
                    <div className="text-[11px] text-[#3A3A55]">{centre.city}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#F5C518]">{centre.totalStaff}</div>
                    <div className="text-[10px] text-[#3A3A55]">staff</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Staff */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-[#5A5A72] uppercase tracking-wider">Staff</h3>
              <Link href="/staff" className="text-[11px] text-[#F5C518] hover:text-[#E6B800] transition-colors flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentStaff.length === 0 ? (
                <p className="text-[#3A3A55] text-xs text-center py-4">No staff added yet</p>
              ) : recentStaff.map((s) => (
                <Link
                  key={s.id}
                  href={`/staff/${s.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#1A1A28] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-[#F5C518]/10 border border-[#F5C518]/20 flex items-center justify-center text-[#F5C518] text-xs font-bold shrink-0">
                    {s.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-[#F0F0F5] truncate group-hover:text-white">{s.full_name}</div>
                    <div className="text-[11px] text-[#3A3A55]">{s.staff_id}</div>
                  </div>
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.status === 'active' ? '#22C55E' : '#5A5A72' }}
                    title={s.status}
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row: Activity + Doc Generator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Activity */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#5A5A72]" />
                <h3 className="text-xs font-semibold text-[#5A5A72] uppercase tracking-wider">Recent Activity</h3>
              </div>
              <Link href="/audit" className="text-[11px] text-[#F5C518] hover:text-[#E6B800] transition-colors flex items-center gap-1">
                Full log <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-0">
              {activity.length === 0 ? (
                <p className="text-[#3A3A55] text-xs text-center py-6">No activity recorded yet</p>
              ) : activity.map((item) => (
                <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-[#1A1A28] last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F5C518]/60 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#8B8BA0] truncate">
                      {formatAction(item.action, item.entity_type)}
                    </div>
                  </div>
                  <div className="text-[10px] text-[#3A3A55] shrink-0 tabular-nums">
                    {timeAgo(item.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Generator Shortcuts */}
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#F0F0F5]">Document Generator Centre</h3>
                <p className="text-xs text-[#5A5A72] mt-0.5">Quick-generate common documents</p>
              </div>
              <Link
                href="/documents"
                className="flex items-center gap-1.5 text-xs text-[#F5C518] hover:text-[#E6B800] transition-colors font-medium"
              >
                All types <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Offer Letter',       type: 'offer_letter' },
                { label: 'Experience Letter',  type: 'experience_letter' },
                { label: 'Pay Slip',           type: 'payslip_monthly' },
                { label: 'Appointment Letter', type: 'appointment_letter' },
                { label: 'Relieving Letter',   type: 'relieving_letter' },
                { label: 'Authorization',      type: 'authorization_letter' },
                { label: 'Warning Letter',     type: 'warning_letter' },
                { label: 'ID Card',            type: 'id_card' },
              ].map((doc) => (
                <Link
                  key={doc.type}
                  href={`/documents/new?type=${doc.type}`}
                  className="flex flex-col items-center gap-1.5 p-3 bg-[#0D0D15] border border-[#1E1E2E] rounded-lg hover:border-[#F5C518]/20 hover:bg-[#111118] transition-all group text-center"
                >
                  <FileText className="w-5 h-5 text-[#3A3A55] group-hover:text-[#F5C518] transition-colors" />
                  <span className="text-[10px] text-[#5A5A72] group-hover:text-[#8B8BA0] leading-tight transition-colors">
                    {doc.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
