'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, DollarSign, Award,
  Calendar, Settings, LogOut, ChevronLeft, Building2,
  ClipboardList, Shield, Folder, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/staff', label: 'Staff', icon: Users },
    ],
  },
  {
    label: 'HR',
    items: [
      { href: '/leave', label: 'Leave & Attendance', icon: Calendar },
      { href: '/certifications', label: 'Certifications', icon: Award },
    ],
  },
  {
    label: 'Documents',
    items: [
      { href: '/documents', label: 'Document Generator', icon: FileText },
      { href: '/templates', label: 'Template Library', icon: Folder },
      { href: '/document-history', label: 'Document History', icon: ClipboardList },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/payroll', label: 'Payroll & Payslips', icon: DollarSign },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', label: 'Admin Settings', icon: Settings },
      { href: '/audit', label: 'Audit Log', icon: Shield },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-[#0D0D15] border-r border-[#1E1E2E] flex flex-col z-50 transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[#1E1E2E] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div className="w-9 h-9 bg-[#F5C518] rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-[#F5C518]/20">
            <Shield className="w-[18px] h-[18px] text-[#0A0A0F]" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-[#F5C518] font-bold text-[15px] tracking-[0.18em] leading-none">FETS</div>
              <div className="text-[#5A5A72] text-[9px] tracking-[0.15em] uppercase mt-1">Internal OS</div>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="ml-auto w-7 h-7 flex items-center justify-center rounded-md text-[#3A3A55] hover:text-[#F5C518] hover:bg-[#1E1E2E] transition-all shrink-0"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <ChevronLeft className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3">
            {!collapsed && (
              <div className="text-[#3A3A55] text-[9px] font-semibold uppercase tracking-[0.15em] px-3 py-1 mb-1">
                {group.label}
              </div>
            )}
            {collapsed && <div className="w-full h-px bg-[#1E1E2E] my-2" />}

            {group.items.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg transition-all duration-150 overflow-hidden',
                    collapsed ? 'h-10 justify-center px-0 mx-1' : 'h-9 px-3',
                    isActive
                      ? 'bg-[#F5C518]/10 text-[#F5C518]'
                      : 'text-[#5A5A72] hover:bg-[#1A1A28] hover:text-[#C0C0D0]'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#F5C518] rounded-r-full" />
                  )}

                  <Icon
                    className={cn(
                      'w-[18px] h-[18px] shrink-0 transition-colors',
                      isActive ? 'text-[#F5C518]' : 'text-[#3A3A55] group-hover:text-[#8B8BA0]',
                      collapsed && 'mx-auto'
                    )}
                  />

                  {!collapsed && (
                    <span className={cn('text-[13px] font-medium truncate', isActive ? 'text-[#F5C518]' : '')}>
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip for collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1E1E2E] text-[#F0F0F5] text-xs rounded-lg border border-[#2A2A3E] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl transition-opacity">
                      {item.label}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#1E1E2E] p-2 shrink-0">
        <button
          onClick={handleLogout}
          className={cn(
            'group flex items-center gap-3 w-full rounded-lg transition-all duration-150 text-[#3A3A55] hover:text-red-400 hover:bg-red-500/8',
            collapsed ? 'h-10 justify-center' : 'h-9 px-3'
          )}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0 transition-colors" />
          {!collapsed && <span className="text-[13px] font-medium">Sign Out</span>}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1E1E2E] text-[#F0F0F5] text-xs rounded-lg border border-[#2A2A3E] opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
