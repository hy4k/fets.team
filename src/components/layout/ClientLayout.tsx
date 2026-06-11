'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { cn } from '@/lib/utils'

interface ClientLayoutProps {
  children: React.ReactNode
  role: string
}

export default function ClientLayout({ children, role }: ClientLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} role={role} />
      <main className={cn(
        'transition-all duration-300 ease-in-out min-h-screen',
        collapsed ? 'ml-[72px]' : 'ml-[260px]'
      )}>
        {children}
      </main>
    </div>
  )
}
