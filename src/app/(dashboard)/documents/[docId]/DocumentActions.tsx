'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateDocumentStatus, deleteGeneratedDocument } from '@/lib/actions/documents'
import type { GeneratedDocument } from '@/lib/types'

interface Props { doc: GeneratedDocument }

export default function DocumentActions({ doc }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  function openPrint() {
    window.open(`/print/documents/${doc.id}`, '_blank')
  }

  async function handleDelete() {
    if (!confirm('Delete this document permanently?')) return
    setLoading(true)
    await deleteGeneratedDocument(doc.id)
    router.push('/document-history')
  }

  async function handleStatus(status: GeneratedDocument['status']) {
    setLoading(true)
    await updateDocumentStatus(doc.id, status)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={openPrint}
        className="flex items-center gap-2 px-3 py-2 bg-[#1E1E2E] text-[#8A8AA0] hover:text-white rounded-lg text-sm transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Print / PDF
      </button>

      {doc.status === 'generated' && (
        <button
          onClick={() => handleStatus('approved')}
          disabled={loading}
          className="px-3 py-2 bg-[#1B3A1B] text-[#4ADE80] hover:bg-[#224422] rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          Approve
        </button>
      )}

      {doc.status === 'generated' && (
        <button
          onClick={() => handleStatus('archived')}
          disabled={loading}
          className="px-3 py-2 bg-[#2A2A1E] text-[#FBBF24] hover:bg-[#333320] rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          Archive
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-3 py-2 bg-[#3A1B1B] text-[#F87171] hover:bg-[#44222] rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  )
}
