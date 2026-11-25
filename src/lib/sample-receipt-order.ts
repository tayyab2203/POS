import type { Order, Settings } from '@/db'

export function buildSampleOrder(settings: Settings): Order {
  const now = new Date().toISOString()
  const isFood = settings.businessType === 'food'
  const isRetail = settings.businessType === 'retail'

  return {
    id: 'preview-order',
    invoiceNumber: 'INV-PREVIEW-0001',
    tokenNumber: isFood || settings.businessType === 'bakery' ? 42 : null,
    orderType: isFood ? 'takeaway' : null,
    items: [
      {
        productId: 'p1',
        variantId: null,
        name: isFood
          ? 'Chicken Biryani (Full)'
          : isRetail
            ? 'Atta 1kg'
            : 'Gulab Jamun',
        unitPrice: isFood ? 350 : isRetail ? 180 : 1200,
        quantity: isFood ? 1 : isRetail ? 2 : 0.5,
        discount: isRetail ? 10 : 0,
        lineTotal: isFood ? 350 : isRetail ? 350 : 600,
        unit: isFood ? 'plate' : isRetail ? 'pcs' : 'kg',
      },
      {
        productId: 'p2',
        variantId: null,
        name: isFood ? 'Cold Drink' : isRetail ? 'Soap' : 'Cake Slice',
        unitPrice: isFood ? 80 : isRetail ? 120 : 150,
        quantity: 1,
        discount: 0,
        lineTotal: isFood ? 80 : isRetail ? 120 : 150,
        unit: 'pcs',
      },
    ],
    subtotal: isFood ? 430 : isRetail ? 470 : 750,
    discount: 0,
    tax: settings.receiptConfig.showTax
      ? Math.round(
          ((isFood ? 430 : isRetail ? 470 : 750) *
            (settings.receiptConfig.taxPercent || 0)) /
            100,
        )
      : 0,
    total: isFood ? 430 : isRetail ? 470 : 750,
    paymentMethod: 'cash',
    paymentBreakdown: {
      cash: isFood ? 430 : isRetail ? 470 : 750,
      online: 0,
      udhaar: 0,
    },
    cashReceived: 500,
    changeReturned: isFood ? 70 : isRetail ? 30 : 0,
    customerId: isRetail ? 'c1' : null,
    customerName: isRetail ? 'Ahmed Ali' : null,
    previousBalance: isRetail ? 500 : null,
    newBalance: isRetail ? 500 : null,
    status: 'completed',
    note: '',
    localDate: now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
  }
}
