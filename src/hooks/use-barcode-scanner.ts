import { useEffect, useRef } from 'react'

/**
 * Detects USB barcode scanners: rapid keystrokes (<50ms gap) ending with Enter.
 * Works even when search input is not focused.
 */
export function useBarcodeScanner(
  onScan: (code: string) => void,
  enabled = true,
) {
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    if (!enabled) return

    let buffer = ''
    let lastTs = 0
    const MAX_GAP_MS = 50

    function shouldIgnore(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false
      if (target.isContentEditable) return true
      const tag = target.tagName
      if (tag === 'TEXTAREA' || tag === 'SELECT') return true
      if (tag !== 'INPUT') return false
      const input = target as HTMLInputElement
      if (input.dataset.posSearch === 'true') return false
      if (input.type === 'password' || input.type === 'number') return true
      if (input.dataset.noBarcode === 'true') return true
      // Other form fields (qty, cash, etc.) — ignore scanner buffer
      return true
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      if (shouldIgnore(e.target)) return

      const now = performance.now()

      if (e.key === 'Enter') {
        const gapOk = lastTs > 0 && now - lastTs <= MAX_GAP_MS * 4
        if (buffer.length >= 3 && gapOk) {
          e.preventDefault()
          e.stopPropagation()
          const code = buffer
          buffer = ''
          lastTs = 0
          onScanRef.current(code)
        } else {
          buffer = ''
          lastTs = 0
        }
        return
      }

      if (e.key.length !== 1) return

      if (lastTs && now - lastTs > MAX_GAP_MS) {
        buffer = e.key
      } else {
        buffer += e.key
      }
      lastTs = now

      if (buffer.length > 64) buffer = buffer.slice(-64)
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [enabled])
}
