import { useState } from 'react'
import { Printer, FileText, X, ChevronDown } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import type { SupplierDocumentTemplate } from '../../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentReceiptData {
  type: 'payment'
  paymentNumber: string
  supplierName: string
  purchaseOrderNumber?: string
  amount: number
  amountPaid: number
  currency: string
  paymentMethod: string
  paymentDate: string
  status: string
  notes?: string
}

export interface POReceiptData {
  type: 'purchase_order'
  poNumber: string
  supplierName: string
  orderDate: string
  expectedCompletionDate?: string
  currency: string
  status: string
  notes?: string
  items: { productName: string; quantity: number; unitCost: number; totalCost: number }[]
  totalAmount: number
}

export type ReceiptData = PaymentReceiptData | POReceiptData

// ─── Currency symbol helper ───────────────────────────────────────────────────

const currencySymbol = (c: string) =>
  ({ USD: '$', CNY: '¥', EUR: '€', DZD: 'دج' }[c] ?? c)

const fmt = (amount: number, currency: string) =>
  `${currencySymbol(currency)} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ─── Payment method label helper ─────────────────────────────────────────────

const paymentMethodLabel = (method: string, lang: string) => {
  const labels: Record<string, { ar: string; fr: string }> = {
    bank_transfer: { ar: 'تحويل بنكي', fr: 'Virement bancaire' },
    cash: { ar: 'نقدا', fr: 'Espèces' },
    wise: { ar: 'Wise', fr: 'Wise' },
    western_union: { ar: 'Western Union', fr: 'Western Union' },
    paypal: { ar: 'PayPal', fr: 'PayPal' },
    other: { ar: 'أخرى', fr: 'Autre' },
  }
  const entry = labels[method]
  if (!entry) return method
  return lang === 'ar' ? entry.ar : entry.fr
}

// ─── Minimalist receipt HTML builder ─────────────────────────────────────────

function buildMinimalistHTML(data: ReceiptData, companyName: string, lang: string): string {
  const isAr = lang === 'ar'
  const dir = isAr ? 'rtl' : 'ltr'
  const align = isAr ? 'right' : 'left'
  const now = new Date()
  const dateStr = now.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-DZ')
  const timeStr = now.toLocaleTimeString(isAr ? 'ar-DZ' : 'fr-DZ', { hour: '2-digit', minute: '2-digit' })

  let body = ''

  if (data.type === 'payment') {
    const title = isAr ? 'إيصال دفعة' : 'Reçu de paiement'
    const rows = [
      [isAr ? 'رقم الإيصال' : 'N° Reçu', data.paymentNumber],
      [isAr ? 'المورد' : 'Fournisseur', data.supplierName],
      ...(data.purchaseOrderNumber ? [[isAr ? 'أمر الشراء' : 'Bon de commande', data.purchaseOrderNumber]] : []),
      [isAr ? 'طريقة الدفع' : 'Méthode', paymentMethodLabel(data.paymentMethod, lang)],
      [isAr ? 'تاريخ الدفع' : 'Date paiement', data.paymentDate],
      ...(data.notes ? [[isAr ? 'ملاحظات' : 'Notes', data.notes]] : []),
    ]

    body = `
      <h2 style="text-align:center;margin:0 0 12px;font-size:16px;">${title}</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:5px 8px;font-weight:600;color:#555;width:45%;border-bottom:1px dashed #e0e0e0;">${k}</td>
            <td style="padding:5px 8px;border-bottom:1px dashed #e0e0e0;">${v}</td>
          </tr>`).join('')}
      </table>
      <div style="border:2px solid #333;border-radius:6px;padding:12px;text-align:center;margin-bottom:12px;">
        <div style="font-size:11px;color:#666;margin-bottom:4px;">${isAr ? 'المبلغ المدفوع' : 'Montant payé'}</div>
        <div style="font-size:24px;font-weight:700;">${fmt(data.amountPaid, data.currency)}</div>
        <div style="font-size:11px;color:#666;margin-top:4px;">${isAr ? 'من أصل' : 'sur'} ${fmt(data.amount, data.currency)}</div>
      </div>`
  } else {
    const title = isAr ? 'إيصال أمر شراء' : 'Bon de commande'
    const rows = [
      [isAr ? 'رقم الأمر' : 'N° Commande', data.poNumber],
      [isAr ? 'المورد' : 'Fournisseur', data.supplierName],
      [isAr ? 'تاريخ الطلب' : 'Date commande', data.orderDate],
      ...(data.expectedCompletionDate ? [[isAr ? 'تاريخ الاستلام المتوقع' : 'Livraison prévue', data.expectedCompletionDate]] : []),
      ...(data.notes ? [[isAr ? 'ملاحظات' : 'Notes', data.notes]] : []),
    ]

    const itemsRows = data.items.map(item => `
      <tr>
        <td style="padding:5px 8px;border-bottom:1px dashed #e0e0e0;">${item.productName}</td>
        <td style="padding:5px 8px;border-bottom:1px dashed #e0e0e0;text-align:center;">${item.quantity}</td>
        <td style="padding:5px 8px;border-bottom:1px dashed #e0e0e0;text-align:${align};">${fmt(item.unitCost, data.currency)}</td>
        <td style="padding:5px 8px;border-bottom:1px dashed #e0e0e0;text-align:${align};font-weight:600;">${fmt(item.totalCost, data.currency)}</td>
      </tr>`).join('')

    body = `
      <h2 style="text-align:center;margin:0 0 12px;font-size:16px;">${title}</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="padding:5px 8px;font-weight:600;color:#555;width:45%;border-bottom:1px dashed #e0e0e0;">${k}</td>
            <td style="padding:5px 8px;border-bottom:1px dashed #e0e0e0;">${v}</td>
          </tr>`).join('')}
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;font-size:12px;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:6px 8px;text-align:${align};border-bottom:2px solid #333;">${isAr ? 'المنتج' : 'Produit'}</th>
            <th style="padding:6px 8px;text-align:center;border-bottom:2px solid #333;">${isAr ? 'الكمية' : 'Qté'}</th>
            <th style="padding:6px 8px;text-align:${align};border-bottom:2px solid #333;">${isAr ? 'سعر الوحدة' : 'P.U.'}</th>
            <th style="padding:6px 8px;text-align:${align};border-bottom:2px solid #333;">${isAr ? 'الإجمالي' : 'Total'}</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div style="border:2px solid #333;border-radius:6px;padding:12px;text-align:center;margin-bottom:12px;">
        <div style="font-size:11px;color:#666;margin-bottom:4px;">${isAr ? 'المجموع الكلي' : 'Total général'}</div>
        <div style="font-size:24px;font-weight:700;">${fmt(data.totalAmount, data.currency)}</div>
      </div>`
  }

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${companyName} — ${isAr ? 'إيصال' : 'Reçu'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${isAr ? "'Cairo','Tahoma',sans-serif" : "'Inter','Segoe UI',sans-serif"};
      font-size: 13px;
      color: #111;
      direction: ${dir};
      padding: 20px;
      max-width: 380px;
      margin: 0 auto;
    }
    @media print {
      body { padding: 8px; }
      @page { size: 80mm auto; margin: 4mm; }
    }
    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 14px; }
    .company { font-size: 18px; font-weight: 700; }
    .subtitle { font-size: 11px; color: #666; }
    .footer { text-align: center; font-size: 10px; color: #999; border-top: 1px dashed #ccc; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">${companyName}</div>
    <div class="subtitle">${dateStr} &mdash; ${timeStr}</div>
  </div>
  ${body}
  <div class="footer">${isAr ? 'شكراً لتعاملكم معنا' : 'Merci pour votre confiance'} — CargoBridge</div>
</body>
</html>`
}

