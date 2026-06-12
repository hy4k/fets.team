'use client'

import { useEffect, useState } from 'react'
import CommandDock from '@/components/layout/CommandDock'
import CommandPalette from '@/components/layout/CommandPalette'

interface ClientLayoutProps {
  children: React.ReactNode
  role: string
}

export default function ClientLayout({ children, role }: ClientLayoutProps) {
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Global Ctrl/Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="aurora-veil" aria-hidden />
      <main className="relative z-10 min-h-screen pb-28">
        {children}
      </main>
      <CommandDock role={role} onOpenPalette={() => setPaletteOpen(true)} />
      <CommandPalette role={role} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
