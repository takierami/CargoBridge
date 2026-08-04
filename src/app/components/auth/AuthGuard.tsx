import { useEffect, useState } from 'react'
import { useNavigate, Navigate, Outlet, useSearchParams, useLocation } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '../../../store/authStore'
import { useAppStore } from '../../../store/appStore'
import { sanitizeNextPath } from '../../../lib/authRedirect'

export function AuthGuard() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, loadUser } = useAuthStore()
  const initializeData = useAppStore((s) => s.initializeData)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    loadUser()
      .then(() => {
        if (useAuthStore.getState().isAuthenticated) {
          return initializeData()
        }
      })
      .finally(() => setChecking(false))
  }, [loadUser, initializeData])

  useEffect(() => {
    if (!checking && !isAuthenticated) {
      const raw = `${location.pathname}${location.search}`
      const loginPath =
        location.pathname === '/dashboard' && !location.search
          ? '/login'
          : `/login?next=${encodeURIComponent(sanitizeNextPath(raw))}`
      navigate(loginPath, { replace: true })
    }
  }, [checking, isAuthenticated, navigate, location.pathname, location.search])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <Outlet />
}

export function GuestGuard() {
  const { isAuthenticated, loadUser } = useAuthStore()
  const [checking, setChecking] = useState(true)
  const [searchParams] = useSearchParams()
  const nextPath = sanitizeNextPath(searchParams.get('next'))

  useEffect(() => {
    loadUser().finally(() => setChecking(false))
  }, [loadUser])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={nextPath} replace />
  }

  return <Outlet />
}