// ─── Template variables filler ────────────────────────────────────────────────

function fillTemplate(
  content: string,
  data: ReceiptData,
  companyName: string,
  lang: string,
  supplierRecord?: { country: string; city: string; address: string; phones: { label: string; number: string }[]; email: string; code: string } | null
): string {
  const now = new Date()
  const isAr = lang === 'ar'
  const dateStr = now.toLocaleDateString(isAr ? 'ar-DZ' : 'fr-DZ')
  const timeStr = now.toLocaleTimeString(isAr ? 'ar-DZ' : 'fr-DZ', { hour: '2-digit', minute: '2-digit' })

  // Supplier-level fields available for both Arabic and English placeholders
  const supplierCountry = supplierRecord?.country ?? '—'
  const supplierCity = supplierRecord?.city ?? '—'
  const supplierAddress = supplierRecord?.address ?? '—'
  const supplierPhone = supplierRecord?.phones?.[0]?.number ?? '—'
  const supplierEmail = supplierRecord?.email ?? '—'
  const supplierCode = supplierRecord?.code ?? '—'

  const vars: Record<string, string> = {
    // ── English camelCase ──
    companyName,
    currentDate: dateStr,
    currentTime: timeStr,
    currentDateTime: `${dateStr} — ${timeStr}`,
    supplierName: data.supplierName,
    supplierCountry,
    supplierCity,
    supplierAddress,
    supplierPhone,
    supplierEmail,
    supplierCode,
    // ── Arabic placeholder keys (as used in the Suppliers → النماذج editor) ──
    'اسم_المورد': data.supplierName,
    'الدولة': supplierCountry,
    'المدينة': supplierCity,
    'العنوان': supplierAddress,
    'الهاتف': supplierPhone,
    'البريد_الإلكتروني': supplierEmail,
    'رقم_المورد': supplierCode,
    'تاريخ_اليوم': dateStr,
    'اسم_الشركة': companyName,
    'الوقت': timeStr,
    'التاريخ_والوقت': `${dateStr} — ${timeStr}`,
  }

  if (data.type === 'payment') {
    const paymentVars: Record<string, string> = {
      // English
      paymentNumber: data.paymentNumber,
      purchaseOrderNumber: data.purchaseOrderNumber ?? '—',
      amount: fmt(data.amount, data.currency),
      amountPaid: fmt(data.amountPaid, data.currency),
      currency: data.currency,
      paymentMethod: paymentMethodLabel(data.paymentMethod, lang),
      paymentDate: data.paymentDate,
      status: data.status,
      notes: data.notes ?? '',
      value: fmt(data.amountPaid, data.currency),
      // Arabic
      'رقم_الدفعة': data.paymentNumber,
      'رقم_أمر_الشراء': data.purchaseOrderNumber ?? '—',
      'المبلغ': fmt(data.amount, data.currency),
      'المبلغ_المدفوع': fmt(data.amountPaid, data.currency),
      'العملة': data.currency,
      'طريقة_الدفع': paymentMethodLabel(data.paymentMethod, lang),
      'تاريخ_الدفع': data.paymentDate,
      'الحالة': data.status,
      'ملاحظات': data.notes ?? '',
      'القيمة': fmt(data.amountPaid, data.currency),
    }
    Object.assign(vars, paymentVars)
  } else {
    const itemsList = data.items
      .map((it, i) => `${i + 1}. ${it.productName} × ${it.quantity} @ ${fmt(it.unitCost, data.currency)} = ${fmt(it.totalCost, data.currency)}`)
      .join('\n')

    const poVars: Record<string, string> = {
      // English
      poNumber: data.poNumber,
      orderDate: data.orderDate,
      expectedCompletionDate: data.expectedCompletionDate ?? '—',
      currency: data.currency,
      status: data.status,
      notes: data.notes ?? '',
      totalAmount: fmt(data.totalAmount, data.currency),
      value: fmt(data.totalAmount, data.currency),
      lineItems: itemsList,
      quantity: data.items.reduce((s, i) => s + i.quantity, 0).toString(),
      // Arabic
      'رقم_الطلب': data.poNumber,
      'تاريخ_الطلب': data.orderDate,
      'تاريخ_الإنجاز_المتوقع': data.expectedCompletionDate ?? '—',
      'العملة': data.currency,
      'الحالة': data.status,
      'ملاحظات': data.notes ?? '',
      'الإجمالي': fmt(data.totalAmount, data.currency),
      'القيمة': fmt(data.totalAmount, data.currency),
      'بنود_الطلب': itemsList,
      'الكمية': data.items.reduce((s, i) => s + i.quantity, 0).toString(),
    }
    Object.assign(vars, poVars)
  }

  // Use [^}]+ instead of \w+ so Arabic placeholder keys are captured correctly
  return content.replace(/\{\{([^}]+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
}

function buildTemplateHTML(
  template: SupplierDocumentTemplate,
  data: ReceiptData,
  companyName: string,
  lang: string,
  supplierRecord?: { country: string; city: string; address: string; phones: { label: string; number: string }[]; email: string; code: string } | null
): string {
  const isAr = /[؀-ۿ]/.test(template.templateBody) || lang === 'ar'
  const dir = isAr ? 'rtl' : 'ltr'
  const filled = fillTemplate(template.templateBody, data, companyName, lang, supplierRecord)
  const lines = filled.split('\n').map(line => {
    if (line.startsWith('━')) return '<hr style="border:none;border-top:1px solid #ccc;margin:8px 0;">'
    return `<p style="min-height:1.2em;white-space:pre-wrap;">${line || ' '}</p>`
  }).join('')

  return `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${template.templateName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${isAr ? "'Cairo','Tahoma',sans-serif" : "'Inter','Segoe UI',sans-serif"};
      font-size: 13px;
      color: #111;
      direction: ${dir};
      text-align: ${isAr ? 'right' : 'left'};
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }
    @media print { body { padding: 12px; } }
    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 16px; }
    .template-name { font-size: 16px; font-weight: 700; }
    .company-name { font-size: 12px; color: #666; }
    .content { line-height: 1.8; }
    .footer { text-align: center; font-size: 10px; color: #999; border-top: 1px dashed #ccc; padding-top: 8px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="template-name">${template.templateName}</div>
    <div class="company-name">${companyName}</div>
  </div>
  <div class="content">${lines}</div>
  <div class="footer">CargoBridge</div>
</body>
</html>`
}

// ─── Print helper ─────────────────────────────────────────────────────────────

function printHTML(html: string) {
  const win = window.open('', '_blank', 'width=500,height=700')
  if (!win) { alert('Please allow popups to print'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

// ─── Modal component ──────────────────────────────────────────────────────────

interface Props {
  data: ReceiptData
  onClose: () => void
}

export function ReceiptPrintModal({ data, onClose }: Props) {
  const { language, companyName, supplierTemplates, suppliers } = useAppStore()
  const isAr = language === 'ar'

  // Resolve the supplier record from the store so Arabic template placeholders
  // (e.g. {{الدولة}}, {{الهاتف}}) can be filled with real data.
  const activeSupplier = suppliers.find(s => s.name === data.supplierName) ?? null
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [mode, setMode] = useState<'choose' | 'direct' | 'template'>('choose')

  const printLabel = data.type === 'payment'
    ? (isAr ? 'طباعة إيصال الدفعة' : 'Imprimer le reçu de paiement')
    : (isAr ? 'طباعة إيصال الطلب' : 'Imprimer le bon de commande')

  const handleDirectPrint = () => {
    const html = buildMinimalistHTML(data, companyName, language)
    printHTML(html)
    onClose()
  }

  const handleTemplatePrint = () => {
    const tpl = supplierTemplates.find(t => t.id === selectedTemplateId)
    if (!tpl) return
    const html = buildTemplateHTML(tpl, data, companyName, language, activeSupplier)
    printHTML(html)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Printer className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{printLabel}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isAr ? 'اختر طريقة الطباعة' : 'Choisissez le mode d\'impression'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Option 1: Direct minimalist print */}
          <button
            onClick={handleDirectPrint}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all text-start group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {isAr ? '🖨️ طباعة مباشرة (مبسطة)' : '🖨️ Impression directe (simplifiée)'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isAr
                  ? 'إيصال مبسط جاهز للطباعة فوراً مع جميع تفاصيل العملية'
                  : 'Reçu simple prêt à imprimer avec tous les détails de l\'opération'}
              </p>
            </div>
          </button>

          {/* Option 2: Template-based print */}
          <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {isAr ? '📄 طباعة بقالب مخصص' : '📄 Impression avec modèle personnalisé'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isAr
                    ? 'استخدم أحد قوالب نماذج الوثائق المحفوظة'
                    : 'Utilisez un modèle de document enregistré'}
                </p>
              </div>
            </div>

            {supplierTemplates.length === 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                {isAr
                  ? '⚠️ لا توجد قوالب. أضف قوالب من قسم النماذج في صفحة الموردين أولاً.'
                  : '⚠️ Aucun modèle. Créez-en un dans l\'onglet Modèles des Fournisseurs.'}
              </p>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedTemplateId}
                    onChange={e => setSelectedTemplateId(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pe-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">{isAr ? 'اختر قالباً...' : 'Choisir un modèle...'}</option>
                    {supplierTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.templateName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute end-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={handleTemplatePrint}
                  disabled={!selectedTemplateId}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {isAr ? 'طباعة' : 'Imprimer'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium"
          >
            {isAr ? 'تخطي — بدون طباعة' : 'Passer — sans impression'}
          </button>
        </div>
      </div>
    </div>
  )
}
