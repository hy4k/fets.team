// ============================================================
// FETS OS — Document HTML Renderer
// Converts field values + doc type into print-ready HTML
// ============================================================

export interface RenderOptions {
  docType: string
  fields: Record<string, string>
  docNumber: string
  companyName?: string
  companyEmail?: string
  companyPhone?: string
  companyWebsite?: string
  logoUrl?: string
  signatureUrl?: string
  sealUrl?: string
}

// ─── Helpers ─────────────────────────────────────────────────
function fmt(val: string | undefined, fallback = '___________'): string {
  return val && val.trim() ? val.trim() : `<span style="color:#aaa">${fallback}</span>`
}

function fmtDate(val: string | undefined): string {
  if (!val) return '<span style="color:#aaa">__/__/____</span>'
  try {
    return new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return val }
}

function fmtCurrency(val: string | undefined): string {
  if (!val || val === '0') return '₹0.00'
  const n = parseFloat(val) || 0
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function toWords(n: number): string {
  // Simple words for common salary amounts
  if (!n) return 'Zero'
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  function convert(num: number): string {
    if (num < 20) return ones[num]
    if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? ' ' + ones[num%10] : '')
    if (num < 1000) return ones[Math.floor(num/100)] + ' Hundred' + (num%100 ? ' ' + convert(num%100) : '')
    if (num < 100000) return convert(Math.floor(num/1000)) + ' Thousand' + (num%1000 ? ' ' + convert(num%1000) : '')
    if (num < 10000000) return convert(Math.floor(num/100000)) + ' Lakh' + (num%100000 ? ' ' + convert(num%100000) : '')
    return convert(Math.floor(num/10000000)) + ' Crore' + (num%10000000 ? ' ' + convert(num%10000000) : '')
  }
  return convert(Math.floor(n)) + ' Only'
}

