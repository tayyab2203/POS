import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listAuditLogs, type AuditAction } from '@/db'
import { useI18n } from '@/i18n'

const ACTIONS: Array<AuditAction | 'all'> = [
  'all',
  'BILL_VOIDED',
  'DISCOUNT_APPLIED',
  'PRICE_CHANGED',
  'PIN_FAILED_ATTEMPT',
  'TOKEN_RESET',
  'DATA_RESTORED',
  'STOCK_IN',
]

export function AuditLogPanel() {
  const { t } = useI18n()
  const [action, setAction] = useState<AuditAction | 'all'>('all')
  const [limit, setLimit] = useState(100)

  const logs = useLiveQuery(
    () => listAuditLogs({ action, limit }),
    [action, limit],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('activityLog')}</CardTitle>
        <CardDescription>{t('activityLogDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Select
            value={action}
            onValueChange={(v) => setAction(v as AuditAction | 'all')}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a === 'all' ? t('allCategories') : a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(logs ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t('noAuditLogs')}
          </p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-auto">
            {(logs ?? []).map((log) => (
              <div
                key={log.id}
                className="rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{log.action}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {log.performedBy}
                  </span>
                  <span className="ms-auto text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-slate-700">{log.details}</p>
              </div>
            ))}
            {(logs ?? []).length >= limit ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setLimit((n) => n + 100)}
              >
                {t('loadMore')}
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
