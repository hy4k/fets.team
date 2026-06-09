'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getStaffById, updateStaff, getCentres, getDepartments, getDesignations } from '@/lib/actions/staff'
import Header from '@/components/layout/Header'
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react'

interface FormState {
  full_name: string
  email: string
  phone: string
  gender: string
  date_of_birth: string
  address_line1: string
  address_line2: string
  address_city: string
  address_state: string
  address_pincode: string
  emergency_name: string
  emergency_phone: string
  emergency_relation: string
  centre_id: string
  department_id: string
  designation_id: string
  employment_type: string
  status: string
  date_of_joining: string
  salary: string
  account_name: string
  account_number: string
  bank_name: string
  ifsc_code: string
  branch: string
  aadhaar_number: string
  pan_number: string
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#A0A0B8]">
        {label} {required && <span className="text-[#F5C518]">*</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 bg-[#0D0D15] border border-[#1E1E2E] rounded-lg text-sm text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F5C518]/40 transition-colors"
    />
  )
}

function Select({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 bg-[#0D0D15] border border-[#1E1E2E] rounded-lg text-sm text-[#F0F0F5] focus:outline-none focus:border-[#F5C518]/40 transition-colors"
    >
      {children}
    </select>
  )
}

function Section({ title }: { title: string }) {
  return (
    <div className="col-span-full pt-4 pb-2 border-t border-[#1E1E2E] first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold text-[#5A5A72] uppercase tracking-wider">{title}</h3>
    </div>
  )
}

export default function EditStaffPage() {
  const { staffId } = useParams<{ staffId: string }>()
  const router = useRouter()
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState('')
  const [centres, setCentres]     = useState<{id:string;name:string}[]>([])
  const [departments, setDepts]   = useState<{id:string;name:string}[]>([])
  const [designations, setDesigs] = useState<{id:string;title:string}[]>([])
  const [staffName, setStaffName] = useState('')

  const [form, setForm] = useState<FormState>({
    full_name: '', email: '', phone: '', gender: '', date_of_birth: '',
    address_line1: '', address_line2: '', address_city: '', address_state: '', address_pincode: '',
    emergency_name: '', emergency_phone: '', emergency_relation: '',
    centre_id: '', department_id: '', designation_id: '',
    employment_type: 'full_time', status: 'active',
    date_of_joining: '', salary: '',
    account_name: '', account_number: '', bank_name: '', ifsc_code: '', branch: '',
    aadhaar_number: '', pan_number: '',
  })

  useEffect(() => {
    Promise.all([getStaffById(staffId), getCentres(), getDepartments(), getDesignations()])
      .then(([staff, c, d, des]) => {
        if (staff) {
          const s = staff as Record<string, unknown>
          const addr = (s.address as Record<string, string>) || {}
          const emrg = (s.emergency_contact as Record<string, string>) || {}
          const bank = (s.bank_account as Record<string, string>) || {}
          setStaffName(String(s.full_name || ''))
          setForm({
            full_name:          String(s.full_name || ''),
            email:              String(s.email || ''),
            phone:              String(s.phone || ''),
            gender:             String(s.gender || ''),
            date_of_birth:      String(s.date_of_birth || ''),
            address_line1:      addr.line1 || '',
            address_line2:      addr.line2 || '',
            address_city:       addr.city || '',
            address_state:      addr.state || '',
            address_pincode:    addr.pincode || '',
            emergency_name:     emrg.name || '',
            emergency_phone:    emrg.phone || '',
            emergency_relation: emrg.relation || '',
            centre_id:          String(s.centre_id || ''),
            department_id:      String(s.department_id || ''),
            designation_id:     String(s.designation_id || ''),
            employment_type:    String(s.employment_type || 'full_time'),
            status:             String(s.status || 'active'),
            date_of_joining:    String(s.date_of_joining || ''),
            salary:             s.salary ? String(s.salary) : '',
            account_name:       bank.account_name || '',
            account_number:     bank.account_number || '',
            bank_name:          bank.bank_name || '',
            ifsc_code:          bank.ifsc_code || '',
            branch:             bank.branch || '',
            aadhaar_number:     String(s.aadhaar_number || ''),
            pan_number:         String(s.pan_number || ''),
          })
        }
        setCentres(c as {id:string;name:string}[])
        setDepts(d as {id:string;name:string}[])
        setDesigs(des as {id:string;title:string}[])
      })
      .finally(() => setLoading(false))
  }, [staffId])

  const set = (key: keyof FormState) => (val: string) => {
    setForm(f => ({ ...f, [key]: val }))
  }

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError('Full name is required.'); return }
    setSaving(true)
    setError('')
    try {
      const result = await updateStaff(staffId, {
        full_name: form.full_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        gender: form.gender || undefined,
        date_of_birth: form.date_of_birth || undefined,
        address: { line1: form.address_line1, line2: form.address_line2, city: form.address_city, state: form.address_state, pincode: form.address_pincode },
        emergency_contact: { name: form.emergency_name, phone: form.emergency_phone, relation: form.emergency_relation },
        centre_id: form.centre_id || undefined,
        department_id: form.department_id || undefined,
        designation_id: form.designation_id || undefined,
        employment_type: form.employment_type,
        date_of_joining: form.date_of_joining || undefined,
        salary: form.salary ? parseFloat(form.salary) : undefined,
        bank_account: { account_name: form.account_name, account_number: form.account_number, bank_name: form.bank_name, ifsc_code: form.ifsc_code, branch: form.branch },
        aadhaar_number: form.aadhaar_number || undefined,
        pan_number: form.pan_number || undefined,
      })
      if (result.success) {
        setSaved(true)
        setTimeout(() => { router.push(`/staff/${staffId}`) }, 1000)
      } else {
        setError(result.error || 'Failed to save. Please try again.')
      }
    } catch {
      setError('An unexpected error occurred.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-[900px] mx-auto animate-pulse space-y-4">
        <div className="h-8 w-48 bg-[#1E1E2E] rounded" />
        <div className="h-96 bg-[#12121A] border border-[#1E1E2E] rounded-xl" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <Header
        title={`Edit — ${staffName}`}
        subtitle="Update staff profile details"
        action={
          <button onClick={() => router.push(`/staff/${staffId}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#5A5A72] hover:text-[#F0F0F5] border border-[#1E1E2E] rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        }
      />

      <div className="p-6 max-w-[900px] mx-auto">
        {saved && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="text-sm text-emerald-400">Changes saved. Redirecting…</p>
          </div>
        )}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Section title="Personal Information" />
            <Field label="Full Name" required>
              <Input value={form.full_name} onChange={set('full_name')} placeholder="Full name" />
            </Field>
            <Field label="Email">
              <Input value={form.email} onChange={set('email')} placeholder="email@fets.in" type="email" />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={set('gender')}>
                <option value="">Select gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Date of Birth">
              <Input value={form.date_of_birth} onChange={set('date_of_birth')} type="date" />
            </Field>

            <Section title="Address" />
            <Field label="Address Line 1">
              <Input value={form.address_line1} onChange={set('address_line1')} placeholder="Street, area" />
            </Field>
            <Field label="Address Line 2">
              <Input value={form.address_line2} onChange={set('address_line2')} placeholder="Landmark" />
            </Field>
            <Field label="City">
              <Input value={form.address_city} onChange={set('address_city')} placeholder="City" />
            </Field>
            <Field label="State">
              <Input value={form.address_state} onChange={set('address_state')} placeholder="Kerala" />
            </Field>
            <Field label="Pincode">
              <Input value={form.address_pincode} onChange={set('address_pincode')} placeholder="673001" />
            </Field>

            <Section title="Employment" />
            <Field label="Status">
              <Select value={form.status} onChange={set('status')}>
                <option value="active">Active</option>
                <option value="probation">Probation</option>
                <option value="on_leave">On Leave</option>
                <option value="resigned">Resigned</option>
                <option value="terminated">Terminated</option>
              </Select>
            </Field>
            <Field label="Employment Type">
              <Select value={form.employment_type} onChange={set('employment_type')}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </Select>
            </Field>
            <Field label="Centre">
              <Select value={form.centre_id} onChange={set('centre_id')}>
                <option value="">Select centre</option>
                {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Department">
              <Select value={form.department_id} onChange={set('department_id')}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Designation">
              <Select value={form.designation_id} onChange={set('designation_id')}>
                <option value="">Select designation</option>
                {designations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </Select>
            </Field>
            <Field label="Date of Joining">
              <Input value={form.date_of_joining} onChange={set('date_of_joining')} type="date" />
            </Field>
            <Field label="Monthly Salary (₹)">
              <Input value={form.salary} onChange={set('salary')} placeholder="25000" type="number" />
            </Field>

            <Section title="Emergency Contact" />
            <Field label="Name">
              <Input value={form.emergency_name} onChange={set('emergency_name')} placeholder="Emergency contact name" />
            </Field>
            <Field label="Phone">
              <Input value={form.emergency_phone} onChange={set('emergency_phone')} placeholder="+91 9876543210" />
            </Field>
            <Field label="Relation">
              <Select value={form.emergency_relation} onChange={set('emergency_relation')}>
                <option value="">Select relation</option>
                <option value="parent">Parent</option>
                <option value="spouse">Spouse</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </Select>
            </Field>

            <Section title="Bank Account" />
            <Field label="Account Holder Name">
              <Input value={form.account_name} onChange={set('account_name')} placeholder="As per bank records" />
            </Field>
            <Field label="Account Number">
              <Input value={form.account_number} onChange={set('account_number')} placeholder="Account number" />
            </Field>
            <Field label="Bank Name">
              <Input value={form.bank_name} onChange={set('bank_name')} placeholder="e.g. SBI" />
            </Field>
            <Field label="IFSC Code">
              <Input value={form.ifsc_code} onChange={set('ifsc_code')} placeholder="SBIN0001234" />
            </Field>
            <Field label="Branch">
              <Input value={form.branch} onChange={set('branch')} placeholder="Branch name" />
            </Field>

            <Section title="Identity Documents" />
            <Field label="Aadhaar Number">
              <Input value={form.aadhaar_number} onChange={set('aadhaar_number')} placeholder="12-digit Aadhaar" />
            </Field>
            <Field label="PAN Number">
              <Input value={form.pan_number} onChange={set('pan_number')} placeholder="ABCDE1234F" />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 mt-7 pt-5 border-t border-[#1E1E2E]">
            <button
              onClick={() => router.push(`/staff/${staffId}`)}
              className="px-4 py-2 text-sm text-[#A0A0B8] border border-[#1E1E2E] rounded-lg hover:text-[#F0F0F5] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex items-center gap-2 px-5 py-2 bg-[#F5C518] text-[#0A0A0F] rounded-lg text-sm font-semibold hover:bg-[#F5C518]/90 disabled:opacity-60 transition-all"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> :
               saved  ? <><CheckCircle2 className="w-4 h-4" />Saved!</> :
                        <><Save className="w-4 h-4" />Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
