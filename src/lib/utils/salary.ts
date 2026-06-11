// Pure calculation helpers — importable by both server actions and client components

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export interface SalaryFields {
  basic_salary?: number | null
  hra?: number | null
  transport_allowance?: number | null
  other_allowances?: number | null
  incentives?: number | null
  overtime?: number | null
  pf_deduction?: number | null
  esi_deduction?: number | null
  leave_deduction?: number | null
  advance_deduction?: number | null
  other_deductions?: number | null
}

export function calcGross(r: SalaryFields): number {
  return (r.basic_salary || 0) + (r.hra || 0) + (r.transport_allowance || 0) +
    (r.other_allowances || 0) + (r.incentives || 0) + (r.overtime || 0)
}

export function calcDeductions(r: SalaryFields): number {
  return (r.pf_deduction || 0) + (r.esi_deduction || 0) + (r.leave_deduction || 0) +
    (r.advance_deduction || 0) + (r.other_deductions || 0)
}

export function calcNet(r: SalaryFields): number {
  return calcGross(r) - calcDeductions(r)
}
