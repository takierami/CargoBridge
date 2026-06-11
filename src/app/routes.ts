import { createBrowserRouter } from 'react-router'
import { Root } from './components/layout/Root'
import { Dashboard } from './components/pages/Dashboard'
import { Goods } from './components/pages/Goods'
import { GoodsDetail } from './components/pages/GoodsDetail'
import { Suppliers } from './components/pages/Suppliers'
import { SupplierProfile } from './components/pages/SupplierProfile'
import { PurchaseOrders } from './components/pages/PurchaseOrders'
import { Payments } from './components/pages/Payments'
import { AccountStatement } from './components/pages/AccountStatement'
import { Agents } from './components/pages/Agents'
import { AgentProfile } from './components/pages/AgentProfile'
import { Scanner } from './components/pages/Scanner'
import { Calculator } from './components/pages/Calculator'
import { Settings } from './components/pages/Settings'
import { TemplatesManager } from './components/pages/TemplatesManager'
import { Tasks } from './components/pages/Tasks'
import { TaskForm } from './components/pages/TaskForm'
import { Performance } from './components/pages/Performance'
import { Analytics } from './components/pages/Analytics'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
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
      { path: 'suppliers/tasks/new', Component: TaskForm },
      { path: 'suppliers/tasks/:id', Component: TaskForm },
      { path: 'suppliers/analytics', Component: Analytics },
      { path: 'suppliers/:id/performance', Component: Performance },
      { path: 'agents', Component: Agents },
      { path: 'agents/:id', Component: AgentProfile },
      { path: 'scanner', Component: Scanner },
      { path: 'calculator', Component: Calculator },
      { path: 'settings', Component: Settings },
      { path: 'settings/templates', Component: TemplatesManager },
    ],
  },
])
