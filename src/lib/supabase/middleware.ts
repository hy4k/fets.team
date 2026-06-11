import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes a staff/viewer role user should NOT access
const ADMIN_ONLY_PREFIXES = [
  '/staff', '/leave', '/certifications', '/documents',
  '/templates', '/document-history', '/vault',
  '/payroll', '/settings', '/audit', '/dashboard',
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            supabaseResponse.cookies.set(name, value, options as any)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname  = request.nextUrl.pathname
  const isAuthPage      = pathname.startsWith('/login')
  const isPublicVerify  = pathname.startsWith('/verify')
  const isApiRoute      = pathname.startsWith('/api')

  // Unauthenticated — send to login
  if (!user && !isAuthPage && !isPublicVerify && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    // Fetch role once
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    const role = (profile?.role as string) ?? 'staff'
    const isStaffOnly = role === 'staff' || role === 'viewer'

    // On login page → redirect to appropriate home
    if (isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = isStaffOnly ? '/self-service' : '/dashboard'
      return NextResponse.redirect(url)
    }

    // Staff/viewer trying to access admin-only routes → bounce to portal
    if (isStaffOnly) {
      const blocked = ADMIN_ONLY_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (blocked) {
        const url = request.nextUrl.clone()
        url.pathname = '/self-service'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
