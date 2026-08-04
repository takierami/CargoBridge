import { useState, useRef, useMemo } from 'react'
import { Plus, Pencil, Trash2, Copy, Star, Eye, X, Save, FileText, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'
import { formatDate } from '../../../utils/dateUtils'
import { TEMPLATE_VARIABLES } from '../../../types'
import type { DocumentTemplate, TemplateType } from '../../../types'

const SAMPLE: Record<string, string> = {
  trackingNumber: 'CB-2025-001',
  goodsDescription: 'هواتف ذكية سامسونج',
  quantity: '50',
  category: 'إلكترونيات',
  weight: '25 كجم',
  value: '150000 دج',
  agentName: 'أحمد بن علي',
  agentPhone: '+86-138-0000-1234',
  passportNumber: 'DZ-1234567',
  departureDate: '01/06/2025',
  expectedArrivalDate: '08/06/2025',
  arrivalDate: '07/06/2025',
  creationDate: '25/05/2025',
  currentDate: new Date().toLocaleDateString('ar-DZ'),
  status: 'في الطريق',
  notes: 'يحتوي على ضمان سنة',
  companyName: 'كارغو بريدج',
}

function processPreview(content: string): string {
  return content.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE[key] ?? `{{${key}}}`)
}

interface EditorProps {
  template?: DocumentTemplate
  onSave: (data: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  t: ReturnType<typeof useAppStore>['t']
  language: string
}

const contentIsArabic = (text: string) => /[؀-ۿ]/.test(text)

function TemplateEditor({ template, onSave, onCancel, t, language }: EditorProps) {
  const appIsRTL = language === 'ar'
  const [name, setName] = useState(template?.name ?? '')
  const [type, setType] = useState<TemplateType>(template?.type ?? 'reception')
  const [content, setContent] = useState(template?.content ?? '')
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false)
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Direction follows the template content language, not the app language.
  // A French template being edited inside the Arabic app must still render LTR.
  const contentRTL = contentIsArabic(content)
  const contentFont = contentRTL
    ? "'Cairo', 'Tahoma', sans-serif"
    : "'Inter', 'Segoe UI', sans-serif"
  const contentDir = contentRTL ? 'rtl' : 'ltr'
  const contentAlign = contentRTL ? 'right' : 'left'

