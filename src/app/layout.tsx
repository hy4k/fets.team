import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'FETS OS — Internal Operating System',
    template: '%s | FETS OS',
  },
  description: 'Forun Testing & Educational Services — Internal Platform',
  robots: 'noindex, nofollow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0A0F] text-[#F0F0F5] min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
