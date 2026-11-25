import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DateRangeToolbar } from '@/components/date-range-toolbar'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import {
  createExpense,
  deleteExpense,
  EXPENSE_CATEGORIES,
  listExpenses,
} from '@/db'
import { useI18n } from '@/i18n'
import { type DatePreset, PAGE_SIZE, presetToRange } from '@/lib/date-range'
import { formatMoney, todayKey } from '@/lib/format'

export function ExpensesPage() {
  const { t, dir } = useI18n()
  const initial = presetToRange('today')
  const [preset, setPreset] = useState<DatePreset>('today')
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [limit, setLimit] = useState(PAGE_SIZE)

  const expenses = useLiveQuery(
    () => listExpenses({ from, to, limit }),
    [from, to, limit],
  )
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const rows = expenses ?? []
  const today = todayKey()
  const todayTotal = rows
    .filter((e) => (e.localDate || e.createdAt.slice(0, 10)) === today)
    .reduce((sum, e) => sum + e.amount, 0)
  const canLoadMore = rows.length >= limit

  async function save() {
    if (!title.trim() || !amount) {
      toast.error(t('requiredField'))
      return
    }
    setSaving(true)
    try {
      await createExpense({
        title,
        category,
        amount: Number(amount) || 0,
        paymentMethod,
        note,
      })
      toast.success(t('settingsSaved'))
      setOpen(false)
      setTitle('')
      setAmount('')
      setNote('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm(t('deleteConfirm'))) return
    await deleteExpense(id)
    toast.success(t('deleted'))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{t('expenses')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('today')}: {formatMoney(todayTotal)}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('addExpense')}
        </Button>
      </div>

      <DateRangeToolbar
        preset={preset}
        from={from}
        to={to}
        onPresetChange={(p) => {
          setPreset(p)
          setLimit(PAGE_SIZE)
        }}
        onFromChange={(v) => {
          setFrom(v)
          setLimit(PAGE_SIZE)
        }}
        onToChange={(v) => {
          setTo(v)
          setLimit(PAGE_SIZE)
        }}
        count={rows.length}
      />

      {rows.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-muted-foreground">
          {t('noExpenses')}
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center gap-3 rounded-xl border bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{expense.title}</span>
                  <Badge variant="secondary">{expense.category}</Badge>
                  <Badge variant="outline">{expense.paymentMethod}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(expense.createdAt).toLocaleString()}
                  {expense.note ? ` · ${expense.note}` : ''}
                </p>
              </div>
              <div className="font-semibold">{formatMoney(expense.amount)}</div>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive"
                onClick={() => void onDelete(expense.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {canLoadMore ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLimit((n) => n + PAGE_SIZE)}
            >
              {t('loadMore')}
            </Button>
          ) : null}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{t('addExpense')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t('expenseTitle')}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('expenseCategory')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('amount')}</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  {t('cash')} / {t('onlinePay')}
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) =>
                    setPaymentMethod(v as 'cash' | 'online')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{t('cash')}</SelectItem>
                    <SelectItem value="online">{t('onlinePay')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('note')}</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
