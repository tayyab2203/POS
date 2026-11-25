import { useLiveQuery } from 'dexie-react-hooks'
import { CircleHelp, Search, ShoppingCart } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  ProductAddDialog,
  type ProductAddSelection,
} from '@/components/pos/product-add-dialog'
import { CartPanel } from '@/components/pos/cart-panel'
import { CustomItemDialog } from '@/components/pos/custom-item-dialog'
import { ProductCard } from '@/components/pos/product-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  CUSTOM_PRODUCT_ID,
  db,
  findProductBySku,
  type BusinessType,
  type Product,
} from '@/db'
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner'
import {
  POS_EVENTS,
  usePosShortcuts,
} from '@/hooks/use-pos-shortcuts'
import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/format'
import { useCartStore } from '@/stores'

interface PosPageProps {
  businessType: BusinessType
  shopName: string
}

export function PosPage({ businessType, shopName }: PosPageProps) {
  const { t } = useI18n()
  const searchRef = useRef<HTMLInputElement>(null)

  const settings = useLiveQuery(() => db.settings.get('shop'), [])
  const minStockAlert = settings?.minStockAlert ?? 5

  const categories = useLiveQuery(
    () => db.categories.orderBy('sortOrder').toArray(),
    [],
  )
  const products = useLiveQuery(
    () => db.products.filter((p) => p.isActive).toArray(),
    [],
  )

  const addItem = useCartStore((s) => s.addItem)
  const items = useCartStore((s) => s.items)
  const itemCount = useCartStore((s) => s.itemCount)
  const total = useCartStore((s) => s.total)

  const [categoryId, setCategoryId] = useState('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [mobileCartOpen, setMobileCartOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [customOpen, setCustomOpen] = useState(false)

  const showBarcode = businessType === 'retail'
  const showStock = businessType === 'retail' || businessType === 'bakery'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (products ?? [])
      .filter((p) => {
        if (categoryId !== 'all' && p.categoryId !== categoryId) return false
        if (
          lowStockOnly &&
          !(
            p.trackStock &&
            p.stock !== null &&
            p.stock <= minStockAlert
          )
        ) {
          return false
        }
        if (!q) return true
        return (
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [products, categoryId, query, lowStockOnly, minStockAlert])

  const openPicker = useCallback(
    (product: Product) => {
      const simple =
        product.variants.length === 0 &&
        !product.allowFractional &&
        product.weightPresets.length === 0

      if (simple) {
        addItem({
          productId: product.id,
          variantId: null,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
          discount: 0,
          unit: product.unit,
        })
        return
      }

      setPickerProduct(product)
      setPickerOpen(true)
    },
    [addItem],
  )

  function addToCart(selection: ProductAddSelection) {
    addItem({
      productId: selection.product.id,
      variantId: selection.variant?.id ?? null,
      name: selection.name,
      unitPrice: selection.unitPrice,
      quantity: selection.quantity,
      discount: 0,
      unit: selection.product.unit,
    })
  }

  async function resolveSku(value: string) {
    const bySku = await findProductBySku(value)
    if (bySku && bySku.isActive) {
      openPicker(bySku)
      setQuery('')
      return true
    }
    return false
  }

  async function onSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const value = query.trim()
    if (!value) return

    if (await resolveSku(value)) return

    if (filtered.length === 1) {
      openPicker(filtered[0])
      setQuery('')
      return
    }

    if (showBarcode) {
      toast.error(t('notFoundSku'))
    }
  }

  usePosShortcuts(true)

  useBarcodeScanner(
    (code) => {
      void resolveSku(code).then((ok) => {
        if (!ok) toast.error(t('notFoundSku'))
      })
    },
    showBarcode,
  )

  useEffect(() => {
    function onFocusSearch() {
      searchRef.current?.focus()
      searchRef.current?.select()
    }
    function onCloseOverlays() {
      setPickerOpen(false)
      setMobileCartOpen(false)
      setShowShortcuts(false)
    }
    window.addEventListener(POS_EVENTS.focusSearch, onFocusSearch)
    window.addEventListener(POS_EVENTS.closeOverlays, onCloseOverlays)
    return () => {
      window.removeEventListener(POS_EVENTS.focusSearch, onFocusSearch)
      window.removeEventListener(POS_EVENTS.closeOverlays, onCloseOverlays)
    }
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col lg:w-[65%]">
        <div className="space-y-3 border-b bg-white p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                {shopName}
              </h2>
              <p className="text-xs text-muted-foreground capitalize">
                {businessType}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 ? (
                <Badge variant="secondary" className="lg:hidden">
                  {itemCount()} {t('items')}
                </Badge>
              ) : null}
              <div className="relative">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label={t('shortcutGuide')}
                  onClick={() => setShowShortcuts((v) => !v)}
                >
                  <CircleHelp className="h-4 w-4" />
                </Button>
                {showShortcuts ? (
                  <div className="absolute end-0 top-9 z-40 w-56 rounded-lg border bg-white p-3 text-xs shadow-lg">
                    <p className="mb-2 font-semibold">{t('shortcutGuide')}</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>
                        <kbd className="font-mono text-foreground">F2</kbd> —{' '}
                        {t('shortcutSearch')}
                      </li>
                      <li>
                        <kbd className="font-mono text-foreground">F4</kbd> —{' '}
                        {t('shortcutOrderType')}
                      </li>
                      <li>
                        <kbd className="font-mono text-foreground">F8</kbd> —{' '}
                        {t('shortcutCheckout')}
                      </li>
                      <li>
                        <kbd className="font-mono text-foreground">F9</kbd> —{' '}
                        {t('shortcutHold')}
                      </li>
                      <li>
                        <kbd className="font-mono text-foreground">Esc</kbd> —{' '}
                        {t('shortcutEsc')}
                      </li>
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              data-pos-search="true"
              className="h-11 ps-9"
              placeholder={
                showBarcode ? t('searchOrScan') : t('searchProducts')
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => void onSearchKeyDown(e)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              size="sm"
              variant={categoryId === 'all' && !lowStockOnly ? 'default' : 'outline'}
              className="shrink-0 rounded-full"
              onClick={() => {
                setCategoryId('all')
                setLowStockOnly(false)
              }}
            >
              {t('allCategories')}
            </Button>
            {showStock ? (
              <Button
                size="sm"
                variant={lowStockOnly ? 'destructive' : 'outline'}
                className="shrink-0 rounded-full"
                onClick={() => {
                  setLowStockOnly(true)
                  setCategoryId('all')
                }}
              >
                {t('lowStockFilter')}
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 rounded-full border-dashed"
              onClick={() => setCustomOpen(true)}
            >
              + {t('customItem')}
            </Button>
            {(categories ?? []).map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={categoryId === c.id && !lowStockOnly ? 'default' : 'outline'}
                className="shrink-0 gap-2 rounded-full"
                onClick={() => {
                  setCategoryId(c.id)
                  setLowStockOnly(false)
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 pb-28 sm:p-4 lg:pb-4">
          {filtered.length === 0 ? (
            <div className="rounded-xl border bg-white p-10 text-center text-muted-foreground">
              {t('noProducts')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showStock={showStock}
                  minStockAlert={minStockAlert}
                  lowStockLabel={t('lowStock')}
                  stockLabel={t('stock')}
                  variantsLabel={t('variants')}
                  onSelect={openPicker}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="hidden w-[35%] min-w-[320px] border-s lg:block">
        <CartPanel businessType={businessType} listenShortcuts />
      </aside>

      <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileCartOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl bg-slate-900 px-4 py-3.5 text-white shadow-lg"
        >
          <span className="flex items-center gap-2 font-medium">
            <ShoppingCart className="h-5 w-5" />
            {t('viewCart')} · {itemCount()} {t('items')}
          </span>
          <span className="text-lg font-bold">{formatMoney(total())}</span>
        </button>
      </div>

      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{t('cart')}</SheetTitle>
          </SheetHeader>
          <CartPanel
            businessType={businessType}
            compact
            onCheckedOut={() => setMobileCartOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <ProductAddDialog
        open={pickerOpen}
        product={pickerProduct}
        onOpenChange={setPickerOpen}
        onConfirm={addToCart}
      />

      <CustomItemDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        onConfirm={({ name, price }) => {
          addItem({
            productId: CUSTOM_PRODUCT_ID,
            variantId: null,
            name,
            unitPrice: price,
            quantity: 1,
            discount: 0,
            unit: 'pcs',
          })
        }}
      />
    </div>
  )
}
