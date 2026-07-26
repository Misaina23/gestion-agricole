"use client"

import { RefreshCw, Wifi, WifiOff, Cloud, Upload, Image, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDashboardStats, useSyncStatus } from "@/lib/hooks"

export function SyncStatus() {
  const { stats, isLoading: statsLoading } = useDashboardStats()
  const { syncStatus, isLoading: syncLoading, refresh } = useSyncStatus()

  const isLoading = statsLoading || syncLoading

  const activeAgents = stats?.agents?.active ?? 0
  const totalAgents = stats?.agents?.total ?? 0
  const offlineAgents = Math.max(totalAgents - activeAgents, 0)
  const pendingSync = syncStatus?.pending_sync ?? 0
  const lastSyncLabel = syncStatus?.last_sync
    ? new Date(syncStatus.last_sync).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    : 'Jamais'
  const isOnline = syncStatus?.is_online ?? false

  const pendingSyncItems = [
    { label: "En attente de sync", count: pendingSync, icon: Cloud, color: "bg-amber-500 text-white" },
    { label: "Agents actifs", count: activeAgents, icon: Users, color: "bg-[#1e3a5f] text-white" },
    { label: "Agents hors ligne", count: offlineAgents, icon: WifiOff, color: "bg-[#f59e0b] text-white" },
  ]

  return (
    <div className="panel-surface p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f4fc]">
            <RefreshCw className="h-5 w-5 text-[#1e3a5f]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Synchronisation Terrain</h3>
            <p className="text-xs text-muted-foreground">Dernier sync : {isLoading ? '...' : lastSyncLabel}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${isOnline ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-emerald-400 opacity-75 animate-ping' : 'bg-red-400 opacity-75'}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </span>
          <span className="text-xs font-medium">{isOnline ? 'Connecté' : 'Déconnecté'}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="h-28 animate-pulse rounded-2xl bg-muted" />
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-card/95 p-4 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-background/60">
              <div className="mb-2 flex items-center gap-2">
                <Wifi className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-muted-foreground">En ligne</span>
              </div>
              <div className="text-2xl font-bold text-foreground">{activeAgents}</div>
              <div className="text-xs text-muted-foreground">agents synchronisés</div>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-card/95 p-4 dark:border-amber-900/50 dark:from-amber-950/40 dark:to-background/60">
              <div className="mb-2 flex items-center gap-2">
                <WifiOff className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">Hors ligne</span>
              </div>
              <div className="text-2xl font-bold text-amber-700">{offlineAgents}</div>
              <div className="text-xs text-muted-foreground">agents en attente</div>
            </div>
          </div>

          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Données en attente</div>

          <div className="space-y-2">
            {pendingSyncItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 p-3 transition-colors hover:bg-accent/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
                <span className="rounded-full bg-background px-3 py-1 font-mono text-sm font-semibold text-foreground shadow-sm">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <Button onClick={() => refresh()} className="mt-5 w-full gap-2">
        <Upload className="h-4 w-4" />
        Rafraîchir
      </Button>
    </div>
  )
}
