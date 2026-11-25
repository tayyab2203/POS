import type { Order, PaymentBreakdown, PaymentMethod } from './types'

export function emptyBreakdown(): PaymentBreakdown {
  return { cash: 0, online: 0, udhaar: 0 }
}

export function breakdownSum(b: PaymentBreakdown): number {
  return (b.cash || 0) + (b.online || 0) + (b.udhaar || 0)
}

export function breakdownFromMethod(
  method: Exclude<PaymentMethod, 'split'>,
  total: number,
): PaymentBreakdown {
  const b = emptyBreakdown()
  b[method] = Math.max(0, total)
  return b
}

export function primaryPaymentMethod(b: PaymentBreakdown): PaymentMethod {
  const parts = (
    [
      ['cash', b.cash || 0],
      ['online', b.online || 0],
      ['udhaar', b.udhaar || 0],
    ] as const
  ).filter(([, v]) => v > 0.0001)

  if (parts.length === 0) return 'cash'
  if (parts.length === 1) return parts[0][0]
  return 'split'
}

export function orderPaymentAmounts(order: Order): PaymentBreakdown {
  if (order.paymentBreakdown) {
    return {
      cash: order.paymentBreakdown.cash || 0,
      online: order.paymentBreakdown.online || 0,
      udhaar: order.paymentBreakdown.udhaar || 0,
    }
  }
  if (order.paymentMethod === 'split') {
    return emptyBreakdown()
  }
  return breakdownFromMethod(order.paymentMethod, order.total)
}

/** Round to 2 decimals for money comparisons */
export function moneyEq(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.02
}
