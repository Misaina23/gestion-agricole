"use client"

import { useMemo } from "react"
import { MapPin, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { useDashboardStats } from "@/lib/hooks"
import { useLanguage } from "@/lib/language-context"

const statusHighlights = [
  { labelKey: "validated", key: "passed", icon: CheckCircle2, color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
  { labelKey: "waiting", key: "pending", icon: Clock, color: "bg-amber-50 border-amber-100 text-amber-700" },
  { labelKey: "alerts", key: "failed", icon: AlertTriangle, color: "bg-red-50 border-red-100 text-red-700" },
]

export function RegionStats() {
  const { stats, isLoading } = useDashboardStats()
  const { t } = useLanguage()

  const regions = stats?.regions ?? []
  const totalProducers = useMemo(
    () => regions.reduce((acc, region) => acc + region.producers, 0),
    [regions]
  )

  return (
    <div className="panel-surface p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f4fc]">
            <MapPin className="h-5 w-5 text-[#1e3a5f]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("dashboardOverview")}</h3>
            <p className="text-xs text-muted-foreground">{isLoading ? t("loading") : `${totalProducers} ${t("activeProducers")}`}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 rounded-full bg-muted" />
              <div className="h-3 w-3/4 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {regions.length > 0 ? (
            regions.map((region) => {
              const percentage = totalProducers > 0 ? Math.round((region.producers / totalProducers) * 100) : 0
              const color = region.name === 'Sava' ? '#1e3a5f' : '#4a90c2'

              return (
                <div key={region.name} className="group">
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-sm font-medium text-foreground">{region.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">{region.producers}</span>
                      <span className="text-xs text-muted-foreground">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}dd)`,
                      }}
                    />
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-sm text-muted-foreground">{t("noRegionalData")}</div>
          )}
        </div>
      )}

      <div className="mt-6 border-t border-border/70 pt-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{t("recentInspections")}</div>
        <div className="grid grid-cols-3 gap-2">
          {statusHighlights.map((status) => {
            const count = stats?.inspections?.[status.key as keyof typeof stats.inspections] ?? 0
            const Icon = status.icon

            return (
              <div key={status.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${status.color}`}>
                <Icon className="w-4 h-4" />
                <div>
                  <span className="text-sm font-bold">{count}</span>
                  <p className="text-[10px]">{t(status.labelKey as any)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
