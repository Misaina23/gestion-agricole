"use client"

import { useState } from "react"
import { History as HistoryIcon, Search, Filter, Trash2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuditLogs } from "@/lib/hooks"
import { auditLogsApi } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"
import { useAuth } from "@/lib/auth-context"
import { confirmDelete, successAlert, errorAlert, baseConfig } from "@/lib/sweetalert"
import Swal from "sweetalert2"

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  UPDATE: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  LOGIN: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  LOGIN_FAILED: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  LOGOUT: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300",
  EXPORT: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  SYNC: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
}

const MODULES = [
  "producers", "parcels", "productions", "deliveries", "inputs",
  "campaigns", "inspections", "accounts", "auth", "core",
]

export default function HistoryPage() {
  const { t } = useLanguage()
  const { isSupervisorOrAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [isResetting, setIsResetting] = useState(false)

  const params: Record<string, string> = { page_size: "15", page: String(page) }
  if (search) params.search = search
  if (moduleFilter !== "all") params.module = moduleFilter
  if (actionFilter !== "all") params.action = actionFilter

  const { logs, total, isLoading, refresh } = useAuditLogs(params)
  const totalPages = Math.max(1, Math.ceil((total || 0) / 15))

  const handleResetHistory = async () => {
    const { value: password } = await Swal.fire({
      ...baseConfig(),
      title: "Confirmer la réinitialisation",
      text: "Entrez votre mot de passe de connexion pour confirmer cette action irréversible.",
      icon: "warning",
      input: "password",
      inputLabel: "Mot de passe",
      inputPlaceholder: "Votre mot de passe",
      showCancelButton: true,
      confirmButtonText: "Réinitialiser",
      cancelButtonText: "Annuler",
      reverseButtons: true,
      focusCancel: true,
      inputValidator: (value: string | undefined) => {
        if (!value || !value.trim()) return "Le mot de passe est requis"
        return null
      },
    })

    if (!password) return

    const ok = await confirmDelete("Tout l'historique sera définitivement supprimé. Cette action est irréversible.")
    if (!ok) return

    setIsResetting(true)
    try {
      await auditLogsApi.resetHistory(password)
      successAlert("Succès", "L'historique a été réinitialisé avec succès.")
      refresh()
      setPage(1)
    } catch (error: any) {
      errorAlert("Erreur", error?.message || "Impossible de réinitialiser l'historique.")
    } finally {
      setIsResetting(false)
    }
  }

  const fmtValue = (v: Record<string, any> | null) => {
    if (!v) return "-"
    const keys = Object.keys(v)
    if (keys.length === 0) return "-"
    return keys
      .slice(0, 4)
      .map((k) => `${k}: ${String(v[k])}`)
      .join(", ")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <HistoryIcon className="h-6 w-6 text-primary" />
            {t("history")}
          </h1>
          <p className="text-sm text-muted-foreground">
            Journal d&apos;activité et traçabilité des actions du système
          </p>
        </div>
        {isSupervisorOrAdmin && (
          <Button
            variant="destructive"
            onClick={handleResetHistory}
            disabled={isResetting}
            className="gap-2"
          >
            {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Réinitialiser l'historique
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher (utilisateur, module, élément...)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
        <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[170px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous modules</SelectItem>
            {MODULES.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[170px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes actions</SelectItem>
            {Object.keys(ACTION_STYLES).map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-foreground">Date & heure</TableHead>
              <TableHead className="text-foreground">Utilisateur</TableHead>
              <TableHead className="text-foreground">Action</TableHead>
              <TableHead className="text-foreground">Module</TableHead>
              <TableHead className="text-foreground">Élément</TableHead>
              <TableHead className="text-foreground">Ancienne → Nouvelle valeur</TableHead>
              <TableHead className="text-foreground">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Aucune activité enregistrée
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/40">
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {log.user_name || log.user_username || "Système"}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_STYLES[log.action] || "bg-muted text-muted-foreground"}`}>
                      {log.action_display || log.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.module}</TableCell>
                  <TableCell className="text-sm text-foreground">{log.object_repr || "-"}</TableCell>
                  <TableCell className="max-w-[280px] text-xs text-muted-foreground">
                    <span className="text-red-600 dark:text-red-400">{fmtValue(log.old_value)}</span>
                    {log.old_value && log.new_value && " → "}
                    <span className="text-emerald-600 dark:text-emerald-400">{fmtValue(log.new_value)}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.ip_address || "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} ({total} entrées)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
