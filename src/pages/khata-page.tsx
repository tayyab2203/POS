import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Wallet } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  createCustomer,
  listCustomers,
  listKhataTransactions,
  recordWasooli,
  type Customer,
} from '@/db'
import { useI18n } from '@/i18n'
import { formatMoney } from '@/lib/format'

export function KhataPage() {
  const { t, dir } = useI18n()
  const customers = useLiveQuery(() => listCustomers(), [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [ledgerLimit, setLedgerLimit] = useState(50)
  const [addOpen, setAddOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const selected = (customers ?? []).find((c) => c.id === selectedId) ?? null
  const ledger = useLiveQuery(
    () =>
      selectedId
        ? listKhataTransactions(selectedId, { limit: ledgerLimit })
        : [],
    [selectedId, ledgerLimit],
  )

  async function addCustomer() {
    if (!name.trim()) {
      toast.error(t('requiredField'))
      return
    }
    const customer = await createCustomer({ name, phone })
    toast.success(t('settingsSaved'))
    setAddOpen(false)
    setName('')
    setPhone('')
    setSelectedId(customer.id)
  }

  async function onWasooli() {
    if (!selected) return
    const value = Number(amount)
    if (!value || value <= 0) {
      toast.error(t('requiredField'))
      return
    }
    try {
      await recordWasooli({
        customerId: selected.id,
        amount: value,
        note,
      })
      toast.success(t('settingsSaved'))
      setPayOpen(false)
      setAmount('')
      setNote('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{t('customers')}</h2>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('addCustomer')}
          </Button>
        </div>

        {(customers ?? []).length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground">
            {t('noCustomers')}
          </div>
        ) : (
          <div className="space-y-2">
            {(customers ?? []).map((customer) => (
              <CustomerRow
                key={customer.id}
                customer={customer}
                active={customer.id === selectedId}
                onSelect={() => {
                  setSelectedId(customer.id)
                  setLedgerLimit(50)
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-4">
        {!selected ? (
          <p className="py-16 text-center text-muted-foreground">
            {t('selectCustomer')}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{selected.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selected.phone || '—'}
                </p>
              </div>
              <div className="text-end">
                <p className="text-xs text-muted-foreground">{t('balance')}</p>
                <p className="text-xl font-bold text-amber-700">
                  {formatMoney(selected.balance)}
                </p>
              </div>
            </div>

            <Button className="w-full sm:w-auto" onClick={() => setPayOpen(true)}>
              <Wallet className="h-4 w-4" />
              {t('wasooli')} / {t('recordPayment')}
            </Button>

            <div>
              <h4 className="mb-2 text-sm font-semibold">{t('ledger')}</h4>
              <ScrollArea className="h-[420px] rounded-lg border">
                <div className="divide-y">
                  {(ledger ?? []).length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      —
                    </p>
                  ) : (
                    (ledger ?? []).map((txn) => (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                txn.type === 'debit' ? 'warning' : 'success'
                              }
                            >
                              {txn.type === 'debit' ? t('debit') : t('credit')}
                            </Badge>
                            <span>{txn.note || '—'}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(txn.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="font-semibold">
                          {txn.type === 'debit' ? '+' : '−'}
                          {formatMoney(txn.amount)}
                        </span>
                      </div>
                    ))
                  )}
                  {(ledger ?? []).length >= ledgerLimit ? (
                    <div className="p-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={() => setLedgerLimit((n) => n + 50)}
                      >
                        {t('loadMore')}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>{t('addCustomer')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t('customerName')}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{t('shopPhone')}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={() => void addCustomer()}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent dir={dir}>
          <DialogHeader>
            <DialogTitle>
              {t('wasooli')} — {selected?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>{t('amount')}</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('note')}</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={() => void onWasooli()}>{t('confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CustomerRow({
  customer,
  active,
  onSelect,
}: {
  customer: Customer
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-xl border p-3 text-start transition ${
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'bg-white hover:border-slate-400'
      }`}
    >
      <div>
        <div className="font-medium">{customer.name}</div>
        <div className={`text-xs ${active ? 'text-white/70' : 'text-muted-foreground'}`}>
          {customer.phone || '—'}
        </div>
      </div>
      <div className="font-semibold">{formatMoney(customer.balance)}</div>
    </button>
  )
}
