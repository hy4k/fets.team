import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { getGeneratedDocument, getAdminSettings } from '@/lib/actions/documents'
import { renderDocument } from '@/lib/templates/documentRenderer'
import PrintTrigger from './PrintTrigger'

interface Props { params: Promise<{ docId: string }> }

// Inject a QR stamp into the bottom-right corner of the first .page div
function injectQR(html: string, qrDataUrl: string, verifyUrl: string): string {
  const qrBlock = `
  <div style="position:absolute;bottom:12mm;right:22mm;text-align:center;z-index:10;">
    <img src="${qrDataUrl}" width="72" height="72" alt="Verify" style="display:block;border-radius:6px;" />
    <p style="font-size:6pt;color:#888;margin-top:3px;font-family:Arial,sans-serif;">Scan to verify</p>
  </div>`
  // Insert before the footer (or before closing .page div)
  return html.replace(/<div class="footer"/, `${qrBlock}<div class="footer"`)
}

export default async function PrintDocumentPage({ params }: Props) {
  const { docId } = await params

  const [doc, settings] = await Promise.all([
    getGeneratedDocument(docId),
    getAdminSettings(),
  ])

  if (!doc) notFound()

  const verifyUrl = `https://fets.team/verify/${doc.verification_id}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 80, margin: 1,
    color: { dark: '#1a1a1a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })

  let html = renderDocument({
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

  html = injectQR(html, qrDataUrl, verifyUrl)

  return (
    <>
      <PrintTrigger />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  )
}
