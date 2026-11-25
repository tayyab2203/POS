import { ThermalReceipt } from '@/components/print/thermal-receipt'
import { KotSlip } from '@/components/print/kot-slip'
import type { Settings } from '@/db'
import { buildSampleOrder } from '@/lib/sample-receipt-order'

interface ReceiptPreviewProps {
  settings: Settings
  showKotPreview?: boolean
}

export function ReceiptPreview({
  settings,
  showKotPreview = false,
}: ReceiptPreviewProps) {
  const sample = buildSampleOrder(settings)
  const showKot =
    showKotPreview &&
    settings.businessType === 'food' &&
    settings.receiptConfig.autoPrintKot

  return (
    <div className="space-y-4">
      <div
        className="thermal-preview"
        data-width={settings.printerWidth}
        style={{
          ['--thermal-width' as string]: `${settings.printerWidth}mm`,
        }}
      >
        <ThermalReceipt order={sample} settings={settings} />
      </div>

      {showKot ? (
        <div
          className="thermal-preview"
          data-width={settings.printerWidth}
          style={{
            ['--thermal-width' as string]: `${settings.printerWidth}mm`,
          }}
        >
          <KotSlip order={sample} settings={settings} />
        </div>
      ) : null}
    </div>
  )
}
