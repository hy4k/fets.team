// Plain utility — no 'use server'. Safe to import from both server actions and client components.

export const CERT_STATUSES = [
  'not_started',
  'in_progress',
  'passed',
  'failed',
  'expired',
  'renewed',
] as const

export type CertStatus = (typeof CERT_STATUSES)[number]

export const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  passed: 'Passed',
  failed: 'Failed',
  expired: 'Expired',
  renewed: 'Renewed',
}

export const STATUS_COLORS: Record<string, string> = {
  not_started: 'text-[#66756A] bg-[#12231C]',
  in_progress: 'text-blue-400 bg-blue-500/10',
  passed: 'text-green-400 bg-green-500/10',
  failed: 'text-red-400 bg-red-500/10',
  expired: 'text-orange-400 bg-orange-500/10',
  renewed: 'text-teal-400 bg-teal-500/10',
}

export const CERT_CATEGORIES = [
  'Testing / Exam Delivery',
  'Language Proficiency',
  'Finance & Accounting',
  'Medical / Healthcare',
  'Cloud & Technology',
  'Internal / FETS',
  'Other',
] as const
