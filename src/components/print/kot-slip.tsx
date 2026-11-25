import type { Order, Settings } from '@/db'
import { formatQty } from '@/lib/format'
import { formatReceiptDate, orderTypeLabel } from '@/lib/receipt-labels'
import { cn } from '@/lib/utils'

interface KotSlipProps {
  order: Order
  settings: Settings
  className?: string
  isDuplicate?: boolean
}

/** Kitchen Order Ticket — items + qty only, no prices */
export function KotSlip({
  order,
  settings,
  className,
  isDuplicate = false,
}: KotSlipProps) {
  return (
    <div className={cn('thermal-slip', className)} dir="auto">
      {isDuplicate ? (
        <div className="thermal-duplicate">*** DUPLICATE COPY ***</div>
      ) : null}
      <div className="thermal-center thermal-bold">KOT / KITCHEN</div>
      <div className="thermal-center thermal-muted">
        {settings.shopName || 'Local POS'}
      </div>

      <div className="thermal-token-box">
        <div className="thermal-muted">TOKEN</div>
        <div className="thermal-xl">
          #{order.tokenNumber ?? '—'}
        </div>
      </div>

      {order.orderType ? (
        <div className="thermal-center thermal-lg">
          {orderTypeLabel(order.orderType)}
        </div>
      ) : null}

      <div className="thermal-center thermal-muted">
        {formatReceiptDate(order.createdAt)}
      </div>
      <div className="thermal-center thermal-muted">{order.invoiceNumber}</div>

      <hr className="thermal-divider-solid" />

      <table className="thermal-items">
        <thead>
          <tr>
            <th className="qty">Qty</th>
            <th className="thermal-left">Item</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={`${item.productId}-${index}`}>
              <td className="qty thermal-bold thermal-lg">
                {formatQty(item.quantity)}
              </td>
              <td className="thermal-left">
                <div className="thermal-bold">{item.name}</div>
                {item.notes ? (
                  <div className="thermal-note">** {item.notes}</div>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="thermal-divider" />
      <div className="thermal-center thermal-muted">*** END KOT ***</div>
    </div>
  )
}
