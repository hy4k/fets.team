'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getStaffById, updateStaffStatus } from '@/lib/actions/staff'
import {
  ArrowLeft, Edit2, Phone, Mail, MapPin, Calendar, Building2,
  CreditCard, FileText, Shield, AlertTriangle, CheckCircle2,
  UserX, Clock, Download, MoreHorizontal
} from 'lucide-react'
import { cn, getInitials, formatDate, formatCurrency } from '@/lib/utils'

interface Staff {
  id: string
  staff_id: string
  full_name: string
  email?: string
  phone?: string
  gender?: string
  date_of_birth?: string
  address?: Record<string, string>
  emergency_contact?: Record<string, string>
  designation?: { id: string; title: string }
  department?: { id: string; name: string }
  centre?: { id: string; name: string; city: string; address?: string }
  employment_type: string
  status: string
  date_of_joining?: string
  date_of_leaving?: string
  salary?: number
  bank_account?: Record<string, string>
  aadhaar_number?: string
  pan_number?: string
  photo_url?: string
  created_at: string
}

// Fallback data for demo
const DEMO_STAFF: Record<string, Partial<Staff>> = {
  's1': { staff_id:'FETS0006', full_name:'Aysha Satha',  status:'active', employment_type:'full_time', centre:{id:'c1',name:'FETS Calicut',city:'Calicut'}, designation:{id:'d1',title:'Test Administrator'}, date_of_joining:'2023-01-15' },
  's2': { staff_id:'FETS0007', full_name:'Anshitha K',   status:'active', employment_type:'full_time', centre:{id:'c1',name:'FETS Calicut',city:'Calicut'}, designation:{id:'d1',title:'Test Administrator'} },
  's3': { staff_id:'FETS0009', full_name:'Linofer K',    status:'active', employment_type:'full_time', centre:{id:'c1',name:'FETS Calicut',city:'Calicut'}, designation:{id:'d2',title:'IT Coordinator'} },
  's4': { staff_id:'FETS0010', full_name:'Bindu Rajan',  status:'active', employment_type:'full_time', centre:{id:'c1',name:'FETS Calicut',city:'Calicut'}, designation:{id:'d1',title:'Test Administrator'} },
  's5': { staff_id:'FETS0011', full_name:'Abidha',       status:'active', employment_type:'full_time', centre:{id:'c1',name:'FETS Calicut',city:'Calicut'}, designation:{id:'d1',title:'Test Administrator'} },
  's6': { staff_id:'FETS0014', full_name:'Nimmy M',      status:'active', employment_type:'full_time', centre:{id:'c1',name:'FETS Calicut',city:'Calicut'}, designation:{id:'d3',title:'HR Executive'} },
  's7': { staff_id:'FETS0015', full_name:'Naima MM',     status:'active', employment_type:'full_time', centre:{id:'c1',name:'FETS Calicut',city:'Calicut'}, designation:{id:'d1',title:'Test Administrator'} },
  's8': { staff_id:'FETS0016', full_name:'Shimna K',     status:'active', employment_type:'full_time', centre:{id:'c1',name:'FETS Calicut',city:'Calicut'}, designation:{id:'d1',title:'Test Administrator'} },
  's9': { staff_id:'FETS0017', full_name:'Lazeem P',     status:'active', employment_type:'full_time', centre:{id:'c2',name:'FETS Cochin',city:'Cochin'},   designation:{id:'d4',title:'Centre Manager'} },
}

const statusBadge: Record<string, string> = {
  active:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  on_leave:   'text-amber-400  bg-amber-400/10  border-amber-400/30',
  probation:  'text-blue-400   bg-blue-400/10   border-blue-400/30',
  resigned:   'text-[#5A5A72]  bg-[#1E1E2E]     border-[#2A2A3E]',
  terminated: 'text-rose-400   bg-rose-400/10   border-rose-400/30',
}

const statusLabel: Record<string, string> = {
  active: 'Active', on_leave: 'On Leave', probation: 'Probation',
  resigned: 'Resigned', terminated: 'Terminated',
}

const employmentLabel: Record<string, string> = {
  full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract', intern: 'Intern',
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[#1A1A28] last:border-0">
      <span className="text-xs text-[#5A5A72] min-w-[110px]">{label}</span>
      <span className="text-sm text-[#F0F0F5] text-right">{value || '—'}</span>
    </div>
  )
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#1E1E2E]">
        <Icon className="w-4 h-4 text-[#F5C518]" />
        <span className="text-sm font-semibold text-[#F0F0F5]">{title}</span>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  )
}

