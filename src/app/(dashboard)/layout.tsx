'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { cn } from '@/lib/utils'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main
        className={cn(
          'transition-all duration-300 ease-in-out min-h-screen',
          collapsed ? 'ml-[72px]' : 'ml-[260px]'
        )}
      >
        {children}
      </main>
    </div>
  )
}
