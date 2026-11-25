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
import { useI18n } from '@/i18n'

interface CustomItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (item: { name: string; price: number }) => void
}

export function CustomItemDialog({
  open,
  onOpenChange,
  onConfirm,
}: CustomItemDialogProps) {
  const { t, dir } = useI18n()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setPrice('')
    }
  }, [open])

  function submit() {
    const trimmed = name.trim()
    const value = Number(price)
    if (!trimmed || !value || value <= 0) return
    onConfirm({ name: trimmed, price: value })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={dir} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('customItem')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t('productName')}</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('price')}</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={submit}>{t('addToCart')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