export default function StaffProfilePage() {
  const { staffId } = useParams<{ staffId: string }>()
  const router = useRouter()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    getStaffById(staffId)
      .then(data => {
        if (data) {
          setStaff(data as Staff)
        } else {
          // Try demo data
          const demo = DEMO_STAFF[staffId]
          if (demo) setStaff({ id: staffId, created_at: new Date().toISOString(), employment_type: 'full_time', status: 'active', ...demo } as Staff)
        }
      })
      .finally(() => setLoading(false))
  }, [staffId])

  if (loading) {
    return (
      <div className="p-6 max-w-[1000px] mx-auto animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[#1E1E2E] rounded-lg" />
        <div className="h-40 bg-[#12121A] border border-[#1E1E2E] rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 bg-[#12121A] border border-[#1E1E2E] rounded-xl" />
          <div className="h-48 bg-[#12121A] border border-[#1E1E2E] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="p-6 max-w-[600px] mx-auto text-center pt-20">
        <AlertTriangle className="w-12 h-12 text-[#5A5A72] mx-auto mb-4" />
        <h2 className="text-lg font-bold text-[#F0F0F5] mb-2">Staff Not Found</h2>
        <p className="text-[#5A5A72] text-sm mb-5">This staff profile doesn&apos;t exist or may have been removed.</p>
        <button onClick={() => router.push('/staff')}
          className="px-4 py-2 bg-[#F5C518] text-[#0A0A0F] rounded-lg text-sm font-semibold">
          Back to Staff List
        </button>
      </div>
    )
  }

  const address = staff.address || {}
  const emergency = staff.emergency_contact || {}
  const bank = staff.bank_account || {}

  const fullAddress = [address.line1, address.line2, address.city, address.state, address.pincode]
    .filter(Boolean).join(', ')

  return (
    <div className="animate-fade-in min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-[#0D0D15] border-b border-[#1E1E2E] px-6 py-3.5 flex items-center justify-between">
        <button onClick={() => router.push('/staff')}
          className="flex items-center gap-1.5 text-sm text-[#5A5A72] hover:text-[#F0F0F5] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Staff Directory
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/staff/${staffId}/edit`)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F5C518] text-[#0A0A0F] rounded-lg text-sm font-semibold hover:bg-[#F5C518]/90 transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-[#5A5A72] hover:text-[#F0F0F5] border border-[#1E1E2E] rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showActions && (
              <div className="absolute right-0 top-10 z-50 bg-[#1A1A2E] border border-[#2A2A3E] rounded-xl shadow-2xl w-48 py-1">
                <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#A0A0B8] hover:text-[#F0F0F5] hover:bg-[#F5C518]/5">
                  <Download className="w-4 h-4" /> Export Profile
                </button>
                <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#A0A0B8] hover:text-[#F0F0F5] hover:bg-[#F5C518]/5">
                  <FileText className="w-4 h-4" /> Generate Payslip
                </button>
                <div className="border-t border-[#2A2A3E] my-1" />
                <button
                  onClick={async () => {
                    await updateStaffStatus(staffId, 'resigned')
                    setStaff(s => s ? {...s, status: 'resigned'} : null)
                    setShowActions(false)
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-400/5"
                >
                  <UserX className="w-4 h-4" /> Mark as Resigned
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-[1000px] mx-auto space-y-5">

        {/* Hero card */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {staff.photo_url ? (
              <img src={staff.photo_url} alt={staff.full_name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-[#F5C518]/30" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F5C518]/20 to-[#F5C518]/5 border border-[#F5C518]/20 flex items-center justify-center text-[#F5C518] text-2xl font-bold">
                {getInitials(staff.full_name)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#12121A]" />
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-1">
              <h1 className="text-xl font-bold text-[#F0F0F5]">{staff.full_name}</h1>
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                statusBadge[staff.status] || statusBadge.active
              )}>
                {statusLabel[staff.status] || staff.status}
              </span>
            </div>
            <div className="text-sm text-[#5A5A72] font-mono mb-3">{staff.staff_id}</div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#A0A0B8]">
              {staff.designation && (
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#5A5A72]" />
                  {staff.designation.title}
                </span>
              )}
              {staff.centre && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#5A5A72]" />
                  {staff.centre.name}
                </span>
              )}
              {staff.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#5A5A72]" />
                  {staff.phone}
                </span>
              )}
              {staff.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#5A5A72]" />
                  {staff.email}
                </span>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex sm:flex-col gap-4 sm:gap-3 sm:items-end">
            {staff.salary && (
              <div className="text-right">
                <div className="text-lg font-bold text-[#F5C518]">{formatCurrency(staff.salary)}</div>
                <div className="text-xs text-[#5A5A72]">Monthly Salary</div>
              </div>
            )}
            {staff.date_of_joining && (
              <div className="text-right">
                <div className="text-sm font-semibold text-[#F0F0F5]">{formatDate(staff.date_of_joining)}</div>
                <div className="text-xs text-[#5A5A72]">Date Joined</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Generate Payslip', icon: CreditCard, onClick: () => router.push('/payroll') },
            { label: 'Issue Letter',     icon: FileText,   onClick: () => router.push('/documents') },
            { label: 'Check Leave',      icon: Calendar,   onClick: () => router.push('/leave') },
            { label: 'View Documents',   icon: Shield,     onClick: () => {} },
          ].map(a => (
            <button key={a.label} onClick={a.onClick}
              className="flex flex-col items-center gap-2 p-4 bg-[#12121A] border border-[#1E1E2E] rounded-xl hover:border-[#F5C518]/20 hover:bg-[#F5C518]/5 transition-all group">
              <a.icon className="w-5 h-5 text-[#5A5A72] group-hover:text-[#F5C518] transition-colors" />
              <span className="text-xs text-[#5A5A72] group-hover:text-[#A0A0B8] text-center">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card title="Personal Information" icon={User}>
            <InfoRow label="Full Name"   value={staff.full_name} />
            <InfoRow label="Gender"      value={staff.gender ? staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1) : undefined} />
            <InfoRow label="Date of Birth" value={staff.date_of_birth ? formatDate(staff.date_of_birth) : undefined} />
            <InfoRow label="Phone"       value={staff.phone} />
            <InfoRow label="Email"       value={staff.email} />
            <InfoRow label="Address"     value={fullAddress || undefined} />
          </Card>

          <Card title="Employment Details" icon={Briefcase}>
            <InfoRow label="Staff ID"     value={staff.staff_id} />
            <InfoRow label="Designation"  value={staff.designation?.title} />
            <InfoRow label="Department"   value={staff.department?.name} />
            <InfoRow label="Centre"       value={staff.centre?.name} />
            <InfoRow label="Type"         value={employmentLabel[staff.employment_type]} />
            <InfoRow label="Joined"       value={staff.date_of_joining ? formatDate(staff.date_of_joining) : undefined} />
            {staff.date_of_leaving && <InfoRow label="Leaving" value={formatDate(staff.date_of_leaving)} />}
          </Card>

          {(bank.account_number || bank.bank_name) && (
            <Card title="Bank Account" icon={CreditCard}>
              <InfoRow label="Account Name" value={bank.account_name} />
              <InfoRow label="Account No."  value={bank.account_number ? `****${bank.account_number.slice(-4)}` : undefined} />
              <InfoRow label="Bank"         value={bank.bank_name} />
              <InfoRow label="IFSC"         value={bank.ifsc_code} />
              <InfoRow label="Branch"       value={bank.branch} />
            </Card>
          )}

          <Card title="Identity Documents" icon={FileText}>
            <InfoRow label="Aadhaar" value={staff.aadhaar_number ? `XXXX-XXXX-${staff.aadhaar_number.slice(-4)}` : undefined} />
            <InfoRow label="PAN"     value={staff.pan_number} />
            <div className="py-3 flex items-center justify-between">
              <span className="text-xs text-[#5A5A72]">Document uploads</span>
              <span className="text-xs text-[#F5C518]/70 bg-[#F5C518]/10 px-2 py-0.5 rounded-full">Stage 3</span>
            </div>
          </Card>

          {(emergency.name || emergency.phone) && (
            <Card title="Emergency Contact" icon={AlertTriangle}>
              <InfoRow label="Name"     value={emergency.name} />
              <InfoRow label="Phone"    value={emergency.phone} />
              <InfoRow label="Relation" value={emergency.relation} />
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="text-xs text-[#3A3A55] text-center pb-4">
          Profile created {formatDate(staff.created_at)} · Last updated {formatDate(staff.created_at)}
        </div>
      </div>
    </div>
  )
}

// Missing import fix
function User(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function Briefcase(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  )
}
