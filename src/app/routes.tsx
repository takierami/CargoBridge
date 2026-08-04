import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router'
import { AuthGuard, GuestGuard } from './components/auth/AuthGuard'
import { Root } from './components/layout/Root'
import { Login } from './components/pages/Login'
import { Register } from './components/pages/Register'
import { ForgotPassword, ResetPassword } from './components/pages/ResetPassword'
import { Dashboard } from './components/pages/Dashboard'
import { Goods } from './components/pages/Goods'
import { GoodsDetail } from './components/pages/GoodsDetail'
import { GoodsTrackPage } from './components/pages/GoodsTrackPage'
import { Suppliers } from './components/pages/Suppliers'
import { SupplierProfile } from './components/pages/SupplierProfile'
import { PurchaseOrders } from './components/pages/PurchaseOrders'
import { Payments } from './components/pages/Payments'
import { AccountStatement } from './components/pages/AccountStatement'
import { Agents } from './components/pages/Agents'
import { AgentProfile } from './components/pages/AgentProfile'
import { Scanner } from './components/pages/Scanner'
import { Settings } from './components/pages/Settings'
import { Tasks } from './components/pages/Tasks'
import { MarketingLayout } from '../marketing/MarketingLayout'
import Home from '../marketing/pages/Home'
import Features from '../marketing/pages/Features'
import Pricing from '../marketing/pages/Pricing'
import About from '../marketing/pages/About'
import FAQ from '../marketing/pages/FAQ'
import Contact from '../marketing/pages/Contact'
import ContactSuccess from '../marketing/pages/ContactSuccess'
import Privacy from '../marketing/pages/Privacy'
import Terms from '../marketing/pages/Terms'
import NotFound from '../marketing/pages/NotFound'

const Calculator = lazy(() =>
  import('./components/pages/Calculator').then(m => ({ default: m.Calculator })),
)
const TemplatesManager = lazy(() =>
  import('./components/pages/TemplatesManager').then(m => ({ default: m.TemplatesManager })),
)
const Analytics = lazy(() =>
  import('./components/pages/Analytics').then(m => ({ default: m.Analytics })),
)
const Performance = lazy(() =>
  import('./components/pages/Performance').then(m => ({ default: m.Performance })),
)
const HistoryPage = lazy(() =>
  import('./components/pages/History').then(m => ({ default: m.History })),
)

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-40 items-center justify-center text-sm text-gray-500">
          …
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

function LazyCalculator() {
  return (
    <LazyPage>
      <Calculator />
    </LazyPage>
  )
}
function LazyTemplatesManager() {
  return (
    <LazyPage>
      <TemplatesManager />
    </LazyPage>
  )
}
function LazyAnalytics() {
  return (
    <LazyPage>
      <Analytics />
    </LazyPage>
  )
}
function LazyPerformance() {
  return (
    <LazyPage>
      <Performance />
    </LazyPage>
  )
}
function LazyHistory() {
  return (
    <LazyPage>
      <HistoryPage />
    </LazyPage>
  )
}

export const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [
      { index: true, Component: Home },
      { path: 'features', Component: Features },
      { path: 'pricing', Component: Pricing },
      { path: 'about', Component: About },
      { path: 'faq', Component: FAQ },
      { path: 'contact', Component: Contact },
      { path: 'contact/success', Component: ContactSuccess },
      { path: 'privacy', Component: Privacy },
      { path: 'terms', Component: Terms },
    ],
  },
  {
    element: <GuestGuard />,
    children: [
      { path: '/login', Component: Login },
      { path: '/register', Component: Register },
      { path: '/forgot-password', Component: ForgotPassword },
      { path: '/reset-password', Component: ResetPassword },
    ],
  },
  {
    path: '/t/:token',
    Component: GoodsTrackPage,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        Component: Root,
        children: [
          { path: 'dashboard', Component: Dashboard },
          { path: 'goods', Component: Goods },
          { path: 'goods/:id', Component: GoodsDetail },
          { path: 'suppliers', Component: Suppliers },
          { path: 'suppliers/:id', Component: SupplierProfile },
          { path: 'suppliers/purchase-orders', Component: PurchaseOrders },
          { path: 'suppliers/purchase-orders/new', Component: PurchaseOrders },
          { path: 'suppliers/purchase-orders/:id', Component: PurchaseOrders },
          { path: 'suppliers/payments', Component: Payments },
          { path: 'suppliers/payments/new', Component: Payments },
          { path: 'suppliers/payments/:id', Component: Payments },
          { path: 'suppliers/:id/statement', Component: AccountStatement },
          { path: 'suppliers/tasks', Component: Tasks },
          { path: 'suppliers/tasks/new', Component: Tasks },
          { path: 'suppliers/tasks/:id', Component: Tasks },
          { path: 'suppliers/analytics', Component: LazyAnalytics },
          { path: 'suppliers/:id/performance', Component: LazyPerformance },
          { path: 'agents', Component: Agents },
          { path: 'agents/:id', Component: AgentProfile },
          { path: 'scanner', Component: Scanner },
          { path: 'calculator', Component: LazyCalculator },
          { path: 'history', Component: LazyHistory },
          { path: 'settings', Component: Settings },
          { path: 'settings/templates', Component: LazyTemplatesManager },
        ],
      },
    ],
  },
  {
    element: <MarketingLayout />,
    children: [
      { path: '*', Component: NotFound },
    ],
  },
])
