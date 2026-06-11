// Plain utility — no 'use server'. Safe to import from both server actions and client components.

export const DOC_TYPES = [
  'Contract / Offer Letter',
  'Appointment Letter',
  'ID Proof',
  'Address Proof',
  'Educational Certificate',
  'Experience Certificate',
  'Relieving Letter',
  'Payslip',
  'Warning Letter',
  'NOC / NDC',
  'Performance Review',
  'Medical Certificate',
  'Policy Acknowledgement',
  'Other',
] as const

export type DocType = (typeof DOC_TYPES)[number]
