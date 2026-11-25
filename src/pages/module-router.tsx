import { useEffect, type ReactNode } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import type { BusinessType } from '@/db'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useSessionStore } from '@/stores'
import { ExpensesPage } from './expenses-page'
import { KhataPage } from './khata-page'
import { LiveCloudPage } from './live-cloud-page'
import { OrdersPage } from './orders-page'
import { PosPage } from './pos-page'
import { ProductsPage } from './products-page'
import { ReportsPage } from './reports-page'
import { SettingsPage } from './settings-page'

interface ModuleRouterProps {
  businessType: BusinessType
  shopName: string
}

function wrap(label: string, node: ReactNode) {
  return <ErrorBoundary label={label}>{node}</ErrorBoundary>
}

export function ModuleRouter({ businessType, shopName }: ModuleRouterProps) {
  const activeModule = useSessionStore((s) => s.activeModule)
  const setActiveModule = useSessionStore((s) => s.setActiveModule)
  const khataEnabled = useFeatureFlag('enableKhata')

  useEffect(() => {
    if (activeModule === 'khata' && !khataEnabled) {
      setActiveModule('pos')
    }
  }, [activeModule, khataEnabled, setActiveModule])

  switch (activeModule) {
    case 'pos':
      return wrap(
        'pos',
        <PosPage businessType={businessType} shopName={shopName} />,
      )
    case 'products':
      return wrap('products', <ProductsPage businessType={businessType} />)
    case 'orders':
      return wrap('orders', <OrdersPage />)
    case 'expenses':
      return wrap('expenses', <ExpensesPage />)
    case 'khata':
      if (!khataEnabled) {
        return wrap(
          'pos',
          <PosPage businessType={businessType} shopName={shopName} />,
        )
      }
      return wrap('khata', <KhataPage />)
    case 'liveCloud':
      return wrap('liveCloud', <LiveCloudPage />)
    case 'reports':
      return wrap('reports', <ReportsPage />)
    case 'settings':
      return wrap('settings', <SettingsPage />)
    default:
      return wrap(
        'pos',
        <PosPage businessType={businessType} shopName={shopName} />,
      )
  }
}
