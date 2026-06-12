'use client'

import { Bell, Command } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  action?: React.ReactNode  // alias
}

export default function Header({ title, subtitle, actions, action }: HeaderProps) {
  const headerActions = actions ?? action

  const openPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  }

  return (
    <header className="sticky top-0 z-40 px-6 pt-4 pb-3"
      style={{
        background: 'linear-gradient(180deg, rgba(4,10,8,0.88) 60%, rgba(4,10,8,0))',
        backdropFilter: 'blur(14px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
      }}>
      <div className="flex items-center gap-4 max-w-[1600px] mx-auto">
        {/* Brand mark */}
        <div className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, #E2C285 0%, #A87F3D 100%)',
            boxShadow: '0 4px 16px rgba(201,163,92,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
          }}>
          <span className="font-display font-semibold text-[13px]" style={{ color: '#120D04' }}>F</span>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg font-semibold text-[#EDEFE9] truncate leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[#66756A] mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

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
