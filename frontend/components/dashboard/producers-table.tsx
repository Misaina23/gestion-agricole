// @ts-nocheck
"use client"

import { Users, Eye, Edit, MoreHorizontal, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDashboardStats } from "@/lib/hooks"
import { useLanguage } from "@/lib/language-context"

const statusStyles = {
  active: { labelKey: "active", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pending: { labelKey: "pending", class: "bg-amber-100 text-amber-700 border-amber-200" },
  inactive: { labelKey: "inactive", class: "bg-slate-100 text-slate-700 border-slate-200" },
  alert: { labelKey: "alert", class: "bg-red-100 text-red-700 border-red-200" },
}

interface ProducersTableProps {
  onNavigate?: (item: string, params?: Record<string, string>) => void
}

export function ProducersTable({ onNavigate }: ProducersTableProps) {
  const { stats, isLoading } = useDashboardStats()
  const { t } = useLanguage()
  const producers = stats?.recent_producers ?? []
  const handleNavigateProducers = () => onNavigate?.('producers')
  const handleNavigateProducerDetail = (id: number) => onNavigate?.('producers', { producer: id.toString(), action: 'view' })
  const handleNavigateProducerEdit = (id: number) => onNavigate?.('producers', { producer: id.toString(), action: 'edit' })
  return (
    <div className="panel-surface p-6">
      <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f4fc]">
            <Users className="h-5 w-5 text-[#1e3a5f]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t("recentProducers")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? t("loading") : `${producers.length} ${t("lastRegistered")}`}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleNavigateProducers}>
          <Plus className="h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))
        ) : producers.length > 0 ? (
          producers.map((producer) => (
            <div
              key={producer.code}
              className="group flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 p-3 transition-colors hover:bg-accent/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f4fc] text-sm font-bold text-[#1e3a5f]">
                  {producer.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {producer.name}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {producer.code}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {producer.region_name || t("unknownRegion")} • {producer.parcels_count} {t("parcels")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background text-sm font-bold text-foreground shadow-sm">
                    {producer.parcels_count}
                  </span>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    statusStyles[producer.status as keyof typeof statusStyles]?.class ?? 'border-border bg-muted text-muted-foreground'
                  }`}
                >
                  {t(statusStyles[producer.status as keyof typeof statusStyles]?.labelKey as any) ?? t("user")}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleNavigateProducerDetail(producer.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      {t("viewDetails")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigateProducerEdit(producer.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t("edit")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">{t("noRecentProducers")}</div>
        )}
      </div>

      <Button variant="ghost" className="mt-4 w-full text-foreground hover:bg-accent/40" onClick={handleNavigateProducers}>
        {t("viewAllProducers")}
      </Button>
    </div>
  )
}
