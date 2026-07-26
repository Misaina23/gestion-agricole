"use client"

import { Users, Map, Leaf, Package, TrendingUp, TrendingDown, Loader2, Target, Box } from "lucide-react"
import { useDashboardStats } from "@/lib/hooks"
import { useLanguage } from "@/lib/language-context"
import { StatCard } from "./stat-card"

export function KPICards() {
  const { stats, isLoading } = useDashboardStats()
  const { t } = useLanguage()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[#c5ddf5] bg-card/95 p-4 shadow-sm dark:border-border dark:bg-card/95 animate-pulse">
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const kpiData = [
    {
      label: t("producers").toUpperCase(),
      value: stats?.producers?.total?.toLocaleString() || "0",
      trend: stats?.producers?.new_this_month ? `+${stats.producers.new_this_month}` : "+0",
      trendLabel: t("thisMonth"),
      isUp: (stats?.producers?.new_this_month || 0) >= 0,
      icon: Users,
      gradient: "from-[#1e3a5f] to-[#2d5a87]",
      iconColor: "text-[#87ceeb]",
    },
    {
      label: t("parcelsGps").toUpperCase(),
      value: stats?.parcels?.total?.toLocaleString() || "0",
      trend: stats?.parcels?.active ? `${stats.parcels.active}` : "0",
      trendLabel: t("activeParcels"),
      isUp: true,
      icon: Map,
      gradient: "from-[#87ceeb] to-[#4a90c2]",
      iconColor: "text-[#0a1628]",
    },
    {
      label: t("surface").toUpperCase(),
      value: stats?.parcels?.total_surface?.toLocaleString() || "0",
      unit: "ha",
      trend: `${stats?.parcels?.total_vanilla_trees?.toLocaleString() || 0}`,
      trendLabel: t("vanillaTrees"),
      isUp: true,
      icon: Leaf,
      gradient: "from-emerald-500 to-emerald-600",
      iconColor: "text-white",
    },
    {
      label: t("production").toUpperCase(),
      value: stats?.productions?.total_prepared_weight?.toLocaleString() || "0",
      unit: "kg",
      trend: stats?.productions?.total_revenue ? `${stats.productions.total_revenue.toLocaleString()} €` : "0",
      trendLabel: t("revenue"),
      isUp: true,
      icon: Package,
      gradient: "from-amber-500 to-amber-600",
      iconColor: "text-white",
    },
    {
      label: "CAMPAGNES",
      value: stats?.campaigns?.total?.toLocaleString() || "0",
      trend: stats?.campaigns?.active ? `${stats.campaigns.active}` : "0",
      trendLabel: "Actives",
      isUp: true,
      icon: Target,
      gradient: "from-purple-500 to-purple-600",
      iconColor: "text-white",
    },
    {
      label: "INTRANTS",
      value: stats?.inputs?.total?.toLocaleString() || "0",
      trend: stats?.inputs?.total_quantity ? `${stats.inputs.total_quantity.toLocaleString()} units` : "0",
      trendLabel: "Distribués",
      isUp: true,
      icon: Box,
      gradient: "from-indigo-500 to-indigo-600",
      iconColor: "text-white",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {kpiData.map((kpi) => (
        <StatCard
          key={kpi.label}
          title={kpi.label}
          value={kpi.value}
          unit={kpi.unit}
          footer={kpi.trendLabel ? `${kpi.trendLabel} • ${kpi.trend}` : kpi.trend}
          icon={<kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />}
        />
      ))}
    </div>
  )
}
