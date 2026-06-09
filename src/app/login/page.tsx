'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Shield, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Incorrect email or password. Please try again.'
        : error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#F5C518]/4 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#3B82F6]/3 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-[420px] px-6 py-8">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#F5C518] rounded-xl flex items-center justify-center shadow-lg shadow-[#F5C518]/20">
              <Shield className="w-6 h-6 text-[#0A0A0F]" />
            </div>
            <div className="text-left">
              <div className="text-[#F5C518] font-bold text-xl tracking-[0.2em] leading-none">FETS</div>
              <div className="text-[#5A5A72] text-[10px] tracking-[0.15em] uppercase mt-1">Internal OS</div>
            </div>
          </div>
          <h1 className="text-[#F0F0F5] text-2xl font-bold">Welcome back</h1>
          <p className="text-[#5A5A72] text-sm mt-1.5">Sign in to your FETS account</p>
        </div>

        {/* Login card */}
        <div className="bg-[#12121A] border border-[#1E1E2E] rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#8B8BA0]">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="your@fets.in"
                className="w-full px-4 py-3 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl text-[#F0F0F5] placeholder-[#3A3A55] text-sm focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#8B8BA0]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 pr-12 bg-[#0A0A0F] border border-[#1E1E2E] rounded-xl text-[#F0F0F5] placeholder-[#3A3A55] text-sm focus:outline-none focus:border-[#F5C518] focus:ring-1 focus:ring-[#F5C518]/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3A3A55] hover:text-[#8B8BA0] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-red-500/8 border border-red-500/20 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#F5C518] hover:bg-[#E6B800] disabled:opacity-60 disabled:cursor-not-allowed text-[#0A0A0F] font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#F5C518]/10"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#3A3A55] text-xs mt-8">
          Forun Testing & Educational Services &middot; Authorized Access Only
        </p>
      </div>
    </div>
  )
}
