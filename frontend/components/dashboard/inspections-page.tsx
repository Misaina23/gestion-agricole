"use client"

import { useState, useEffect } from "react"
import {
  ClipboardCheck,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react"
import { StatCard } from "./stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { confirmDelete, successAlert, errorAlert } from "@/lib/sweetalert"
import { useInspections, useInspectionStats, useProducers, useParcels, useUsers } from "@/lib/hooks"
import { inspectionsApi } from "@/lib/api"

interface Inspection {
  id: number
  code: string
  producer: number
  producer_name?: string
  producer_code?: string
  parcel: number
  parcel_code?: string
  inspector: number
  inspector_name?: string
  actual_date: string
  inspection_type?: "initial" | "followup" | "certification"
  result?: "passed" | "failed" | "pending" | "conditional"
  score: number
  observations: string
  next_inspection: string | null
}

const inspection_typeConfig = {
  initial: { label: "Initiale", class: "bg-[#e8f4fc] text-[#1e3a5f] border-[#c5ddf5]" },
  followup: { label: "Suivi", class: "bg-amber-100 text-amber-700 border-amber-200" },
  certification: { label: "Certification", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
}

const resultConfig = {
  passed: { label: "Validee", class: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  failed: { label: "Rejetee", class: "bg-red-100 text-red-700", icon: XCircle },
  pending: { label: "En attente", class: "bg-[#e8f4fc] text-[#1e3a5f]", icon: Clock },
  conditional: { label: "Conditionnelle", class: "bg-amber-100 text-amber-700", icon: AlertTriangle },
}

export function InspectionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [inspection_typeFilter, setTypeFilter] = useState<string>("all")
  const [resultFilter, setResultFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    producer: "",
    parcel: "",
    inspector: "",
    actual_date: "",
    inspection_type: "",
    result: "pending",
    score: "",
    observations: "",
  })

  const { stats: inspectionStats } = useInspectionStats()

  const params: Record<string, string> = { page_size: "4" }
  if (searchQuery) params.search = searchQuery
  if (inspection_typeFilter !== "all") params.inspection_type = inspection_typeFilter
  if (resultFilter !== "all") params.result = resultFilter
  params.page = currentPage.toString()

  const { inspections, total, isLoading, refresh } = useInspections(params)
  const { producers = [] } = useProducers({ page_size: "1000" })
  const { parcels = [] } = useParcels({ page_size: "1000" })
  const { data: users = [] } = useUsers()
  const totalPages = Math.max(1, Math.ceil((total || 0) / 4))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, inspection_typeFilter, resultFilter])

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await inspectionsApi.exportExcel({ search: searchQuery })
      toast.success("Export Excel réussi")
    } catch {
      toast.error("Erreur lors de l'export Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPdf = async () => {
    setIsExporting(true)
    try {
      await inspectionsApi.exportPdf({ search: searchQuery })
      toast.success("Export PDF réussi")
    } catch {
      toast.error("Erreur lors de l'export PDF")
    } finally {
      setIsExporting(false)
    }
  }

  const handleAdd = async () => {
    setIsSubmitting(true)
    try {
      await inspectionsApi.create({
        producer: parseInt(formData.producer),
        parcel: parseInt(formData.parcel),
        inspector: parseInt(formData.inspector),
        actual_date: formData.actual_date,
        inspection_type: formData.inspection_type,
        result: formData.result,
        score: parseInt(formData.score) || 0,
        observations: formData.observations,
      })
      toast.success("Inspection ajoutee avec succes")
      refresh()
      setFormData({ producer: "", parcel: "", inspector: "", actual_date: "", inspection_type: "", result: "pending", score: "", observations: "" })
      setIsAddDialogOpen(false)
    } catch {
      toast.error("Erreur lors de l&apos;ajout")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedInspection) return
    setIsSubmitting(true)
    try {
      await inspectionsApi.update(selectedInspection.id, {
        inspector: parseInt(formData.inspector),
        actual_date: formData.actual_date,
        inspection_type: formData.inspection_type,
        result: formData.result,
        score: parseInt(formData.score) || 0,
        observations: formData.observations,
      })
      toast.success("Inspection modifiee avec succes")
      refresh()
      setIsEditDialogOpen(false)
      setSelectedInspection(null)
    } catch {
      toast.error("Erreur lors de la modification")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedInspection) return
    setIsSubmitting(true)
    try {
      await inspectionsApi.delete(selectedInspection.id)
      successAlert("Suppression réussie", "L'inspection a été supprimée.")
      refresh()
      setIsDeleteDialogOpen(false)
      setSelectedInspection(null)
    } catch {
      errorAlert("Erreur", "Impossible de supprimer l'inspection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (inspection: Inspection) => {
    setSelectedInspection(inspection)
    setFormData({
      producer: inspection.producer.toString(),
      parcel: inspection.parcel.toString(),
      inspector: inspection.inspector.toString(),
      actual_date: inspection.actual_date,
      inspection_type: inspection.inspection_type,
      result: inspection.result,
      score: inspection.score.toString(),
      observations: inspection.observations,
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (inspection: Inspection) => {
    setSelectedInspection(inspection)
    setIsViewDialogOpen(true)
  }

  const openDeleteDialog = (inspection: Inspection) => {
    setSelectedInspection(inspection)
    confirmDelete("L'inspection sera définitivement supprimée.").then((ok) => {
      if (ok) handleDelete()
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-100"
    if (score >= 60) return "text-amber-600 bg-amber-100"
    if (score > 0) return "text-red-600 bg-red-100"
    return "text-[#5a7a9a] bg-[#e8f4fc]"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0a1628]">Gestion des Inspections</h1>
          <p className="text-sm text-[#5a7a9a] mt-1">
            {total} inspection{total !== 1 ? "s" : ""} enregistrée{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-[#c5ddf5] text-[#1e3a5f] hover:bg-[#e8f4fc]">
                <Download className="w-4 h-4" />
                Générer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf} disabled={isExporting}>PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouvelle Inspection
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Validees" value={inspectionStats?.by_status?.passed ?? 0} icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatCard title="En attente" value={inspectionStats?.by_status?.pending ?? 0} icon={<Clock className="w-5 h-5" />} />
        <StatCard title="Total" value={total} icon={<ClipboardCheck className="w-5 h-5" />} />
        <StatCard title="Score moyen" value={`${(inspectionStats?.avg_score ?? 0).toFixed(0)}%`} icon={<CheckCircle2 className="w-5 h-5 text-[#1e3a5f]" />} />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#c5ddf5] bg-card/95 p-4 shadow-sm dark:border-border dark:bg-card/95">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
            <Input
              placeholder="Rechercher par code, producteur ou inspecteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#c5ddf5] focus:border-[#87ceeb]"
            />
          </div>
          <div className="flex gap-2">
            <Select value={inspection_typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] border-[#c5ddf5]">
                <Filter className="w-4 h-4 mr-2 text-[#5a7a9a]" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous inspection_types</SelectItem>
                <SelectItem value="initial">Initiale</SelectItem>
                <SelectItem value="followup">Suivi</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-[140px] border-[#c5ddf5]">
                <CheckCircle2 className="w-4 h-4 mr-2 text-[#5a7a9a]" />
                <SelectValue placeholder="Resultat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous resultats</SelectItem>
                <SelectItem value="passed">Validee</SelectItem>
                <SelectItem value="failed">Rejetee</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="conditional">Conditionnelle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#c5ddf5] bg-card/95 shadow-sm dark:border-border dark:bg-card/95">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#e8f4fc] hover:bg-[#e8f4fc]">
              <TableHead className="font-semibold text-[#1e3a5f]">Code</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Producteur</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Inspecteur</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Date</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Type</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f] text-center">Score</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Resultat</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
            <TableBody>
              {inspections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-[#5a7a9a]">
                    Aucune inspection trouvee
                  </TableCell>
                </TableRow>
              ) : (
                inspections.map((inspection: Inspection) => {
                const ResultIcon = resultConfig[inspection.result]?.icon || Clock
                return (
                  <TableRow key={inspection.id} className="hover:bg-muted/50 dark:hover:bg-muted/60">
                    <TableCell className="font-mono text-sm text-[#1e3a5f]">{inspection.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[#0a1628]">{inspection.producer_name || "N/A"}</p>
                        <p className="text-xs text-[#5a7a9a] font-mono">{inspection.parcel_code || "N/A"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#5a7a9a]">{inspection.inspector_name || "N/A"}</TableCell>
                    <TableCell className="text-[#5a7a9a]">{inspection.actual_date}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${inspection_typeConfig[inspection.inspection_type]?.class || "bg-gray-100"}`}>
                        {inspection_typeConfig[inspection.inspection_type]?.label || inspection.inspection_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${getScoreColor(inspection.score)}`}>
                        {inspection.score > 0 ? inspection.score : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${resultConfig[inspection.result]?.class || "bg-gray-100"}`}>
                        <ResultIcon className="w-3.5 h-3.5" />
                        {resultConfig[inspection.result]?.label || inspection.result}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewDialog(inspection)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(inspection)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(inspection)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#5a7a9a]">
            Page {currentPage} sur {totalPages} ({total} enregistrements)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="border-[#c5ddf5]"
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="border-[#c5ddf5]"
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <ClipboardCheck className="w-5 h-5" />
              Nouvelle Inspection
            </DialogTitle>
            <DialogDescription>Planifiez une nouvelle inspection terrain</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Producteur</label>
                <Select value={formData.producer} onValueChange={(v) => setFormData({ ...formData, producer: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder="Selectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {producers.map((p: { id: number; full_name: string }) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Parcelle</label>
                <Select value={formData.parcel} onValueChange={(v) => setFormData({ ...formData, parcel: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder="Selectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {parcels.map((p: { id: number; code: string }) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Inspecteur</label>
                <Select value={formData.inspector} onValueChange={(v) => setFormData({ ...formData, inspector: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder="Selectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u: { id: number; full_name: string }) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Date</label>
                <Input
                  type="date"
                  value={formData.actual_date}
                  onChange={(e) => setFormData({ ...formData, actual_date: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Type</label>
                <Select value={formData.inspection_type} onValueChange={(v) => setFormData({ ...formData, inspection_type: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder="Selectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initiale</SelectItem>
                    <SelectItem value="followup">Suivi</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Score (0-100)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  placeholder="0"
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Observations</label>
              <Textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Notes et observations..."
                className="border-[#c5ddf5] min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-[#c5ddf5]">
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={isSubmitting} className="bg-[#1e3a5f] hover:bg-[#2d5a87]">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <Edit className="w-5 h-5" />
              Modifier l&apos;Inspection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Inspecteur</label>
                <Select value={formData.inspector} onValueChange={(v) => setFormData({ ...formData, inspector: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u: { id: number; full_name: string }) => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Date</label>
                <Input
                  type="date"
                  value={formData.actual_date}
                  onChange={(e) => setFormData({ ...formData, actual_date: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Type</label>
                <Select value={formData.inspection_type} onValueChange={(v) => setFormData({ ...formData, inspection_type: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initiale</SelectItem>
                    <SelectItem value="followup">Suivi</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Resultat</label>
                <Select value={formData.result} onValueChange={(v) => setFormData({ ...formData, result: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="passed">Validee</SelectItem>
                    <SelectItem value="failed">Rejetee</SelectItem>
                    <SelectItem value="conditional">Conditionnelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Score (0-100)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.score}
                onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Observations</label>
              <Textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                className="border-[#c5ddf5] min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-[#c5ddf5]">
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting} className="bg-[#1e3a5f] hover:bg-[#2d5a87]">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <Eye className="w-5 h-5" />
              Details de l&apos;Inspection
            </DialogTitle>
          </DialogHeader>
          {selectedInspection && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#5a7a9a]">Code</p>
                  <p className="font-mono font-medium">{selectedInspection.code}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Producteur</p>
                  <p className="font-medium">{selectedInspection.producer_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Parcelle</p>
                  <p className="font-mono">{selectedInspection.parcel_code || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Inspecteur</p>
                  <p className="font-medium">{selectedInspection.inspector_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Date</p>
                  <p className="font-medium">{selectedInspection.actual_date}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Score</p>
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${getScoreColor(selectedInspection.score)}`}>
                    {selectedInspection.score > 0 ? selectedInspection.score : "-"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Type</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${inspection_typeConfig[selectedInspection.inspection_type]?.class || "bg-gray-100"}`}>
                    {inspection_typeConfig[selectedInspection.inspection_type]?.label || selectedInspection.inspection_type}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Resultat</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${resultConfig[selectedInspection.result]?.class || "bg-gray-100"}`}>
                    {resultConfig[selectedInspection.result]?.label || selectedInspection.result}
                  </span>
                </div>
              </div>
              {selectedInspection.observations && (
                <div>
                  <p className="text-sm text-[#5a7a9a] mb-1">Observations</p>
                  <p className="text-sm bg-[#f8fafc] p-3 rounded-lg">{selectedInspection.observations}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)} className="bg-[#1e3a5f] hover:bg-[#2d5a87]">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer cette inspection ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
