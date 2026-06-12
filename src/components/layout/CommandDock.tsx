'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, DollarSign, Award,
  Calendar, Settings, LogOut, Shield, Folder, Archive,
  ClipboardList, Star, CalendarDays, Command,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  group: string
  roles: string[]
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',       label: 'Dashboard',          icon: LayoutDashboard, group: 'Overview',        roles: ['super_admin','hr_admin','centre_manager','accountant','viewer'] },
  { href: '/staff',           label: 'Staff',              icon: Users,           group: 'Overview',        roles: ['super_admin','hr_admin','centre_manager','accountant','viewer'] },
  { href: '/self-service',    label: 'My Portal',          icon: Star,            group: 'Self Service',    roles: ['super_admin','hr_admin','centre_manager','accountant','staff','viewer'] },
  { href: '/roster',          label: 'Operations Roster',  icon: CalendarDays,    group: 'HR & Compliance', roles: ['super_admin','hr_admin','centre_manager'] },
  { href: '/leave',           label: 'Leave & Attendance', icon: Calendar,        group: 'HR & Compliance', roles: ['super_admin','hr_admin','centre_manager'] },
  { href: '/certifications',  label: 'Certifications',     icon: Award,           group: 'HR & Compliance', roles: ['super_admin','hr_admin','centre_manager'] },
  { href: '/documents',       label: 'Document Generator', icon: FileText,        group: 'Documents',       roles: ['super_admin','hr_admin','centre_manager'] },
  { href: '/templates',       label: 'Template Library',   icon: Folder,          group: 'Documents',       roles: ['super_admin','hr_admin','centre_manager'] },
  { href: '/document-history',label: 'Document History',   icon: ClipboardList,   group: 'Documents',       roles: ['super_admin','hr_admin','centre_manager'] },
  { href: '/vault',           label: 'Document Vault',     icon: Archive,         group: 'Documents',       roles: ['super_admin','hr_admin','centre_manager'] },
  { href: '/payroll',         label: 'Payroll & Payslips', icon: DollarSign,      group: 'Finance',         roles: ['super_admin','hr_admin','accountant'] },
  { href: '/settings',        label: 'Admin Settings',     icon: Settings,        group: 'System',          roles: ['super_admin'] },
  { href: '/audit',           label: 'Audit Log',          icon: Shield,          group: 'System',          roles: ['super_admin'] },
]

export function navForRole(role: string) {
  return NAV_ITEMS.filter(i => i.roles.includes(role))
}

interface CommandDockProps {
  role: string
  onOpenPalette: () => void
}

export default function CommandDock({ role, onOpenPalette }: CommandDockProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const items = navForRole(role)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // group boundaries for dividers
  const groups: string[] = []
  items.forEach(i => { if (!groups.includes(i.group)) groups.push(i.group) })

  return (
    <nav className="command-dock" aria-label="Primary">
      {groups.map((g, gi) => (
        <div key={g} className="flex items-center gap-1">
          {gi > 0 && <span className="dock-divider" />}
          {items.filter(i => i.group === g).map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                className={cn('dock-item', isActive && 'active')}
                aria-current={isActive ? 'page' : undefined}>
                <item.icon style={{ width: 19, height: 19 }} />
                <span className="dock-tooltip">{item.label}</span>
              </Link>
            )
          })}
        </div>
      ))}

      <span className="dock-divider" />

      <button onClick={onOpenPalette} className="dock-item" aria-label="Command palette">
        <Command style={{ width: 19, height: 19 }} />
        <span className="dock-tooltip">Command Palette · Ctrl K</span>
      </button>

      <button onClick={handleLogout} className="dock-item hover:!text-[#FB7185]" aria-label="Sign out">
        <LogOut style={{ width: 19, height: 19 }} />
        <span className="dock-tooltip">Sign Out</span>
      </button>
    </nav>
  )
}