  const insertVariable = (key: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const snippet = `{{${key}}}`
    const next = content.slice(0, start) + snippet + content.slice(end)
    setContent(next)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + snippet.length, start + snippet.length)
    }, 0)
  }

  const handleSave = () => {
    if (!name.trim()) { toast.error(t('common.required')); return }
    if (!content.trim()) { toast.error(t('common.required')); return }
    onSave({ name: name.trim(), type, content, isDefault })
  }

  const preview = useMemo(() => processPreview(content), [content])

  const TYPES: TemplateType[] = ['reception', 'delivery', 'general']

  return (
    <div className="flex flex-col h-full">
      {/* Editor header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          {template ? t('templates.editTemplate') : t('templates.addTemplate')}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-11 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-11 flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {t('common.save')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Name + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('templates.templateName')} *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full min-h-11 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t('templates.templateName')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('templates.templateType')}</label>
            <div className="relative">
              <select
                value={type}
                onChange={e => setType(e.target.value as TemplateType)}
                className="w-full min-h-11 appearance-none ps-3 pe-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base sm:text-sm focus:ring-2 focus:ring-blue-500"
              >
                {TYPES.map(tp => (
                  <option key={tp} value={tp}>{t(`templates.types.${tp}`)}</option>
                ))}
              </select>
              <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Default toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded" />
          <span className="text-xs text-gray-700 dark:text-gray-300">{t('templates.isDefault')}</span>
        </label>

        {/* Variables */}
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">{t('templates.placeholders')}</p>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES.map(v => (
              <button
                key={v.key}
                onClick={() => insertVariable(v.key)}
                title={`${appIsRTL ? v.labelAr : v.labelFr} → ${v.example}`}
                className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-mono"
              >
                {`{{${v.key}}}`}
              </button>
            ))}
          </div>
        </div>

        {/* Tab: edit / preview */}
        <div>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden w-fit mb-3">
            {(['edit', 'preview'] as const).map(tb => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={cn(
                  'px-4 py-1.5 text-xs font-medium transition-colors',
                  tab === tb ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                )}
              >
                {tb === 'edit' ? t('templates.templateContent') : t('templates.livePreview')}
              </button>
            ))}
          </div>

          {tab === 'edit' ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={16}
              dir={contentDir}
              style={{
                direction: contentDir,
                textAlign: contentAlign,
                unicodeBidi: 'isolate',
                fontFamily: contentFont,
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
              placeholder={t('templates.templateContent')}
            />
          ) : (
            /* Preview — fully isolated from app direction */
            <div
              dir={contentDir}
              style={{
                direction: contentDir,
                textAlign: contentAlign,
                unicodeBidi: 'isolate',
                fontFamily: contentFont,
                writingMode: 'horizontal-tb',
              }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
            >
              <div className="text-center border-b-2 border-gray-800 dark:border-gray-200 pb-3 mb-4">
                <p className="font-bold text-gray-900 dark:text-white">{name || '—'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{SAMPLE.companyName}</p>
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed space-y-1">
                {preview.split('\n').map((line, i) => {
                  if (line.startsWith('━')) return <hr key={`hr-${i}`} className="border-gray-300 dark:border-gray-600 my-2" />
                  return <p key={`ln-${i}`} className="whitespace-pre-wrap min-h-[1.2em]">{line || ' '}</p>
                })}
              </div>
              <div className="mt-6 pt-3 border-t border-gray-200 dark:border-gray-600 text-center text-xs text-gray-400">
                CargoBridge &mdash; {t('templates.sampleData')}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function TemplatesManager() {
  const { t, language, templates, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate, setDefaultTemplate } = useAppStore()
  const isRTL = language === 'ar'

  const [typeFilter, setTypeFilter] = useState<TemplateType | 'all'>('all')
  const [editTarget, setEditTarget] = useState<DocumentTemplate | null | 'new'>(null)

  const TYPES: TemplateType[] = ['reception', 'delivery', 'general']

  const filtered = useMemo(
    () => typeFilter === 'all' ? templates : templates.filter(tp => tp.type === typeFilter),
    [templates, typeFilter]
  )

  const handleSave = (data: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editTarget && editTarget !== 'new') {
      updateTemplate(editTarget.id, data)
      if (data.isDefault) setDefaultTemplate(editTarget.id, data.type)
    } else {
      const created = addTemplate(data)
      if (data.isDefault) setDefaultTemplate(created.id, data.type)
    }
    toast.success(t('templates.saved'))
    setEditTarget(null)
  }

  const handleDuplicate = (id: string) => {
    duplicateTemplate(id)
    toast.success(t('templates.saved'))
  }

  const handleDelete = (id: string) => {
    if (!confirm(t('templates.confirmDelete'))) return
    deleteTemplate(id)
  }

  const typeColor: Record<TemplateType, string> = {
    reception: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    delivery:  'bg-blue-100  text-blue-700  dark:bg-blue-900/30  dark:text-blue-400',
    general:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }

  return (
    <div className="p-4 lg:p-6 h-full">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{t('templates.title')}</h1>
        </div>
        <button
          onClick={() => setEditTarget('new')}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          {t('templates.addTemplate')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 h-[calc(100%-4rem)]">
        {/* Left: template list */}
        <div className="lg:w-80 flex-shrink-0 flex flex-col gap-3">
          {/* Type filter chips — horizontal scroll on phone */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={cn(
                'shrink-0 min-h-11 px-3 rounded-xl text-sm font-medium transition-colors border',
                typeFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600'
              )}
            >
              {t('common.all')}
            </button>
            {TYPES.map(tp => (
              <button
                type="button"
                key={tp}
                onClick={() => setTypeFilter(tp)}
                className={cn(
                  'shrink-0 min-h-11 px-3 rounded-xl text-sm font-medium transition-colors border',
                  typeFilter === tp
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                )}
              >
                {t(`templates.types.${tp}`)}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex flex-col gap-2 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                {t('templates.noTemplates')}
              </div>
            ) : filtered.map(tp => (
              <div
                key={tp.id}
                className={cn(
                  'bg-white dark:bg-gray-800 rounded-xl border p-3 cursor-pointer transition-all',
                  editTarget && editTarget !== 'new' && editTarget.id === tp.id
                    ? 'border-blue-500 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
                onClick={() => setEditTarget(tp)}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{tp.name}</p>
                  {tp.isDefault && (
                    <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 fill-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', typeColor[tp.type])}>
                    {t(`templates.types.${tp.type}`)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{formatDate(tp.updatedAt, language as 'ar' | 'fr')}</p>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setEditTarget(tp)}
                    title={t('templates.editTemplate')}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(tp.id)}
                    title={t('templates.duplicateTemplate')}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setDefaultTemplate(tp.id, tp.type); toast.success(t('templates.saved')) }}
                    title={t('templates.setDefault')}
                    className={cn('p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                      tp.isDefault ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'
                    )}
                  >
                    <Star className={cn('w-3.5 h-3.5', tp.isDefault && 'fill-amber-500')} />
                  </button>
                  <button
                    onClick={() => handleDelete(tp.id)}
                    title={t('templates.deleteTemplate')}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-600 transition-colors ms-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: editor */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          {editTarget ? (
            <TemplateEditor
              key={editTarget === 'new' ? 'new' : editTarget.id}
              template={editTarget === 'new' ? undefined : editTarget}
              onSave={handleSave}
              onCancel={() => setEditTarget(null)}
              t={t}
              language={language}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
              <FileText className="w-12 h-12 opacity-30" />
              <p className="text-sm">{isRTL ? 'اختر نموذجاً للتعديل أو أضف نموذجاً جديداً' : 'Sélectionnez un modèle à modifier ou créez-en un nouveau'}</p>
              <button
                onClick={() => setEditTarget('new')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t('templates.addTemplate')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
