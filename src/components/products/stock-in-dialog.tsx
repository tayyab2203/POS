import { useLiveQuery } from 'dexie-react-hooks'
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
import { db, stockInProduct } from '@/db'
import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/format'

interface StockInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectId?: string | null
}

export function StockInDialog({
  open,
  onOpenChange,
  preselectId = null,
}: StockInDialogProps) {
  const { t, dir } = useI18n()
  const products = useLiveQuery(
    () => db.products.filter((p) => p.isActive).sortBy('name'),
    [],
  )
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [cost, setCost] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setProductId(preselectId ?? '')
    setQty('')
    setCost('')
  }, [open, preselectId])

  const selected = (products ?? []).find((p) => p.id === productId)

  async function save() {
    if (!productId || !qty) {
      toast.error(t('requiredField'))
      return
    }
    setSaving(true)
    try {
      await stockInProduct({
        productId,
        quantity: Number(qty) || 0,
        costPrice: cost === '' ? null : Number(cost),
      })
      toast.success(t('stockInSuccess'))
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('stockIn')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t('products')}</Label>
            <Select value={productId || undefined} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectProduct')} />
              </SelectTrigger>
              <SelectContent>
                {(products ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.stock !== null ? ` · ${p.stock}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected ? (
            <p className="text-xs text-muted-foreground">
              {t('stock')}: {selected.stock ?? '—'} · {t('costPrice')}:{' '}
              {formatMoney(selected.costPrice)}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('qty')}</Label>
              <Input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t('costPrice')} ({t('optional')})
              </Label>
              <Input
                type="number"
                value={cost}
                placeholder={selected ? String(selected.costPrice) : ''}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button disabled={saving} onClick={() => void save()}>
            {t('stockIn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
