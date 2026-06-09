import Header from '@/components/layout/Header'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <Header title="Admin Settings" subtitle="Company details, letterhead, user roles and permissions" />
      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#12121A] border border-[#1E1E2E] flex items-center justify-center mb-6">
            <Settings className="w-9 h-9 text-[#F5C518]" />
          </div>
          <h2 className="text-xl font-bold text-[#F0F0F5] mb-2">Admin Settings</h2>
          <p className="text-[#5A5A72] text-sm max-w-sm mb-6">
            Configure company name, logo, letterhead, signature, seal, document numbering, user roles, and centre addresses.
          </p>
          <div className="px-4 py-2 bg-[#F5C518]/10 border border-[#F5C518]/20 rounded-lg text-[#F5C518] text-xs font-medium">
            Coming in Stage 11 — Admin Settings
          </div>
        </div>
      </div>
    </div>
  )
}
