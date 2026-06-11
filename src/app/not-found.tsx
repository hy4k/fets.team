import Link from 'next/link'
import { Shield, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(180deg, #0C0A1F 0%, #09071A 50%, #07060E 100%)' }}>
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #9B6DFF 0%, #6D28D9 100%)', boxShadow: '0 8px 32px rgba(109,40,217,0.5)' }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* 404 */}
        <div className="mb-4" style={{ background: 'linear-gradient(135deg, #C4B5FD, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <span className="text-8xl font-black">404</span>
        </div>

        <h1 className="text-2xl font-bold mb-3" style={{ color: '#F0EEF8' }}>Page Not Found</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          The page you're looking for doesn't exist or you don't have permission to access it.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #9B6DFF, #6D28D9)', color: 'white', boxShadow: '0 4px 16px rgba(109,40,217,0.4)' }}>
            <Home className="w-4 h-4" /> Go to Dashboard
          </Link>
          <Link href="/self-service"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(124,58,237,0.15)', color: '#C4B5FD', border: '1px solid rgba(124,58,237,0.3)' }}>
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
