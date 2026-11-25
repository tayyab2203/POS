import { useLiveQuery } from 'dexie-react-hooks'
import { CloudOff, Loader2, RefreshCw, Wifi } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { db } from '@/db'
import { useI18n } from '@/i18n'
import { isSupabaseConfigured } from '@/lib/supabase'
import { runSyncNow, subscribeSyncEngine } from '@/services/syncEngine'
import { useNetworkStore } from '@/stores'
import { useAuthStore } from '@/stores/auth-store'

export function NetworkStatusPill() {
  const { t } = useI18n()
  const isOnline = useNetworkStore((s) => s.isOnline)
  const session = useAuthStore((s) => s.session)
  const pending = useLiveQuery(
    () => db.syncQueue.where('status').equals('pending').count(),
    [],
  )
  const pendingCount = pending ?? 0
  const [syncing, setSyncing] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    return subscribeSyncEngine((state) => {
      setSyncing(state.syncing)
      setLastError(state.lastError)
    })
  }, [])

  const canSync =
    isSupabaseConfigured &&
    !!session?.shopId &&
    session.role !== 'super_admin'

  async function onSyncNow() {
    if (!isOnline) {
      toast.error(t('offlineLocal'))
      return
    }
    const result = await runSyncNow()
    if (result.pushed > 0) {
      toast.success(`${t('syncDone')} (${result.pushed})`)
    } else {
      toast.message(t('syncIdle'))
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="outline-none">
          <Badge
            variant={isOnline ? 'success' : 'warning'}
            className="cursor-pointer gap-1.5 px-2.5 py-1 text-[11px] font-medium sm:text-xs"
          >
            {syncing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isOnline ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <CloudOff className="h-3 w-3" />
            )}
            <span className="hidden sm:inline">
              {isOnline ? t('onlineSynced') : t('offlineLocal')}
            </span>
            <span className="sm:hidden">{isOnline ? 'Online' : 'Offline'}</span>
            {pendingCount > 0 ? (
              <span className="rounded bg-black/15 px-1.5 py-0.5 tabular-nums">
                {pendingCount} {t('pendingSync')}
              </span>
            ) : null}
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <DropdownMenuLabel className="font-normal">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isOnline ? t('onlineSynced') : t('offlineLocal')}
            </p>
            <p className="text-xs text-muted-foreground">
              {pendingCount} {t('pendingSync')}
            </p>
            {lastError ? (
              <p className="text-xs text-destructive">{lastError}</p>
            ) : null}
          </div>
        </DropdownMenuLabel>
        {canSync ? (
          <>
            <DropdownMenuSeparator />
            <Button
              type="button"
              size="sm"
              className="w-full gap-2"
              disabled={syncing || !isOnline}
              onClick={() => void onSyncNow()}
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {t('syncNow')}
            </Button>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
