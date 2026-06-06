import { useState, useRef, useEffect, useCallback } from 'react'
// Import the ESM build of qr-scanner so Vite/Rollup can resolve the module
import QrScanner from 'qr-scanner/qr-scanner.min.js'
import {
  ScanLine, Search, Camera, CameraOff, Package, User,
  AlertTriangle, CheckCircle2, RefreshCw, ChevronDown,
  Shield, Wifi, WifiOff, Bug, X, Info,
} from 'lucide-react'
import { useAppStore } from '../../../store/appStore'
import { StatusBadge } from '../ui/StatusBadge'
import { formatDate } from '../../../utils/dateUtils'
import { cn } from '../../utils/cn'
import type { Goods } from '../../../types'

// ─── Types ───────────────────────────────────────────────────────────────────

type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'prompt'
type CameraError =
  | 'no_camera'
  | 'permission_denied'
  | 'camera_in_use'
  | 'browser_incompatible'
  | 'https_required'
  | 'stream_interrupted'
  | 'unknown'

interface DiagnosticsInfo {
  permissionStatus: PermissionStatus
  cameraCount: number
  activeCamera: string
  streamActive: boolean
  scannerRunning: boolean
}

interface DebugInfo {
  streamStatus: string
  resolution: string
  fps: number
  lastScanned: string
  lastError: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CAMERA_ERROR_AR: Record<CameraError, string> = {
  no_camera: 'لا توجد كاميرا متاحة على هذا الجهاز',
  permission_denied: 'تم رفض إذن الكاميرا. يُرجى السماح بالوصول في إعدادات المتصفح',
  camera_in_use: 'الكاميرا قيد الاستخدام من تطبيق آخر',
  browser_incompatible: 'المتصفح لا يدعم الوصول إلى الكاميرا',
  https_required: 'يجب استخدام HTTPS للوصول إلى الكاميرا',
  stream_interrupted: 'انقطع البث. يُرجى إعادة تشغيل الكاميرا',
  unknown: 'خطأ غير معروف في الكاميرا',
}

const CAMERA_ERROR_FR: Record<CameraError, string> = {
  no_camera: "Aucune caméra disponible sur cet appareil",
  permission_denied: "Accès caméra refusé. Autorisez l'accès dans les paramètres du navigateur",
  camera_in_use: "La caméra est utilisée par une autre application",
  browser_incompatible: "Ce navigateur ne supporte pas l'accès à la caméra",
  https_required: "HTTPS est requis pour accéder à la caméra",
  stream_interrupted: "Le flux a été interrompu. Redémarrez la caméra",
  unknown: "Erreur caméra inconnue",
}

function classifyError(err: unknown): CameraError {
  // qr-scanner throws plain strings like "Camera not found." — handle both
  const name = (err as { name?: string })?.name ?? ''
  const raw = typeof err === 'string' ? err : ((err as { message?: string })?.message ?? String(err))
  const msg = raw.toLowerCase()

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) return 'permission_denied'
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError' || msg.includes('not found') || msg.includes('no camera') || msg.includes('could not start')) return 'no_camera'
  if (name === 'NotReadableError' || name === 'TrackStartError' || msg.includes('already in use') || msg.includes('not readable')) return 'camera_in_use'
  if (msg.includes('https') || msg.includes('secure origin')) return 'https_required'
  if (typeof navigator.mediaDevices === 'undefined') return 'browser_incompatible'
  return 'unknown'
}

