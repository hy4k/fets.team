// Plain utility — no 'use server'. Safe for both server actions and client components.

export const LEAVE_STATUSES = ['pending', 'approved', 'rejected'] as const
export type LeaveStatus = (typeof LEAVE_STATUSES)[number]

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
}

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'half_day', 'holiday'] as const
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number]

export const ATTENDANCE_LABELS: Record<string, string> = {
  present: 'Present', absent: 'Absent', late: 'Late',
  half_day: 'Half Day', holiday: 'Holiday',
}
