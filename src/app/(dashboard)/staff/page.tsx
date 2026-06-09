'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { getStaffList, getCentres } from '@/lib/actions/staff'
import {
  Plus, Search, Eye, Edit2, MoreVertical,
  MapPin, CheckCircle, XCircle, Clock, UserX
} from 'lucide-react'
import { cn, getInitials, formatDate } from '@/lib/utils'

type StaffStatus = 'active' | 'on_leave' | 'resigned' | 'terminated' | 'probation'

interface StaffMember {
  id: string
  staff_id: string
  full_name: string
  email?: string
  phone?: string
  status: StaffStatus
  date_of_joining?: string
  photo_url?: string
  centre?: { id: string; name: string; city: string }
  department?: { id: string; name: string }
  designation?: { id: string; title: string }
}

interface Centre {
  id: string
  name: string
  city: string
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  active:     { label: 'Active',      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle },
  on_leave:   { label: 'On Leave',    color: 'text-amber-400  bg-amber-400/10  border-amber-400/20',     icon: Clock },
  probation:  { label: 'Probation',   color: 'text-blue-400   bg-blue-400/10   border-blue-400/20',      icon: Clock },
  resigned:   { label: 'Resigned',    color: 'text-[#5A5A72]  bg-[#1E1E2E]     border-[#2A2A3E]',        icon: UserX },
  terminated: { label: 'Terminated',  color: 'text-rose-400   bg-rose-400/10   border-rose-400/20',      icon: XCircle },
}

const STATIC_STAFF: StaffMember[] = [
  { id: 's1', staff_id: 'FETS0006', full_name: 'Aysha Satha',  status: 'active', centre: { id:'c1', name:'FETS Calicut', city:'Calicut' }, designation: { id:'d1', title:'Test Administrator' }, department: undefined! },
  { id: 's2', staff_id: 'FETS0007', full_name: 'Anshitha K',   status: 'active', centre: { id:'c1', name:'FETS Calicut', city:'Calicut' }, designation: { id:'d1', title:'Test Administrator' }, department: undefined! },
  { id: 's3', staff_id: 'FETS0009', full_name: 'Linofer K',    status: 'active', centre: { id:'c1', name:'FETS Calicut', city:'Calicut' }, designation: { id:'d2', title:'IT Coordinator' },       department: undefined! },
  { id: 's4', staff_id: 'FETS0010', full_name: 'Bindu Rajan',  status: 'active', centre: { id:'c1', name:'FETS Calicut', city:'Calicut' }, designation: { id:'d1', title:'Test Administrator' }, department: undefined! },
  { id: 's5', staff_id: 'FETS0011', full_name: 'Abidha',       status: 'active', centre: { id:'c1', name:'FETS Calicut', city:'Calicut' }, designation: { id:'d1', title:'Test Administrator' }, department: undefined! },
  { id: 's6', staff_id: 'FETS0014', full_name: 'Nimmy M',      status: 'active', centre: { id:'c1', name:'FETS Calicut', city:'Calicut' }, designation: { id:'d3', title:'HR Executive' },         department: undefined! },
  { id: 's7', staff_id: 'FETS0015', full_name: 'Naima MM',     status: 'active', centre: { id:'c1', name:'FETS Calicut', city:'Calicut' }, designation: { id:'d1', title:'Test Administrator' }, department: undefined! },
  { id: 's8', staff_id: 'FETS0016', full_name: 'Shimna K',     status: 'active', centre: { id:'c1', name:'FETS Calicut', city:'Calicut' }, designation: { id:'d1', title:'Test Administrator' }, department: undefined! },
  { id: 's9', staff_id: 'FETS0017', full_name: 'Lazeem P',     status: 'active', centre: { id:'c2', name:'FETS Cochin',  city:'Cochin'  }, designation: { id:'d4', title:'Centre Manager' },       department: undefined! },
]

