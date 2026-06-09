import { notFound } from 'next/navigation'
import { getGeneratedDocument, getAdminSettings } from '@/lib/actions/documents'
import { renderDocument } from '@/lib/templates/documentRenderer'
import PrintTrigger from './PrintTrigger'

interface Props { params: Promise<{ docId: string }> }

export default async function PrintDocumentPage({ params }: Props) {
  const { docId } = await params

  const [doc, settings] = await Promise.all([
    getGeneratedDocument(docId),
    getAdminSettings(),
  ])

  if (!doc) notFound()

  const html = renderDocument({
    docType: doc.doc_type,
    fields: doc.field_values,
    docNumber: doc.doc_number,
    companyName: settings.company_name,
    companyEmail: settings.company_email,
    companyPhone: settings.company_phone,
    companyWebsite: settings.company_website,
    logoUrl: settings.logo_url,
    signatureUrl: settings.signature_url,
    sealUrl: settings.seal_url,
  })

  return (
    <>
      <PrintTrigger />
      {/* Render the full document HTML directly */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  )
}
