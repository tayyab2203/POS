import type { Order, Settings } from '@/db'
import { usePrintStore } from '@/stores/print-store'

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

export async function printOrderSlips(options: {
  order: Order
  settings: Settings
  includeReceipt?: boolean
  includeKot?: boolean
  isDuplicate?: boolean
}): Promise<void> {
  const includeReceipt = options.includeReceipt ?? true
  const includeKot =
    options.includeKot ??
    (options.settings.receiptConfig.autoPrintKot &&
      options.settings.businessType === 'food')

  if (!includeReceipt && !includeKot) return

  const root = document.documentElement
  root.style.setProperty(
    '--thermal-width',
    `${options.settings.printerWidth}mm`,
  )

  usePrintStore.getState().setJob({
    order: options.order,
    settings: options.settings,
    includeReceipt,
    includeKot,
    isDuplicate: options.isDuplicate ?? false,
  })

  await waitForPaint()
  window.print()

  window.setTimeout(() => {
    usePrintStore.getState().setJob(null)
  }, 300)
}

export async function reprintReceipt(
  order: Order,
  settings: Settings,
): Promise<void> {
  return printOrderSlips({
    order,
    settings,
    includeReceipt: true,
    includeKot: false,
    isDuplicate: true,
  })
}

export async function reprintKot(
  order: Order,
  settings: Settings,
): Promise<void> {
  return printOrderSlips({
    order,
    settings,
    includeReceipt: false,
    includeKot: true,
    isDuplicate: true,
  })
}