export default function StaffPage() {
  const router = useRouter()
  const [staff, setStaff]         = useState<StaffMember[]>([])
  const [centres, setCentres]     = useState<Centre[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [centreFilter, setCentre] = useState('')
  const [statusFilter, setStatus] = useState('')
  const [openMenu, setOpenMenu]   = useState<string | null>(null)

  const loadStaff = useCallback(async () => {
    setLoading(true)
    try {
      const [staffData, centreData] = await Promise.all([
        getStaffList({ centre_id: centreFilter || undefined, status: statusFilter || undefined }),
        getCentres(),
      ])
      setStaff(staffData.length > 0 ? (staffData as StaffMember[]) : STATIC_STAFF)
      setCentres(centreData as Centre[])
    } catch {
      setStaff(STATIC_STAFF)
    } finally {
      setLoading(false)
    }
  }, [centreFilter, statusFilter])

  useEffect(() => { loadStaff() }, [loadStaff])

  const filtered = staff.filter(s => {
    const q = search.toLowerCase()
    return !q ||
      s.full_name.toLowerCase().includes(q) ||
      s.staff_id.toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
  })

  const counts = {
    total:    staff.length,
    active:   staff.filter(s => s.status === 'active').length,
    onLeave:  staff.filter(s => s.status === 'on_leave').length,
    probation:staff.filter(s => s.status === 'probation').length,
  }

  return (
    <div className="animate-fade-in" onClick={() => setOpenMenu(null)}>
      <Header
        title="Staff Directory"
        subtitle={`${counts.active} active · ${counts.total} total`}
        action={
          <button
            onClick={() => router.push('/staff/new')}
            className="flex items-center gap-2 px-4 py-2 bg-[#F5C518] text-[#0A0A0F] rounded-lg font-semibold text-sm hover:bg-[#F5C518]/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        }
      />

      <div className="p-6 max-w-[1400px] mx-auto space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Staff',  value: counts.total,     color: 'text-[#F0F0F5]' },
            { label: 'Active',       value: counts.active,    color: 'text-emerald-400' },
            { label: 'On Leave',     value: counts.onLeave,   color: 'text-amber-400' },
            { label: 'Probation',    value: counts.probation, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[#5A5A72] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A72]" />
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#12121A] border border-[#1E1E2E] rounded-lg text-sm text-[#F0F0F5] placeholder-[#5A5A72] focus:outline-none focus:border-[#F5C518]/40"
            />
          </div>
          <select
            value={centreFilter}
            onChange={e => setCentre(e.target.value)}
            className="px-3 py-2.5 bg-[#12121A] border border-[#1E1E2E] rounded-lg text-sm text-[#A0A0B8] focus:outline-none focus:border-[#F5C518]/40 min-w-[160px]"
          >
            <option value="">All Centres</option>
            {centres.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            className="px-3 py-2.5 bg-[#12121A] border border-[#1E1E2E] rounded-lg text-sm text-[#A0A0B8] focus:outline-none focus:border-[#F5C518]/40 min-w-[140px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="probation">Probation</option>
            <option value="on_leave">On Leave</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1E1E2E]">
                  {['Staff', 'Role', 'Centre', 'Joined', 'Status', ''].map((h, i) => (
                    <th key={i} className={cn(
                      'text-left px-5 py-3.5 text-xs font-semibold text-[#5A5A72] uppercase tracking-wider',
                      i === 1 && 'hidden sm:table-cell',
                      i === 2 && 'hidden md:table-cell',
                      i === 3 && 'hidden lg:table-cell',
                      i === 5 && 'w-10'
                    )}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1E2E]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1E1E2E]" />
                          <div>
                            <div className="h-3.5 w-32 bg-[#1E1E2E] rounded mb-1.5" />
                            <div className="h-3 w-20 bg-[#1E1E2E] rounded" />
                          </div>
                        </div>
                      </td>
                      {[0,1,2,3].map(j => (
                        <td key={j} className="px-4 py-4 hidden sm:table-cell">
                          <div className="h-3.5 w-24 bg-[#1E1E2E] rounded" />
                        </td>
                      ))}
                      <td className="px-4 py-4" />
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-[#5A5A72]">
                      No staff found.
                    </td>
                  </tr>
                ) : filtered.map(member => {
                  const st = statusConfig[member.status] || statusConfig.active
                  const StatusIcon = st.icon
                  return (
                    <tr
                      key={member.id}
                      onClick={() => router.push(`/staff/${member.id}`)}
                      className="hover:bg-[#0D0D15]/60 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {member.photo_url ? (
                            <img src={member.photo_url} alt="" className="w-9 h-9 rounded-full object-cover border border-[#1E1E2E]" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#F5C518]/15 border border-[#F5C518]/20 flex items-center justify-center text-[#F5C518] text-xs font-bold flex-shrink-0">
                              {getInitials(member.full_name)}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-[#F0F0F5] group-hover:text-white">{member.full_name}</div>
                            <div className="text-xs text-[#5A5A72] font-mono">{member.staff_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell">
                        <div className="text-[#A0A0B8]">{member.designation?.title || '—'}</div>
                        {member.department && <div className="text-xs text-[#5A5A72]">{member.department.name}</div>}
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        {member.centre ? (
                          <div className="flex items-center gap-1.5 text-[#A0A0B8]">
                            <MapPin className="w-3.5 h-3.5 text-[#5A5A72]" />
                            {member.centre.city}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell text-[#A0A0B8]">
                        {member.date_of_joining ? formatDate(member.date_of_joining) : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', st.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === member.id ? null : member.id) }}
                            className="p-1.5 rounded-lg text-[#5A5A72] hover:text-[#F0F0F5] hover:bg-[#1E1E2E] transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenu === member.id && (
                            <div className="absolute right-0 top-8 z-50 bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl shadow-2xl w-44 py-1">
                              <button onClick={() => router.push(`/staff/${member.id}`)}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#A0A0B8] hover:text-[#F0F0F5] hover:bg-[#F5C518]/5">
                                <Eye className="w-4 h-4" /> View Profile
                              </button>
                              <button onClick={() => router.push(`/staff/${member.id}/edit`)}
                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#A0A0B8] hover:text-[#F0F0F5] hover:bg-[#F5C518]/5">
                                <Edit2 className="w-4 h-4" /> Edit Staff
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-[#1E1E2E] flex items-center justify-between">
              <span className="text-xs text-[#5A5A72]">
                Showing {filtered.length} of {staff.length} staff
              </span>
              {(centreFilter || statusFilter) && (
                <button
                  onClick={() => { setCentre(''); setStatus('') }}
                  className="text-xs text-[#F5C518] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
