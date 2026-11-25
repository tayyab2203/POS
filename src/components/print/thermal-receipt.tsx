import type { Order, Settings } from '@/db'
import { orderPaymentAmounts } from '@/db/payment'
import { formatMoney, formatQty } from '@/lib/format'
import {
  formatReceiptDate,
  orderTypeLabel,
  paymentLabel,
} from '@/lib/receipt-labels'
import { cn } from '@/lib/utils'

interface ThermalReceiptProps {
  order: Order
  settings: Settings
  className?: string
  isDuplicate?: boolean
}

export function ThermalReceipt({
  order,
  settings,
  className,
  isDuplicate = false,
}: ThermalReceiptProps) {
  const { receiptConfig } = settings
  const showToken =
    receiptConfig.showToken &&
    order.tokenNumber !== null &&
    (settings.businessType === 'food' || settings.businessType === 'bakery')
  const showOrderType =
    receiptConfig.showOrderType &&
    settings.businessType === 'food' &&
    !!order.orderType
  const showSku = receiptConfig.showSku && settings.businessType === 'retail'
  const showItemDiscount = receiptConfig.showItemDiscount
  const amounts = orderPaymentAmounts(order)
  const showUdhaar =
    receiptConfig.showUdhaarBalance &&
    amounts.udhaar > 0 &&
    order.customerName

  return (
    <div className={cn('thermal-slip', className)} dir="auto">
      {isDuplicate ? (
        <div className="thermal-duplicate">*** DUPLICATE COPY ***</div>
      ) : null}
      <div className="thermal-center">
        {receiptConfig.showLogo && settings.logoBase64 ? (
          <img
            src={settings.logoBase64}
            alt=""
            className="thermal-logo"
          />
        ) : null}
        <div className="thermal-lg">{settings.shopName || 'Local POS'}</div>
        {settings.address ? (
          <div className="thermal-muted">{settings.address}</div>
        ) : null}
        {settings.phone ? (
          <div className="thermal-muted">Tel: {settings.phone}</div>
        ) : null}
      </div>

      {showToken ? (
        <div className="thermal-token-box">
          <div className="thermal-muted">TOKEN</div>
          <div className="thermal-xl">#{order.tokenNumber}</div>
        </div>
      ) : null}

      {showOrderType ? (
        <div className="thermal-center thermal-bold thermal-lg">
          {orderTypeLabel(order.orderType)}
        </div>
      ) : null}

      <hr className="thermal-divider" />

      <div className="thermal-row thermal-muted">
        <span>{order.invoiceNumber}</span>
        <span>{formatReceiptDate(order.createdAt)}</span>
      </div>
      {order.customerName ? (
        <div className="thermal-left thermal-muted">
          Customer: {order.customerName}
        </div>
      ) : null}

      <hr className="thermal-divider" />

      <table className="thermal-items">
        <thead>
          <tr>
            <th className="thermal-left">Item</th>
            <th className="qty">Qty</th>
            {(showSku || settings.businessType === 'retail') && (
              <th className="rate">Rate</th>
            )}
            <th className="amt">Amt</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => (
            <tr key={`${item.productId}-${index}`}>
              <td className="thermal-left">
                <div className="thermal-bold">{item.name}</div>
                {item.notes ? (
                  <div className="thermal-note">{item.notes}</div>
                ) : null}
                {showItemDiscount && item.discount > 0 ? (
                  <div className="thermal-muted">
                    Disc -{formatMoney(item.discount, settings.currency)}
                  </div>
                ) : null}
              </td>
              <td className="qty">{formatQty(item.quantity)}</td>
              {(showSku || settings.businessType === 'retail') && (
                <td className="rate">
                  {formatMoney(item.unitPrice, settings.currency)}
                </td>
              )}
              <td className="amt">
                {formatMoney(item.lineTotal, settings.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="thermal-divider-solid" />

      <div className="thermal-row">
        <span>Subtotal</span>
        <span>{formatMoney(order.subtotal, settings.currency)}</span>
      </div>
      {order.discount > 0 ? (
        <div className="thermal-row">
          <span>Discount</span>
          <span>-{formatMoney(order.discount, settings.currency)}</span>
        </div>
      ) : null}
      {receiptConfig.showTax && order.tax > 0 ? (
        <div className="thermal-row">
          <span>Tax ({receiptConfig.taxPercent}%)</span>
          <span>{formatMoney(order.tax, settings.currency)}</span>
        </div>
      ) : null}
      <div className="thermal-row thermal-lg">
        <span>TOTAL</span>
        <span>{formatMoney(order.total, settings.currency)}</span>
      </div>

      <hr className="thermal-divider" />

      <div className="thermal-row">
        <span>Payment</span>
        <span className="thermal-bold">{paymentLabel(order.paymentMethod)}</span>
      </div>
      {order.paymentMethod === 'split' ? (
        <>
          {amounts.cash > 0 ? (
            <div className="thermal-row">
              <span>Cash</span>
              <span>{formatMoney(amounts.cash, settings.currency)}</span>
            </div>
          ) : null}
          {amounts.online > 0 ? (
            <div className="thermal-row">
              <span>Online</span>
              <span>{formatMoney(amounts.online, settings.currency)}</span>
            </div>
          ) : null}
          {amounts.udhaar > 0 ? (
            <div className="thermal-row">
              <span>Udhaar</span>
              <span>{formatMoney(amounts.udhaar, settings.currency)}</span>
            </div>
          ) : null}
        </>
      ) : null}
      {amounts.cash > 0 && order.cashReceived !== null ? (
        <>
          <div className="thermal-row">
            <span>Cash tendered</span>
            <span>{formatMoney(order.cashReceived, settings.currency)}</span>
          </div>
          <div className="thermal-row">
            <span>Change</span>
            <span>
              {formatMoney(order.changeReturned ?? 0, settings.currency)}
            </span>
          </div>
        </>
      ) : null}

      {showUdhaar ? (
        <>
          <hr className="thermal-divider" />
          <div className="thermal-row">
            <span>Prev Balance</span>
            <span>
              {formatMoney(order.previousBalance ?? 0, settings.currency)}
            </span>
          </div>
          <div className="thermal-row thermal-bold">
            <span>New Balance</span>
            <span>{formatMoney(order.newBalance ?? 0, settings.currency)}</span>
          </div>
        </>
      ) : null}

      {receiptConfig.footerMessage ? (
        <>
          <hr className="thermal-divider" />
          <div className="thermal-center thermal-muted">
            {receiptConfig.footerMessage}
          </div>
        </>
      ) : null}
    </div>
  )
}
