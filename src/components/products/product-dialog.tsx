import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createProduct,
  updateProduct,
  type BusinessType,
  type Category,
  type Product,
  type ProductUnit,
  type ProductVariant,
} from '@/db'
import { useI18n } from '@/i18n'
import { compressImageToBase64 } from '@/lib/image'
import { PRODUCT_COLORS, PRODUCT_UNITS } from '@/lib/product-colors'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores'

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  categories: Category[]
  businessType: BusinessType
}

function emptyVariant(): ProductVariant {
  return {
    id: crypto.randomUUID(),
    name: '',
    price: 0,
    costPrice: 0,
  }
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  businessType,
}: ProductDialogProps) {
  const { t, dir } = useI18n()
  const role = useSessionStore((s) => s.role)
  const openPinModal = useSessionStore((s) => s.openPinModal)

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('0')
  const [costPrice, setCostPrice] = useState('0')
  const [sku, setSku] = useState('')
  const [stock, setStock] = useState('0')
  const [trackStock, setTrackStock] = useState(businessType === 'retail')
  const [unit, setUnit] = useState<ProductUnit>('pcs')
  const [allowFractional, setAllowFractional] = useState(false)
  const [color, setColor] = useState<string>(PRODUCT_COLORS[0])
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [weightPresets, setWeightPresets] = useState('0.25, 0.5, 1')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(product?.name ?? '')
    setCategoryId(product?.categoryId ?? categories[0]?.id ?? '')
    setPrice(String(product?.price ?? 0))
    setCostPrice(String(product?.costPrice ?? 0))
    setSku(product?.sku ?? '')
    setStock(String(product?.stock ?? 0))
    setTrackStock(product?.trackStock ?? businessType !== 'food')
    setUnit(product?.unit ?? (businessType === 'bakery' ? 'kg' : 'pcs'))
    setAllowFractional(product?.allowFractional ?? businessType !== 'food')
    setColor(product?.color ?? PRODUCT_COLORS[0])
    setImageBase64(product?.imageBase64 ?? null)
    setVariants(product?.variants?.length ? product.variants : [])
    setWeightPresets(
      (product?.weightPresets?.length
        ? product.weightPresets
        : businessType === 'bakery'
          ? [0.25, 0.5, 1]
          : []
      ).join(', '),
    )
    setIsActive(product?.isActive ?? true)
  }, [open, product, categories, businessType])

  async function onImage(file: File | null) {
    if (!file) return
    try {
      const data = await compressImageToBase64(file)
      setImageBase64(data)
    } catch {
      toast.error('Image upload failed')
    }
  }

  async function save() {
    if (role !== 'owner' && product) {
      openPinModal(null)
      toast.error(t('ownerRequiredPrices'))
      return
    }
    if (!name.trim() || !categoryId) {
      toast.error(t('requiredField'))
      return
    }

    const presets = weightPresets
      .split(',')
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v) && v > 0)

    setSaving(true)
    try {
      const payload = {
        categoryId,
        name,
        price: Number(price) || 0,
        costPrice: Number(costPrice) || 0,
        sku,
        stock: trackStock ? Number(stock) || 0 : null,
        trackStock,
        unit,
        allowFractional,
        weightPresets: presets,
        imageBase64,
        color,
        variants: variants.filter((v) => v.name.trim()),
        isActive,
      }

      if (product) {
        await updateProduct(product.id, payload)
      } else {
        await createProduct(payload)
      }
      toast.success(t('productSaved'))
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={dir}
        className="max-h-[90vh] max-w-lg overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>
            {product ? t('editProduct') : t('addProduct')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border"
              style={{ backgroundColor: color }}
            >
              {imageBase64 ? (
                <img
                  src={imageBase64}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlus className="h-6 w-6 text-white/80" />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-image">{t('uploadImage')}</Label>
              <Input
                id="product-image"
                type="file"
                accept="image/*"
                onChange={(e) => void onImage(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('productName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{t('category')}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder={t('category')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('price')}</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('costPrice')}</Label>
              <Input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('sku')}</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('unit')}</Label>
              <Select
                value={unit}
                onValueChange={(v) => setUnit(v as ProductUnit)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={trackStock}
                onChange={(e) => setTrackStock(e.target.checked)}
              />
              {t('trackStock')}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allowFractional}
                onChange={(e) => setAllowFractional(e.target.checked)}
              />
              {t('fractionalQty')}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              {t('active')}
            </label>
          </div>

          {trackStock ? (
            <div className="space-y-2">
              <Label>{t('stock')}</Label>
              <Input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          ) : null}

          {(businessType === 'bakery' || allowFractional) && (
            <div className="space-y-2">
              <Label>{t('weightPresets')}</Label>
              <Input
                value={weightPresets}
                onChange={(e) => setWeightPresets(e.target.value)}
                placeholder="0.25, 0.5, 1"
              />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('variants')}</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setVariants((v) => [...v, emptyVariant()])}
              >
                <Plus className="h-4 w-4" />
                {t('addVariant')}
              </Button>
            </div>
            {variants.map((variant, index) => (
              <div key={variant.id} className="grid grid-cols-[1fr_80px_80px_36px] gap-2">
                <Input
                  placeholder={t('variantName')}
                  value={variant.name}
                  onChange={(e) =>
                    setVariants((rows) =>
                      rows.map((row, i) =>
                        i === index ? { ...row, name: e.target.value } : row,
                      ),
                    )
                  }
                />
                <Input
                  type="number"
                  placeholder={t('price')}
                  value={variant.price}
                  onChange={(e) =>
                    setVariants((rows) =>
                      rows.map((row, i) =>
                        i === index
                          ? { ...row, price: Number(e.target.value) || 0 }
                          : row,
                      ),
                    )
                  }
                />
                <Input
                  type="number"
                  placeholder={t('costPrice')}
                  value={variant.costPrice}
                  onChange={(e) =>
                    setVariants((rows) =>
                      rows.map((row, i) =>
                        i === index
                          ? { ...row, costPrice: Number(e.target.value) || 0 }
                          : row,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setVariants((rows) => rows.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>{t('color')}</Label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    'h-8 w-8 rounded-full border-2',
                    color === c ? 'border-slate-900 scale-110' : 'border-transparent',
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button disabled={saving} onClick={() => void save()}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
