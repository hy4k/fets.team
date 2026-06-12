'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { createStaff, getCentres, getDepartments, getDesignations } from '@/lib/actions/staff'
import {
  User, Briefcase, CreditCard, CheckCircle2,
  ArrowLeft, ArrowRight, Loader2, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormData {
  // Personal
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
  // Employment
  centre_id: string
  department_id: string
  designation_id: string
  employment_type: string
  date_of_joining: string
  salary: string
  // Bank & Documents
  account_name: string
  account_number: string
  bank_name: string
  ifsc_code: string
  branch: string
  aadhaar_number: string
  pan_number: string
}

const EMPTY: FormData = {
  full_name: '', email: '', phone: '', gender: '', date_of_birth: '',
  address_line1: '', address_line2: '', address_city: '', address_state: '', address_pincode: '',
  emergency_name: '', emergency_phone: '', emergency_relation: '',
  centre_id: '', department_id: '', designation_id: '',
  employment_type: 'full_time', date_of_joining: '', salary: '',
  account_name: '', account_number: '', bank_name: '', ifsc_code: '', branch: '',
  aadhaar_number: '', pan_number: '',
}

const STEPS = [
  { id: 0, title: 'Personal Info',      icon: User,        desc: 'Basic details & contact' },
  { id: 1, title: 'Employment Details', icon: Briefcase,   desc: 'Role, centre & salary' },
  { id: 2, title: 'Bank & Documents',   icon: CreditCard,  desc: 'Bank account & ID docs' },
  { id: 3, title: 'Review & Submit',    icon: CheckCircle2,desc: 'Confirm and add staff' },
]

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[#A9B5A9]">
        {label} {required && <span className="text-[#C9A35C]">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-rose-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 bg-[#0A130F] border border-[#1B2A22] rounded-lg text-sm text-[#EDEFE9] placeholder-[#3D4B42] focus:outline-none focus:border-[#C9A35C]/40 disabled:opacity-50 transition-colors"
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
      className="w-full px-3.5 py-2.5 bg-[#0A130F] border border-[#1B2A22] rounded-lg text-sm text-[#EDEFE9] focus:outline-none focus:border-[#C9A35C]/40 transition-colors"
    >
      {children}
    </select>
  )
}

export default function AddStaffPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [centres, setCentres]       = useState<{id:string;name:string}[]>([])
  const [departments, setDepts]     = useState<{id:string;name:string}[]>([])
  const [designations, setDesigs]   = useState<{id:string;title:string}[]>([])

  useEffect(() => {
    Promise.all([getCentres(), getDepartments(), getDesignations()]).then(([c, d, des]) => {
      setCentres(c as {id:string;name:string}[])
      setDepts(d as {id:string;name:string}[])
      setDesigs(des as {id:string;title:string}[])
    })
  }, [])

  const set = (key: keyof FormData) => (val: string) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const validateStep = (s: number): boolean => {
    const errs: Partial<FormData> = {}
    if (s === 0) {
      if (!form.full_name.trim()) errs.full_name = 'Full name is required'
    }
    if (s === 1) {
      if (!form.centre_id) errs.centre_id = 'Please select a centre'
      if (!form.employment_type) errs.employment_type = 'Select employment type'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => {
    if (validateStep(step)) setStep(s => Math.min(s + 1, 3))
  }
  const back = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    if (!validateStep(step)) return
    setSubmitting(true)
    setSubmitError('')
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await createStaff({
        full_name: form.full_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        gender: form.gender || undefined,
        date_of_birth: form.date_of_birth || undefined,
        address: {
          line1: form.address_line1,
          line2: form.address_line2,
          city: form.address_city,
          state: form.address_state,
          pincode: form.address_pincode,
        },
        emergency_contact: {
          name: form.emergency_name,
          phone: form.emergency_phone,
          relation: form.emergency_relation,
        },
        centre_id: form.centre_id,
        department_id: form.department_id || undefined,
        designation_id: form.designation_id || undefined,
        employment_type: form.employment_type,
        date_of_joining: form.date_of_joining || undefined,
        salary: form.salary ? parseFloat(form.salary) : undefined,
        bank_account: {
          account_name: form.account_name,
          account_number: form.account_number,
          bank_name: form.bank_name,
          ifsc_code: form.ifsc_code,
          branch: form.branch,
        },
        aadhaar_number: form.aadhaar_number || undefined,
        pan_number: form.pan_number || undefined,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = result as any
      if (res.success && res.data) {
        router.push(`/staff/${res.data.id}`)
      } else {
        setSubmitError(res.error || 'Failed to create staff member. Please try again.')
      }
    } catch (e) {
      setSubmitError('An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  const sectionLabel = 'text-xs font-semibold text-[#66756A] uppercase tracking-wider mb-4 mt-6 first:mt-0'

  return (
    <div className="animate-fade-in">
      <Header
        title="Add New Staff"
        subtitle="Fill in staff details to create a new profile"
        action={
          <button onClick={() => router.push('/staff')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#66756A] hover:text-[#EDEFE9] border border-[#1B2A22] rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        }
      />

      <div className="p-6 max-w-[900px] mx-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done    = i < step
            const current = i === step
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-sm font-medium flex-shrink-0',
                    current && 'bg-[#C9A35C]/10 text-[#C9A35C]',
                    done    && 'text-emerald-400 cursor-pointer hover:bg-emerald-400/5',
                    !current && !done && 'text-[#66756A]'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border',
                    current && 'bg-[#C9A35C] text-[#040A08] border-[#C9A35C]',
                    done    && 'bg-emerald-400/20 text-emerald-400 border-emerald-400/40',
                    !current && !done && 'bg-[#0C1A16] text-[#66756A] border-[#1B2A22]'
                  )}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className="hidden sm:block">{s.title}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-px mx-2', i < step ? 'bg-emerald-400/30' : 'bg-[#1B2A22]')} />
                )}
              </div>
            )
          })}
        </div>

        {/* Form card */}
        <div className="card-glass rounded-2xl p-7">

          {/* ─── Step 0: Personal Info ─────────────────────────────── */}
          {step === 0 && (
            <div>
              <h2 className="text-base font-semibold text-[#EDEFE9] mb-1">Personal Information</h2>
              <p className="text-sm text-[#66756A] mb-6">Basic details and contact information</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" required error={errors.full_name}>
                  <Input value={form.full_name} onChange={set('full_name')} placeholder="e.g. Aysha Satha" />
                </Field>
                <Field label="Email Address">
                  <Input value={form.email} onChange={set('email')} placeholder="staff@fets.in" type="email" />
                </Field>
                <Field label="Phone Number">
                  <Input value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" type="tel" />
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
              </div>

              <p className={sectionLabel}>Address</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Address Line 1">
                  <Input value={form.address_line1} onChange={set('address_line1')} placeholder="House No., Street Name" />
                </Field>
                <Field label="Address Line 2">
                  <Input value={form.address_line2} onChange={set('address_line2')} placeholder="Landmark, Area" />
                </Field>
                <Field label="City">
                  <Input value={form.address_city} onChange={set('address_city')} placeholder="Calicut" />
                </Field>
                <Field label="State">
                  <Input value={form.address_state} onChange={set('address_state')} placeholder="Kerala" />
                </Field>
                <Field label="Pincode">
                  <Input value={form.address_pincode} onChange={set('address_pincode')} placeholder="673001" />
                </Field>
              </div>

              <p className={sectionLabel}>Emergency Contact</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Contact Name">
                  <Input value={form.emergency_name} onChange={set('emergency_name')} placeholder="Full name" />
                </Field>
                <Field label="Phone">
                  <Input value={form.emergency_phone} onChange={set('emergency_phone')} placeholder="+91 9876543210" />
                </Field>
                <Field label="Relation">
                  <Select value={form.emergency_relation} onChange={set('emergency_relation')}>
                    <option value="">Select</option>
                    <option value="parent">Parent</option>
                    <option value="spouse">Spouse</option>
                    <option value="sibling">Sibling</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                  </Select>
                </Field>
              </div>
            </div>
          )}

          {/* ─── Step 1: Employment ────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h2 className="text-base font-semibold text-[#EDEFE9] mb-1">Employment Details</h2>
              <p className="text-sm text-[#66756A] mb-6">Role, centre assignment and salary</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Centre" required error={errors.centre_id}>
                  <Select value={form.centre_id} onChange={set('centre_id')}>
                    <option value="">Select centre</option>
                    {centres.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    {centres.length === 0 && (
                      <>
                        <option value="calicut">FETS Calicut</option>
                        <option value="cochin">FETS Cochin</option>
                        <option value="mangalore">FETS Mangalore</option>
                      </>
                    )}
                  </Select>
                </Field>
                <Field label="Department">
                  <Select value={form.department_id} onChange={set('department_id')}>
                    <option value="">Select department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    {departments.length === 0 && (
                      <>
                        <option value="ops">Operations</option>
                        <option value="hr">HR & Admin</option>
                        <option value="it">IT</option>
                        <option value="finance">Finance</option>
                      </>
                    )}
                  </Select>
                </Field>
                <Field label="Designation">
                  <Select value={form.designation_id} onChange={set('designation_id')}>
                    <option value="">Select designation</option>
                    {designations.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                    {designations.length === 0 && (
                      <>
                        <option value="ta">Test Administrator</option>
                        <option value="cm">Centre Manager</option>
                        <option value="it">IT Coordinator</option>
                        <option value="hr">HR Executive</option>
                      </>
                    )}
                  </Select>
                </Field>
                <Field label="Employment Type" required error={errors.employment_type}>
                  <Select value={form.employment_type} onChange={set('employment_type')}>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </Select>
                </Field>
                <Field label="Date of Joining">
                  <Input value={form.date_of_joining} onChange={set('date_of_joining')} type="date" />
                </Field>
                <Field label="Monthly Salary (₹)">
                  <Input value={form.salary} onChange={set('salary')} placeholder="25000" type="number" />
                </Field>
              </div>

              <div className="mt-5 p-4 bg-[#0A130F] border border-[#1B2A22] rounded-xl">
                <p className="text-xs text-[#66756A]">
                  <span className="text-[#C9A35C] font-medium">Staff ID</span> will be auto-generated in FETS#### format (e.g., FETS0018) after submission.
                </p>
              </div>
            </div>
          )}

          {/* ─── Step 2: Bank & Docs ───────────────────────────────── */}
          {step === 2 && (
            <div>
              <h2 className="text-base font-semibold text-[#EDEFE9] mb-1">Bank Account & Documents</h2>
              <p className="text-sm text-[#66756A] mb-6">Bank details and identity documents</p>

              <p className={sectionLabel}>Bank Account</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Account Holder Name">
                  <Input value={form.account_name} onChange={set('account_name')} placeholder="As per bank records" />
                </Field>
                <Field label="Account Number">
                  <Input value={form.account_number} onChange={set('account_number')} placeholder="Account number" />
                </Field>
                <Field label="Bank Name">
                  <Input value={form.bank_name} onChange={set('bank_name')} placeholder="e.g. State Bank of India" />
                </Field>
                <Field label="IFSC Code">
                  <Input value={form.ifsc_code} onChange={set('ifsc_code')} placeholder="e.g. SBIN0001234" />
                </Field>
                <Field label="Branch">
                  <Input value={form.branch} onChange={set('branch')} placeholder="Branch name" />
                </Field>
              </div>

              <p className={sectionLabel}>Identity Documents</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Aadhaar Number">
                  <Input value={form.aadhaar_number} onChange={set('aadhaar_number')} placeholder="12-digit Aadhaar number" />
                </Field>
                <Field label="PAN Number">
                  <Input value={form.pan_number} onChange={set('pan_number')} placeholder="e.g. ABCDE1234F" />
                </Field>
              </div>

              <div className="mt-5 p-4 bg-[#0A130F] border border-[#1B2A22] rounded-xl">
                <p className="text-xs text-[#66756A]">
                  Photo and document uploads (Aadhaar, resume, appointment letter) are available on the staff profile page after creation.
                </p>
              </div>
            </div>
          )}

          {/* ─── Step 3: Review ────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <h2 className="text-base font-semibold text-[#EDEFE9] mb-1">Review & Submit</h2>
              <p className="text-sm text-[#66756A] mb-6">Confirm all details before adding the staff member</p>

              <div className="space-y-5">
                {[
                  {
                    title: 'Personal Info',
                    rows: [
                      ['Full Name', form.full_name || '—'],
                      ['Email',     form.email || '—'],
                      ['Phone',     form.phone || '—'],
                      ['Gender',    form.gender || '—'],
                      ['DOB',       form.date_of_birth || '—'],
                      ['City',      form.address_city || '—'],
                    ]
                  },
                  {
                    title: 'Employment',
                    rows: [
                      ['Centre',          centres.find(c => c.id === form.centre_id)?.name || form.centre_id || '—'],
                      ['Designation',     designations.find(d => d.id === form.designation_id)?.title || '—'],
                      ['Employment Type', form.employment_type || '—'],
                      ['Date of Joining', form.date_of_joining || '—'],
                      ['Salary',          form.salary ? `₹${Number(form.salary).toLocaleString('en-IN')}` : '—'],
                    ]
                  },
                  {
                    title: 'Bank & Docs',
                    rows: [
                      ['Bank Name',     form.bank_name || '—'],
                      ['Account No.',   form.account_number ? `****${form.account_number.slice(-4)}` : '—'],
                      ['IFSC',          form.ifsc_code || '—'],
                      ['Aadhaar',       form.aadhaar_number ? `XXXX-XXXX-${form.aadhaar_number.slice(-4)}` : '—'],
                      ['PAN',           form.pan_number || '—'],
                    ]
                  }
                ].map(section => (
                  <div key={section.title} className="bg-[#0A130F] border border-[#1B2A22] rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-[#1B2A22] bg-[#0C1A16]">
                      <span className="text-xs font-semibold text-[#66756A] uppercase tracking-wider">{section.title}</span>
                    </div>
                    <div className="divide-y divide-[#12231C]">
                      {section.rows.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-xs text-[#66756A]">{label}</span>
                          <span className="text-sm text-[#EDEFE9]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {submitError && (
                <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <p className="text-sm text-rose-400">{submitError}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-[#1B2A22]">
            <button
              onClick={step === 0 ? () => router.push('/staff') : back}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[#A9B5A9] hover:text-[#EDEFE9] border border-[#1B2A22] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 0 ? 'Cancel' : 'Back'}
            </button>

            {step < 3 ? (
              <button
                onClick={next}
                className="flex items-center gap-2 px-5 py-2 bg-[#C9A35C] text-[#040A08] rounded-lg text-sm font-semibold hover:bg-[#C9A35C]/90 transition-all"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2 bg-[#C9A35C] text-[#040A08] rounded-lg text-sm font-semibold hover:bg-[#C9A35C]/90 disabled:opacity-60 transition-all"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Creating…</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" />Add Staff Member</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
