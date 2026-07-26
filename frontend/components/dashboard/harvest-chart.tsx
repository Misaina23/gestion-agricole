"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { BarChart3, TrendingUp } from "lucide-react"
import { useDashboardStats } from "@/lib/hooks"

export function HarvestChart() {
  const { stats, isLoading } = useDashboardStats()

  const chartData = stats?.monthly_harvest?.length
    ? stats.monthly_harvest.map((item) => ({
        month: item.month,
        value: item.prepared_weight,
        previous: item.green_weight,
      }))
    : []

  const totalWeight = stats?.productions?.total_prepared_weight ?? 0
  const totalGreen = stats?.productions?.total_green_weight ?? 0
  const goal = stats?.current_season?.target_weight ?? 0
  const growth =
    totalGreen > 0
      ? ((totalWeight - totalGreen) / totalGreen * 100).toFixed(1)
      : "0.0"

  const hasData = chartData.some(
    (d) => d.value > 0 || d.previous > 0
  )

  return (
    <div className="panel-surface p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f4fc]">
            <BarChart3 className="h-5 w-5 text-[#1e3a5f]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Récoltes Mensuelles
            </h3>
            <p className="text-xs text-muted-foreground">
              {stats?.current_season?.name || "Campagne en cours"}
            </p>
          </div>
        </div>
        {hasData && (
          <div
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${
              Number(growth) >= 0
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-red-500/10 text-red-600"
            }`}
          >
            <TrendingUp
              className={`h-4 w-4 ${
                Number(growth) < 0 ? "rotate-180" : ""
              }`}
            />
            <span className="text-sm font-semibold">
              {Number(growth) >= 0 ? "+" : ""}
              {growth}%
            </span>
          </div>
        )}
      </div>

      <div className="mb-4 flex gap-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gradient-to-r from-sky-500 to-slate-800" />
          <span className="text-xs text-muted-foreground">Préparé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-muted" />
          <span className="text-xs text-muted-foreground">Vert</span>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
              }
            />
            <Tooltip
              contentStyle={{
                background: "linear-gradient(135deg, var(--color-primary), var(--color-slate-900))",
                border: "none",
                borderRadius: "12px",
                color: "white",
                fontSize: "12px",
                padding: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
              }}
              cursor={{ fill: "var(--color-accent)", radius: 4 }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString()} kg`,
                name,
              ]}
            />
            <Bar
              dataKey="previous"
              fill="var(--color-muted)"
              radius={[4, 4, 0, 0]}
              name="Vert"
            />
            <Bar
              dataKey="value"
              fill="url(#colorGradient)"
              radius={[4, 4, 0, 0]}
              name="Préparé"
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a90c2" />
                <stop offset="100%" stopColor="#1e3a5f" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4">
        <div>
          <p className="text-xs text-muted-foreground">Total saison</p>
          <p className="text-lg font-semibold text-foreground">
            {isLoading
              ? "..."
              : `${totalWeight.toLocaleString()} kg`}
          </p>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "..."
              : `${totalGreen.toLocaleString()} kg en vert`}
          </p>
        </div>
        {goal > 0 && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Objectif</p>
            <p className="text-lg font-semibold text-primary">
              {goal.toLocaleString()} kg
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
