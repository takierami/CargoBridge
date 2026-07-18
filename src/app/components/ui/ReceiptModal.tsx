import { useState, useMemo, useEffect } from 'react'
import { X, Printer, FileDown, ChevronDown, Pencil, Check, RotateCcw } from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import { formatDate, formatDateTime, formatDateTimeIsolated, ltrIsolate } from '../../../utils/dateUtils'
import { cn } from '../../utils/cn'
import type { Goods, Agent, DocumentTemplate, TemplateType } from '../../../types'

interface ReceiptModalProps {
  goods: Goods
  agent?: Agent
  defaultType?: TemplateType
  onClose: () => void
}

// Detect Arabic from RAW template content only (before variable substitution)
// so that substituted values (company name, agent name) don't pollute the detection
const templateIsArabic = (content: string) => /[؀-ۿ]/.test(content)

// Translated category and status labels for each language
const CATEGORY_FR: Record<string, string> = {
  electronics: 'Électronique', clothing: 'Vêtements', food: 'Alimentation',
  cosmetics: 'Cosmétiques', medicine: 'Médicaments', tools: 'Outils',
  furniture: 'Mobilier', other: 'Autre',
}
const CATEGORY_AR: Record<string, string> = {
  electronics: 'إلكترونيات', clothing: 'ملابس', food: 'مواد غذائية',
  cosmetics: 'مستحضرات تجميل', medicine: 'أدوية', tools: 'أدوات',
  furniture: 'أثاث', other: 'أخرى',
}
const STATUS_FR: Record<string, string> = {
  draft: 'Brouillon', assigned: 'Assigné', ready_for_departure: 'Prêt au départ',
  in_transit: 'En transit', arrived: 'Arrivé', delivered: 'Livré',
  delayed: 'En retard', cancelled: 'Annulé',
}
const STATUS_AR: Record<string, string> = {
  draft: 'مسودة', assigned: 'مُعيَّن', ready_for_departure: 'جاهز للمغادرة',
  in_transit: 'في الطريق', arrived: 'وصل', delivered: 'تم التسليم',
  delayed: 'متأخر', cancelled: 'ملغي',
}

