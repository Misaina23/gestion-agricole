"use client"

import { useState, useEffect } from "react"
import { Loader2, Repeat, CheckCircle, XCircle, MessageSquare, RefreshCw, GitBranch, User, Clock } from "lucide-react"
import { workflowsApi } from "@/lib/api"
import { toast } from "sonner"

interface WorkflowInstance {
  id: number
  workflow_step: number
  step_name?: string
  entity_type: string
  entity_id: number
  status: string
  current_step: number
  initiated_by?: number
  initiated_by_name?: string
  assigned_to?: number
  assigned_to_name?: string
  comment?: string
  action?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    setLoading(true)
    try {
      const [data, statsRes] = await Promise.all([
        workflowsApi.instances(),
        workflowsApi.stats().catch(() => null),
      ])
      setWorkflows(data)
      setStats(statsRes)
    } catch (e) {
      toast.error("Erreur lors du chargement des workflows")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      in_progress: 'En cours',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      cancelled: 'Annulé',
    }
    return labels[status] || status
  }

  const pending = workflows.filter(w => w.status === 'pending').length
  const inProgress = workflows.filter(w => w.status === 'in_progress').length
  const approved = workflows.filter(w => w.status === 'approved').length
  const rejected = workflows.filter(w => w.status === 'rejected').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Repeat className="w-6 h-6 text-[#1e3a5f]" />
          <h1 className="text-2xl font-bold text-[#0a1628]">Workflow de validation</h1>
        </div>
        <button
          onClick={loadWorkflows}
          className="p-2 rounded-lg bg-white border border-[#c5ddf5] hover:bg-[#e8f4fc]"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4 text-[#1e3a5f]" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#e8f4fc] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">En attente</p>
              <p className="text-2xl font-bold text-[#0a1628]">{pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e8f4fc] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">En cours</p>
              <p className="text-2xl font-bold text-[#0a1628]">{inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e8f4fc] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">Approuves</p>
              <p className="text-2xl font-bold text-[#0a1628]">{approved}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e8f4fc] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <XCircle className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">Rejetes</p>
              <p className="text-2xl font-bold text-[#0a1628]">{rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {workflows.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#c5ddf5] p-8 text-center">
          <Repeat className="w-12 h-12 text-[#5a7a9a] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#0a1628] mb-2">Aucun workflow en attente</h3>
          <p className="text-sm text-[#5a7a9a] mb-4">
            Les validations et approbations circulent ici. Chaque entite (production, parcelle, livraison...) suit un flux multi-etapes.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-[#5a7a9a]">
            <User className="w-4 h-4" />
            <span>Agent → Chef zone → Superviseur → Admin</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e8f4fc] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8f4fc]">
                <th className="px-4 py-3 text-left text-sm font-semibold">Entité</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Étape actuelle</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Statut</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Assigné à</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map(wf => (
                <tr key={wf.id} className="border-b border-[#e8f4fc] last:border-0">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-[#0a1628]">{wf.step_name || wf.entity_type}</p>
                      <p className="text-xs text-[#5a7a9a]">#{wf.entity_id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Étape {wf.current_step + 1}</span>
                      <span className="text-xs text-[#5a7a9a]">/ Agent → Chef zone → Superviseur → Admin</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(wf.status)}`}>
                      {getStatusLabel(wf.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-[#5a7a9a]" />
                      <span className="text-sm">{wf.assigned_to_name || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-[#5a7a9a]" />
                      <span className="text-sm">{new Date(wf.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
