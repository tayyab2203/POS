import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { todayKey } from '@/lib/format'
import { useCartStore } from '@/stores'

export interface ShopNavCounts {
  pos: number
  orders: number
  products: number
  expenses: number
  khata: number
  liveCloud: number
}

/** Live badge counts for shop sidebar / mobile nav. */
export function useShopNavCounts(): ShopNavCounts {
  const cartCount = useCartStore((s) => s.itemCount())

  const heldOrders = useLiveQuery(
    () => db.orders.where('status').equals('held').count(),
    [],
  )

  const settings = useLiveQuery(() => db.settings.get('shop'), [])
  const minStock = settings?.minStockAlert ?? 5

  const lowStock = useLiveQuery(async () => {
    const products = await db.products.toArray()
    return products.filter(
      (p) =>
        p.isActive &&
        p.trackStock &&
        p.stock !== null &&
        p.stock !== undefined &&
        Number(p.stock) <= minStock,
    ).length
  }, [minStock])

  const todayExpenses = useLiveQuery(
    () => db.expenses.where('localDate').equals(todayKey()).count(),
    [],
  )

  const khataDue = useLiveQuery(async () => {
    const customers = await db.customers.toArray()
    return customers.filter((c) => Number(c.balance) > 0).length
  }, [])

  const pendingSync = useLiveQuery(
    () => db.syncQueue.where('status').equals('pending').count(),
    [],
  )

  return {
    pos: cartCount,
    orders: heldOrders ?? 0,
    products: lowStock ?? 0,
    expenses: todayExpenses ?? 0,
    khata: khataDue ?? 0,
    liveCloud: pendingSync ?? 0,
  }
}