function buildPrintHtml(
  content: string,
  title: string,
  companyName: string,
  isRTL: boolean,
  footerDateTime: string,
): string {
  const dir = isRTL ? 'rtl' : 'ltr'
  const align = isRTL ? 'right' : 'left'
  const font = isRTL
    ? "'Cairo', 'Tahoma', 'Arabic Typesetting', sans-serif"
    : "'Inter', 'Segoe UI', 'Helvetica Neue', sans-serif"

  const lines = content.split('\n').map(l => {
    if (l.startsWith('━'))
      return `<hr style="border:none;border-top:1px solid #d1d5db;margin:14px 0"/>`
    return `<p style="margin:3px 0;white-space:pre-wrap;min-height:1.4em">${l || '&nbsp;'}</p>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="${isRTL ? 'ar' : 'fr'}" dir="${dir}">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      direction: ${dir};
      unicode-bidi: embed;
    }
    body {
      font-family: ${font};
      color: #111827;
      font-size: 13.5px;
      line-height: 1.75;
      padding: 48px 56px;
      text-align: ${align};
      background: #fff;
    }
    .doc-header {
      text-align: center;
      border-bottom: 2px solid #111827;
      padding-bottom: 18px;
      margin-bottom: 28px;
    }
    .doc-header h1 { font-size: 18px; font-weight: 700; letter-spacing: 0.02em; }
    .doc-header .company { font-size: 11px; color: #6b7280; margin-top: 5px; }
    .doc-body { line-height: 1.9; }
    .doc-footer {
      margin-top: 48px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #9ca3af;
      text-align: center;
    }
    .doc-footer-datetime {
      direction: ltr;
      unicode-bidi: isolate;
      display: inline-block;
    }
    p { margin: 3px 0; }
    @media print {
      body { padding: 0; }
      @page { margin: 18mm 22mm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <h1>${title}</h1>
    <div class="company">${companyName}</div>
  </div>
  <div class="doc-body">${lines}</div>
  <div class="doc-footer">
    CargoBridge &mdash; <span class="doc-footer-datetime">${footerDateTime}</span>
  </div>
</body>
</html>`
}

// Isolated document container styles — breaks out of the app-level dir="rtl/ltr" context
function docContainerStyle(isRTL: boolean, font: string): React.CSSProperties {
  return {
    direction: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' : 'left',
    unicodeBidi: 'isolate',
    fontFamily: font,
    writingMode: 'horizontal-tb',
  }
}

export function ReceiptModal({ goods, agent, defaultType = 'reception', onClose }: ReceiptModalProps) {
  const { t, language, templates, companyName, companyNameFr } = useAppStore()

  // Document direction driven by APP LANGUAGE — not content-sniffing the processed text,
  // because processed text always contains Arabic variable values (company name, agent name)
  // even when the template itself is French.
  const docIsRTL = language === 'ar'
  const docFont = docIsRTL
    ? "'Cairo', 'Tahoma', sans-serif"
    : "'Inter', 'Segoe UI', sans-serif"

  const [selectedType, setSelectedType] = useState<TemplateType>(
    defaultType === 'general' ? 'reception' : defaultType
  )
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [editMode, setEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState<string | null>(null)

  const typeTemplates = useMemo(
    () => templates.filter(tp => tp.type === selectedType),
    [templates, selectedType]
  )

  // Auto-select template whose RAW content language matches the app language.
  // We check the template.content (before substitution) so Arabic company/agent names
  // in the data don't cause a French template to be classified as Arabic.
  const languageMatchedTemplate = useMemo(() => {
    const wantArabic = language === 'ar'
    return (
      typeTemplates.find(tp => templateIsArabic(tp.content) === wantArabic) ??
      typeTemplates.find(tp => tp.isDefault) ??
      typeTemplates[0]
    )
  }, [typeTemplates, language])

  const activeTemplate: DocumentTemplate | undefined = useMemo(() => {
    if (selectedTemplateId) return templates.find(tp => tp.id === selectedTemplateId)
    return languageMatchedTemplate
  }, [templates, selectedTemplateId, languageMatchedTemplate])

  // Reset manual selection + edits when type or language changes
  useEffect(() => {
    setSelectedTemplateId('')
    setEditedContent(null)
    setEditMode(false)
  }, [selectedType, language])

  // Reset edits when active template changes
  useEffect(() => {
    setEditedContent(null)
    setEditMode(false)
  }, [activeTemplate?.id])

  const isFr = language === 'fr'
  const MISSING_FR = '[Traduction manquante]'
  const hasMissingFrTranslation = isFr && (
    (!goods.descriptionFr) || (goods.notes && !goods.notesFr) || (agent && !agent.nameFr)
  )

  const effectiveCompany = isFr ? (companyNameFr || companyName) : companyName
  const documentGeneratedAt = useMemo(() => new Date(), [activeTemplate?.id, selectedType, language, goods.id])
  const footerDateTime = formatDateTime(language as 'ar' | 'fr', documentGeneratedAt)

  const processed = useMemo(() => {
    if (!activeTemplate) return ''

    const lang = language as 'ar' | 'fr'
    const weightUnit = isFr ? 'kg' : 'كجم'
    const currency = isFr ? 'DZD' : 'دج'
    const categoryMap = isFr ? CATEGORY_FR : CATEGORY_AR
    const statusMap = isFr ? STATUS_FR : STATUS_AR
    const locale = isFr ? 'fr-FR' : 'ar-DZ'
    // Isolate LTR-sensitive fields when embedding into Arabic templates
    const isolate = (value: string) => (lang === 'ar' ? ltrIsolate(value) : value)

    const vars: Record<string, string> = {
      trackingNumber: isolate(goods.trackingNumber),
      goodsDescription: isFr ? (goods.descriptionFr || MISSING_FR) : goods.description,
      quantity: isolate(String(goods.quantity)),
      category: categoryMap[goods.category] ?? goods.category,
      weight: goods.weight ? isolate(`${goods.weight} ${weightUnit}`) : '—',
      value: goods.value ? isolate(`${goods.value.toLocaleString(locale)} ${currency}`) : '—',
      agentName: isFr ? (agent?.nameFr || agent?.name || '—') : (agent?.name ?? '—'),
      agentPhone: isolate(agent?.phone ?? '—'),
      passportNumber: isolate(agent?.passport ?? '—'),
      departureDate: isolate(formatDate(goods.departureDate, lang)),
      expectedArrivalDate: isolate(formatDate(goods.expectedArrivalDate, lang)),
      arrivalDate: isolate(formatDate(goods.arrivalDate, lang)),
      creationDate: isolate(formatDate(goods.createdAt, lang)),
      currentDate: isolate(documentGeneratedAt.toLocaleDateString(locale)),
      currentTime: isolate(documentGeneratedAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })),
      currentDateTime: formatDateTimeIsolated(lang, documentGeneratedAt),
      status: statusMap[goods.status] ?? goods.status,
      transportType: goods.transportType
        ? (isFr
          ? ({ air: 'Fret aérien', sea: 'Fret maritime', land: 'Transport terrestre', express: 'Express', other: 'Autre' }[goods.transportType] ?? goods.transportType)
          : ({ air: 'طيران', sea: 'بحر', land: 'بري', express: 'سريع', other: 'أخرى' }[goods.transportType] ?? goods.transportType))
        : '—',
      notes: isFr ? (goods.notesFr || goods.notes || '—') : (goods.notes || '—'),
      companyName: effectiveCompany,
    }
    return activeTemplate.content.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`)
  }, [activeTemplate, goods, agent, effectiveCompany, language, isFr, documentGeneratedAt])

  const displayContent = editedContent ?? processed

  const title = selectedType === 'reception'
    ? t('receipts.receptionReceipt')
    : t('receipts.deliveryReceipt')

  const handlePrint = () => {
    const html = buildPrintHtml(displayContent, title, effectiveCompany, docIsRTL, footerDateTime)
    const win = window.open('', '_blank', 'width=820,height=960')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.focus(); win.print() }
  }

  const handleDownload = () => {
    const html = buildPrintHtml(displayContent, title, effectiveCompany, docIsRTL, footerDateTime)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${goods.trackingNumber}-${selectedType}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleEditStart = () => {
    setEditedContent(processed)
    setEditMode(true)
  }

  const handleEditDone = () => setEditMode(false)

  const handleEditReset = () => {
    setEditedContent(null)
    setEditMode(false)
  }

  const TYPES: TemplateType[] = ['reception', 'delivery']
  const docStyle = docContainerStyle(docIsRTL, docFont)

  // HR divider line
  const renderLines = (content: string) =>
    content.split('\n').map((line, i) =>
      line.startsWith('━')
        ? <hr key={`hr-${i}`} className="border-0 border-t border-gray-300 my-3" />
        : <p key={`ln-${i}`} className="whitespace-pre-wrap min-h-[1.3em]">{line || ' '}</p>
    )

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">

        {/* Modal header — follows APP direction, not document direction */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">{t('receipts.preview')}</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono" dir="ltr">{goods.trackingNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {/* Type tabs */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            {TYPES.map(tp => (
              <button
                key={tp}
                onClick={() => setSelectedType(tp)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  selectedType === tp
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                )}
              >
                {t(`templates.types.${tp}`)}
              </button>
            ))}
          </div>

          {/* Template selector */}
          <div className="relative">
            <select
              value={selectedTemplateId || activeTemplate?.id || ''}
              onChange={e => setSelectedTemplateId(e.target.value)}
              className="appearance-none ps-3 pe-8 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {typeTemplates.length === 0
                ? <option value="">{t('receipts.noTemplate')}</option>
                : typeTemplates.map(tp => (
                  <option key={tp.id} value={tp.id}>
                    {tp.name}{tp.isDefault ? ' ★' : ''}
                  </option>
                ))
              }
            </select>
            <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="ms-auto flex gap-2">
            <button
              onClick={handlePrint}
              disabled={!activeTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              {t('receipts.print')}
            </button>
            <button
              onClick={handleDownload}
              disabled={!activeTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              {t('receipts.downloadPdf')}
            </button>
          </div>
        </div>

        {/* Document area — dir applied here to fix scrollbar side + content anchor in RTL app */}
        <div
          dir={docIsRTL ? 'rtl' : 'ltr'}
          className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 p-6"
        >
          {!activeTemplate ? (
            <div className="text-center py-16 text-gray-400">
              <p>{t('receipts.noTemplate')}</p>
            </div>
          ) : (
            <div className="mx-auto max-w-[640px]">

              {/* Missing French translation warning */}
              {hasMissingFrTranslation && (
                <div dir="ltr" className="mb-3 px-4 py-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-800 text-xs flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">⚠</span>
                  <span>Some fields are missing French translations and will show <strong>[Traduction manquante]</strong>. Edit the goods or agent record to add French translations.</span>
                </div>
              )}

              {/* Edit / Done toolbar */}
              <div className="flex items-center justify-end gap-2 mb-3">
                {editMode ? (
                  <>
                    {editedContent !== processed && (
                      <button
                        onClick={handleEditReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {docIsRTL ? 'إعادة تعيين' : 'Réinitialiser'}
                      </button>
                    )}
                    <button
                      onClick={handleEditDone}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {docIsRTL ? 'تم' : 'Terminer'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditStart}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700 rounded-lg text-xs font-medium transition-colors shadow-sm"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {docIsRTL ? 'تعديل الوثيقة' : 'Modifier le document'}
                  </button>
                )}
              </div>

              {/* ── DOCUMENT CARD ── */}
              {/* We apply docStyle (direction + text-align + unicode-bidi: isolate) here
                  to fully break out of the app-level html[dir] context */}
              <div
                style={docStyle}
                className={cn(
                  'bg-white rounded-xl shadow-md border',
                  editMode
                    ? 'border-amber-400 dark:border-amber-500'
                    : 'border-gray-200 dark:border-gray-600'
                )}
              >
                {/* Document header — always centered, direction-neutral */}
                <div className="text-center border-b-2 border-gray-800 mx-8 pt-8 pb-5 mb-0">
                  <h1 className="text-[17px] font-bold text-gray-900 tracking-wide">{title}</h1>
                  <p className="text-[11px] text-gray-500 mt-1">{effectiveCompany}</p>
                </div>

                {/* Document body */}
                {editMode ? (
                  <textarea
                    value={editedContent ?? ''}
                    onChange={e => setEditedContent(e.target.value)}
                    style={{
                      direction: docIsRTL ? 'rtl' : 'ltr',
                      textAlign: docIsRTL ? 'right' : 'left',
                      fontFamily: docFont,
                      resize: 'none',
                    }}
                    className="w-full px-8 py-6 text-[13.5px] text-gray-800 leading-[1.85] bg-transparent focus:outline-none min-h-[380px]"
                  />
                ) : (
                  <div className="px-8 py-6 text-[13.5px] text-gray-800 leading-[1.85] space-y-0.5">
                    {renderLines(displayContent)}
                  </div>
                )}

                {/* Document footer — datetime LTR-isolated to prevent Arabic bi-di scramble */}
                <div className="mx-8 mb-6 mt-2 pt-4 border-t border-gray-200 text-center text-[11px] text-gray-400">
                  CargoBridge —{' '}
                  <span dir="ltr" style={{ unicodeBidi: 'isolate', display: 'inline-block' }}>
                    {footerDateTime}
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