const PERM_COLOR: Record<PermissionStatus, string> = {
  granted: 'text-green-600 dark:text-green-400',
  denied: 'text-red-600 dark:text-red-400',
  prompt: 'text-yellow-600 dark:text-yellow-400',
  unknown: 'text-gray-500',
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Scanner() {
  const { t, language, goods, agents } = useAppStore()
  const isFr = language === 'fr'

  // Manual search
  const [manualInput, setManualInput] = useState('')
  const [result, setResult] = useState<Goods | null>(null)
  const [notFound, setNotFound] = useState(false)

  // Camera state
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState<CameraError | null>(null)
  const [cameraErrorRaw, setCameraErrorRaw] = useState<string>('')
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown')

  // Scanner state
  const [scannerReady, setScannerReady] = useState(false)
  const [lastScanned, setLastScanned] = useState('')
  const [scanFlash, setScanFlash] = useState(false)

  // Debug / diagnostics
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    streamStatus: 'inactive',
    resolution: '—',
    fps: 0,
    lastScanned: '—',
    lastError: '—',
  })

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const lastScannedRef = useRef('')
  const lastScannedTimeRef = useRef(0)
  const fpsCountRef = useRef(0)
  const fpsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Guard refs to avoid stale closure issues with async startCamera
  const cameraActiveRef = useRef(false)
  const cameraLoadingRef = useRef(false)
  const selectedCameraIdRef = useRef('')

  // ── Goods lookup ──────────────────────────────────────────────────────────

  const lookupGoods = useCallback((trackingNumber: string) => {
    const trimmed = trackingNumber.trim().toUpperCase()
    // Try exact match first, then case-insensitive
    const found = goods.find(g => g.trackingNumber.toUpperCase() === trimmed)
    if (found) {
      setResult(found)
      setNotFound(false)
      setManualInput(found.trackingNumber)
    } else {
      setResult(null)
      setNotFound(true)
    }
  }, [goods])

  const handleManualSearch = () => {
    if (!manualInput.trim()) return
    lookupGoods(manualInput)
  }

  // ── Camera device enumeration ─────────────────────────────────────────────

  const loadCameras = useCallback(async () => {
    try {
      const list = await QrScanner.listCameras(true)
      setCameras(list)
      if (list.length > 0 && !selectedCameraId) {
        // Prefer rear camera on mobile
        const rear = list.find(c =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('environment') ||
          c.label.includes('0')
        )
        setSelectedCameraId(rear?.id ?? list[0].id)
      }
    } catch {
      setCameras([])
    }
  }, [selectedCameraId])

  // ── Permission check ──────────────────────────────────────────────────────

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) return
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      setPermissionStatus(result.state as PermissionStatus)
      result.addEventListener('change', () => {
        setPermissionStatus(result.state as PermissionStatus)
      })
    } catch {
      setPermissionStatus('unknown')
    }
  }, [])

  // ── Scanner callbacks ─────────────────────────────────────────────────────

  const handleScanSuccess = useCallback((result: QrScanner.ScanResult) => {
    const now = Date.now()
    const value = result.data.trim()
    if (!value) return

    // Debounce: ignore same QR within 3 seconds
    if (value === lastScannedRef.current && now - lastScannedTimeRef.current < 3000) return
    lastScannedRef.current = value
    lastScannedTimeRef.current = now

    setLastScanned(value)
    setDebugInfo(d => ({ ...d, lastScanned: value }))

    // Flash animation
    setScanFlash(true)
    setTimeout(() => setScanFlash(false), 500)

    // Look up goods
    lookupGoods(value)

    fpsCountRef.current += 1
  }, [lookupGoods])

  const handleScanError = useCallback((err: unknown) => {
    // "No QR code found" is expected — suppress
    const msg = String(err)
    if (msg.includes('No QR code') || msg.includes('No barcode')) return
    setDebugInfo(d => ({ ...d, lastError: msg.substring(0, 80) }))
  }, [])

  // ── Start camera ──────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    if (!videoRef.current) return
    // Use refs to guard — avoids stale closure issue with async state
    if (cameraLoadingRef.current || cameraActiveRef.current) return

    cameraLoadingRef.current = true
    setCameraLoading(true)
    setCameraError(null)
    setCameraErrorRaw('')

    // Browser compat check
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('browser_incompatible')
      setCameraLoading(false)
      cameraLoadingRef.current = false
      return
    }

    try {
      // Do NOT call loadCameras() or getUserMedia() here — let scanner.start() be
      // the single call that triggers the browser permission dialog. Calling getUserMedia
      // twice (once to enumerate labels, once to actually stream) causes some browsers
      // to silently block the second call or show two overlapping permission dialogs.

      const cameraId = selectedCameraIdRef.current
      // 'environment' = rear camera on mobile, front on desktop fallback
      const preferredCamera: string = cameraId || 'environment'

      const scanner = new QrScanner(
        videoRef.current,
        handleScanSuccess,
        {
          onDecodeError: handleScanError,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera,
          maxScansPerSecond: 5,
          calculateScanRegion: (video) => {
            const size = Math.min(video.videoWidth, video.videoHeight) * 0.7
            return {
              x: (video.videoWidth - size) / 2,
              y: (video.videoHeight - size) / 2,
              width: size,
              height: size,
            }
          },
        }
      )

      scannerRef.current = scanner

      // This single call triggers the OS/browser permission dialog
      await scanner.start()

      // Permission was granted — now safely enumerate cameras (labels are now unlocked)
      const updatedList = await QrScanner.listCameras(false)
      setCameras(updatedList)
      if (updatedList.length > 0 && !selectedCameraIdRef.current) {
        const rear = updatedList.find(c => /back|rear|environment/i.test(c.label))
        const chosen = rear?.id ?? updatedList[0].id
        selectedCameraIdRef.current = chosen
        setSelectedCameraId(chosen)
      }

      setPermissionStatus('granted')
      cameraActiveRef.current = true
      setCameraActive(true)
      setScannerReady(true)

      // FPS + resolution polling
      fpsTimerRef.current = setInterval(() => {
        const count = fpsCountRef.current
        fpsCountRef.current = 0
        const video = videoRef.current
        const w = video?.videoWidth ?? 0
        const h = video?.videoHeight ?? 0
        setDebugInfo(d => ({
          ...d,
          streamStatus: 'active',
          resolution: w && h ? `${w}×${h}` : '—',
          fps: count,
        }))
      }, 1000)
    } catch (err) {
      const errType = classifyError(err)
      const rawMsg = typeof err === 'string' ? err : ((err as { message?: string })?.message ?? String(err))
      scannerRef.current?.destroy()
      scannerRef.current = null

      // If qr-scanner itself fails for an internal reason (worker load, etc.), try a
      // raw getUserMedia fallback so at least the camera feed shows up
      if (errType === 'unknown' && navigator.mediaDevices?.getUserMedia && videoRef.current) {
        try {
          const constraints: MediaStreamConstraints = {
            video: selectedCameraIdRef.current
              ? { deviceId: { exact: selectedCameraIdRef.current } }
              : { facingMode: 'environment' },
          }
          const stream = await navigator.mediaDevices.getUserMedia(constraints)
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setPermissionStatus('granted')
          cameraActiveRef.current = true
          setCameraActive(true)
          // No QR scanning in fallback mode — just camera preview
          setScannerReady(false)
          setDebugInfo(d => ({ ...d, streamStatus: 'active (fallback — no QR)', lastError: rawMsg }))
          fpsTimerRef.current = setInterval(() => {
            const video = videoRef.current
            const w = video?.videoWidth ?? 0
            const h = video?.videoHeight ?? 0
            setDebugInfo(d => ({ ...d, resolution: w && h ? `${w}×${h}` : '—' }))
          }, 1000)
          return
        } catch (fallbackErr) {
          const fbMsg = typeof fallbackErr === 'string' ? fallbackErr : ((fallbackErr as { message?: string })?.message ?? String(fallbackErr))
          setCameraError(classifyError(fallbackErr))
          setCameraErrorRaw(fbMsg)
          setDebugInfo(d => ({ ...d, lastError: fbMsg, streamStatus: 'error' }))
          cameraActiveRef.current = false
          return
        }
      }

      setCameraError(errType)
      setCameraErrorRaw(rawMsg)
      if (errType === 'permission_denied') setPermissionStatus('denied')
      setDebugInfo(d => ({ ...d, lastError: rawMsg, streamStatus: 'error' }))
      cameraActiveRef.current = false
    } finally {
      cameraLoadingRef.current = false
      setCameraLoading(false)
    }
  }, [handleScanSuccess, handleScanError])

  // ── Stop camera ───────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    if (fpsTimerRef.current) {
      clearInterval(fpsTimerRef.current)
      fpsTimerRef.current = null
    }
    // Stop QrScanner if running
    scannerRef.current?.stop()
    scannerRef.current?.destroy()
    scannerRef.current = null
    // Stop raw fallback stream if any
    if (videoRef.current?.srcObject instanceof MediaStream) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    cameraActiveRef.current = false
    cameraLoadingRef.current = false
    setCameraActive(false)
    setScannerReady(false)
    setCameraLoading(false)
    setDebugInfo(d => ({ ...d, streamStatus: 'inactive', fps: 0, resolution: '—' }))
  }, [])

  // ── Camera switch ─────────────────────────────────────────────────────────

  const switchCamera = useCallback(async (deviceId: string) => {
    selectedCameraIdRef.current = deviceId
    setSelectedCameraId(deviceId)
    if (scannerRef.current && cameraActiveRef.current) {
      try {
        await scannerRef.current.setCamera(deviceId)
      } catch {
        stopCamera()
        setTimeout(() => startCamera(), 300)
      }
    }
  }, [stopCamera, startCamera])

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // Check permission status only — do NOT call getUserMedia on mount.
    // Camera enumeration happens after scanner.start() grants permission.
    checkPermission()
    // Passive device count (no getUserMedia, so labels will be empty — that's fine)
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const videoInputs = devices.filter(d => d.kind === 'videoinput')
      setCameras(videoInputs.map((d, i) => ({
        id: d.deviceId,
        label: d.label || (i === 0 ? 'Default Camera' : `Camera ${i + 1}`),
      })))
    }).catch(() => {})
    return () => {
      stopCamera()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Diagnostics data ──────────────────────────────────────────────────────

  const diagnostics: DiagnosticsInfo = {
    permissionStatus,
    cameraCount: cameras.length,
    activeCamera: cameras.find(c => c.id === selectedCameraId)?.label ?? (cameras[0]?.label ?? '—'),
    streamActive: cameraActive,
    scannerRunning: scannerReady,
  }

  // ── Result helpers ────────────────────────────────────────────────────────

  const agent = result ? agents.find(a => a.id === result.agentId) : null
  const agentName = isFr ? (agent?.nameFr || agent?.name) : agent?.name
  const goodsDesc = result ? (isFr ? (result.descriptionFr || result.description) : result.description) : ''
  const goodsNotes = result ? (isFr ? (result.notesFr || result.notes) : result.notes) : ''

  // ── Error message ─────────────────────────────────────────────────────────

  const errorMsg = cameraError
    ? (isFr ? CAMERA_ERROR_FR[cameraError] : CAMERA_ERROR_AR[cameraError])
    : null

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('scanner.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isFr
              ? 'Scannez un QR code ou saisissez le numéro de suivi manuellement'
              : 'مسح QR أو إدخال رقم التتبع يدوياً'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDiagnostics(d => !d)}
            title={isFr ? 'Diagnostics' : 'التشخيص'}
            className={cn(
              'p-2 rounded-lg border transition-colors text-xs flex items-center gap-1.5',
              showDiagnostics
                ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50'
            )}
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDebug(d => !d)}
            title="Debug"
            className={cn(
              'p-2 rounded-lg border transition-colors',
              showDebug
                ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 text-purple-700 dark:text-purple-400'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50'
            )}
          >
            <Bug className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Diagnostics panel ── */}
      {showDiagnostics && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 text-sm flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              {isFr ? 'Diagnostics caméra' : 'تشخيص الكاميرا'}
            </h3>
            <button onClick={() => setShowDiagnostics(false)} className="text-blue-400 hover:text-blue-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <DiagRow
              label={isFr ? 'Permission' : 'الإذن'}
              value={diagnostics.permissionStatus}
              color={PERM_COLOR[diagnostics.permissionStatus]}
            />
            <DiagRow
              label={isFr ? 'Caméras détectées' : 'الكاميرات'}
              value={String(diagnostics.cameraCount)}
            />
            <DiagRow
              label={isFr ? 'Caméra active' : 'الكاميرا النشطة'}
              value={diagnostics.activeCamera}
            />
            <DiagRow
              label={isFr ? 'Flux actif' : 'البث نشط'}
              value={diagnostics.streamActive ? (isFr ? 'Oui' : 'نعم') : (isFr ? 'Non' : 'لا')}
              color={diagnostics.streamActive ? 'text-green-600 dark:text-green-400' : 'text-red-500'}
            />
            <DiagRow
              label={isFr ? 'Scanner actif' : 'الماسح نشط'}
              value={diagnostics.scannerRunning ? (isFr ? 'Oui' : 'نعم') : (isFr ? 'Non' : 'لا')}
              color={diagnostics.scannerRunning ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}
            />
            <DiagRow
              label={isFr ? 'Compatibilité' : 'التوافق'}
              value={!!navigator.mediaDevices?.getUserMedia ? (isFr ? 'OK' : 'متوافق') : (isFr ? 'Non supporté' : 'غير متوافق')}
              color={!!navigator.mediaDevices?.getUserMedia ? 'text-green-600 dark:text-green-400' : 'text-red-500'}
            />
          </div>
        </div>
      )}

      {/* ── Debug panel ── */}
      {showDebug && (
        <div className="bg-gray-900 border border-purple-700 rounded-xl p-4 font-mono text-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-purple-400 font-semibold">[ DEBUG ]</span>
            <button onClick={() => setShowDebug(false)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1.5 text-gray-300">
            <DebugRow label="stream_status" value={debugInfo.streamStatus} />
            <DebugRow label="resolution" value={debugInfo.resolution} />
            <DebugRow label="fps" value={String(debugInfo.fps)} />
            <DebugRow label="last_scanned" value={debugInfo.lastScanned || '—'} />
            <DebugRow label="last_error" value={debugInfo.lastError || '—'} color="text-red-400" />
            <DebugRow label="cameras_count" value={String(cameras.length)} />
            <DebugRow label="selected_camera" value={selectedCameraId || 'auto'} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Left: Scanner + Manual ── */}
        <div className="space-y-4">
          {/* Camera panel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Video viewport */}
            <div className="relative bg-gray-950" style={{ aspectRatio: '4/3' }}>
              {/* Video ALWAYS in DOM and never display:none — qr-scanner manipulates video display
                  and will break if it finds display:none on start. We layer overlays on top instead. */}
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Scan flash overlay */}
              {scanFlash && (
                <div className="absolute inset-0 bg-green-400/30 z-20 pointer-events-none" />
              )}

              {/* Idle overlay — covers the black video when camera is off */}
              {!cameraActive && !cameraLoading && !cameraError && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-gray-500 gap-3 bg-gray-950">
                  <div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center">
                    <Camera className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-sm text-gray-400">
                    {isFr ? 'Caméra désactivée' : 'الكاميرا غير مفعّلة'}
                  </p>
                </div>
              )}

              {/* Loading state */}
              {cameraLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white gap-3 bg-gray-900/95">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                  <p className="text-sm text-gray-300">
                    {isFr ? 'Initialisation de la caméra…' : 'جارٍ تشغيل الكاميرا…'}
                  </p>
                </div>
              )}

              {/* Error state */}
              {cameraError && !cameraLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-gray-900 p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-red-900/40 flex items-center justify-center">
                    {cameraError === 'permission_denied'
                      ? <Shield className="w-8 h-8 text-red-400" />
                      : cameraError === 'no_camera'
                      ? <CameraOff className="w-8 h-8 text-red-400" />
                      : cameraError === 'browser_incompatible'
                      ? <WifiOff className="w-8 h-8 text-red-400" />
                      : <AlertTriangle className="w-8 h-8 text-red-400" />}
                  </div>
                  <p className="text-sm text-red-300 leading-relaxed">{errorMsg}</p>
                  {cameraErrorRaw && (
                    <p className="text-[10px] text-red-500/70 font-mono mt-1 max-w-xs break-all">{cameraErrorRaw}</p>
                  )}
                  {cameraError !== 'browser_incompatible' && (
                    <button
                      onClick={() => { setCameraError(null); setCameraErrorRaw(''); setShowPermissionDialog(true) }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      {isFr ? 'Réessayer' : 'إعادة المحاولة'}
                    </button>
                  )}
                </div>
              )}

              {/* Live indicator */}
              {cameraActive && (
                <div className="absolute top-3 start-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white text-xs font-medium">LIVE</span>
                </div>
              )}

              {/* Last scanned badge */}
              {cameraActive && lastScanned && (
                <div className="absolute top-3 end-3 bg-green-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <p className="text-white text-xs font-mono truncate max-w-[140px]">{lastScanned}</p>
                </div>
              )}
            </div>

            {/* Camera controls */}
            <div className="p-4 space-y-3">
              {/* Start/Stop button */}
              <div className="flex gap-2">
                <button
                  onClick={cameraActive ? stopCamera : () => setShowPermissionDialog(true)}
                  disabled={cameraLoading}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    cameraLoading
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-wait'
                      : cameraActive
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  )}
                >
                  {cameraLoading
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : cameraActive
                    ? <CameraOff className="w-4 h-4" />
                    : <Camera className="w-4 h-4" />}
                  {cameraLoading
                    ? (isFr ? 'Démarrage…' : 'جارٍ التشغيل…')
                    : cameraActive
                    ? t('scanner.stopCamera')
                    : t('scanner.startCamera')}
                </button>
              </div>

              {/* Camera selector */}
              {cameras.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedCameraId}
                    onChange={e => switchCamera(e.target.value)}
                    className="w-full appearance-none ps-3 pe-8 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {cameras.map(cam => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || `Camera ${cam.id.substring(0, 8)}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              )}

              {/* Status chips */}
              <div className="flex flex-wrap gap-2">
                <StatusChip
                  active={cameraActive}
                  labelOn={isFr ? 'Flux actif' : 'البث نشط'}
                  labelOff={isFr ? 'Flux inactif' : 'البث متوقف'}
                  icon={cameraActive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                />
                <StatusChip
                  active={scannerReady}
                  labelOn={isFr ? 'Scanner prêt' : 'الماسح جاهز'}
                  labelOff={isFr ? 'Scanner arrêté' : 'الماسح متوقف'}
                  icon={<ScanLine className="w-3 h-3" />}
                />
              </div>

              {/* Permission hint when denied */}
              {permissionStatus === 'denied' && (
                <p className="text-xs text-red-500 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                  {isFr
                    ? 'Autorisez la caméra dans les paramètres du navigateur (icône 🔒 dans la barre d\'adresse)'
                    : 'اسمح بالكاميرا في إعدادات المتصفح (أيقونة 🔒 في شريط العنوان)'}
                </p>
              )}
            </div>
          </div>

          {/* Manual Entry */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-blue-500" />
              {t('scanner.manualEntry')}
            </h3>
            <div className="flex gap-2">
              <input
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
                placeholder={t('scanner.enterTracking')}
                dir="ltr"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
              <button
                onClick={handleManualSearch}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                {t('scanner.scan')}
              </button>
            </div>

            {/* Quick examples */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">{isFr ? 'Exemples :' : 'أمثلة:'}</p>
              <div className="flex flex-wrap gap-1.5">
                {goods.slice(0, 5).map(g => (
                  <button
                    key={g.id}
                    onClick={() => { setManualInput(g.trackingNumber); lookupGoods(g.trackingNumber) }}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-xs font-mono text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                  >
                    {g.trackingNumber}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div>
          {/* Not found */}
          {notFound && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="font-semibold text-red-700 dark:text-red-400">{t('scanner.noResult')}</p>
              <p className="text-sm text-red-500 mt-1">{t('scanner.tryDifferent')}</p>
              {manualInput && (
                <p className="mt-2 font-mono text-xs text-red-400 bg-red-100 dark:bg-red-900/30 rounded px-3 py-1 inline-block">
                  «{manualInput}»
                </p>
              )}
            </div>
          )}

          {/* Result card */}
          {result && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              {/* Header */}
              <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                    {result.status === 'delivered'
                      ? <CheckCircle2 className="w-5 h-5 text-white" />
                      : result.status === 'delayed'
                      ? <AlertTriangle className="w-5 h-5 text-white" />
                      : <Package className="w-5 h-5 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold tracking-wider">
                      {result.trackingNumber}
                    </p>
                    <h3 className="font-semibold text-gray-900 dark:text-white mt-0.5 leading-tight">
                      {goodsDesc}
                    </h3>
                    <div className="mt-1.5">
                      <StatusBadge status={result.status} type="goods" label={t(`goods.statuses.${result.status}`)} size="sm" />
                    </div>
                  </div>
                  {/* Dismiss */}
                  <button
                    onClick={() => { setResult(null); setNotFound(false); setManualInput('') }}
                    className="ms-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Details grid */}
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard
                    label={t('goods.category')}
                    value={t(`goods.categories.${result.category}`)}
                  />
                  <InfoCard
                    label={t('goods.quantity')}
                    value={`${result.quantity} ${t('goods.pieces')}`}
                  />
                  {result.weight && (
                    <InfoCard
                      label={t('goods.weight')}
                      value={`${result.weight} ${isFr ? 'kg' : 'كجم'}`}
                    />
                  )}
                  {result.value && (
                    <InfoCard
                      label={t('goods.value')}
                      value={`${result.value.toLocaleString(isFr ? 'fr-FR' : 'ar-DZ')} ${isFr ? 'DZD' : 'دج'}`}
                      accent
                    />
                  )}
                  {result.transportType && (
                    <InfoCard
                      label={t('goods.transportType')}
                      value={t(`goods.transportTypes.${result.transportType}`)}
                    />
                  )}
                  <InfoCard
                    label={t('goods.departureDate')}
                    value={formatDate(result.departureDate, language)}
                  />
                  <InfoCard
                    label={t('goods.expectedArrival')}
                    value={formatDate(result.expectedArrivalDate, language)}
                    accent
                  />
                  {result.arrivalDate && (
                    <InfoCard
                      label={isFr ? "Date d'arrivée" : 'تاريخ الوصول'}
                      value={formatDate(result.arrivalDate, language)}
                      className="col-span-2"
                      greenAccent
                    />
                  )}
                </div>

                {/* Agent card */}
                {agent && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                      {agent.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500">{t('goods.agent')}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{agentName}</p>
                      {agent.nameFr && isFr && agent.name !== agent.nameFr && (
                        <p className="text-xs text-gray-400">{agent.name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <User className="w-3 h-3 text-gray-400" />
                        <p className="text-xs font-mono text-gray-500">{agent.phone}</p>
                      </div>
                    </div>
                    <StatusBadge status={agent.status} type="agent" label={t(`agents.statuses.${agent.status}`)} size="sm" />
                  </div>
                )}

                {/* Notes */}
                {goodsNotes && (
                  <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700">
                    <p className="text-xs text-gray-500 mb-1">{t('goods.notes')}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{goodsNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && !notFound && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
              <ScanLine className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="font-medium text-gray-500 dark:text-gray-400">{t('scanner.goodsInfo')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('scanner.scanningTip')}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Camera Permission Dialog ── */}
      {showPermissionDialog && (
        <CameraPermissionDialog
          isFr={isFr}
          permissionStatus={permissionStatus}
          onAllow={() => {
            setShowPermissionDialog(false)
            startCamera()
          }}
          onDeny={() => setShowPermissionDialog(false)}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CameraPermissionDialog({ isFr, permissionStatus, onAllow, onDeny }: {
  isFr: boolean
  permissionStatus: PermissionStatus
  onAllow: () => void
  onDeny: () => void
}) {
  const wasDenied = permissionStatus === 'denied'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        dir={isFr ? 'ltr' : 'rtl'}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Top illustration */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 px-8 pt-10 pb-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 ring-4 ring-white/30">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-white font-bold text-lg leading-snug">
            {isFr ? 'Accès à la caméra' : 'الوصول إلى الكاميرا'}
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            {isFr ? 'CargoBridge a besoin de la caméra' : 'كارغو بريدج تحتاج إلى الكاميرا'}
          </p>
        </div>

        <div className="px-6 py-6 space-y-5">
          {/* Why we need it */}
          <div className="space-y-3">
            {[
              {
                icon: '📦',
                ar: 'مسح رموز QR على الشحنات',
                fr: 'Scanner les QR codes sur les colis',
              },
              {
                icon: '🔍',
                ar: 'البحث الفوري عن معلومات البضاعة',
                fr: 'Retrouver instantanément les infos marchandise',
              },
              {
                icon: '🔒',
                ar: 'لا يتم تخزين أي صور',
                fr: 'Aucune photo n\'est enregistrée',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xl leading-none mt-0.5">{item.icon}</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {isFr ? item.fr : item.ar}
                </p>
              </div>
            ))}
          </div>

          {/* Previously denied — extra help */}
          {wasDenied && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 space-y-2">
              <p className="text-amber-800 dark:text-amber-300 font-semibold text-sm flex items-center gap-2">
                <span>⚠️</span>
                {isFr ? 'Permission précédemment refusée' : 'تم رفض الإذن مسبقاً'}
              </p>
              <p className="text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
                {isFr
                  ? 'Pour autoriser la caméra : cliquez sur l\'icône 🔒 dans la barre d\'adresse de votre navigateur → Autorisations du site → Caméra → Autoriser.'
                  : 'لتفعيل الكاميرا: انقر على أيقونة 🔒 في شريط العنوان بالمتصفح ← أذونات الموقع ← الكاميرا ← السماح.'}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={onAllow}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2.5 shadow-md shadow-blue-200 dark:shadow-blue-900/40"
            >
              <Camera className="w-4 h-4" />
              {isFr ? 'Autoriser l\'accès à la caméra' : 'السماح بالوصول إلى الكاميرا'}
            </button>
            <button
              onClick={onDeny}
              className="w-full py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium text-sm transition-colors"
            >
              {isFr ? 'Annuler' : 'إلغاء'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            {isFr
              ? 'Le navigateur affichera sa propre boîte de dialogue de permission.'
              : 'سيظهر المتصفح نافذته الخاصة لطلب الإذن.'}
          </p>
        </div>
      </div>
    </div>
  )
}

function DiagRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg px-3 py-2">
      <p className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
      <p className={cn('font-semibold text-xs truncate', color ?? 'text-gray-900 dark:text-gray-100')}>{value}</p>
    </div>
  )
}

function DebugRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 w-36 flex-shrink-0">{label}:</span>
      <span className={cn('truncate', color ?? 'text-green-400')}>{value}</span>
    </div>
  )
}

function StatusChip({ active, labelOn, labelOff, icon }: {
  active: boolean; labelOn: string; labelOff: string; icon?: React.ReactNode
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
      active
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
    )}>
      {icon}
      {active ? labelOn : labelOff}
    </span>
  )
}

function InfoCard({ label, value, accent, greenAccent, className }: {
  label: string; value: string; accent?: boolean; greenAccent?: boolean; className?: string
}) {
  return (
    <div className={cn(
      'rounded-xl p-3',
      greenAccent
        ? 'bg-green-50 dark:bg-green-900/20'
        : accent
        ? 'bg-amber-50 dark:bg-amber-900/20'
        : 'bg-gray-50 dark:bg-gray-700',
      className
    )}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={cn(
        'text-sm font-medium',
        greenAccent
          ? 'text-green-700 dark:text-green-400'
          : accent
          ? 'text-amber-700 dark:text-amber-400'
          : 'text-gray-900 dark:text-white'
      )}>{value || '—'}</p>
    </div>
  )
}
