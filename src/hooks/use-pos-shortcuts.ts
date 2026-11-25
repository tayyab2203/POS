import { useEffect } from 'react'
import type { OrderType } from '@/db/types'
import { useCartStore } from '@/stores'

export const POS_EVENTS = {
  checkout: 'pos:checkout',
  hold: 'pos:hold',
  closeOverlays: 'pos:close-overlays',
  focusSearch: 'pos:focus-search',
} as const

export function dispatchPosEvent(name: (typeof POS_EVENTS)[keyof typeof POS_EVENTS]) {
  window.dispatchEvent(new CustomEvent(name))
}

/**
 * POS keyboard shortcuts:
 * F2 search · F4 dine-in/takeaway · F8 checkout · F9 hold · Esc close overlays
 */
export function usePosShortcuts(enabled = true) {
  const orderType = useCartStore((s) => s.orderType)
  const setOrderType = useCartStore((s) => s.setOrderType)

  useEffect(() => {
    if (!enabled) return

    function onKeyDown(e: KeyboardEvent) {
      const key = e.key

      if (key === 'Escape') {
        dispatchPosEvent(POS_EVENTS.closeOverlays)
        return
      }

      // Don't steal typing inside pin/password/modals except function keys
      const target = e.target as HTMLElement | null
      const typing =
        target &&
        (target.tagName === 'TEXTAREA' ||
          (target.tagName === 'INPUT' &&
            (target as HTMLInputElement).type === 'password') ||
          target.isContentEditable)

      if (key === 'F2') {
        e.preventDefault()
        dispatchPosEvent(POS_EVENTS.focusSearch)
        return
      }

      if (key === 'F4') {
        e.preventDefault()
        const next: OrderType =
          orderType === 'dine_in' ? 'takeaway' : 'dine_in'
        setOrderType(next)
        return
      }

      if (key === 'F8') {
        e.preventDefault()
        if (!typing) dispatchPosEvent(POS_EVENTS.checkout)
        return
      }

      if (key === 'F9') {
        e.preventDefault()
        if (!typing) dispatchPosEvent(POS_EVENTS.hold)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled, orderType, setOrderType])
}
