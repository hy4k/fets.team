'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface StaffFormData {
  // Personal
  full_name: string
  email?: string
  phone?: string
  gender?: string
  date_of_birth?: string
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    pincode?: string
  }
  emergency_contact?: {
    name?: string
    phone?: string
    relation?: string
  }
  // Employment
  designation_id?: string
  department_id?: string
  centre_id: string
  employment_type: string
  date_of_joining?: string
  salary?: number
  // Bank
  bank_account?: {
    account_name?: string
    account_number?: string
    bank_name?: string
    ifsc_code?: string
    branch?: string
  }
  // Documents
  aadhaar_number?: string
  pan_number?: string
  photo_url?: string
}

export async function getStaffList(filters?: {
  centre_id?: string
  status?: string
  search?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from('staff')
    .select(`
      *,
      centre:centres(id, name, city),
      department:departments(id, name),
      designation:designations(id, title)
    `)
    .order('created_at', { ascending: false })

  if (filters?.centre_id) {
    query = query.eq('centre_id', filters.centre_id)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,staff_id.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('getStaffList error:', error)
    return []
  }
  return data || []
}

export async function getStaffById(staffId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('staff')
    .select(`
      *,
      centre:centres(id, name, city, address),
      department:departments(id, name),
      designation:designations(id, title)
    `)
    .eq('id', staffId)
    .single()

  if (error) {
    console.error('getStaffById error:', error)
    return null
  }
  return data
}

export async function generateNextStaffId(): Promise<string> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('staff')
    .select('staff_id')
    .order('staff_id', { ascending: false })
    .limit(1)
    .single()

  if (!data) return 'FETS0018'

  const match = data.staff_id.match(/FETS(\d+)/)
  if (!match) return 'FETS0018'

  const nextNum = parseInt(match[1]) + 1
  return `FETS${String(nextNum).padStart(4, '0')}`
}

export async function createStaff(formData: StaffFormData) {
  const supabase = await createClient()

  const nextId = await generateNextStaffId()

  const { data, error } = await supabase
    .from('staff')
    .insert({
      staff_id: nextId,
      full_name: formData.full_name,
      email: formData.email || null,
      phone: formData.phone || null,
      gender: formData.gender || null,
      date_of_birth: formData.date_of_birth || null,
      address: formData.address || {},
      emergency_contact: formData.emergency_contact || {},
      designation_id: formData.designation_id || null,
      department_id: formData.department_id || null,
      centre_id: formData.centre_id,
      employment_type: formData.employment_type || 'full_time',
      status: 'active',
      date_of_joining: formData.date_of_joining || null,
      salary: formData.salary || null,
      bank_account: formData.bank_account || {},
      aadhaar_number: formData.aadhaar_number || null,
      pan_number: formData.pan_number || null,
      photo_url: formData.photo_url || null,
    })
    .select()
    .single()

  if (error) {
    console.error('createStaff error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/staff')
  return { success: true, data }
}

export async function updateStaff(id: string, formData: Partial<StaffFormData>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('staff')
    .update({
      ...formData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateStaff error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/staff')
  revalidatePath(`/staff/${id}`)
  return { success: true, data }
}

export async function updateStaffStatus(id: string, status: string) {
  const supabase = await createClient()

  const updates: Record<string, string> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'resigned' || status === 'terminated') {
    updates.date_of_leaving = new Date().toISOString().split('T')[0]
  }

  const { error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/staff')
  revalidatePath(`/staff/${id}`)
  return { success: true }
}

export async function getCentres() {
  const supabase = await createClient()
  const { data } = await supabase.from('centres').select('*').order('name')
  return data || []
}

export async function getDepartments() {
  const supabase = await createClient()
  const { data } = await supabase.from('departments').select('*').order('name')
  return data || []
}

export async function getDesignations() {
  const supabase = await createClient()
  const { data } = await supabase.from('designations').select('*').order('title')
  return data || []
}

export async function uploadStaffPhoto(staffId: string, file: File) {
  const supabase = await createClient()

  const ext = file.name.split('.').pop()
  const filePath = `${staffId}/photo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('staff-photos')
    .upload(filePath, file, { upsert: true })

  if (uploadError) return { success: false, error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage
    .from('staff-photos')
    .getPublicUrl(filePath)

  await supabase.from('staff').update({ photo_url: publicUrl }).eq('id', staffId)

  revalidatePath(`/staff/${staffId}`)
  return { success: true, url: publicUrl }
}
