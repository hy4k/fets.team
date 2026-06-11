'use server'

import { createClient } from '@/lib/supabase/server'

// Public-safe fields only — no salary, no sensitive employee data
export interface PublicDocumentVerification {
  id: string
  doc_number: string
  doc_type: string
  status: string
  verification_id: string
  created_at: string
  approval_date: string | null
  approval_remarks: string | null
  field_values: Record<string, unknown>
  staff: {
    full_name: string
    staff_id: string
    designation_text: string | null
    centre: { name: string } | null
  } | null
}

export async function getDocumentByVerificationId(
  verificationId: string
): Promise<PublicDocumentVerification | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await (supabase as any)
      .from('generated_documents')
      .select(`
        id, doc_number, doc_type, status, verification_id,
        created_at, approval_date, approval_remarks, field_values,
        staff:staff_id (
          full_name, staff_id, designation_text,
          centre:centre_id ( name )
        )
      `)
      .eq('verification_id', verificationId)
      .single()

    if (error || !data) return null
    return data as PublicDocumentVerification
  } catch {
    return null
  }
}
