import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Product, ProductVariant } from '@/db'
import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface ProductAddSelection {
  product: Product
  variant: ProductVariant | null
  quantity: number
  unitPrice: number
  name: string
}

interface ProductAddDialogProps {
  open: boolean
  product: Product | null
  onOpenChange: (open: boolean) => void
  onConfirm: (selection: ProductAddSelection) => void
}

export function ProductAddDialog({
  open,
  product,
  onOpenChange,
  onConfirm,
}: ProductAddDialogProps) {
  const { t, dir } = useI18n()
  const [variantId, setVariantId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('1')

  const needsVariant = (product?.variants.length ?? 0) > 0
  const needsWeight =
    !!product &&
    (product.allowFractional || product.weightPresets.length > 0)

  useEffect(() => {
    if (!open || !product) return
    setVariantId(product.variants[0]?.id ?? null)
    setQuantity(
      product.weightPresets[0]
        ? String(product.weightPresets[0])
        : '1',
    )
  }, [open, product])

  if (!product) return null

  const activeProduct: Product = product
  const variant =
    activeProduct.variants.find((v) => v.id === variantId) ?? null
  const unitPrice = variant?.price ?? activeProduct.price
  const displayName = variant
    ? `${activeProduct.name} (${variant.name})`
    : activeProduct.name

  function confirm() {
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty <= 0) return
    onConfirm({
      product: activeProduct,
      variant,
      quantity: qty,
      unitPrice,
      name: displayName,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{activeProduct.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {needsVariant ? (
            <div className="space-y-2">
              <Label>{t('selectVariant')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {activeProduct.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={cn(
                      'rounded-xl border-2 px-3 py-3 text-start',
                      variantId === v.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200',
                    )}
                    onClick={() => setVariantId(v.id)}
                  >
                    <div className="font-semibold">{v.name}</div>
                    <div className="text-sm opacity-80">
                      {formatMoney(v.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {needsWeight ? (
            <div className="space-y-2">
              <Label>{t('selectWeight')}</Label>
              {activeProduct.weightPresets.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeProduct.weightPresets.map((w) => (
                    <Button
                      key={w}
                      type="button"
                      variant={Number(quantity) === w ? 'default' : 'outline'}
                      onClick={() => setQuantity(String(w))}
                    >
                      {w < 1 ? `${w * 1000}g` : `${w}kg`}
                    </Button>
                  ))}
                </div>
              ) : null}
              <Input
                type="number"
                step="0.001"
                min="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t('qty')}</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setQuantity(String(Math.max(1, Number(quantity) - 1)))
                  }
                >
                  −
                </Button>
                <Input
                  type="number"
                  className="text-center"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuantity(String(Number(quantity) + 1))}
                >
                  +
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            {displayName} · {formatMoney(unitPrice)} × {quantity} ={' '}
            <strong>
              {formatMoney(unitPrice * (Number(quantity) || 0))}
            </strong>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={confirm}>{t('confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
