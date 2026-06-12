'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, CornerDownLeft, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { navForRole } from './CommandDock'

interface CommandPaletteProps {
  role: string
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ role, open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const actions = useMemo(() => {
    const nav = navForRole(role).map(i => ({
      id: i.href, label: i.label, group: i.group, icon: i.icon,
      run: () => router.push(i.href),
    }))
    return [
      ...nav,
      {
        id: 'logout', label: 'Sign Out', group: 'Session', icon: LogOut,
        run: async () => { await supabase.auth.signOut(); router.push('/login') },
      },
    ]
  }, [role, router, supabase])

  const filtered = useMemo(() => {
    if (!query.trim()) return actions
    const q = query.toLowerCase()
    return actions.filter(a =>
      a.label.toLowerCase().includes(q) || a.group.toLowerCase().includes(q))
  }, [actions, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setHighlighted(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => { setHighlighted(0) }, [query])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
      else if (e.key === 'Enter') {
        e.preventDefault()
        const a = filtered[highlighted]
        if (a) { onClose(); a.run() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, filtered, highlighted, onClose])

  if (!open) return null

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette-panel" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[rgba(226,194,133,0.08)]">
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--brass-500)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Where to? Type a module or action…"
            className="flex-1 bg-transparent outline-none text-sm text-[#EDEFE9] placeholder-[#3D4B42]"
          />
          <span className="kbd-hint">ESC</span>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              Nothing matches “{query}”
            </p>
          )}
          {filtered.map((a, i) => (
            <div key={a.id}
              className={cn('palette-option', i === highlighted && 'highlighted')}
              onMouseEnter={() => setHighlighted(i)}
              onClick={() => { onClose(); a.run() }}>
              <a.icon style={{ width: 16, height: 16 }} />
              <span className="flex-1 text-sm font-medium">{a.label}</span>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-ghost)' }}>{a.group}</span>
              {i === highlighted && <CornerDownLeft className="w-3.5 h-3.5" style={{ color: 'var(--brass-500)' }} />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-[rgba(226,194,133,0.07)]">
          <span className="kbd-hint">↑↓</span>
          <span className="text-[11px]" style={{ color: 'var(--text-ghost)' }}>navigate</span>
          <span className="kbd-hint">↵</span>
          <span className="text-[11px]" style={{ color: 'var(--text-ghost)' }}>open</span>
        </div>
      </div>
    </div>
  )
}
