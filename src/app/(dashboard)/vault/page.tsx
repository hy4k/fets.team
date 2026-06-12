'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Archive, Upload, Search, Download, Trash2, Eye, EyeOff,
  FileText, Image, File, X, ChevronDown, Loader2, Plus,
  Filter, RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react'
import {
  getVaultDocuments, uploadVaultFile, deleteVaultDocument,
  updateVaultDocument, getVaultDownloadUrl, getStaffForVault,
  getVaultStats,
  type VaultDocument, type StaffForVault,
} from '@/lib/actions/vault'
import { DOC_TYPES } from '@/lib/utils/vault'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FileIcon({ mime }: { mime: string | null }) {
  if (!mime) return <File className="w-4 h-4" />
  if (mime.startsWith('image/')) return <Image className="w-4 h-4 text-blue-400" />
  if (mime === 'application/pdf') return <FileText className="w-4 h-4 text-red-400" />
  return <File className="w-4 h-4 text-[#66756A]" />
}

// ─── Upload Modal ──────────────────────────────────────────────────────────────

interface UploadModalProps {
  staffList: StaffForVault[]
  onClose: () => void
  onSuccess: () => void
}

function UploadModal({ staffList, onClose, onSuccess }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [staffId, setStaffId] = useState('')
  const [docName, setDocName] = useState('')
  const [docType, setDocType] = useState('')
  const [notes, setNotes] = useState('')
  const [isVisible, setIsVisible] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setSelectedFile(f)
    if (!docName) setDocName(f.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !staffId || !docName || !docType) {
      setError('Please fill all required fields and select a file.')
      return
    }
    setError('')
    setUploading(true)

    const fd = new FormData()
    fd.append('file', selectedFile)
    fd.append('staff_id', staffId)
    fd.append('doc_name', docName)
    fd.append('doc_type', docType)
    fd.append('notes', notes)
    fd.append('is_visible_to_employee', String(isVisible))

    const result = await uploadVaultFile(fd)
    setUploading(false)

    if ('error' in result) { setError(result.error); return }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0A130F] border border-[#1B2A22] rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1B2A22]">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#C9A35C]" />
            <h2 className="text-[#EDEFE9] font-semibold text-[15px]">Upload Document</h2>
          </div>
          <button onClick={onClose} className="text-[#3D4B42] hover:text-[#EDEFE9] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
              dragging ? 'border-[#C9A35C]/60 bg-[#C9A35C]/5' : 'border-[#27392E] hover:border-[#C9A35C]/30 hover:bg-[#12231C]'
            )}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileIcon mime={selectedFile.type} />
                <span className="text-[#C4CDC2] text-sm font-medium truncate max-w-[280px]">{selectedFile.name}</span>
                <span className="text-[#66756A] text-xs">({formatBytes(selectedFile.size)})</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-[#3D4B42] mx-auto mb-2" />
                <p className="text-[#66756A] text-sm">Drop file here or <span className="text-[#C9A35C]">browse</span></p>
                <p className="text-[#3D4B42] text-xs mt-1">PDF, JPG, PNG, DOCX — max 50 MB</p>
              </>
            )}
          </div>

          {/* Staff member */}
          <div>
            <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Staff Member <span className="text-red-400">*</span></label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm focus:outline-none focus:border-[#C9A35C]/50"
              required
            >
              <option value="">Select staff member…</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.staff_id})</option>
              ))}
            </select>
          </div>

          {/* Doc name + type row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Document Name <span className="text-red-400">*</span></label>
              <input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Offer Letter 2024"
                className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm placeholder-[#3D4B42] focus:outline-none focus:border-[#C9A35C]/50"
                required
              />
            </div>
            <div>
              <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Document Type <span className="text-red-400">*</span></label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm focus:outline-none focus:border-[#C9A35C]/50"
                required
              >
                <option value="">Select type…</option>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[#A9B5A9] text-xs font-medium mb-1.5">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context…"
              className="w-full bg-[#060D0A] border border-[#27392E] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm placeholder-[#3D4B42] focus:outline-none focus:border-[#C9A35C]/50"
            />
          </div>

          {/* Visibility toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setIsVisible(!isVisible)}
              className={cn(
                'w-10 h-5 rounded-full transition-colors relative',
                isVisible ? 'bg-[#C9A35C]' : 'bg-[#27392E]'
              )}
            >
              <div className={cn(
                'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                isVisible ? 'translate-x-5' : 'translate-x-0.5'
              )} />
            </div>
            <span className="text-[#A9B5A9] text-sm">
              {isVisible ? 'Visible to employee' : 'Admin only'}
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[#27392E] text-[#66756A] text-sm hover:text-[#C4CDC2] hover:border-[#3D4B42] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-2.5 rounded-lg bg-[#C9A35C] text-[#040A08] text-sm font-semibold hover:bg-[#C9A35C]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <>Upload</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function VaultPage() {
  const [docs, setDocs] = useState<VaultDocument[]>([])
  const [staffList, setStaffList] = useState<StaffForVault[]>([])
  const [stats, setStats] = useState<{ total: number; byType: Record<string, number>; visibleToStaff: number }>({ total: 0, byType: {}, visibleToStaff: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStaff, setFilterStaff] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [docsData, staffData, statsData] = await Promise.all([
      getVaultDocuments({
        staffId: filterStaff || undefined,
        docType: filterType || undefined,
        search: search || undefined,
      }),
      getStaffForVault(),
      getVaultStats(),
    ])
    setDocs(docsData)
    setStaffList(staffData)
    setStats(statsData)
    setLoading(false)
  }, [filterStaff, filterType, search])

  useEffect(() => { load() }, [load])

  const handleDownload = async (doc: VaultDocument) => {
    setDownloading(doc.id)
    const result = await getVaultDownloadUrl(doc.id)
    setDownloading(null)
    if ('error' in result) { showToast(result.error, 'error'); return }
    window.open(result.url, '_blank')
  }

  const handleDelete = async (doc: VaultDocument) => {
    if (!confirm(`Delete "${doc.doc_name}"? This cannot be undone.`)) return
    setDeleting(doc.id)
    const result = await deleteVaultDocument(doc.id)
    setDeleting(null)
    if (result.error) { showToast(result.error, 'error'); return }
    showToast(`"${doc.doc_name}" deleted`)
    load()
  }

  const handleToggleVisibility = async (doc: VaultDocument) => {
    setTogglingId(doc.id)
    const result = await updateVaultDocument(doc.id, { is_visible_to_employee: !doc.is_visible_to_employee })
    setTogglingId(null)
    if (result.error) { showToast(result.error, 'error'); return }
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, is_visible_to_employee: !d.is_visible_to_employee } : d))
  }

  // Top doc types for stat chips
  const topTypes = Object.entries(stats.byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-[#080810] text-[#EDEFE9]">
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium transition-all',
          toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        )}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {showUpload && (
        <UploadModal
          staffList={staffList}
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); showToast('Document uploaded successfully'); load() }}
        />
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C9A35C]/10 rounded-xl flex items-center justify-center">
              <Archive className="w-5 h-5 text-[#C9A35C]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#EDEFE9]">Document Vault</h1>
              <p className="text-[#66756A] text-xs mt-0.5">Secure storage for all staff documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-2 text-[#3D4B42] hover:text-[#C9A35C] hover:bg-[#12231C] rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#C9A35C] text-[#040A08] rounded-lg text-sm font-semibold hover:bg-[#C9A35C]/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Upload Document
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0A130F] border border-[#1B2A22] rounded-xl p-4">
            <div className="text-[#66756A] text-xs font-medium mb-1">Total Documents</div>
            <div className="font-display text-2xl font-bold text-[#EDEFE9]">{stats.total}</div>
          </div>
          <div className="bg-[#0A130F] border border-[#1B2A22] rounded-xl p-4">
            <div className="text-[#66756A] text-xs font-medium mb-1">Visible to Staff</div>
            <div className="font-display text-2xl font-bold text-green-400">{stats.visibleToStaff}</div>
          </div>
          <div className="bg-[#0A130F] border border-[#1B2A22] rounded-xl p-4">
            <div className="text-[#66756A] text-xs font-medium mb-1">Admin Only</div>
            <div className="font-display text-2xl font-bold text-[#C9A35C]">{stats.total - stats.visibleToStaff}</div>
          </div>
          <div className="bg-[#0A130F] border border-[#1B2A22] rounded-xl p-4">
            <div className="text-[#66756A] text-xs font-medium mb-1">Top Type</div>
            <div className="text-sm font-semibold text-[#C4CDC2] truncate">
              {topTypes[0]?.[0] || '—'}
            </div>
            {topTypes[0] && <div className="text-xs text-[#66756A]">{topTypes[0][1]} doc{topTypes[0][1] !== 1 ? 's' : ''}</div>}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3D4B42]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search document name…"
              className="w-full pl-9 pr-4 py-2.5 bg-[#0A130F] border border-[#1B2A22] rounded-lg text-[#C4CDC2] text-sm placeholder-[#3D4B42] focus:outline-none focus:border-[#C9A35C]/40"
            />
          </div>
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="bg-[#0A130F] border border-[#1B2A22] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm focus:outline-none focus:border-[#C9A35C]/40 min-w-[180px]"
          >
            <option value="">All Staff Members</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0A130F] border border-[#1B2A22] rounded-lg px-3 py-2.5 text-[#C4CDC2] text-sm focus:outline-none focus:border-[#C9A35C]/40 min-w-[180px]"
          >
            <option value="">All Document Types</option>
            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {(filterStaff || filterType || search) && (
            <button
              onClick={() => { setSearch(''); setFilterStaff(''); setFilterType('') }}
              className="flex items-center gap-1.5 px-3 py-2.5 text-[#66756A] hover:text-[#EDEFE9] text-sm transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-[#0A130F] border border-[#1B2A22] rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-[#C9A35C] animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Archive className="w-10 h-10 text-[#27392E]" />
              <p className="text-[#3D4B42] text-sm">No documents found</p>
              {!filterStaff && !filterType && !search && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="text-[#C9A35C] text-sm hover:underline"
                >
                  Upload the first document
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1B2A22]">
                    {['Document', 'Type', 'Staff Member', 'Size', 'Uploaded', 'Visibility', 'Actions'].map(h => (
                      <th key={h} className="text-left text-[#3D4B42] text-[11px] font-semibold uppercase tracking-wider px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B2A22]">
                  {docs.map(doc => (
                    <tr key={doc.id} className="hover:bg-[#12231C]/50 transition-colors group">
                      {/* Document name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-[#12231C] rounded-lg flex items-center justify-center shrink-0">
                            <FileIcon mime={doc.mime_type} />
                          </div>
                          <div>
                            <div className="text-[#C4CDC2] text-sm font-medium">{doc.doc_name}</div>
                            {doc.notes && <div className="text-[#3D4B42] text-xs truncate max-w-[180px]">{doc.notes}</div>}
                          </div>
                        </div>
                      </td>
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#12231C] text-[#A9B5A9] text-xs">
                          {doc.doc_type}
                        </span>
                      </td>
                      {/* Staff */}
                      <td className="px-4 py-3">
                        <div className="text-[#C4CDC2] text-sm">{doc.staff?.full_name || '—'}</div>
                        {doc.staff?.staff_id && (
                          <div className="text-[#3D4B42] text-xs">{doc.staff.staff_id}</div>
                        )}
                      </td>
                      {/* Size */}
                      <td className="px-4 py-3 text-[#66756A] text-sm">{formatBytes(doc.file_size)}</td>
                      {/* Date */}
                      <td className="px-4 py-3 text-[#66756A] text-sm">{formatDate(doc.created_at)}</td>
                      {/* Visibility */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleVisibility(doc)}
                          disabled={togglingId === doc.id}
                          className={cn(
                            'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md transition-colors',
                            doc.is_visible_to_employee
                              ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                              : 'bg-[#27392E] text-[#66756A] hover:bg-[#3D4B42]'
                          )}
                        >
                          {togglingId === doc.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : doc.is_visible_to_employee ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />
                          }
                          {doc.is_visible_to_employee ? 'Visible' : 'Hidden'}
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloading === doc.id}
                            title="Download"
                            className="p-1.5 text-[#3D4B42] hover:text-[#C9A35C] hover:bg-[#C9A35C]/10 rounded-md transition-colors disabled:opacity-50"
                          >
                            {downloading === doc.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Download className="w-4 h-4" />
                            }
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            disabled={deleting === doc.id}
                            title="Delete"
                            className="p-1.5 text-[#3D4B42] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-50"
                          >
                            {deleting === doc.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer count */}
        {docs.length > 0 && (
          <p className="text-[#3D4B42] text-xs text-right">
            Showing {docs.length} document{docs.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  )
}
