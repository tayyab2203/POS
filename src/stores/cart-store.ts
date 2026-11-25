import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  OrderItem,
  OrderType,
  PaymentBreakdown,
  PaymentMethod,
} from '@/db/types'

export interface CartLine extends OrderItem {
  lineId: string
}

interface CartState {
  items: CartLine[]
  orderType: OrderType | null
  discount: number
  paymentMethod: PaymentMethod
  splitPayment: boolean
  paymentBreakdown: PaymentBreakdown
  cashReceived: number | null
  customerId: string | null
  customerName: string | null
  heldLabel: string | null
  addItem: (
    item: Omit<CartLine, 'lineId' | 'lineTotal'> & { lineTotal?: number },
  ) => void
  updateQty: (lineId: string, quantity: number) => void
  setLineDiscount: (lineId: string, discount: number) => void
  setLineNotes: (lineId: string, notes: string) => void
  removeItem: (lineId: string) => void
  setOrderType: (orderType: OrderType | null) => void
  setDiscount: (discount: number) => void
  setPaymentMethod: (paymentMethod: PaymentMethod) => void
  setSplitPayment: (split: boolean) => void
  setPaymentBreakdown: (breakdown: Partial<PaymentBreakdown>) => void
  setCashReceived: (cashReceived: number | null) => void
  setCustomer: (customerId: string | null, customerName: string | null) => void
  setHeldLabel: (heldLabel: string | null) => void
  loadFromHeld: (payload: {
    items: CartLine[]
    orderType: OrderType | null
    discount: number
    paymentMethod: PaymentMethod
    customerId: string | null
    customerName: string | null
    heldLabel: string | null
  }) => void
  clearCart: () => void
  itemCount: () => number
  subtotal: () => number
  total: () => number
  changeDue: () => number
}

function calcLineTotal(unitPrice: number, quantity: number, discount: number) {
  return Math.max(0, unitPrice * quantity - discount)
}

const emptyBreakdown = (): PaymentBreakdown => ({
  cash: 0,
  online: 0,
  udhaar: 0,
})

const emptyCart = {
  items: [] as CartLine[],
  orderType: null as OrderType | null,
  discount: 0,
  paymentMethod: 'cash' as PaymentMethod,
  splitPayment: false,
  paymentBreakdown: emptyBreakdown(),
  cashReceived: null as number | null,
  customerId: null as string | null,
  customerName: null as string | null,
  heldLabel: null as string | null,
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...emptyCart,

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (line) =>
              line.productId === item.productId &&
              line.variantId === item.variantId &&
              (line.notes ?? '') === (item.notes ?? ''),
          )

          if (existing) {
            const quantity = existing.quantity + item.quantity
            return {
              items: state.items.map((line) =>
                line.lineId === existing.lineId
                  ? {
                      ...line,
                      quantity,
                      lineTotal: calcLineTotal(
                        line.unitPrice,
                        quantity,
                        line.discount,
                      ),
                    }
                  : line,
              ),
            }
          }

          const discount = item.discount ?? 0
          return {
            items: [
              ...state.items,
              {
                ...item,
                discount,
                lineId: crypto.randomUUID(),
                lineTotal:
                  item.lineTotal ??
                  calcLineTotal(item.unitPrice, item.quantity, discount),
              },
            ],
          }
        }),

      updateQty: (lineId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((line) => line.lineId !== lineId)
              : state.items.map((line) =>
                  line.lineId === lineId
                    ? {
                        ...line,
                        quantity,
                        lineTotal: calcLineTotal(
                          line.unitPrice,
                          quantity,
                          line.discount,
                        ),
                      }
                    : line,
                ),
        })),

      setLineDiscount: (lineId, discount) =>
        set((state) => ({
          items: state.items.map((line) =>
            line.lineId === lineId
              ? {
                  ...line,
                  discount: Math.max(0, discount),
                  lineTotal: calcLineTotal(
                    line.unitPrice,
                    line.quantity,
                    Math.max(0, discount),
                  ),
                }
              : line,
          ),
        })),

      setLineNotes: (lineId, notes) =>
        set((state) => ({
          items: state.items.map((line) =>
            line.lineId === lineId ? { ...line, notes } : line,
          ),
        })),

      removeItem: (lineId) =>
        set((state) => ({
          items: state.items.filter((line) => line.lineId !== lineId),
        })),

      setOrderType: (orderType) => set({ orderType }),
      setDiscount: (discount) => set({ discount: Math.max(0, discount) }),
      setPaymentMethod: (paymentMethod) =>
        set({ paymentMethod, splitPayment: false }),
      setSplitPayment: (split) => set({ splitPayment: split }),
      setPaymentBreakdown: (patch) =>
        set((state) => ({
          paymentBreakdown: { ...state.paymentBreakdown, ...patch },
        })),
      setCashReceived: (cashReceived) => set({ cashReceived }),
      setCustomer: (customerId, customerName) => set({ customerId, customerName }),
      setHeldLabel: (heldLabel) => set({ heldLabel }),

      loadFromHeld: (payload) =>
        set({
          items: payload.items,
          orderType: payload.orderType,
          discount: payload.discount,
          paymentMethod: payload.paymentMethod,
          splitPayment: payload.paymentMethod === 'split',
          paymentBreakdown: emptyBreakdown(),
          customerId: payload.customerId,
          customerName: payload.customerName,
          heldLabel: payload.heldLabel,
          cashReceived: null,
        }),

      clearCart: () =>
        set({
          items: [],
          discount: 0,
          cashReceived: null,
          customerId: null,
          customerName: null,
          heldLabel: null,
          paymentMethod: 'cash',
          splitPayment: false,
          paymentBreakdown: emptyBreakdown(),
        }),

      itemCount: () =>
        get().items.reduce((sum, line) => sum + line.quantity, 0),

      subtotal: () => get().items.reduce((sum, line) => sum + line.lineTotal, 0),

      total: () => Math.max(0, get().subtotal() - get().discount),

      changeDue: () => {
        const { paymentMethod, cashReceived, splitPayment, paymentBreakdown } =
          get()
        if (cashReceived === null) return 0
        if (splitPayment) {
          return Math.max(0, cashReceived - (paymentBreakdown.cash || 0))
        }
        if (paymentMethod !== 'cash') return 0
        return Math.max(0, cashReceived - get().total())
      },
    }),
    {
      name: 'local-pos-active-cart',
      partialize: (state) => ({
        items: state.items,
        orderType: state.orderType,
        discount: state.discount,
        paymentMethod: state.paymentMethod,
        splitPayment: state.splitPayment,
        paymentBreakdown: state.paymentBreakdown,
        cashReceived: state.cashReceived,
        customerId: state.customerId,
        customerName: state.customerName,
        heldLabel: state.heldLabel,
      }),
    },
  ),
)
