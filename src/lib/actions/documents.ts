'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { GeneratedDocument, DocumentTemplate } from '@/lib/types'

// ─── Get settings for letterhead ─────────────────────────────
export async function getAdminSettings(): Promise<Record<string, string>> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_settings')
    .select('key, value')
  const settings: Record<string, string> = {}
  if (data) {
    for (const row of data as { key: string; value: string }[]) {
      settings[row.key] = row.value
    }
  }
  return settings
}

// ─── Atomic doc number generation ────────────────────────────
export async function generateDocNumber(): Promise<string> {
  const supabase = await createClient()
  const year = new Date().getFullYear()

  // Increment counter atomically
  const { data, error } = await supabase.rpc('increment_doc_counter')

  if (error || !data) {
    // Fallback: read current counter
    const { data: row } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'doc_number_counter')
      .single() as { data: { value: string } | null }
    const counter = row ? parseInt(row.value, 10) + 1 : 1001
    return `FETS/${year}/${counter}`
  }

  return `FETS/${year}/${data}`
}

// ─── List document templates ──────────────────────────────────
export async function getDocumentTemplates(): Promise<DocumentTemplate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as DocumentTemplate[]
}

// ─── List generated documents ─────────────────────────────────
export async function getGeneratedDocuments(filters?: {
  staffId?: string
  docType?: string
  status?: string
  limit?: number
}): Promise<GeneratedDocument[]> {
  const supabase = await createClient()
  let query = supabase
    .from('generated_documents')
    .select(`
      *,
      staff:staff_id (
        id, staff_id, full_name, photo_url,
        centre:centre_id (id, name, city),
        department:department_id (id, name)
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.staffId)  query = query.eq('staff_id', filters.staffId)
  if (filters?.docType)  query = query.eq('doc_type', filters.docType)
  if (filters?.status)   query = query.eq('status', filters.status)
  if (filters?.limit)    query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data || []) as unknown as GeneratedDocument[]
}

// ─── Get single generated document ───────────────────────────
export async function getGeneratedDocument(id: string): Promise<GeneratedDocument | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('generated_documents')
    .select(`
      *,
      staff:staff_id (
        id, staff_id, full_name, photo_url, phone, email,
        date_of_joining, salary, designation_text,
        centre:centre_id (id, name, city),
        department:department_id (id, name),
        designation:designation_id (id, title)
      )
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as GeneratedDocument
}

// ─── Create generated document ────────────────────────────────
export interface CreateDocumentInput {
  docType: string
  templateId?: string
  staffId?: string | null
  fieldValues: Record<string, string>
  status?: 'draft' | 'generated'
}

export async function createGeneratedDocument(input: CreateDocumentInput): Promise<{ id: string; docNumber: string } | { error: string }> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Generate doc number
  const docNumber = await generateDocNumber()

  const { data, error } = await supabase
    .from('generated_documents')
    .insert({
      doc_number: docNumber,
      doc_type: input.docType,
      template_id: input.templateId || null,
      staff_id: input.staffId || null,
      field_values: input.fieldValues,
      status: input.status || 'generated',
      created_by: user.id,
    })
    .select('id, doc_number')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/documents')
  revalidatePath('/document-history')

  return { id: (data as { id: string; doc_number: string }).id, docNumber: (data as { id: string; doc_number: string }).doc_number }
}

// ─── Update document status ───────────────────────────────────
export async function updateDocumentStatus(
  id: string,
  status: GeneratedDocument['status'],
  remarks?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const update: Record<string, unknown> = { status }
  if (status === 'approved') {
    update.approved_by = user?.id
    update.approval_date = new Date().toISOString()
    if (remarks) update.approval_remarks = remarks
  }

  const { error } = await supabase
    .from('generated_documents')
    .update(update)
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/document-history')
  return {}
}

// ─── Delete document (admin only) ────────────────────────────
export async function deleteGeneratedDocument(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('generated_documents')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/document-history')
  return {}
}

// ─── Verification lookup ──────────────────────────────────────
export async function verifyDocument(verificationId: string): Promise<GeneratedDocument | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('generated_documents')
    .select('*, staff:staff_id(id, staff_id, full_name)')
    .eq('verification_id', verificationId)
    .single()

  if (error) return null
  return data as unknown as GeneratedDocument
}
