import { createBrowserRouter } from 'react-router'
import { Root } from './components/layout/Root'
import { Dashboard } from './components/pages/Dashboard'
import { Goods } from './components/pages/Goods'
import { GoodsDetail } from './components/pages/GoodsDetail'
import { Agents } from './components/pages/Agents'
import { AgentProfile } from './components/pages/AgentProfile'
import { Scanner } from './components/pages/Scanner'
import { Calculator } from './components/pages/Calculator'
import { Settings } from './components/pages/Settings'
import { TemplatesManager } from './components/pages/TemplatesManager'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: 'goods', Component: Goods },
      { path: 'goods/:id', Component: GoodsDetail },
      { path: 'agents', Component: Agents },
      { path: 'agents/:id', Component: AgentProfile },
      { path: 'scanner', Component: Scanner },
      { path: 'calculator', Component: Calculator },
      { path: 'settings', Component: Settings },
      { path: 'settings/templates', Component: TemplatesManager },
    ],
  },
])
