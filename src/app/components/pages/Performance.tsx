import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Star, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../utils/cn'
import { RATING_CRITERIA_LABELS_AR, RATING_CRITERIA_LABELS_FR } from '../../../types'

interface RatingFormData {
  quality: number
  communication: number
  deliverySpeed: number
  reliability: number
  pricing: number
  flexibility: number
  note: string
}

function StarRating({ value, onChange, readonly = false }: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          className={cn(
            'p-0.5 transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
          disabled={readonly}
        >
          <Star
            className={cn(
              'w-5 h-5 transition-colors',
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-300 dark:fill-gray-700 dark:text-gray-600'
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function Performance() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, language, suppliers, upsertSupplierRating, getSupplierRating } = useAppStore()

  const supplier = useMemo(() => suppliers.find(s => s.id === id), [suppliers, id])
  const existingRating = useMemo(() => id ? getSupplierRating(id) : undefined, [id, getSupplierRating])

  const labels = language === 'ar' ? RATING_CRITERIA_LABELS_AR : RATING_CRITERIA_LABELS_FR

  const [form, setForm] = useState<RatingFormData>({
    quality: existingRating?.quality || 0,
    communication: existingRating?.communication || 0,
    deliverySpeed: existingRating?.deliverySpeed || 0,
    reliability: existingRating?.reliability || 0,
    pricing: existingRating?.pricing || 0,
    flexibility: existingRating?.flexibility || 0,
    note: existingRating?.note || '',
  })

  const computedOverall = useMemo(() => {
    const scores = [form.quality, form.communication, form.deliverySpeed, form.reliability, form.pricing, form.flexibility].filter(s => s > 0)
    if (scores.length === 0) return 0
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
  }, [form])

  const handleSave = () => {
    if (!id) return
    const hasAnyScore = [form.quality, form.communication, form.deliverySpeed, form.reliability, form.pricing, form.flexibility].some(s => s > 0)
    if (!hasAnyScore) {
      toast.error(t('suppliers.ratingRequired'))
      return
    }
    upsertSupplierRating(id, {
      quality: form.quality,
      communication: form.communication,
      deliverySpeed: form.deliverySpeed,
      reliability: form.reliability,
      pricing: form.pricing,
      flexibility: form.flexibility,
      note: form.note,
    })
    toast.success(t('common.success'))
    navigate('/suppliers')
  }

  if (!supplier) {
    return (
      <div className="p-4 lg:p-6">
        <button onClick={() => navigate('/suppliers')} className="flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </button>
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">{t('common.noData')}</div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/suppliers')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('common.back')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{supplier.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{supplier.code}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('suppliers.ratingForm')}</h3>
            <div className="space-y-4">
              {(Object.keys(labels) as Array<keyof typeof labels>).map(criterion => (
                <div key={criterion} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{labels[criterion]}</p>
                  </div>
                  <StarRating
                    value={form[criterion]}
                    onChange={v => setForm(f => ({ ...f, [criterion]: v }))}
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('suppliers.overallScore')}</span>
                <div className="flex items-center gap-2">
                  <StarRating value={Math.round(computedOverall)} readonly />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {computedOverall > 0 ? computedOverall.toFixed(1) : '—'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.notes')}</label>
                <textarea
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={t('suppliers.ratingNotesPlaceholder')}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {t('common.save')}
            </button>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('suppliers.currentRating')}</h3>

            {existingRating ? (
              <div className="space-y-4">
                {(Object.keys(labels) as Array<keyof typeof labels>).map(criterion => (
                  <div key={criterion} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{labels[criterion]}</span>
                    <StarRating
                      value={existingRating[criterion]}
                      readonly
                    />
                  </div>
                ))}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('suppliers.overallScore')}</span>
                    <div className="flex items-center gap-2">
                      <StarRating value={existingRating.overall} readonly />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {existingRating.overall.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {existingRating.note && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">{t('common.notes')}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{existingRating.note}</p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <span>{t('suppliers.ratedAt')}:</span>
                    <span>{new Date(existingRating.ratedAt).toLocaleDateString(language === 'ar' ? 'ar-DZ' : 'fr-FR')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">{t('suppliers.notRatedYet')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}