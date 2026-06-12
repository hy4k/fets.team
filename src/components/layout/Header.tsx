'use client'

import { Bell, Command } from 'lucide-react'

interface HeaderProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  action?: React.ReactNode  // alias
}

export default function Header({ title, actions, action }: HeaderProps) {
  const headerActions = actions ?? action

  const openPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  }

  return (
    <header className="sticky top-0 z-40 px-6 pt-4 pb-3"
      style={{
        background: 'linear-gradient(180deg, rgba(4,10,8,0.88) 60%, rgba(4,10,8,0))',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}>
      <div className="flex items-center gap-3 max-w-[1600px] mx-auto">

        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #E2C285 0%, #A87F3D 100%)',
              boxShadow: '0 3px 12px rgba(201,163,92,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}>
            <span className="font-display font-semibold text-[15px] leading-none" style={{ color: '#120D04' }}>f</span>
          </div>
          <span className="font-display text-[17px] font-semibold tracking-tight text-[#EDEFE9]">
            fets<span style={{ color: 'var(--brass-400)' }}>.team</span>
          </span>
        </div>

        {/* Page context */}
        {title && title !== 'Dashboard' && (
          <span className="text-sm truncate min-w-0" style={{ color: 'var(--text-muted)' }}>
            <span className="mx-1.5" style={{ color: 'var(--text-ghost)' }}>/</span>{title}
          </span>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Palette trigger */}
          <button onClick={openPalette}
            className="hidden lg:flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl text-sm transition-all"
            style={{
              background: 'rgba(226,194,133,0.04)',
              border: '1px solid rgba(226,194,133,0.10)',
              color: 'var(--text-muted)',
            }}>
            <Command className="w-3.5 h-3.5" />
            <span className="text-xs">Jump to…</span>
            <span className="kbd-hint">Ctrl K</span>
          </button>

          {headerActions}

          <button className="relative w-8 h-8 flex items-center justify-center rounded-xl transition-all"
            style={{
              background: 'rgba(226,194,133,0.04)',
              border: '1px solid rgba(226,194,133,0.10)',
              color: 'var(--text-muted)',
            }}>
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--brass-400)', boxShadow: '0 0 6px var(--brass-glow)' }} />
          </button>
        </div>
      </div>
    </header>
  )
}
