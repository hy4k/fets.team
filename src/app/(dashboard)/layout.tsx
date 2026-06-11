import { createClient } from '@/lib/supabase/server'
import ClientLayout from '@/components/layout/ClientLayout'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role = 'staff'
  if (user) {
    const { data } = await (supabase as any)
      .from('profiles').select('role').eq('id', user.id).single()
    role = data?.role ?? 'staff'
  }

  return <ClientLayout role={role}>{children}</ClientLayout>
}
