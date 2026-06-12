'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import {
  getSalaryRecords, createSalaryRecord, updateSalaryRecord,
  markAsPaid, deleteSalaryRecord, generatePayslipDoc,
  getStaffForPayroll,
  type SalaryRecord, type CreateSalaryInput, type StaffForPayroll
} from '@/lib/actions/payroll'
import { calcGross, calcDeductions, calcNet, MONTHS } from '@/lib/utils/salary'

// ─── Helpers ──────────────────────────────────────────────────
const fmtCur = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const Icon = ({ path, size = 16 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
)
const ICONS = {
  plus:    'M12 5v14 M5 12h14',
  check:   'M20 6L9 17l-5-5',
  edit:    'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 1 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:   'M3 6h18 M19 6l-1 14H6L5 6 M8 6V4h8v2',
  printer: 'M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z',
  x:       'M18 6L6 18 M6 6l12 12',
  search:  'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
}

// ─── Stat card ────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="card-glass rounded-xl p-4">
      <div className="text-[11px] text-[#66756A] uppercase tracking-widest mb-2">{label}</div>
      <div className="font-display text-2xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-[#66756A] mt-1">{sub}</div>}
    </div>
  )
}

// ─── Salary row ───────────────────────────────────────────────
function SalaryRow({ record, onEdit, onDelete, onPayslip, onMarkPaid }: {
  record: SalaryRecord
  onEdit: () => void
  onDelete: () => void
  onPayslip: () => void
  onMarkPaid: () => void
}) {
  const gross = calcGross(record)
  const deductions = calcDeductions(record)
  const net = calcNet(record)
  const staff = record.staff

  return (
    <div className="flex items-center gap-4 px-4 py-3 card-glass rounded-xl hover:border-[#2C3D32] transition-all group">
      <div className="flex items-center gap-3 w-48 shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#C9A35C] flex items-center justify-center text-black font-bold text-xs shrink-0">
          {staff?.full_name?.charAt(0) || '?'}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">{staff?.full_name || '—'}</div>
          <div className="text-[10px] text-[#66756A]">{staff?.staff_id}</div>
        </div>
      </div>
      <div className="w-28 shrink-0">
        <div className="text-sm text-white font-medium">{MONTHS[record.month - 1]}</div>
        <div className="text-[10px] text-[#66756A]">{record.year}</div>
      </div>
      <div className="w-28 shrink-0 text-right">
        <div className="text-xs text-[#66756A]">Gross</div>
        <div className="text-sm text-white font-mono">{fmtCur(gross)}</div>
      </div>
      <div className="w-28 shrink-0 text-right">
        <div className="text-xs text-[#66756A]">Deductions</div>
        <div className="text-sm text-red-400 font-mono">-{fmtCur(deductions)}</div>
      </div>
      <div className="w-32 shrink-0 text-right">
        <div className="text-xs text-[#66756A]">Net Pay</div>
        <div className="text-base font-bold text-[#C9A35C] font-mono">{fmtCur(net)}</div>
      </div>
      <div className="flex-1 flex justify-center">
        {record.is_paid ? (
          <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold rounded-full">
            Paid · {record.payment_date}
          </span>
        ) : (
          <span className="px-2.5 py-1 bg-orange-500/15 text-orange-400 text-[11px] font-semibold rounded-full">
            Unpaid
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onPayslip} title="Generate Payslip"
          className="p-1.5 rounded-lg text-[#66756A] hover:text-[#C9A35C] hover:bg-[#1B2A22] transition-colors">
          <Icon path={ICONS.printer} />
        </button>
        {!record.is_paid && (
          <button onClick={onMarkPaid} title="Mark as Paid"
            className="p-1.5 rounded-lg text-[#66756A] hover:text-emerald-400 hover:bg-[#1B2A22] transition-colors">
            <Icon path={ICONS.check} />
          </button>
        )}
        <button onClick={onEdit} title="Edit"
          className="p-1.5 rounded-lg text-[#66756A] hover:text-white hover:bg-[#1B2A22] transition-colors">
          <Icon path={ICONS.edit} />
        </button>
        <button onClick={onDelete} title="Delete"
          className="p-1.5 rounded-lg text-[#66756A] hover:text-red-400 hover:bg-[#1B2A22] transition-colors">
          <Icon path={ICONS.trash} />
        </button>
      </div>
    </div>
  )
}

// ─── Currency input ───────────────────────────────────────────
function CurrencyInput({ label, value, onChange, hint }: {
  label: string; value: string; onChange: (v: string) => void; hint?: string
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium text-[#A3B1A5] uppercase tracking-wider">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#66756A] text-sm">₹</span>
        <input type="number" min="0" step="0.01"
          className="w-full bg-[#040A08] border border-[#1B2A22] rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A35C] transition-colors"
          placeholder="0.00" value={value} onChange={e => onChange(e.target.value)} />
      </div>
      {hint && <p className="text-[10px] text-[#66756A]">{hint}</p>}
    </div>
  )
}

// ─── Form types ───────────────────────────────────────────────
interface PayrollFormData {
  staff_id: string; month: string; year: string
  basic_salary: string; hra: string; transport_allowance: string
  other_allowances: string; incentives: string; overtime: string
  pf_deduction: string; esi_deduction: string; leave_deduction: string
  advance_deduction: string; other_deductions: string
  payment_mode: string; admin_notes: string
}

const emptyForm = (): PayrollFormData => ({
  staff_id: '', month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()),
  basic_salary: '', hra: '', transport_allowance: '', other_allowances: '',
  incentives: '', overtime: '', pf_deduction: '', esi_deduction: '',
  leave_deduction: '', advance_deduction: '', other_deductions: '',
  payment_mode: 'bank_transfer', admin_notes: '',
})

function recordToForm(r: SalaryRecord): PayrollFormData {
  const s = (v?: number | null) => v ? String(v) : ''
  return {
    staff_id: r.staff_id, month: String(r.month), year: String(r.year),
    basic_salary: s(r.basic_salary), hra: s(r.hra),
    transport_allowance: s(r.transport_allowance), other_allowances: s(r.other_allowances),
    incentives: s(r.incentives), overtime: s(r.overtime),
    pf_deduction: s(r.pf_deduction), esi_deduction: s(r.esi_deduction),
    leave_deduction: s(r.leave_deduction), advance_deduction: s(r.advance_deduction),
    other_deductions: s(r.other_deductions), payment_mode: r.payment_mode || 'bank_transfer',
    admin_notes: r.admin_notes || '',
  }
}

function formToInput(f: PayrollFormData): CreateSalaryInput {
  const n = (v: string) => parseFloat(v) || 0
  return {
    staff_id: f.staff_id, month: parseInt(f.month), year: parseInt(f.year),
    basic_salary: n(f.basic_salary), hra: n(f.hra),
    transport_allowance: n(f.transport_allowance), other_allowances: n(f.other_allowances),
    incentives: n(f.incentives), overtime: n(f.overtime),
    pf_deduction: n(f.pf_deduction), esi_deduction: n(f.esi_deduction),
    leave_deduction: n(f.leave_deduction), advance_deduction: n(f.advance_deduction),
    other_deductions: n(f.other_deductions), payment_mode: f.payment_mode,
    admin_notes: f.admin_notes || undefined,
  }
}

function liveCalc(f: PayrollFormData) {
  const n = (v: string) => parseFloat(v) || 0
  return calcNet({
    basic_salary: n(f.basic_salary), hra: n(f.hra),
    transport_allowance: n(f.transport_allowance), other_allowances: n(f.other_allowances),
    incentives: n(f.incentives), overtime: n(f.overtime),
    pf_deduction: n(f.pf_deduction), esi_deduction: n(f.esi_deduction),
    leave_deduction: n(f.leave_deduction), advance_deduction: n(f.advance_deduction),
    other_deductions: n(f.other_deductions),
  })
}

function liveGross(f: PayrollFormData) {
  const n = (v: string) => parseFloat(v) || 0
  return calcGross({ basic_salary: n(f.basic_salary), hra: n(f.hra),
    transport_allowance: n(f.transport_allowance), other_allowances: n(f.other_allowances),
    incentives: n(f.incentives), overtime: n(f.overtime) })
}

function liveDed(f: PayrollFormData) {
  const n = (v: string) => parseFloat(v) || 0
  return calcDeductions({ pf_deduction: n(f.pf_deduction), esi_deduction: n(f.esi_deduction),
    leave_deduction: n(f.leave_deduction), advance_deduction: n(f.advance_deduction),
    other_deductions: n(f.other_deductions) })
}

// ─── Payroll Form Modal ───────────────────────────────────────
function PayrollModal({ editRecord, staffList, onClose, onSaved }: {
  editRecord: SalaryRecord | null
  staffList: StaffForPayroll[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<PayrollFormData>(editRecord ? recordToForm(editRecord) : emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof PayrollFormData) => (v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleStaffChange = (id: string) => {
    const staff = staffList.find(s => s.id === id)
    setForm(prev => ({ ...prev, staff_id: id, basic_salary: staff?.salary ? String(staff.salary) : prev.basic_salary }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.staff_id) { setError('Please select a staff member'); return }
    setSaving(true); setError('')
    if (editRecord) {
      const res = await updateSalaryRecord(editRecord.id, formToInput(form))
      if (res.error) { setError(res.error); setSaving(false); return }
    } else {
      const res = await createSalaryRecord(formToInput(form))
      if ('error' in res) { setError(res.error); setSaving(false); return }
    }
    onSaved()
  }

  const inp = 'w-full bg-[#040A08] border border-[#1B2A22] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A35C] transition-colors'

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0A130F] border border-[#1B2A22] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-[#1B2A22] bg-[#0A130F]">
          <div>
            <h2 className="text-white font-bold text-lg">{editRecord ? 'Edit Salary Record' : 'New Salary Entry'}</h2>
            <p className="text-[#66756A] text-xs mt-0.5">Net pay calculates automatically as you type</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#1B2A22] rounded-lg text-[#66756A] hover:text-white transition-colors">
            <Icon path={ICONS.x} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="block text-[11px] font-medium text-[#A3B1A5] uppercase tracking-wider">Staff Member *</label>
              <select className={inp} value={form.staff_id} onChange={e => handleStaffChange(e.target.value)} required>
                <option value="">Select staff member</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.staff_id})</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-[#A3B1A5] uppercase tracking-wider">Month *</label>
              <select className={inp} value={form.month} onChange={e => set('month')(e.target.value)} required>
                {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-[#A3B1A5] uppercase tracking-wider">Year *</label>
              <input type="number" className={inp} value={form.year} onChange={e => set('year')(e.target.value)} min="2020" max="2040" required />
            </div>
          </div>

          <div className="card-glass rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Earnings</h3>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput label="Basic Salary *" value={form.basic_salary} onChange={set('basic_salary')} />
              <CurrencyInput label="HRA" value={form.hra} onChange={set('hra')} />
              <CurrencyInput label="Transport Allowance" value={form.transport_allowance} onChange={set('transport_allowance')} />
              <CurrencyInput label="Other Allowances" value={form.other_allowances} onChange={set('other_allowances')} />
              <CurrencyInput label="Incentives / Bonus" value={form.incentives} onChange={set('incentives')} />
              <CurrencyInput label="Overtime" value={form.overtime} onChange={set('overtime')} />
            </div>
          </div>

          <div className="card-glass rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Deductions</h3>
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput label="PF Deduction" value={form.pf_deduction} onChange={set('pf_deduction')} hint="Employee PF contribution" />
              <CurrencyInput label="ESI Deduction" value={form.esi_deduction} onChange={set('esi_deduction')} />
              <CurrencyInput label="Leave Deduction" value={form.leave_deduction} onChange={set('leave_deduction')} />
              <CurrencyInput label="Advance Deduction" value={form.advance_deduction} onChange={set('advance_deduction')} />
              <CurrencyInput label="Other Deductions" value={form.other_deductions} onChange={set('other_deductions')} />
            </div>
          </div>

          {/* Live net calc */}
          <div className="bg-[#040A08] border border-[#C9A35C]/20 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[10px] text-[#66756A] uppercase tracking-wider mb-1">Gross Pay</div>
                <div className="text-lg font-bold text-emerald-400 font-mono">{fmtCur(liveGross(form))}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#66756A] uppercase tracking-wider mb-1">Deductions</div>
                <div className="text-lg font-bold text-red-400 font-mono">-{fmtCur(liveDed(form))}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#C9A35C] uppercase tracking-wider mb-1">Net Pay</div>
                <div className="font-display text-2xl font-bold text-[#C9A35C] font-mono">{fmtCur(liveCalc(form))}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-[#A3B1A5] uppercase tracking-wider">Payment Mode</label>
              <select className={inp} value={form.payment_mode} onChange={e => set('payment_mode')(e.target.value)}>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-[#A3B1A5] uppercase tracking-wider">Admin Notes</label>
              <input type="text" className={inp} placeholder="Optional notes…"
                value={form.admin_notes} onChange={e => set('admin_notes')(e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-400">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-[#1B2A22] text-[#A3B1A5] hover:text-white rounded-lg text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-[#C9A35C] text-black font-semibold rounded-lg text-sm hover:bg-[#B08D4A] disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : (editRecord ? 'Update Record' : 'Save Salary Entry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Mark Paid Modal ──────────────────────────────────────────
function MarkPaidModal({ record, onClose, onDone }: {
  record: SalaryRecord; onClose: () => void; onDone: () => void
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [mode, setMode] = useState(record.payment_mode || 'bank_transfer')
  const [saving, setSaving] = useState(false)
  const net = calcNet(record)
  const inp = 'w-full bg-[#040A08] border border-[#1B2A22] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A35C] transition-colors'

  async function handleConfirm() {
    setSaving(true)
    await markAsPaid(record.id, date, mode)
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#0A130F] border border-[#1B2A22] rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-bold text-lg mb-1">Confirm Payment</h2>
        <p className="text-[#66756A] text-xs mb-4">
          {record.staff?.full_name} · {MONTHS[record.month - 1]} {record.year} · Net: <span className="text-[#C9A35C] font-semibold">{fmtCur(net)}</span>
        </p>
        <div className="space-y-3 mb-5">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-[#A3B1A5] uppercase tracking-wider">Payment Date</label>
            <input type="date" className={`${inp} [color-scheme:dark]`} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-[#A3B1A5] uppercase tracking-wider">Payment Mode</label>
            <select className={inp} value={mode} onChange={e => setMode(e.target.value)}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="upi">UPI</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-[#1B2A22] text-[#A3B1A5] hover:text-white rounded-lg text-sm transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={saving}
            className="flex-1 py-2.5 bg-emerald-500 text-white font-semibold rounded-lg text-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Mark as Paid'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function PayrollPage() {
  const router = useRouter()
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [staffList, setStaffList] = useState<StaffForPayroll[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()))
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editRecord, setEditRecord] = useState<SalaryRecord | null>(null)
  const [markPaidRecord, setMarkPaidRecord] = useState<SalaryRecord | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [recs, staff] = await Promise.all([
      getSalaryRecords({
        month: filterMonth ? parseInt(filterMonth) : undefined,
        year: filterYear ? parseInt(filterYear) : undefined,
        isPaid: filterStatus === 'all' ? undefined : filterStatus === 'paid',
      }),
      getStaffForPayroll(),
    ])
    setRecords(recs)
    setStaffList(staff)
    setLoading(false)
  }, [filterMonth, filterYear, filterStatus])

  useEffect(() => { loadData() }, [loadData])

  const filtered = records.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return r.staff?.full_name.toLowerCase().includes(q) || r.staff?.staff_id.toLowerCase().includes(q)
  })

  const totalGross = filtered.reduce((s, r) => s + calcGross(r), 0)
  const totalNet = filtered.reduce((s, r) => s + calcNet(r), 0)
  const totalPaid = filtered.filter(r => r.is_paid).length
  const totalUnpaid = filtered.filter(r => !r.is_paid).length

  async function handleDelete(id: string) {
    if (!confirm('Delete this salary record? This cannot be undone.')) return
    await deleteSalaryRecord(id)
    loadData()
  }

  async function handlePayslip(record: SalaryRecord) {
    setGeneratingId(record.id)
    const res = await generatePayslipDoc(record.id)
    setGeneratingId(null)
    if ('error' in res) { alert('Error: ' + res.error); return }
    window.open(`/print/documents/${res.docId}`, '_blank')
  }

  const years = Array.from({ length: 6 }, (_, i) => String(new Date().getFullYear() - 2 + i))

  return (
    <div className="animate-fade-in">
      <Header
        title="Payroll & Payslips"
        subtitle="Monthly salary entries, auto net calculation, payslip generation"
        actions={
          <button onClick={() => { setEditRecord(null); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A35C] text-black font-semibold rounded-lg text-sm hover:bg-[#B08D4A] transition-colors">
            <Icon path={ICONS.plus} />
            New Salary Entry
          </button>
        }
      />

      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Records" value={String(filtered.length)} color="#EDEFE9" />
          <StatCard label="Total Gross" value={fmtCur(totalGross)} color="#5EEAD4" />
          <StatCard label="Total Net Pay" value={fmtCur(totalNet)} color="#C9A35C" />
          <StatCard label="Paid / Unpaid" value={`${totalPaid} / ${totalUnpaid}`}
            sub={totalUnpaid > 0 ? `${totalUnpaid} pending` : 'All settled'}
            color={totalUnpaid > 0 ? '#FB923C' : '#34D399'} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#66756A] pointer-events-none">
              <Icon path={ICONS.search} size={14} />
            </span>
            <input type="text" placeholder="Search by staff name or ID…"
              className="w-full pl-9 pr-4 py-2 card-glass rounded-lg text-sm text-white placeholder-[#66756A] focus:outline-none focus:border-[#C9A35C] transition-colors"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="px-3 py-2 card-glass rounded-lg text-sm text-white focus:outline-none focus:border-[#C9A35C]"
            value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
          </select>
          <select className="px-3 py-2 card-glass rounded-lg text-sm text-white focus:outline-none focus:border-[#C9A35C]"
            value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex rounded-lg overflow-hidden border border-[#1B2A22]">
            {(['all', 'paid', 'unpaid'] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-[#C9A35C] text-black' : 'bg-[#0C1A16] text-[#A3B1A5] hover:text-white'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Records */}
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[#66756A]">Loading payroll records…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="text-4xl mb-3">💰</div>
            <div className="text-white font-semibold">No salary records found</div>
            <div className="text-[#66756A] text-sm mt-1">Click &quot;New Salary Entry&quot; to add the first record</div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-4 px-4 pb-1">
              <div className="w-48 shrink-0 text-[10px] text-[#3D4B42] uppercase tracking-wider">Staff</div>
              <div className="w-28 shrink-0 text-[10px] text-[#3D4B42] uppercase tracking-wider">Period</div>
              <div className="w-28 shrink-0 text-right text-[10px] text-[#3D4B42] uppercase tracking-wider">Gross</div>
              <div className="w-28 shrink-0 text-right text-[10px] text-[#3D4B42] uppercase tracking-wider">Deductions</div>
              <div className="w-32 shrink-0 text-right text-[10px] text-[#3D4B42] uppercase tracking-wider">Net Pay</div>
              <div className="flex-1 text-center text-[10px] text-[#3D4B42] uppercase tracking-wider">Status</div>
            </div>
            {filtered.map(record => (
              <SalaryRow key={record.id} record={record}
                onEdit={() => { setEditRecord(record); setShowModal(true) }}
                onDelete={() => handleDelete(record.id)}
                onPayslip={() => handlePayslip(record)}
                onMarkPaid={() => setMarkPaidRecord(record)} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <PayrollModal editRecord={editRecord} staffList={staffList}
          onClose={() => { setShowModal(false); setEditRecord(null) }}
          onSaved={() => { setShowModal(false); setEditRecord(null); loadData() }} />
      )}

      {markPaidRecord && (
        <MarkPaidModal record={markPaidRecord}
          onClose={() => setMarkPaidRecord(null)}
          onDone={() => { setMarkPaidRecord(null); loadData() }} />
      )}

      {generatingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="card-glass rounded-xl px-8 py-6 text-center">
            <div className="text-[#C9A35C] text-3xl mb-3">⚙️</div>
            <div className="text-white font-semibold">Generating payslip…</div>
            <div className="text-[#66756A] text-sm mt-1">Opening print view in new tab</div>
          </div>
        </div>
      )}
    </div>
  )
}
