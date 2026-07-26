"use client"

import { ReactNode } from "react"

interface StatCardProps {
  title: string
  value: ReactNode
  unit?: string
  footer?: ReactNode
  icon?: ReactNode
}

export function StatCard({ title, value, unit, footer, icon }: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.1)] dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-slate-700">
              {icon}
            </div>
          ) : null}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{title}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <div className="font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
        {unit ? <div className="text-sm text-slate-500 dark:text-slate-400">{unit}</div> : null}
      </div>

      {footer ? <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{footer}</div> : null}
    </div>
  )
}
