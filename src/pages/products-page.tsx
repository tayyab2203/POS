import { useLiveQuery } from 'dexie-react-hooks'
import { PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CategoryDialog } from '@/components/products/category-dialog'
import { ProductDialog } from '@/components/products/product-dialog'
import { StockInDialog } from '@/components/products/stock-in-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  db,
  deleteCategory,
  deleteProduct,
  type BusinessType,
  type Category,
  type Product,
} from '@/db'
import { useFeatureFlag } from '@/hooks/use-feature-flag'
import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/format'
import { useSessionStore } from '@/stores'

interface ProductsPageProps {
  businessType: BusinessType
}

export function ProductsPage({ businessType }: ProductsPageProps) {
  const { t } = useI18n()
  const role = useSessionStore((s) => s.role)
  const openPinModal = useSessionStore((s) => s.openPinModal)

  const categories = useLiveQuery(
    () => db.categories.orderBy('sortOrder').toArray(),
    [],
  )
  const products = useLiveQuery(() => db.products.orderBy('name').toArray(), [])

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [stockInOpen, setStockInOpen] = useState(false)
  const [stockInProductId, setStockInProductId] = useState<string | null>(null)

  const settings = useLiveQuery(() => db.settings.get('shop'), [])
  const minStockAlert = settings?.minStockAlert ?? 5
  const inventoryEnabled = useFeatureFlag('enableInventory')
  const showStockIn = businessType === 'retail' && inventoryEnabled

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>()
    for (const c of categories ?? []) map.set(c.id, c)
    return map
  }, [categories])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (products ?? []).filter((p) => {
      if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      )
    })
  }, [products, search, categoryFilter])

  function requireOwner(action: () => void) {
    if (role !== 'owner') {
      openPinModal(null)
      toast.error(t('ownerRequiredPrices'))
      return
    }
    action()
  }

  async function onDeleteProduct(id: string) {
    if (!window.confirm(t('deleteConfirm'))) return
    requireOwner(async () => {
      await deleteProduct(id)
      toast.success(t('deleted'))
    })
  }

  async function onDeleteCategory(id: string) {
    if (!window.confirm(t('deleteConfirm'))) return
    requireOwner(async () => {
      try {
        await deleteCategory(id)
        toast.success(t('deleted'))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="max-w-sm"
          placeholder={t('searchProducts')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="ms-auto flex flex-wrap gap-2">
          {showStockIn ? (
            <Button
              variant="outline"
              onClick={() => {
                setStockInProductId(null)
                setStockInOpen(true)
              }}
            >
              <PackagePlus className="h-4 w-4" />
              {t('stockIn')}
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={() => {
              setEditingCategory(null)
              setCategoryDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            {t('addCategory')}
          </Button>
          <Button
            onClick={() =>
              requireOwner(() => {
                setEditingProduct(null)
                setProductDialogOpen(true)
              })
            }
          >
            <Plus className="h-4 w-4" />
            {t('addProduct')}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Button
          size="sm"
          variant={categoryFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setCategoryFilter('all')}
        >
          {t('allCategories')}
        </Button>
        {(categories ?? []).map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={categoryFilter === c.id ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setCategoryFilter(c.id)}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: c.color }}
            />
            {c.name}
            <Pencil
              className="h-3 w-3 opacity-60"
              onClick={(e) => {
                e.stopPropagation()
                requireOwner(() => {
                  setEditingCategory(c)
                  setCategoryDialogOpen(true)
                })
              }}
            />
            <Trash2
              className="h-3 w-3 opacity-60"
              onClick={(e) => {
                e.stopPropagation()
                void onDeleteCategory(c.id)
              }}
            />
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-muted-foreground">
          {t('noProducts')}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => {
            const category = categoryMap.get(product.categoryId)
            const lowStock =
              product.trackStock &&
              product.stock !== null &&
              product.stock <= minStockAlert
            return (
              <div
                key={product.id}
                className="flex gap-3 rounded-xl border bg-white p-3 shadow-sm"
              >
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg text-lg font-bold text-white"
                  style={{ backgroundColor: product.color }}
                >
                  {product.imageBase64 ? (
                    <img
                      src={product.imageBase64}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    product.name.slice(0, 1)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {category?.name ?? '—'}
                        {product.sku ? ` · ${product.sku}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {showStockIn ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          title={t('stockIn')}
                          onClick={() => {
                            setStockInProductId(product.id)
                            setStockInOpen(true)
                          }}
                        >
                          <PackagePlus className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() =>
                          requireOwner(() => {
                            setEditingProduct(product)
                            setProductDialogOpen(true)
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => void onDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {formatMoney(product.price)}
                    </span>
                    {product.variants.length > 0 ? (
                      <Badge variant="secondary">
                        {product.variants.length} {t('variants')}
                      </Badge>
                    ) : null}
                    {product.trackStock ? (
                      <Badge variant={lowStock ? 'destructive' : 'outline'}>
                        {t('stock')}: {product.stock}
                      </Badge>
                    ) : null}
                    {!product.isActive ? (
                      <Badge variant="destructive">{t('inactive')}</Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
      />
      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        categories={categories ?? []}
        businessType={businessType}
      />
      {showStockIn ? (
        <StockInDialog
          open={stockInOpen}
          onOpenChange={setStockInOpen}
          preselectId={stockInProductId}
        />
      ) : null}
    </div>
  )
}
