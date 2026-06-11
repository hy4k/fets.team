'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { DocumentTemplate } from '@/lib/types'

// ─── List all templates ──────────────────────────────────────
export async function getAllTemplates(): Promise<DocumentTemplate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as DocumentTemplate[]
}

// ─── Toggle active/inactive ──────────────────────────────────
export async function toggleTemplateActive(
  id: string,
  isActive: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('document_templates')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/templates')
  revalidatePath('/documents/new')
  return { ok: true }
}

// ─── Update template metadata ────────────────────────────────
export interface TemplateMetaInput {
  name: string
  description: string
  has_letterhead: boolean
  has_signature: boolean
  has_seal: boolean
  has_qr: boolean
}

export async function updateTemplateMeta(
  id: string,
  input: TemplateMetaInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('document_templates')
    .update({
      name: input.name,
      description: input.description,
      has_letterhead: input.has_letterhead,
      has_signature: input.has_signature,
      has_seal: input.has_seal,
      has_qr: input.has_qr,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/templates')
  return { ok: true }
}
