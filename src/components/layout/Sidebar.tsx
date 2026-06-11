'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, DollarSign, Award,
  Calendar, Settings, LogOut, ChevronLeft, Building2,
  ClipboardList, Shield, Folder, Archive, ChevronRight, Star,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/staff', label: 'Staff', icon: Users },
    ],
  },
  {
    label: 'Self Service',
    items: [
      { href: '/self-service', label: 'My Portal', icon: Star },
    ],
  },
  {
    label: 'HR & Compliance',
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
      { href: '/vault', label: 'Document Vault', icon: Archive },
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

interface SidebarProps { collapsed: boolean; onToggle: () => void }

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full flex flex-col z-50 transition-all duration-300 ease-in-out',
      'border-r border-[rgba(124,58,237,0.1)]',
      collapsed ? 'w-[72px]' : 'w-[260px]'
    )}
      style={{
        background: 'linear-gradient(180deg, #0C0A1F 0%, #09071A 50%, #07060E 100%)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.5), inset -1px 0 0 rgba(124,58,237,0.08)',
      }}
    >

      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 shrink-0 border-b border-[rgba(124,58,237,0.08)]',
        collapsed ? 'px-4 justify-center' : 'px-5 gap-3'
      )}>
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #9B6DFF 0%, #6D28D9 100%)',
              boxShadow: '0 4px 16px rgba(109,40,217,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}>
            <Shield className="w-[18px] h-[18px] text-white" />
          </div>
          <div className="absolute -inset-1 rounded-xl opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.4), transparent 70%)', zIndex: -1 }} />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm leading-tight"
              style={{ background: 'linear-gradient(135deg, #F0EEF8, #C4B5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FETS OS
            </p>
            <p className="text-[10px] font-medium tracking-wider uppercase"
              style={{ color: 'var(--violet-600)' }}>
              Operations Suite
            </p>
          </div>
        )}
      </div>

      {/* Toggle */}
      <button onClick={onToggle}
        className={cn(
          'absolute top-[52px] flex items-center justify-center w-6 h-6 rounded-full z-10 transition-all duration-200',
          collapsed ? '-right-3' : '-right-3'
        )}
        style={{
          background: 'linear-gradient(135deg, #9B6DFF, #6D28D9)',
          boxShadow: '0 2px 12px rgba(109,40,217,0.5)',
          border: '1.5px solid rgba(155,109,255,0.4)',
        }}>
        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5 text-white" />
          : <ChevronLeft className="w-3.5 h-3.5 text-white" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-700 tracking-[0.12em] uppercase"
                style={{ color: 'var(--text-ghost)', letterSpacing: '0.14em' }}>
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link key={item.href} href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl transition-all duration-200 group relative',
                      collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5',
                      isActive ? 'text-white' : 'text-[#5A567A] hover:text-[#9A96B8]'
                    )}
                    style={isActive ? {
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(109,40,217,0.1))',
                      boxShadow: '0 4px 16px rgba(109,40,217,0.2), inset 0 1px 0 rgba(139,92,246,0.15)',
                      border: '1px solid rgba(124,58,237,0.2)',
                    } : {
                      background: 'transparent',
                      border: '1px solid transparent',
                    }}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4/5 rounded-full"
                        style={{ background: 'linear-gradient(180deg, #C4B5FD, #7C3AED)' }} />
                    )}
                    <item.icon className={cn('shrink-0 transition-colors',
                      collapsed ? 'w-5 h-5' : 'w-4.5 h-4.5',
                      isActive ? 'text-[#C4B5FD]' : 'text-current'
                    )} style={{ width: '18px', height: '18px' }} />
                    {!collapsed && (
                      <span className={cn('text-sm font-medium truncate',
                        isActive ? 'text-white' : ''
                      )}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="shrink-0 p-3 border-t border-[rgba(124,58,237,0.08)]">
        <button onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 group',
            'text-[#5A567A] hover:text-[#FB7185]',
            collapsed && 'justify-center px-2'
          )}
          style={{ border: '1px solid transparent' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(244,63,94,0.08)'
            ;(e.currentTarget as HTMLElement).style.border = '1px solid rgba(244,63,94,0.15)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.border = '1px solid transparent'
          }}
        >
          <LogOut style={{ width: '18px', height: '18px' }} className="shrink-0 transition-colors" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
