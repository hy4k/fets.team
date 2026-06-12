import Header from '@/components/layout/Header'
import Link from 'next/link'
import { FileText, Plus, ChevronRight } from 'lucide-react'

const docTypes = [
  { key: 'offer_letter',          label: 'Offer Letter',          category: 'HR Letters',     color: '#3B82F6' },
  { key: 'appointment_letter',    label: 'Appointment Letter',    category: 'HR Letters',     color: '#3B82F6' },
  { key: 'experience_letter',     label: 'Experience Letter',     category: 'HR Letters',     color: '#3B82F6' },
  { key: 'relieving_letter',      label: 'Relieving Letter',      category: 'HR Letters',     color: '#3B82F6' },
  { key: 'confirmation_letter',   label: 'Confirmation Letter',   category: 'HR Letters',     color: '#3B82F6' },
  { key: 'appreciation_letter',   label: 'Appreciation Letter',   category: 'HR Letters',     color: '#22C55E' },
  { key: 'leave_approval',        label: 'Leave Approval Letter', category: 'HR Letters',     color: '#22C55E' },
  { key: 'warning_letter',        label: 'Warning Letter',        category: 'Disciplinary',   color: '#EF4444' },
  { key: 'payslip',               label: 'Pay Slip',              category: 'Finance',        color: '#C9A35C' },
  { key: 'salary_certificate',    label: 'Salary Certificate',    category: 'Finance',        color: '#C9A35C' },
  { key: 'increment_letter',      label: 'Increment Letter',      category: 'Finance',        color: '#C9A35C' },
  { key: 'authorization_letter',  label: 'Authorization Letter',  category: 'Operations',     color: '#2DD4BF' },
  { key: 'id_card',               label: 'Staff ID Card',         category: 'Operations',     color: '#2DD4BF' },
  { key: 'asset_handover',        label: 'Asset Handover Letter', category: 'Operations',     color: '#2DD4BF' },
  { key: 'uniform_issue',         label: 'Uniform / ID Issue',    category: 'Operations',     color: '#2DD4BF' },
  { key: 'internship_certificate',label: 'Internship Certificate',category: 'Certificates',  color: '#F59E0B' },
  { key: 'training_certificate',  label: 'Training Certificate',  category: 'Certificates',  color: '#F59E0B' },
  { key: 'nda_agreement',         label: 'NDA / Confidentiality', category: 'Legal',          color: '#6B7280' },
  { key: 'cert_record',           label: 'Certification Record',  category: 'Certifications', color: '#06B6D4' },
]

const categories = Array.from(new Set(docTypes.map(d => d.category)))

export default function DocumentsPage() {
  return (
    <div className="animate-fade-in">
      <Header
        title="Document Generator Centre"
        subtitle="19 document types available"
        actions={
          <Link href="/document-history" className="flex items-center gap-1.5 text-xs text-[#66756A] hover:text-[#C9A35C] transition-colors">
            History <ChevronRight className="w-3 h-3" />
          </Link>
        }
      />

      <div className="p-6 max-w-[1400px] mx-auto space-y-8">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-[#3D4B42] uppercase tracking-wider mb-3">{category}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {docTypes.filter(d => d.category === category).map(doc => (
                <Link
                  key={doc.key}
                  href={`/documents/new?type=${doc.key}`}
                  className="group flex flex-col items-center gap-3 p-4 card-glass rounded-xl hover:border-[#C9A35C]/20 hover:bg-[#122418] transition-all text-center"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${doc.color}15` }}>
                    <FileText className="w-5 h-5" style={{ color: doc.color }} />
                  </div>
                  <span className="text-[12px] font-medium text-[#A9B5A9] group-hover:text-[#EDEFE9] leading-tight transition-colors">
                    {doc.label}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-[#3D4B42] group-hover:text-[#C9A35C] transition-colors">
                    <Plus className="w-3 h-3" />
                    Generate
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
