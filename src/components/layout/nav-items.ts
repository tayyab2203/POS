import {
  Cloud,
  ClipboardList,
  LayoutGrid,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { FeatureFlagKey } from '@/hooks/use-feature-flag'
import type { TranslationKey } from '@/i18n'
import type { AppModule } from '@/stores'

export interface NavItem {
  id: AppModule
  labelKey: TranslationKey
  icon: LucideIcon
  requiresOwner?: boolean
  /** Show only for cloud-authenticated shop_owner (live read-only view) */
  cloudOwnerOnly?: boolean
  /** Hide when this SaaS feature flag is off */
  featureFlag?: FeatureFlagKey
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'pos', labelKey: 'pos', icon: ShoppingCart },
  { id: 'orders', labelKey: 'orders', icon: ClipboardList },
  { id: 'products', labelKey: 'products', icon: Package },
  { id: 'expenses', labelKey: 'expenses', icon: Wallet },
  { id: 'khata', labelKey: 'khata', icon: Users, featureFlag: 'enableKhata' },
  {
    id: 'liveCloud',
    labelKey: 'liveCloud',
    icon: Cloud,
    cloudOwnerOnly: true,
  },
  { id: 'reports', labelKey: 'reports', icon: LayoutGrid, requiresOwner: true },
  { id: 'settings', labelKey: 'settings', icon: Settings, requiresOwner: true },
]