// ─── Base CSS ─────────────────────────────────────────────────
const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #1a1a1a; background: white; }
  .page { width: 210mm; min-height: 297mm; padding: 18mm 22mm 28mm; margin: 0 auto; position: relative; }
  .letterhead { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #F5C518; padding-bottom: 14px; margin-bottom: 22px; }
  .logo-box { width: 72px; height: 72px; background: #0A0A0F; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #F5C518; font-size: 20px; font-weight: bold; font-family: Arial, sans-serif; letter-spacing: -1px; flex-shrink: 0; }
  .company-info { text-align: right; }
  .company-name { font-size: 15pt; font-weight: bold; color: #0A0A0F; font-family: Arial, sans-serif; }
  .company-sub { font-size: 8.5pt; color: #555; margin-top: 2px; font-family: Arial, sans-serif; }
  .doc-title-box { text-align: center; margin: 0 0 22px; padding: 10px; background: #f9f9f9; border-top: 2px solid #F5C518; border-bottom: 2px solid #F5C518; }
  .doc-title { font-size: 13pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #0A0A0F; font-family: Arial, sans-serif; }
  .doc-meta { display: flex; justify-content: space-between; margin-top: 5px; font-size: 8.5pt; color: #666; font-family: Arial, sans-serif; }
  .body { margin-top: 6px; line-height: 1.85; }
  .body p { margin-bottom: 12px; text-align: justify; }
  .body .salutation { font-weight: bold; margin-bottom: 14px; }
  .body .closing { margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
  th, td { padding: 7px 10px; border: 1px solid #ccc; text-align: left; }
  th { background: #0A0A0F; color: #F5C518; font-family: Arial, sans-serif; font-size: 9.5pt; }
  tr:nth-child(even) td { background: #fafafa; }
  .signature-block { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
  .signatory { text-align: center; }
  .sig-img { height: 45px; margin-bottom: 4px; }
  .sig-line { border-top: 1px solid #333; padding-top: 5px; font-size: 10pt; font-weight: bold; font-family: Arial, sans-serif; }
  .sig-sub { font-size: 9pt; color: #555; margin-top: 2px; font-family: Arial, sans-serif; }
  .ack-block { margin-top: 30px; border-top: 1px dashed #999; padding-top: 14px; font-size: 10pt; }
  .ack-block .ack-line { display: flex; justify-content: space-between; margin-top: 20px; }
  .ack-sig { text-align: center; border-top: 1px solid #333; padding-top: 4px; font-size: 9.5pt; min-width: 150px; }
  .footer { position: absolute; bottom: 10mm; left: 22mm; right: 22mm; border-top: 1px solid #e5e5e5; padding-top: 5px; font-size: 7.5pt; color: #999; text-align: center; font-family: Arial, sans-serif; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { margin: 0; } }
`

function letterheadHTML(opts: RenderOptions): string {
  return `
  <div class="letterhead">
    ${opts.logoUrl
      ? `<img src="${opts.logoUrl}" style="height:64px">`
      : `<div class="logo-box">FETS</div>`}
    <div class="company-info">
      <div class="company-name">${opts.companyName || 'Forun Testing & Educational Services'}</div>
      <div class="company-sub">${opts.companyEmail || 'info@fets.in'} &nbsp;|&nbsp; ${opts.companyWebsite || 'www.fets.in'}</div>
      ${opts.companyPhone ? `<div class="company-sub">${opts.companyPhone}</div>` : ''}
    </div>
  </div>`
}

function titleHTML(title: string, docNumber: string, date: string): string {
  return `
  <div class="doc-title-box">
    <div class="doc-title">${title}</div>
    <div class="doc-meta">
      <span>Ref: ${docNumber}</span>
      <span>Date: ${fmtDate(date)}</span>
    </div>
  </div>`
}

function signatureHTML(opts: RenderOptions, withAck = false): string {
  const sigBlock = `
  <div class="signature-block">
    <div>
      ${opts.sealUrl ? `<img src="${opts.sealUrl}" style="width:75px; opacity:0.85">` : ''}
    </div>
    <div class="signatory">
      ${opts.signatureUrl
        ? `<img src="${opts.signatureUrl}" class="sig-img">`
        : `<div style="height:45px"></div>`}
      <div class="sig-line">Authorised Signatory</div>
      <div class="sig-sub">For ${opts.companyName || 'FETS'}</div>
    </div>
  </div>`

  const ackBlock = withAck ? `
  <div class="ack-block">
    <p><strong>Acknowledgement:</strong> I have read and understood the contents of this letter.</p>
    <div class="ack-line">
      <div class="ack-sig">Signature of Employee</div>
      <div class="ack-sig">Date</div>
    </div>
  </div>` : ''

  return sigBlock + ackBlock
}

function footerHTML(opts: RenderOptions): string {
  return `<div class="footer">${opts.companyName || 'Forun Testing & Educational Services'} &nbsp;|&nbsp; ${opts.companyWebsite || 'www.fets.in'} &nbsp;|&nbsp; ${opts.companyEmail || 'info@fets.in'}<br>This is a computer-generated document. &nbsp;|&nbsp; Ref: ${opts.docNumber}</div>`
}

function wrap(body: string, opts: RenderOptions, title: string, withAck = false): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head><body>
  <div class="page">
    ${letterheadHTML(opts)}
    ${titleHTML(title, opts.docNumber, opts.fields.letter_date)}
    <div class="body">${body}</div>
    ${signatureHTML(opts, withAck)}
    ${footerHTML(opts)}
  </div></body></html>`
}

// ─── Document Bodies ──────────────────────────────────────────
function offerLetter(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p class="salutation">To,<br>${fmt(f.candidate_name)}</p>
  <p>Dear ${fmt(f.candidate_name)},</p>
  <p>We are pleased to offer you the position of <strong>${fmt(f.position)}</strong>${f.department ? ` in the <strong>${f.department}</strong> department` : ''}${f.centre ? `, at our <strong>${f.centre}</strong> centre` : ''}.</p>
  <p>The details of your offer are as follows:</p>
  <table>
    <tr><th>Position</th><td>${fmt(f.position)}</td><th>Department</th><td>${fmt(f.department)}</td></tr>
    <tr><th>Location</th><td>${fmt(f.centre)}</td><th>Date of Joining</th><td>${fmtDate(f.date_of_joining)}</td></tr>
    <tr><th colspan="2">Monthly Remuneration</th><td colspan="2">${fmtCurrency(f.monthly_salary)} (${toWords(parseFloat(f.monthly_salary || '0'))})</td></tr>
  </table>
  <p>This offer is valid until <strong>${fmtDate(f.offer_valid_till)}</strong>. Please confirm your acceptance in writing before the validity date.</p>
  ${f.additional_notes ? `<p>${f.additional_notes}</p>` : ''}
  <p>We look forward to welcoming you to the FETS family. Please bring this offer letter on your date of joining along with the required documents.</p>
  <p class="closing">Warm Regards,</p>`
  return wrap(body, opts, 'Offer Letter', true)
}

function appointmentLetter(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p class="salutation">To,<br>${fmt(f.staff_name)}</p>
  <p>Dear ${fmt(f.staff_name)},</p>
  <p>With reference to the recruitment process conducted by <strong>${opts.companyName || 'Forun Testing & Educational Services (FETS)'}</strong>, we are pleased to appoint you as <strong>${fmt(f.position)}</strong> with effect from <strong>${fmtDate(f.date_of_joining)}</strong>, subject to the terms and conditions mentioned below:</p>
  <table>
    <tr><th>Staff ID</th><td>${fmt(f.staff_id)}</td><th>Designation</th><td>${fmt(f.position)}</td></tr>
    <tr><th>Department</th><td>${fmt(f.department)}</td><th>Centre</th><td>${fmt(f.centre)}</td></tr>
    <tr><th>Date of Joining</th><td>${fmtDate(f.date_of_joining)}</td><th>Employment Type</th><td>${fmt(f.employment_type)}</td></tr>
    <tr><th colspan="2">Monthly Salary</th><td colspan="2">${fmtCurrency(f.monthly_salary)}</td></tr>
  </table>
  <p>You will be on probation for a period of <strong>${f.probation_months || '3'} months</strong> from the date of joining. Your performance will be reviewed at the end of the probation period, and upon satisfactory performance, your appointment shall be confirmed.</p>
  <p>You are expected to abide by the Company's rules, regulations, and code of conduct. Any violation may result in disciplinary action.</p>
  <p>Please sign and return the duplicate copy of this letter as acknowledgement of acceptance.</p>
  <p class="closing">Yours Sincerely,</p>`
  return wrap(body, opts, 'Appointment Letter', true)
}

function experienceLetter(f: Record<string, string>, opts: RenderOptions): string {
  const perfMap: Record<string, string> = { excellent: 'excellent', good: 'good', satisfactory: 'satisfactory' }
  const perf = perfMap[f.performance_note] || 'satisfactory'
  const body = `
  <p><strong>To Whom It May Concern,</strong></p>
  <p>This is to certify that <strong>${fmt(f.staff_name)}</strong>${f.staff_id ? ` (Staff ID: ${f.staff_id})` : ''} has been employed with <strong>${opts.companyName || 'Forun Testing & Educational Services (FETS)'}</strong> as <strong>${fmt(f.position)}</strong>${f.department ? ` in the ${f.department} department` : ''}, from <strong>${fmtDate(f.date_of_joining)}</strong> to <strong>${fmtDate(f.last_working_day)}</strong>.</p>
  <p>During the period of employment, ${fmt(f.staff_name)} has demonstrated ${perf} performance and professional conduct. We wish them the very best in their future endeavours.</p>
  <p>This letter is issued at the request of the individual for whatever purpose it may serve.</p>
  <p class="closing">Yours Sincerely,</p>`
  return wrap(body, opts, 'Experience Letter')
}

function relievingLetter(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p class="salutation">To,<br>${fmt(f.staff_name)}</p>
  <p>Dear ${fmt(f.staff_name)},</p>
  <p>This is to inform you that you are hereby relieved from the services of <strong>${opts.companyName || 'Forun Testing & Educational Services (FETS)'}</strong> with effect from <strong>${fmtDate(f.last_working_day)}</strong>.</p>
  <table>
    <tr><th>Staff ID</th><td>${fmt(f.staff_id)}</td><th>Designation</th><td>${fmt(f.position)}</td></tr>
    <tr><th>Department</th><td>${fmt(f.department)}</td><th>Date of Joining</th><td>${fmtDate(f.date_of_joining)}</td></tr>
    <tr><th colspan="2">Last Working Day</th><td colspan="2">${fmtDate(f.last_working_day)}</td></tr>
  </table>
  ${f.relieving_remarks ? `<p>${f.relieving_remarks}</p>` : ''}
  <p>You are requested to complete all exit formalities, return company property, and settle all dues prior to your last working day.</p>
  <p>We thank you for your services and wish you success in your future career.</p>
  <p class="closing">Yours Sincerely,</p>`
  return wrap(body, opts, 'Relieving Letter')
}

function confirmationLetter(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p class="salutation">To,<br>${fmt(f.staff_name)}</p>
  <p>Dear ${fmt(f.staff_name)},</p>
  <p>We are pleased to inform you that upon successful completion of your probation period, your services as <strong>${fmt(f.position)}</strong> have been confirmed with <strong>${opts.companyName || 'Forun Testing & Educational Services (FETS)'}</strong>, effective <strong>${fmtDate(f.confirmation_date)}</strong>.</p>
  <table>
    <tr><th>Staff ID</th><td>${fmt(f.staff_id)}</td><th>Designation</th><td>${fmt(f.position)}</td></tr>
    <tr><th>Date of Joining</th><td>${fmtDate(f.date_of_joining)}</td><th>Confirmation Date</th><td>${fmtDate(f.confirmation_date)}</td></tr>
    ${f.new_salary ? `<tr><th colspan="2">Revised Monthly Salary</th><td colspan="2">${fmtCurrency(f.new_salary)}</td></tr>` : ''}
  </table>
  <p>Your performance during the probation period has been reviewed and found satisfactory. You are expected to continue to maintain the same level of performance and professionalism.</p>
  <p>Congratulations on your confirmation! We look forward to your continued contribution to the organisation.</p>
  <p class="closing">Yours Sincerely,</p>`
  return wrap(body, opts, 'Confirmation Letter', true)
}

function appreciationLetter(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p class="salutation">To,<br>${fmt(f.staff_name)}</p>
  <p>Dear ${fmt(f.staff_name)},</p>
  <p>On behalf of the Management of <strong>${opts.companyName || 'Forun Testing & Educational Services (FETS)'}</strong>, we would like to take this opportunity to express our sincere appreciation and recognition for your <strong>${fmt(f.achievement, 'outstanding contribution')}</strong>.</p>
  <p>Your dedication, commitment, and exemplary performance reflect the values that FETS upholds. Your efforts have made a meaningful impact on the organisation and set an example for your colleagues.</p>
  ${f.additional_message ? `<p>${f.additional_message}</p>` : ''}
  <p>We sincerely hope that you will continue to exhibit the same level of dedication and enthusiasm. Keep up the great work!</p>
  <p class="closing">With warm regards,</p>`
  return wrap(body, opts, 'Appreciation Letter')
}

function leaveApproval(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p class="salutation">To,<br>${fmt(f.staff_name)}</p>
  <p>Dear ${fmt(f.staff_name)},</p>
  <p>This is to inform you that your leave application has been reviewed and approved by the Management. The details of the approved leave are as follows:</p>
  <table>
    <tr><th>Staff ID</th><td>${fmt(f.staff_id)}</td><th>Leave Type</th><td>${fmt(f.leave_type)}</td></tr>
    <tr><th>From Date</th><td>${fmtDate(f.from_date)}</td><th>To Date</th><td>${fmtDate(f.to_date)}</td></tr>
    <tr><th colspan="2">Number of Days</th><td colspan="2"><strong>${fmt(f.days)}</strong> day(s)</td></tr>
    <tr><th colspan="2">Reason</th><td colspan="2">${fmt(f.reason)}</td></tr>
  </table>
  <p>Please ensure that your responsibilities and pending work are properly handed over before you proceed on leave. You are required to rejoin duty on <strong>${fmtDate(f.to_date)}</strong> (next working day).</p>
  <p class="closing">Yours Sincerely,</p>`
  return wrap(body, opts, 'Leave Approval Letter')
}

function warningLetter(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p class="salutation">To,<br>${fmt(f.staff_name)}<br>${f.staff_id ? `(Staff ID: ${f.staff_id})` : ''}<br>${f.position ? f.position : ''}</p>
  <p>Dear ${fmt(f.staff_name)},</p>
  <p>This letter constitutes a formal <strong>${fmt(f.warning_level, 'Warning')}</strong> for the incident / behaviour described below:</p>
  <table>
    <tr><th>Incident Date</th><td>${fmtDate(f.incident_date)}</td></tr>
    <tr><th>Description</th><td style="white-space:pre-wrap">${fmt(f.incident_description)}</td></tr>
    ${f.consequence ? `<tr><th>Action / Consequence</th><td style="white-space:pre-wrap">${f.consequence}</td></tr>` : ''}
  </table>
  <p>Such behaviour is in violation of the Company's Code of Conduct and is not acceptable. We strongly advise you to take corrective measures immediately. Any recurrence of such conduct may lead to more serious disciplinary action, including termination of employment.</p>
  <p>You are required to acknowledge receipt of this letter by signing below. This letter will be placed on your personnel file.</p>
  <p class="closing">Yours Sincerely,</p>`
  return wrap(body, opts, 'Warning Letter', true)
}

function payslip(f: Record<string, string>, opts: RenderOptions): string {
  const earnings = [
    ['Basic Salary', f.basic_salary || '0'],
    ['HRA', f.hra || '0'],
    ['Transport Allowance', f.transport || '0'],
    ['Other Allowances', f.other_allowances || '0'],
    ['Incentives', f.incentives || '0'],
    ['Overtime', f.overtime || '0'],
  ]
  const deductions = [
    ['PF Deduction', f.pf_deduction || '0'],
    ['ESI Deduction', f.esi_deduction || '0'],
    ['Leave Deduction', f.leave_deduction || '0'],
    ['Advance Deduction', f.advance_deduction || '0'],
    ['Other Deductions', f.other_deductions || '0'],
  ]
  const gross = earnings.reduce((s, [, v]) => s + (parseFloat(v) || 0), 0)
  const totalDed = deductions.reduce((s, [, v]) => s + (parseFloat(v) || 0), 0)
  const net = gross - totalDed

  const earRows = earnings.map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right">${fmtCurrency(v)}</td></tr>`).join('')
  const dedRows = deductions.map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right">${fmtCurrency(v)}</td></tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    ${BASE_CSS}
    .payslip-header { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:12px 0; }
    .pay-info-box { background:#f5f5f5; padding:10px 14px; border-radius:4px; border:1px solid #e0e0e0; }
    .pay-info-box th { background:transparent; color:#555; font-size:9pt; padding:3px 6px; }
    .pay-info-box td { font-size:9.5pt; padding:3px 6px; border:none; background:transparent; }
    .pay-info-box table { margin:0; }
    .pay-tables { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:14px 0; }
    .pay-section h4 { font-size:10pt; font-family:Arial,sans-serif; font-weight:bold; color:#0A0A0F; background:#f0f0f0; padding:6px 10px; border:1px solid #ccc; border-bottom:none; margin-bottom:0; }
    .pay-section table { margin-top:0; }
    .total-row td { font-weight:bold; background:#0A0A0F !important; color:#F5C518; }
    .net-box { background:#0A0A0F; color:#F5C518; padding:14px 20px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; margin:14px 0; }
    .net-label { font-family:Arial,sans-serif; font-size:11pt; font-weight:bold; }
    .net-amount { font-size:18pt; font-weight:bold; font-family:Arial,sans-serif; }
    .net-words { font-size:8.5pt; opacity:0.75; margin-top:2px; font-family:Arial,sans-serif; }
  </style></head><body>
  <div class="page">
    ${letterheadHTML(opts)}
    ${titleHTML('PAY SLIP', opts.docNumber, '')}
    <div class="payslip-header">
      <div class="pay-info-box">
        <table><tr><th>Staff ID</th><td>${fmt(f.staff_id)}</td></tr>
        <tr><th>Name</th><td><strong>${fmt(f.staff_name)}</strong></td></tr>
        <tr><th>Designation</th><td>${fmt(f.position)}</td></tr></table>
      </div>
      <div class="pay-info-box">
        <table><tr><th>Department</th><td>${fmt(f.department)}</td></tr>
        <tr><th>Pay Month</th><td><strong>${fmt(f.month_year)}</strong></td></tr>
        <tr><th>Payment Mode</th><td>${fmt(f.payment_mode, 'Bank Transfer')}</td></tr></table>
      </div>
    </div>
    <div class="pay-tables">
      <div class="pay-section">
        <h4>Earnings</h4>
        <table>${earRows}<tr class="total-row"><td>Gross Earnings</td><td style="text-align:right">${fmtCurrency(String(gross))}</td></tr></table>
      </div>
      <div class="pay-section">
        <h4>Deductions</h4>
        <table>${dedRows}<tr class="total-row"><td>Total Deductions</td><td style="text-align:right">${fmtCurrency(String(totalDed))}</td></tr></table>
      </div>
    </div>
    <div class="net-box">
      <div><div class="net-label">Net Salary Payable</div><div class="net-words">${toWords(net)}</div></div>
      <div class="net-amount">${fmtCurrency(String(net))}</div>
    </div>
    ${signatureHTML(opts)}
    ${footerHTML(opts)}
  </div></body></html>`
}

function salaryCertificate(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p><strong>To Whom It May Concern,</strong></p>
  <p>This is to certify that <strong>${fmt(f.staff_name)}</strong>${f.staff_id ? ` (Staff ID: ${f.staff_id})` : ''} is currently employed with <strong>${opts.companyName || 'Forun Testing & Educational Services (FETS)'}</strong> as <strong>${fmt(f.position)}</strong>${f.department ? ` in the ${f.department} department` : ''}${f.centre ? `, at ${f.centre}` : ''}, with effect from <strong>${fmtDate(f.date_of_joining)}</strong>.</p>
  <p>The current monthly salary drawn by the employee is <strong>${fmtCurrency(f.monthly_salary)}</strong> (${toWords(parseFloat(f.monthly_salary || '0'))}).</p>
  <p>This certificate is issued at the request of the employee for the purpose of <strong>${fmt(f.purpose, 'reference')}</strong> and no other purpose is intended.</p>
  <p class="closing">Yours Sincerely,</p>`
  return wrap(body, opts, 'Salary Certificate')
}

function incrementLetter(f: Record<string, string>, opts: RenderOptions): string {
  const old = parseFloat(f.old_salary || '0')
  const newSal = parseFloat(f.new_salary || '0')
  const diff = newSal - old
  const pct = old > 0 ? ((diff / old) * 100).toFixed(1) : '0'
  const body = `
  <p class="salutation">To,<br>${fmt(f.staff_name)}</p>
  <p>Dear ${fmt(f.staff_name)},</p>
  <p>We are pleased to inform you that, in recognition of your performance${f.reason ? ` (${f.reason})` : ''}, the Management has approved a revision in your salary effective <strong>${fmtDate(f.effective_date)}</strong>.</p>
  <table>
    <tr><th>Staff ID</th><td>${fmt(f.staff_id)}</td><th>Designation</th><td>${fmt(f.position)}</td></tr>
    <tr><th>Current Salary</th><td>${fmtCurrency(f.old_salary)}</td><th>Revised Salary</th><td><strong>${fmtCurrency(f.new_salary)}</strong></td></tr>
    <tr><th>Increment Amount</th><td>${fmtCurrency(String(diff))}</td><th>% Increment</th><td>${pct}%</td></tr>
    <tr><th colspan="2">Effective Date</th><td colspan="2">${fmtDate(f.effective_date)}</td></tr>
  </table>
  <p>We appreciate your continued dedication and expect that you will continue to deliver excellent results.</p>
  <p class="closing">Yours Sincerely,</p>`
  return wrap(body, opts, 'Increment Letter', true)
}

function authorizationLetter(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p><strong>To Whom It May Concern,</strong></p>
  <p>This is to certify that <strong>${fmt(f.staff_name)}</strong>${f.staff_id ? ` (Staff ID: ${f.staff_id})` : ''}${f.position ? `, ${f.position}` : ''}, is hereby authorised to act on behalf of <strong>${opts.companyName || 'Forun Testing & Educational Services (FETS)'}</strong> for the following purpose:</p>
  <table>
    <tr><th>Purpose</th><td style="white-space:pre-wrap">${fmt(f.purpose)}</td></tr>
    ${f.authorized_places ? `<tr><th>Authorized For</th><td>${f.authorized_places}</td></tr>` : ''}
    <tr><th>Valid From</th><td>${fmtDate(f.valid_from)}</td></tr>
    <tr><th>Valid Till</th><td>${fmtDate(f.valid_to)}</td></tr>
  </table>
  <p>Any assistance rendered to the above-named individual in carrying out the authorized task will be appreciated.</p>
  <p class="closing">Yours Sincerely,</p>`
  return wrap(body, opts, 'Authorization Letter')
}

function idCard(f: Record<string, string>, opts: RenderOptions): string {
  // ID Card is landscape credit-card style — rendered as a separate layout
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; background:#f0f0f0; display:flex; justify-content:center; align-items:center; min-height:100vh; }
    .card { width:86mm; height:54mm; background:#0A0A0F; border-radius:8px; overflow:hidden; position:relative; color:white; display:flex; flex-direction:column; }
    .card-header { background:#F5C518; padding:8px 12px; display:flex; align-items:center; gap:8px; }
    .card-logo { font-size:14px; font-weight:bold; color:#0A0A0F; }
    .card-company { font-size:7pt; color:#0A0A0F; font-weight:bold; }
    .card-body { flex:1; padding:10px 12px; display:flex; gap:10px; align-items:flex-start; }
    .photo-box { width:30mm; height:30mm; background:#1E1E2E; border-radius:4px; border:2px solid #F5C518; display:flex; align-items:center; justify-content:center; font-size:8pt; color:#5A5A72; flex-shrink:0; }
    .info { flex:1; }
    .name { font-size:12pt; font-weight:bold; color:#F5C518; line-height:1.2; }
    .position { font-size:8pt; color:#aaa; margin-top:3px; }
    .staff-id { font-size:10pt; font-weight:bold; color:white; margin-top:8px; letter-spacing:1px; }
    .extra { font-size:7.5pt; color:#888; margin-top:3px; }
    .card-footer { background:#1E1E2E; padding:5px 12px; display:flex; justify-content:space-between; align-items:center; }
    .valid { font-size:7pt; color:#aaa; }
    .valid strong { color:#F5C518; }
    @media print { body { background:white; } .card { box-shadow:none; } }
  </style></head><body>
  <div class="card">
    <div class="card-header">
      <div class="card-logo">FETS</div>
      <div class="card-company">Forun Testing &amp; Educational Services</div>
    </div>
    <div class="card-body">
      <div class="photo-box">Photo</div>
      <div class="info">
        <div class="name">${fmt(f.staff_name)}</div>
        <div class="position">${fmt(f.position)}</div>
        ${f.department ? `<div class="extra">${f.department}</div>` : ''}
        <div class="staff-id">${fmt(f.staff_id)}</div>
        ${f.phone ? `<div class="extra">📞 ${f.phone}</div>` : ''}
        ${f.blood_group ? `<div class="extra">🩸 ${f.blood_group}</div>` : ''}
      </div>
    </div>
    <div class="card-footer">
      <div class="valid">Valid Till: <strong>${fmtDate(f.valid_till)}</strong></div>
      <div class="valid">${opts.companyWebsite || 'www.fets.in'}</div>
    </div>
  </div>
  </body></html>`
}

function assetHandover(f: Record<string, string>, opts: RenderOptions): string {
  const assetLines = (f.assets_list || '').split('\n').filter(Boolean)
  const rows = assetLines.map((item, i) => `<tr><td>${i + 1}</td><td>${item.trim()}</td></tr>`).join('')
  const body = `
  <p class="salutation">To,<br>${fmt(f.staff_name)}</p>
  <p>Dear ${fmt(f.staff_name)},</p>
  <p>Please acknowledge receipt of the following assets / items issued to you on behalf of <strong>${opts.companyName || 'FETS'}</strong> on <strong>${fmtDate(f.handover_date)}</strong>${f.purpose ? ` for the purpose of <em>${f.purpose}</em>` : ''}:</p>
  <table>
    <tr><th style="width:40px">#</th><th>Item Description</th></tr>
    ${rows}
  </table>
  <p>You are responsible for the safe-keeping of these assets. Any loss, damage, or misuse will be recovered from you. These assets must be returned in good condition upon request or on cessation of employment.</p>
  <p class="closing">Yours Sincerely,</p>`
  return wrap(body, opts, 'Asset Handover Letter', true)
}

function uniformIssue(f: Record<string, string>, opts: RenderOptions): string {
  const itemLines = (f.items_issued || '').split('\n').filter(Boolean)
  const rows = itemLines.map((item, i) => `<tr><td>${i + 1}</td><td>${item.trim()}</td></tr>`).join('')
  const body = `
  <p class="salutation">To,<br>${fmt(f.staff_name)}</p>
  <p>Dear ${fmt(f.staff_name)},</p>
  <p>Please acknowledge receipt of the following items issued to you on behalf of <strong>${opts.companyName || 'FETS'}</strong>${f.centre ? ` — ${f.centre}` : ''} on <strong>${fmtDate(f.issue_date)}</strong>:</p>
  <table>
    <tr><th style="width:40px">#</th><th>Item Issued</th></tr>
    ${rows}
  </table>
  <p>These items are the property of the Company and must be used only for official purposes. They must be returned in good condition upon leaving the organisation. The cost of any lost or damaged items will be recovered from your salary.</p>
  <p class="closing">Yours Sincerely,</p>`
  return wrap(body, opts, 'Uniform / ID Issue Form', true)
}

function internshipCertificate(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p><strong>This is to certify that</strong></p>
  <p style="text-align:center; font-size:16pt; color:#0A0A0F; font-weight:bold; margin:16px 0">${fmt(f.intern_name)}</p>
  <p>from <strong>${fmt(f.college)}</strong>${f.course ? ` (${f.course})` : ''} has successfully completed an internship at <strong>${opts.companyName || 'Forun Testing & Educational Services (FETS)'}</strong>${f.department ? ` — ${f.department} Department` : ''}, from <strong>${fmtDate(f.from_date)}</strong> to <strong>${fmtDate(f.to_date)}</strong>.</p>
  <p>During the internship, ${fmt(f.intern_name)} demonstrated <strong>${f.performance || 'Good'}</strong> performance, punctuality, and a keen interest in learning. We found the intern to be hardworking and sincere.</p>
  <p>We wish them the very best in their academic and professional career.</p>
  <p class="closing">Authorised By,</p>`
  return wrap(body, opts, 'Internship Certificate')
}

function trainingCertificate(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p><strong>This is to certify that</strong></p>
  <p style="text-align:center; font-size:15pt; color:#0A0A0F; font-weight:bold; margin:14px 0">${fmt(f.staff_name)}</p>
  ${f.staff_id ? `<p style="text-align:center; color:#555">(Staff ID: ${f.staff_id})</p>` : ''}
  <p>has successfully completed the training programme <strong>"${fmt(f.training_name)}"</strong>, conducted by <strong>${fmt(f.conducted_by, opts.companyName || 'FETS')}</strong> from <strong>${fmtDate(f.training_from)}</strong> to <strong>${fmtDate(f.training_to)}</strong>${f.duration_hours ? ` (${f.duration_hours} hours)` : ''}.</p>
  <p>Grade / Result: <strong>${fmt(f.grade, 'Completed')}</strong></p>
  <p>We congratulate them on the successful completion of this training and wish them continued success.</p>
  <p class="closing">Authorised By,</p>`
  return wrap(body, opts, 'Training Certificate')
}

function ndaAgreement(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p>This Non-Disclosure and Confidentiality Agreement (<strong>"Agreement"</strong>) is entered into on <strong>${fmtDate(f.letter_date)}</strong> between:</p>
  <table>
    <tr><th>Company</th><td>${opts.companyName || 'Forun Testing & Educational Services (FETS)'}</td></tr>
    <tr><th>Employee</th><td>${fmt(f.staff_name)}${f.staff_id ? ` (${f.staff_id})` : ''}</td></tr>
    <tr><th>Designation</th><td>${fmt(f.position)}</td></tr>
    <tr><th>Effective Date</th><td>${fmtDate(f.effective_date)}</td></tr>
  </table>
  <p><strong>1. Confidential Information:</strong> The Employee agrees to hold in strict confidence all trade secrets, business information, exam materials, candidate data, system credentials, and any other proprietary information of the Company.</p>
  <p><strong>2. Non-Disclosure:</strong> The Employee shall not disclose, share, publish or communicate Confidential Information to any third party without prior written consent from the Company.</p>
  <p><strong>3. Non-Competition:</strong> During employment and for a period of one (1) year after, the Employee shall not directly or indirectly engage in activities competitive with the Company's business.</p>
  <p><strong>4. Return of Property:</strong> Upon termination, the Employee shall immediately return all company property, data, and documents.</p>
  <p><strong>5. Breach:</strong> Any breach of this Agreement may result in immediate termination and legal action for damages.</p>
  <div class="signature-block" style="margin-top:30px">
    <div class="signatory"><div style="height:45px"></div><div class="sig-line">${fmt(f.staff_name)}</div><div class="sig-sub">Employee</div></div>
    <div class="signatory">${opts.signatureUrl ? `<img src="${opts.signatureUrl}" class="sig-img">` : `<div style="height:45px"></div>`}<div class="sig-line">Authorised Signatory</div><div class="sig-sub">For ${opts.companyName || 'FETS'}</div></div>
  </div>`

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head><body>
  <div class="page">
    ${letterheadHTML(opts)}
    ${titleHTML('Non-Disclosure Agreement', opts.docNumber, f.letter_date)}
    <div class="body">${body}</div>
    ${footerHTML(opts)}
  </div></body></html>`
}

function certRecord(f: Record<string, string>, opts: RenderOptions): string {
  const body = `
  <p><strong>To Whom It May Concern,</strong></p>
  <p>This is to certify that the following staff member of <strong>${opts.companyName || 'Forun Testing & Educational Services (FETS)'}</strong> has completed / attempted the certification as detailed below:</p>
  <table>
    <tr><th>Staff Name</th><td>${fmt(f.staff_name)}</td><th>Staff ID</th><td>${fmt(f.staff_id)}</td></tr>
    <tr><th>Designation</th><td colspan="3">${fmt(f.position)}</td></tr>
    <tr><th>Certification</th><td colspan="3"><strong>${fmt(f.certification_name)}</strong></td></tr>
    <tr><th>Issuing Body</th><td>${fmt(f.issuing_body)}</td><th>Exam Date</th><td>${fmtDate(f.exam_date)}</td></tr>
    <tr><th>Result</th><td><strong>${fmt(f.result)}</strong></td><th>Cert. No.</th><td>${fmt(f.certificate_no)}</td></tr>
    ${f.expiry_date ? `<tr><th colspan="2">Expiry Date</th><td colspan="2">${fmtDate(f.expiry_date)}</td></tr>` : ''}
  </table>
  <p>This record is maintained as part of the staff certification tracking system of ${opts.companyName || 'FETS'} and is issued for reference purposes.</p>
  <p class="closing">Issued By,</p>`
  return wrap(body, opts, 'Certification Record')
}

// ─── Main Render Function ─────────────────────────────────────
export function renderDocument(opts: RenderOptions): string {
  const { docType, fields } = opts
  switch (docType) {
    case 'offer_letter':           return offerLetter(fields, opts)
    case 'appointment_letter':     return appointmentLetter(fields, opts)
    case 'experience_letter':      return experienceLetter(fields, opts)
    case 'relieving_letter':       return relievingLetter(fields, opts)
    case 'confirmation_letter':    return confirmationLetter(fields, opts)
    case 'appreciation_letter':    return appreciationLetter(fields, opts)
    case 'leave_approval':         return leaveApproval(fields, opts)
    case 'warning_letter':         return warningLetter(fields, opts)
    case 'payslip':                return payslip(fields, opts)
    case 'salary_certificate':     return salaryCertificate(fields, opts)
    case 'increment_letter':       return incrementLetter(fields, opts)
    case 'authorization_letter':   return authorizationLetter(fields, opts)
    case 'id_card':                return idCard(fields, opts)
    case 'asset_handover':         return assetHandover(fields, opts)
    case 'uniform_issue':          return uniformIssue(fields, opts)
    case 'internship_certificate': return internshipCertificate(fields, opts)
    case 'training_certificate':   return trainingCertificate(fields, opts)
    case 'nda_agreement':          return ndaAgreement(fields, opts)
    case 'cert_record':            return certRecord(fields, opts)
    default:
      return `<html><body><p>Unknown document type: ${docType}</p></body></html>`
  }
}
