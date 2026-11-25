import { KotSlip } from '@/components/print/kot-slip'
import { ThermalReceipt } from '@/components/print/thermal-receipt'
import { usePrintStore } from '@/stores/print-store'

export function PrintHost() {
  const job = usePrintStore((s) => s.job)
  if (!job) return null

  return (
    <div
      className="print-root"
      style={{
        ['--thermal-width' as string]: `${job.settings.printerWidth}mm`,
      }}
    >
      {job.includeReceipt ? (
        <ThermalReceipt
          order={job.order}
          settings={job.settings}
          isDuplicate={job.isDuplicate}
        />
      ) : null}
      {job.includeKot ? (
        <KotSlip
          order={job.order}
          settings={job.settings}
          isDuplicate={job.isDuplicate}
        />
      ) : null}
    </div>
  )
}
