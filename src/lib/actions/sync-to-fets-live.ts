'use server'

import { getFetsLiveClient } from '@/lib/fets-live'

export type SyncStatus = 'created' | 'already_exists' | 'no_email' | 'error'

export async function syncUserToFetsLive(params: {
  email: string | null
  full_name: string
  designation: string | null
  centre_name: string | null
}): Promise<{ ok: boolean; status: SyncStatus; message: string }> {
  const email = params.email?.trim()
  if (!email) {
    return { ok: false, status: 'no_email', message: 'No email on file — add one to the staff record first' }
  }

  try {
    const live = getFetsLiveClient()

    // Check if user already exists in fets.live
    const { data: listData, error: listErr } = await live.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listErr) return { ok: false, status: 'error', message: listErr.message }

    const existing = (listData?.users ?? []).find((u: any) => u.email === email)

    if (existing) {
      // Upsert staff_profiles to keep data in sync
      await live.from('staff_profiles').upsert(
        {
          user_id: existing.id,
          full_name: params.full_name,
          role: params.designation ?? null,
          branch_assigned: params.centre_name ?? null,
          is_active: true,
        },
        { onConflict: 'user_id' },
      )
      return { ok: true, status: 'already_exists', message: 'Already on fets.live — profile synced' }
    }

    // Create user in fets.live auth (no password; staff uses "Forgot Password" on fets.live to set one)
    const { data: createData, error: createErr } = await live.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { full_name: params.full_name },
    })
    if (createErr || !createData?.user) {
      return { ok: false, status: 'error', message: createErr?.message ?? 'Auth user creation failed' }
    }

    // Create matching staff_profiles record in fets.live
    const { error: profileErr } = await live.from('staff_profiles').insert({
      user_id: createData.user.id,
      full_name: params.full_name,
      role: params.designation ?? null,
      branch_assigned: params.centre_name ?? null,
      is_active: true,
    })
    if (profileErr) {
      return {
        ok: false,
        status: 'error',
        message: `Auth user created but staff profile failed: ${profileErr.message}`,
      }
    }

    return { ok: true, status: 'created', message: `fets.live account created for ${email}` }
  } catch (e: any) {
    return { ok: false, status: 'error', message: e.message ?? 'Unknown error' }
  }
}
