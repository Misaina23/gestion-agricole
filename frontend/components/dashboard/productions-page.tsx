// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import {
  BarChart3,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  MoreHorizontal,
  Scale,
  TrendingUp,
  Package,
  Loader2,
  MapPin,
  Calendar,
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
import { toast } from "sonner"
import { confirmDelete, successAlert, errorAlert } from "@/lib/sweetalert"
import { useProductions, useProducers, useParcels } from "@/lib/hooks"
import { coreApi, productionsApi } from "@/lib/api"

interface Production {
  id: number
  code: string
  producer: number
  producer_name?: string
  producer_code?: string
  parcel: number
  parcel_code?: string
  region_name?: string
  commune_name?: string
  season_name?: string
  harvest_date: string
  actual_date?: string
  weight_green: number
  weight_prepared?: number | null
  pods_count?: number
  quality_grade_name?: string | null
  status: 'harvested' | 'drying' | 'curing' | 'ready' | 'sold'
  status_display?: string
}

const qualityConfig = {
  premium: { label: "Premium", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  standard: { label: "Standard", class: "bg-[#e8f4fc] text-[#1e3a5f] border-[#c5ddf5]" },
  second: { label: "Second choix", class: "bg-amber-100 text-amber-700 border-amber-200" },
}

const statusConfig = {
  harvested: { label: "Recolte", class: "bg-amber-100 text-amber-700" },
  drying: { label: "Seche", class: "bg-[#87ceeb]/30 text-[#1e3a5f]" },
  curing: { label: "Affinage", class: "bg-blue-100 text-blue-700" },
  ready: { label: "Pret", class: "bg-emerald-100 text-emerald-700" },
  sold: { label: "Vendu", class: "bg-slate-100 text-slate-700" },
}

export function ProductionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [qualityFilter, setQualityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [seasonId, setSeasonId] = useState<number | null>(null)
  const [qualityGrades, setQualityGrades] = useState<Array<{ id: number; name: string }>>([])
  const [formData, setFormData] = useState({
    producer: "",
    parcel: "",
    actual_date: "",
    weight_green: "",
    weight_prepared: "",
    quality: "",
    status: "collected",
  })

  const params: Record<string, string> = { page_size: "4" }
  if (searchQuery) params.search = searchQuery
  if (qualityFilter !== "all") params.quality = qualityFilter
  if (statusFilter !== "all") params.status = statusFilter
  params.page = currentPage.toString()

  const { productions, total, isLoading, refresh } = useProductions(params)
  const { producers = [] } = useProducers({ page_size: "1000" })
  const { parcels = [] } = useParcels({ page_size: "1000" })
  const totalPages = Math.max(1, Math.ceil((total || 0) / 4))

  useEffect(() => {
    Promise.all([coreApi.seasons(), coreApi.qualityGrades()]).then(([seasons, grades]) => {
      setSeasonId(seasons.find((season) => season.is_current)?.id || seasons[0]?.id || null)
      setQualityGrades(grades)
    }).catch(() => {
      setSeasonId(null)
      setQualityGrades([])
    })
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, qualityFilter, statusFilter])

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await productionsApi.exportExcel({ search: searchQuery })
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
      await productionsApi.exportPdf({ search: searchQuery })
      toast.success("Export PDF réussi")
    } catch {
      toast.error("Erreur lors de l'export PDF")
    } finally {
      setIsExporting(false)
    }
  }

  const handleAdd = async () => {
    if (!formData.parcel || !formData.actual_date || !seasonId) {
      toast.error("La parcelle, la date et la saison sont obligatoires")
      return
    }
    setIsSubmitting(true)
    try {
      await productionsApi.create({
        code: `PROD-${Date.now()}`,
        parcel: parseInt(formData.parcel),
        season: seasonId,
        harvest_date: formData.actual_date,
        weight_green: parseFloat(formData.weight_green) || 0,
        weight_prepared: formData.weight_prepared ? parseFloat(formData.weight_prepared) : null,
        quality_grade: formData.quality ? parseInt(formData.quality) : null,
        status: "harvested",
      })
      toast.success("Production ajoutee avec succes")
      refresh()
      setFormData({ producer: "", parcel: "", actual_date: "", weight_green: "", weight_prepared: "", quality: "", status: "collected" })
      setIsAddDialogOpen(false)
    } catch {
      toast.error("Erreur lors de l'ajout")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedProduction) return
    setIsSubmitting(true)
    try {
      await productionsApi.update(selectedProduction.id, {
        harvest_date: formData.actual_date,
        weight_green: parseFloat(formData.weight_green) || 0,
        weight_prepared: formData.weight_prepared ? parseFloat(formData.weight_prepared) : null,
        quality_grade: formData.quality ? parseInt(formData.quality) : null,
        status: formData.status,
      })
      toast.success("Production modifiee avec succes")
      refresh()
      setIsEditDialogOpen(false)
      setSelectedProduction(null)
    } catch {
      toast.error("Erreur lors de la modification")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProduction) return
    setIsSubmitting(true)
    try {
      await productionsApi.delete(selectedProduction.id)
      successAlert("Suppression réussie", "La production a été supprimée.")
      refresh()
      setIsDeleteDialogOpen(false)
      setSelectedProduction(null)
    } catch {
      errorAlert("Erreur", "Impossible de supprimer la production.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (production: Production) => {
    setSelectedProduction(production)
    setFormData({
      producer: production.producer.toString(),
      parcel: production.parcel.toString(),
      actual_date: production.actual_date || production.harvest_date,
      weight_green: production.weight_green.toString(),
      weight_prepared: (production.weight_prepared || 0).toString(),
      quality: production.quality_grade?.toString() || "",
      status: production.status,
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (production: Production) => {
    setSelectedProduction(production)
    setIsViewDialogOpen(true)
  }

  const openDeleteDialog = (production: Production) => {
    setSelectedProduction(production)
    confirmDelete("La production sera définitivement supprimée.").then((ok) => {
      if (ok) handleDelete()
    })
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
          <h1 className="text-2xl font-bold text-[#0a1628]">Gestion des Productions</h1>
          <p className="text-sm text-[#5a7a9a] mt-1">
            {total} recolte{total !== 1 ? "s" : ""} enregistree{total !== 1 ? "s" : ""}
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
            Nouvelle Recolte
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Vanille Verte" value={`${Number(productions.reduce((acc: number, p: Production) => acc + Number(p.weight_green || 0), 0)).toFixed(1)}`} unit="kg" icon={<Scale className="w-5 h-5" />} />
        <StatCard title="Vanille Preparee" value={`${Number(productions.reduce((acc: number, p: Production) => acc + Number(p.weight_prepared || 0), 0)).toFixed(1)}`} unit="kg" icon={<Package className="w-5 h-5" />} />
        <StatCard title="Taux Conversion" value={`${(() => { const g = productions.reduce((a: number, p: Production) => a + Number(p.weight_green || 0), 0); const p = productions.reduce((a: number, p: Production) => a + Number(p.weight_prepared || 0), 0); return g > 0 ? ((p / g) * 100).toFixed(1) : '0'; })()}%`} icon={<TrendingUp className="w-5 h-5 text-[#1e3a5f]" />} />
        <StatCard title="Gousses" value={`${productions.reduce((a: number, p: Production) => a + Number(p.pods_count || 0), 0)}`} unit="gousses" icon={<BarChart3 className="w-5 h-5 text-emerald-600" />} />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-[#c5ddf5]">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
            <Input
              placeholder="Rechercher par code, producteur ou parcelle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#c5ddf5] focus:border-[#87ceeb]"
            />
          </div>
          <div className="flex gap-2">
            <Select value={qualityFilter} onValueChange={setQualityFilter}>
              <SelectTrigger className="w-[140px] border-[#c5ddf5]">
                <Filter className="w-4 h-4 mr-2 text-[#5a7a9a]" />
                <SelectValue placeholder="Qualite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes qualites</SelectItem>
                {qualityGrades.map((grade) => <SelectItem key={grade.id} value={grade.id.toString()}>{grade.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] border-[#c5ddf5]">
                <Package className="w-4 h-4 mr-2 text-[#5a7a9a]" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="harvested">Recolte</SelectItem>
                <SelectItem value="drying">Seche</SelectItem>
                <SelectItem value="curing">Affinage</SelectItem>
                <SelectItem value="ready">Pret</SelectItem>
                <SelectItem value="sold">Vendu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#c5ddf5] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#e8f4fc] hover:bg-[#e8f4fc]">
              <TableHead className="font-semibold text-[#1e3a5f]">Code</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Producteur</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Localisation</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Date recolte</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f] text-center">Verte (kg)</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f] text-center">Preparee (kg)</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Qualite</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Statut</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-[#5a7a9a]">
                  <div className="flex flex-col items-center justify-center">
                    <BarChart3 className="w-8 h-8 mb-2" />
                    <p>Aucune production trouvee</p>
                    <p className="text-xs mt-1">Les recoltes seront affichees ici avec leur localisation et leur qualite</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              productions.map((production: Production) => (
                <TableRow key={production.id} className="hover:bg-[#f0f7ff]">
                  <TableCell className="font-mono text-sm text-[#1e3a5f]">{production.code}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-[#0a1628]">{production.producer_name || "N/A"}</p>
                      <p className="text-xs text-[#5a7a9a] font-mono">{production.parcel_code || "N/A"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#5a7a9a]">
                    {production.region_name ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{production.region_name}{production.commune_name ? `, ${production.commune_name}` : ''}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-[#5a7a9a]">{production.actual_date}</TableCell>
                  <TableCell className="text-center font-semibold text-[#1e3a5f]">{Number(production.weight_green || 0).toFixed(1)}</TableCell>
                  <TableCell className="text-center font-semibold text-emerald-600">{Number(production.weight_prepared || 0).toFixed(1)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-[#1e3a5f] border-[#c5ddf5]`}>
                      {production.quality_grade_name || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusConfig[production.status]?.class || "bg-gray-100"}`}>
                      {statusConfig[production.status]?.label || production.status}
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
                        <DropdownMenuItem onClick={() => openViewDialog(production)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(production)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(production)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
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
              <BarChart3 className="w-5 h-5" />
              Nouvelle Recolte
            </DialogTitle>
            <DialogDescription>Enregistrez une nouvelle recolte de vanille</DialogDescription>
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Date de Recolte</label>
              <Input
                type="date"
                value={formData.actual_date}
                onChange={(e) => setFormData({ ...formData, actual_date: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Poids Vert (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight_green}
                  onChange={(e) => setFormData({ ...formData, weight_green: e.target.value })}
                  placeholder="0.0"
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Poids Prepare (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight_prepared}
                  onChange={(e) => setFormData({ ...formData, weight_prepared: e.target.value })}
                  placeholder="0.0"
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Qualite</label>
              <Select value={formData.quality} onValueChange={(v) => setFormData({ ...formData, quality: v })}>
                <SelectTrigger className="border-[#c5ddf5]">
                  <SelectValue placeholder="Selectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="second">Second choix</SelectItem>
                </SelectContent>
              </Select>
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
              Modifier la Production
            </DialogTitle>
            <DialogDescription>Modifiez les informations de la recolte</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Date de Recolte</label>
              <Input
                type="date"
                value={formData.actual_date}
                onChange={(e) => setFormData({ ...formData, actual_date: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Poids Vert (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight_green}
                  onChange={(e) => setFormData({ ...formData, weight_green: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Poids Prepare (kg)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight_prepared}
                  onChange={(e) => setFormData({ ...formData, weight_prepared: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Qualite</label>
                <Select value={formData.quality} onValueChange={(v) => setFormData({ ...formData, quality: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="second">Second choix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Statut</label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="harvested">Recolte</SelectItem>
                    <SelectItem value="drying">Seche</SelectItem>
                    <SelectItem value="curing">Affinage</SelectItem>
                    <SelectItem value="ready">Pret</SelectItem>
                    <SelectItem value="sold">Vendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              Details de la Production
            </DialogTitle>
          </DialogHeader>
          {selectedProduction && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#5a7a9a]">Code</p>
                  <p className="font-mono font-medium">{selectedProduction.code}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Producteur</p>
                  <p className="font-medium">{selectedProduction.producer_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Parcelle</p>
                  <p className="font-mono">{selectedProduction.parcel_code || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Localisation</p>
                  <p className="font-medium">{selectedProduction.region_name ? `${selectedProduction.region_name}${selectedProduction.commune_name ? `, ${selectedProduction.commune_name}` : ''}` : "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Date recolte</p>
                  <p className="font-medium">{selectedProduction.actual_date}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Poids Vert</p>
                  <p className="font-bold text-[#1e3a5f]">{selectedProduction.weight_green} kg</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Poids Prepare</p>
                  <p className="font-bold text-emerald-600">{selectedProduction.weight_prepared} kg</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Qualite</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${qualityConfig[selectedProduction.quality]?.class || "bg-gray-100"}`}>
                    {qualityConfig[selectedProduction.quality]?.label || selectedProduction.quality}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Statut</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusConfig[selectedProduction.status]?.class || "bg-gray-100"}`}>
                    {statusConfig[selectedProduction.status]?.label || selectedProduction.status}
                  </span>
                </div>
              </div>
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
              Etes-vous sur de vouloir supprimer cette production ? Cette action est irreversible.
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
