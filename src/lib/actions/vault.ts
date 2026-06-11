'use server'

import { createClient } from '@/lib/supabase/server'

export interface VaultDocument {
  id: string
  staff_id: string
  doc_name: string
  doc_type: string
  file_url: string
  storage_path: string | null
  file_size: number | null
  mime_type: string | null
  notes: string | null
  uploaded_by: string | null
  is_visible_to_employee: boolean
  created_at: string
  updated_at: string | null
  staff?: {
    full_name: string
    staff_id: string
  }
}

export interface StaffForVault {
  id: string
  staff_id: string
  full_name: string
}

// DOC_TYPES lives in @/lib/utils/vault to avoid 'use server' proxy issues

export async function getVaultDocuments(filters?: {
  staffId?: string
  docType?: string
  search?: string
  limit?: number
}): Promise<VaultDocument[]> {
  const supabase = await createClient()
  let q = (supabase as any)
    .from('document_vault')
    .select('*, staff:staff_id(full_name, staff_id)')
    .order('created_at', { ascending: false })

  if (filters?.staffId) q = q.eq('staff_id', filters.staffId)
  if (filters?.docType) q = q.eq('doc_type', filters.docType)
  if (filters?.search) q = q.ilike('doc_name', `%${filters.search}%`)
  if (filters?.limit) q = q.limit(filters.limit)

  const { data, error } = await q
  if (error) { console.error('getVaultDocuments:', error); return [] }
  return (data || []) as VaultDocument[]
}

export async function uploadVaultFile(formData: FormData): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const file = formData.get('file') as File
  const staffId = formData.get('staff_id') as string
  const docName = formData.get('doc_name') as string
  const docType = formData.get('doc_type') as string
  const notes = formData.get('notes') as string
  const isVisible = formData.get('is_visible_to_employee') === 'true'

  if (!file || file.size === 0) return { error: 'No file selected' }
  if (!staffId || !docName || !docType) return { error: 'Staff member, document name and type are required' }

  // Build safe storage path: {staffId}/{timestamp}_{sanitized_filename}
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${staffId}/${Date.now()}_${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('staff-documents')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) return { error: `Storage upload failed: ${uploadError.message}` }

  const { data, error } = await (supabase as any)
    .from('document_vault')
    .insert({
      staff_id: staffId,
      doc_name: docName,
      doc_type: docType,
      file_url: storagePath,   // store path; use getVaultDownloadUrl to get signed URL
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      notes: notes || null,
      is_visible_to_employee: isVisible,
      uploaded_by: user?.id,
    })
    .select('id')
    .single()

  if (error) {
    // Rollback the storage upload
    await supabase.storage.from('staff-documents').remove([storagePath])
    return { error: error.message }
  }

  return { id: data.id }
}

export async function updateVaultDocument(
  id: string,
  updates: { doc_name?: string; doc_type?: string; notes?: string; is_visible_to_employee?: boolean }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await (supabase as any)
    .from('document_vault')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function deleteVaultDocument(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: doc } = await (supabase as any)
    .from('document_vault')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (doc?.storage_path) {
    await supabase.storage.from('staff-documents').remove([doc.storage_path])
  }

  const { error } = await (supabase as any).from('document_vault').delete().eq('id', id)
  if (error) return { error: error.message }
  return {}
}

export async function getVaultDownloadUrl(id: string): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()

  const { data: doc } = await (supabase as any)
    .from('document_vault')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (!doc?.storage_path) return { error: 'Document file not found' }

  const { data, error } = await supabase.storage
    .from('staff-documents')
    .createSignedUrl(doc.storage_path, 3600) // 1-hour signed URL

  if (error || !data?.signedUrl) return { error: 'Could not generate download URL' }
  return { url: data.signedUrl }
}

export async function getStaffForVault(): Promise<StaffForVault[]> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('staff')
    .select('id, staff_id, full_name')
    .eq('status', 'active')
    .order('full_name')
  return (data || []) as StaffForVault[]
}

export async function getVaultStats(): Promise<{
  total: number
  byType: Record<string, number>
  visibleToStaff: number
}> {
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('document_vault')
    .select('doc_type, is_visible_to_employee')

  const docs = (data || []) as Array<{ doc_type: string; is_visible_to_employee: boolean }>
  const byType: Record<string, number> = {}
  let visibleToStaff = 0

  for (const d of docs) {
    byType[d.doc_type] = (byType[d.doc_type] || 0) + 1
    if (d.is_visible_to_employee) visibleToStaff++
  }

  return { total: docs.length, byType, visibleToStaff }
}
