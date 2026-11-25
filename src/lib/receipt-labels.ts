import type { OrderType, PaymentMethod } from '@/db'

export function orderTypeLabel(type: OrderType | null): string {
  if (type === 'dine_in') return 'DINE-IN'
  if (type === 'takeaway') return 'PARCEL'
  if (type === 'delivery') return 'DELIVERY'
  return ''
}

export function paymentLabel(method: PaymentMethod): string {
  if (method === 'cash') return 'CASH'
  if (method === 'online') return 'ONLINE'
  if (method === 'split') return 'SPLIT'
  return 'UDHAAR'
}

export function formatReceiptDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
