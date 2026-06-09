'use client'

import { Bell, Search, Menu } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  action?: React.ReactNode  // alias
}

export default function Header({ title, subtitle, actions, action }: HeaderProps) {
  const headerActions = actions ?? action
  return (
    <header className="h-16 border-b border-[#1E1E2E] flex items-center px-6 gap-4 bg-[#0A0A0F]/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-semibold text-[#F0F0F5] truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-[#5A5A72] mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {/* Search */}
        <div className="relative hidden lg:flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 text-[#3A3A55]" />
          <input
            type="text"
            placeholder="Quick search..."
            className="pl-8 pr-4 py-1.5 bg-[#12121A] border border-[#1E1E2E] rounded-lg text-sm text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F5C518]/50 w-44 transition-all"
          />
        </div>

        {/* Custom actions */}
        {headerActions}

        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-[#12121A] border border-[#1E1E2E] text-[#3A3A55] hover:text-[#F0F0F5] hover:border-[#2A2A3E] transition-all">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#F5C518] rounded-full" />
        </button>
      </div>
    </header>
  )
}
