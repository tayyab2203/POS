import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/db'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  showStock: boolean
  minStockAlert?: number
  lowStockLabel: string
  stockLabel: string
  variantsLabel: string
  onSelect: (product: Product) => void
}

function ProductCardInner({
  product,
  showStock,
  minStockAlert = 5,
  lowStockLabel,
  stockLabel,
  variantsLabel,
  onSelect,
}: ProductCardProps) {
  const lowStock =
    showStock &&
    product.trackStock &&
    product.stock !== null &&
    product.stock <= minStockAlert

  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className={cn(
        'flex min-h-[140px] flex-col overflow-hidden rounded-2xl border bg-white text-start shadow-sm transition active:scale-[0.98]',
        'hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900',
      )}
    >
      <div
        className="relative flex h-24 items-end justify-between p-3 text-white"
        style={{ backgroundColor: product.color }}
      >
        {product.imageBase64 ? (
          <img
            src={product.imageBase64}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <span className="relative z-[1] rounded-md bg-black/35 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
          {formatMoney(product.price)}
        </span>
        {lowStock ? (
          <Badge variant="destructive" className="relative z-[1] text-[10px]">
            {lowStockLabel}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {product.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {product.variants.length > 0
            ? `${product.variants.length} ${variantsLabel}`
            : product.unit}
          {showStock && product.trackStock
            ? ` · ${stockLabel} ${product.stock}`
            : ''}
        </span>
      </div>
    </button>
  )
}

export const ProductCard = memo(ProductCardInner)
