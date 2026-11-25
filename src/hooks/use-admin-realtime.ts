import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase'
import type { ShopRow, SubscriptionPaymentRow } from '@/types/supabase'

interface UseAdminRealtimeOptions {
  enabled?: boolean
  onShopChange: (shop: ShopRow, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
  onPaymentInsert?: (payment: SubscriptionPaymentRow) => void
  notifyNewShop?: boolean
}

/**
 * Live shops + subscription_payments. Requires tables in supabase_realtime publication.
 */
export function useAdminRealtime({
  enabled = true,
  onShopChange,
  onPaymentInsert,
  notifyNewShop = true,
}: UseAdminRealtimeOptions): void {
  const shopCb = useRef(onShopChange)
  const payCb = useRef(onPaymentInsert)
  shopCb.current = onShopChange
  payCb.current = onPaymentInsert

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return

    const client = getSupabase()
    const channel = client
      .channel('super-admin-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shops' },
        (payload) => {
          const event = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
          if (event === 'DELETE') {
            const oldRow = payload.old as Partial<ShopRow>
            if (oldRow?.id) {
              shopCb.current({ ...(oldRow as ShopRow) }, 'DELETE')
            }
            return
          }
          const row = payload.new as ShopRow
          if (!row?.id) return
          shopCb.current(row, event)
          if (event === 'INSERT' && notifyNewShop) {
            toast.message(`New shop: ${row.name}`, {
              description: row.owner_name || row.owner_phone || undefined,
            })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'subscription_payments' },
        (payload) => {
          const row = payload.new as SubscriptionPaymentRow
          if (row?.id) payCb.current?.(row)
        },
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [enabled, notifyNewShop])
}
