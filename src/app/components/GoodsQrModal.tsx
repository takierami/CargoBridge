import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Printer, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { trackPageUrl } from '../../services/trackingService'

export function GoodsQrModal({
  token,
  trackingNumber,
  description,
  onClose,
}: {
  token: string
  trackingNumber: string
  description: string
  onClose: () => void
}) {
  const { t, language } = useAppStore()
  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const url = trackPageUrl(token)

  const handleDownload = () => {
    const canvas = canvasWrapRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qr-${trackingNumber}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const handlePrint = () => {
    const canvas = canvasWrapRef.current?.querySelector('canvas')
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const w = window.open('', '_blank', 'width=480,height=640')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>${trackingNumber}</title>
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 24px; }
        img { width: 280px; height: 280px; }
        h1 { font-size: 18px; margin: 16px 0 4px; }
        p { color: #555; font-size: 13px; margin: 4px 0; }
        .url { font-size: 11px; word-break: break-all; color: #888; margin-top: 12px; }
      </style></head><body>
      <img src="${dataUrl}" alt="QR" />
      <h1>${trackingNumber}</h1>
      <p>${description.replace(/</g, '&lt;')}</p>
      <p class="url">${url}</p>
      <script>window.onload=()=>{window.print();}</script>
      </body></html>`)
    w.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">{t('goods.qrTitle')}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5 text-center">
          <p className="font-mono text-sm text-blue-600 dark:text-blue-400">{trackingNumber}</p>
          <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{description}</p>
          <div ref={canvasWrapRef} className="mx-auto inline-block rounded-xl bg-white p-3">
            <QRCodeCanvas value={url} size={220} level="M" includeMargin />
          </div>
          <p className="break-all text-xs text-gray-400" dir="ltr">{url}</p>
          <p className="text-xs text-gray-500">
            {language === 'ar' ? 'امسح الرمز لفتح صفحة التتبع' : 'Scannez pour ouvrir la page de suivi'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            type="button"
            onClick={handleDownload}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" /> {t('goods.qrDownload')}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <Printer className="h-4 w-4" /> {t('goods.qrPrint')}
          </button>
        </div>
      </div>
    </div>
  )
}
