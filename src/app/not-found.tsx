import Link from 'next/link'
import { Shield, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(180deg, #0C0A1F 0%, #06100D 50%, #040A08 100%)' }}>
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #5EEAD4 0%, #0D9488 100%)', boxShadow: '0 8px 32px rgba(168,127,61,0.5)' }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* 404 */}
        <div className="mb-4" style={{ background: 'linear-gradient(135deg, #99F6E4, #14B8A6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <span className="text-8xl font-black">404</span>
        </div>

        <h1 className="font-display text-2xl font-bold mb-3" style={{ color: '#EDEFE9' }}>Page Not Found</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          The page you're looking for doesn't exist or you don't have permission to access it.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #5EEAD4, #0D9488)', color: 'white', boxShadow: '0 4px 16px rgba(168,127,61,0.4)' }}>
            <Home className="w-4 h-4" /> Go to Dashboard
          </Link>
          <Link href="/self-service"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(201,163,92,0.15)', color: '#99F6E4', border: '1px solid rgba(201,163,92,0.3)' }}>
            <ArrowLeft className="w-4 h-4" /> My Portal
          </Link>
        </div>

        {/* FETS branding */}
        <p className="mt-10 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          FETS OS · Forun Testing & Educational Services
        </p>
      </div>
    </div>
  )
}
