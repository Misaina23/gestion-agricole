"use client"

import { useState, useEffect } from "react"
import {
  Map,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  MoreHorizontal,
  MapPin,
  Maximize2,
  TreeDeciduous,
  Calendar,
  Navigation,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useParcels, invalidateParcels, useRegions, useProducers } from "@/lib/hooks"
import { parcelsApi, type Parcel } from "@/lib/api"
import { toast } from "sonner"
import { confirmDelete, successAlert, errorAlert } from "@/lib/sweetalert"

const statusConfig: Record<string, { label: string; class: string }> = {
  active: { label: "Actif", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  inactive: { label: "Inactif", class: "bg-gray-100 text-gray-700 border-gray-200" },
  fallow: { label: "En jachère", class: "bg-amber-100 text-amber-700 border-amber-200" },
  new: { label: "Nouveau", class: "bg-sky-100 text-sky-700 border-sky-200" },
}

const conversionLabels: Record<string, string> = {
  organic: "Biologique",
  conversion: "En conversion",
  conventional: "Conventionnelle",
}

export function ParcelsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null)
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    producer: "",
    area: "",
    vanilla_plants: "",
    main_crop: "",
    intercrop: "",
    latitude: "",
    longitude: "",
    conversion_status: "organic",
    conversion_level: "",
  })

  const params: Record<string, string> = { page_size: "4" }
  if (searchQuery) params.search = searchQuery
  if (statusFilter !== "all") params.conversion_status = statusFilter
  if (regionFilter !== "all") params.producer__region = regionFilter
  params.page = currentPage.toString()

  const { regions } = useRegions()
  const { producers: producersList } = useProducers({ page_size: "1000" })
  const { parcels, total, isLoading, error, refresh } = useParcels(params)
  const totalPages = Math.max(1, Math.ceil((total || 0) / 4))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, regionFilter])

  const toNumber = (value: unknown) => {
    const numericValue = typeof value === "number" ? value : Number(value)
    return Number.isFinite(numericValue) ? numericValue : 0
  }

  const totalSurface = parcels.reduce((acc, p) => acc + toNumber(p.area), 0)
  const totalVanillaTrees = parcels.reduce((acc, p) => acc + toNumber(p.vanilla_plants), 0)
  const organicCount = parcels.filter(p => p.conversion_status === 'organic').length

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await parcelsApi.exportExcel(params)
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
      await parcelsApi.exportPdf(params)
      toast.success("Export PDF réussi")
    } catch {
      toast.error("Erreur lors de l'export PDF")
    } finally {
      setIsExporting(false)
    }
  }

  const handleAdd = async () => {
    if (!formData.producer || !formData.area) {
      toast.error("Le producteur et la surface sont obligatoires")
      return
    }
    setIsSubmitting(true)
    try {
      await parcelsApi.create({
        code: `PAR-${Date.now()}`,
        producer: Number(formData.producer),
        area: parseFloat(formData.area) || 0,
        vanilla_plants: parseInt(formData.vanilla_plants) || 0,
        main_crop: formData.main_crop || undefined,
        intercrop: formData.intercrop || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        conversion_status: formData.conversion_status as Parcel['conversion_status'],
        conversion_level: formData.conversion_level as Parcel['conversion_level'],
      })
      toast.success("Parcelle ajoutée avec succès")
      setFormData({ producer: "", area: "", vanilla_plants: "", main_crop: "", intercrop: "", latitude: "", longitude: "", conversion_status: "organic", conversion_level: "" })
      setIsAddDialogOpen(false)
      invalidateParcels()
      refresh()
    } catch (err) {
      toast.error("Erreur lors de l'ajout de la parcelle")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedParcelId) return
    setIsSubmitting(true)
    try {
      await parcelsApi.update(selectedParcelId, {
        area: parseFloat(formData.area) || 0,
        vanilla_plants: parseInt(formData.vanilla_plants) || 0,
        main_crop: formData.main_crop || undefined,
        intercrop: formData.intercrop || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        conversion_status: formData.conversion_status as Parcel['conversion_status'],
        conversion_level: formData.conversion_level as Parcel['conversion_level'],
      })
      toast.success("Parcelle modifiée avec succès")
      setIsEditDialogOpen(false)
      setSelectedParcel(null)
      setSelectedParcelId(null)
      invalidateParcels()
      refresh()
    } catch (err) {
      toast.error("Erreur lors de la modification de la parcelle")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedParcelId) return
    setIsSubmitting(true)
    try {
      await parcelsApi.delete(selectedParcelId)
      successAlert("Suppression réussie", "La parcelle a été supprimée.")
      setIsDeleteDialogOpen(false)
      setSelectedParcel(null)
      setSelectedParcelId(null)
      invalidateParcels()
      refresh()
    } catch (err) {
      errorAlert("Erreur", "Impossible de supprimer la parcelle.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (parcel: Parcel) => {
    const parcelId = Number(parcel?.id)
    if (!Number.isInteger(parcelId) || parcelId <= 0) return
    setSelectedParcelId(parcelId)
    setSelectedParcel(parcel)
    setFormData({
      producer: parcel.producer?.toString() || "",
      area: parcel.area?.toString() || "",
      vanilla_plants: parcel.vanilla_plants?.toString() || "",
      main_crop: parcel.main_crop || "",
      intercrop: parcel.intercrop || "",
      latitude: parcel.latitude || "",
      longitude: parcel.longitude || "",
      conversion_status: parcel.conversion_status || "organic",
      conversion_level: parcel.conversion_level || "",
    })
    try {
      setIsEditDialogOpen(true)
    } catch (e) {
      console.error('[parcels] open edit failed', e)
    }
  }

  const openViewDialog = (parcel: Parcel) => {
    const parcelId = Number(parcel?.id)
    if (!Number.isInteger(parcelId) || parcelId <= 0) return
    setSelectedParcelId(parcelId)
    setSelectedParcel(parcel)
    setIsViewDialogOpen(true)
    parcelsApi.get(parcelId).then((details) => {
      setSelectedParcel((current) => current?.id === parcelId ? details : current)
    }).catch(() => {
      toast.error("Impossible de charger les détails de la parcelle")
    })
  }

  const openDeleteDialog = (parcel: Parcel) => {
    const parcelId = Number(parcel?.id)
    if (!Number.isInteger(parcelId) || parcelId <= 0) return
    setSelectedParcelId(parcelId)
    setSelectedParcel(parcel)
    confirmDelete("La parcelle et ses données liées seront définitivement supprimées.").then((ok) => {
      if (ok) handleDelete()
    })
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">Erreur lors du chargement des données</p>
          <Button onClick={() => refresh()}>Réessayer</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0a1628]">Gestion des Parcelles GPS</h1>
          <p className="text-sm text-[#5a7a9a] mt-1">
            {total} parcelle{total !== 1 ? "s" : ""} - {totalSurface.toFixed(2)} ha - {totalVanillaTrees.toLocaleString()} pieds
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
            Nouvelle Parcelle
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Surface Totale"
          value={`${totalSurface.toFixed(2)}`}
          unit="ha"
          icon={<Maximize2 className="w-5 h-5" />}
          footer={null}
        />
        <StatCard
          title="Pieds de Vanille"
          value={totalVanillaTrees.toLocaleString()}
          icon={<TreeDeciduous className="w-5 h-5" />}
        />
        <StatCard
          title="Parcelles biologiques"
          value={organicCount}
          icon={<Navigation className="w-5 h-5 text-[#1e3a5f]" />}
        />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#c5ddf5] bg-card/95 p-4 shadow-sm dark:border-border dark:bg-card/95">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
            <Input
              placeholder="Rechercher par code, producteur ou commune..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#c5ddf5] focus:border-[#87ceeb]"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] border-[#c5ddf5]">
                <Filter className="w-4 h-4 mr-2 text-[#5a7a9a]" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="organic">Biologique</SelectItem>
                <SelectItem value="conversion">En conversion</SelectItem>
                <SelectItem value="conventional">Conventionnelle</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[140px] border-[#c5ddf5]">
                <MapPin className="w-4 h-4 mr-2 text-[#5a7a9a]" />
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes régions</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id.toString()}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#c5ddf5] bg-card/95 shadow-sm dark:border-border dark:bg-card/95">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/80 hover:bg-muted/80 dark:bg-muted/70 dark:hover:bg-muted/70">
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Code</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f]">Producteur</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f]">Site</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] text-center">Surface (ha)</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f]">Culture / interculture</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] text-center">Pieds</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f]">Coordonnées</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f]">Statut</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parcels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-[#5a7a9a]">
                    Aucune parcelle trouvee
                  </TableCell>
                </TableRow>
              ) : (
                parcels.map((parcel) => (
                  <TableRow key={parcel.id} className="hover:bg-[#f0f7ff]">
                    <TableCell className="font-mono text-sm text-[#1e3a5f]">{parcel.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[#0a1628]">{parcel.producer_name || '-'}</p>
                        <p className="text-xs text-[#5a7a9a] font-mono">{parcel.producer_code || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-[#5a7a9a]">{parcel.site_name || '-'}</TableCell>
                    <TableCell className="text-center font-semibold text-[#1e3a5f]">{toNumber(parcel.area).toFixed(2)}</TableCell>
                    <TableCell>
                      <p className="font-medium text-[#0a1628]">{parcel.main_crop || 'Non renseigné'}</p>
                      <p className="text-xs text-[#5a7a9a]">{parcel.intercrop || '—'}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-[#e8f4fc] text-[#1e3a5f] font-semibold text-sm">
                        {parcel.vanilla_plants || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-mono text-[#5a7a9a]">
                        <p>{parcel.latitude || '-'}, {parcel.longitude || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[parcel.conversion_status || 'new']?.class || statusConfig.new.class}`}>
                        {statusConfig[parcel.conversion_status || 'new']?.label || parcel.conversion_status || '-'}
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
                          <DropdownMenuItem onClick={() => openViewDialog(parcel)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(parcel)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(parcel)} className="text-red-600">
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
        )}
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
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <Map className="w-5 h-5" />
              Nouvelle Parcelle
            </DialogTitle>
            <DialogDescription>Enregistrez une nouvelle parcelle GPS</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Producteur</label>
              <Select value={formData.producer} onValueChange={(v) => setFormData({ ...formData, producer: v })}>
                <SelectTrigger className="border-[#c5ddf5]">
                  <SelectValue placeholder="Sélectionner un producteur" />
                </SelectTrigger>
                <SelectContent>
                  {producersList.map((producer) => (
                    <SelectItem key={producer.id} value={producer.id.toString()}>
                      {producer.code} - {[producer.last_name, producer.first_name].filter(Boolean).join(' ') || producer.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Surface (ha)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="0.00"
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Pieds Vanille</label>
                <Input
                  type="number"
                  value={formData.vanilla_plants}
                  onChange={(e) => setFormData({ ...formData, vanilla_plants: e.target.value })}
                  placeholder="0"
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Statut</label>
                <Select value={formData.conversion_status} onValueChange={(v) => setFormData({ ...formData, conversion_status: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organic">Biologique</SelectItem>
                    <SelectItem value="conversion">En conversion</SelectItem>
                    <SelectItem value="conventional">Conventionnelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.conversion_status === 'conversion' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Niveau de conversion</label>
                <Select value={formData.conversion_level} onValueChange={(v) => setFormData({ ...formData, conversion_level: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C1">C1</SelectItem>
                    <SelectItem value="C2">C2</SelectItem>
                    <SelectItem value="C3">C3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Culture principale</label>
                <Input
                  value={formData.main_crop}
                  onChange={(e) => setFormData({ ...formData, main_crop: e.target.value })}
                  placeholder="Ex: Vanille"
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Interculture</label>
                <Input
                  value={formData.intercrop}
                  onChange={(e) => setFormData({ ...formData, intercrop: e.target.value })}
                  placeholder="Ex: Girofle"
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Latitude</label>
                <Input
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="-14.2661"
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Longitude</label>
                <Input
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="50.1707"
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button onClick={handleAdd} className="bg-[#1e3a5f] hover:bg-[#2d5a87] text-white" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog key={`edit-${selectedParcel?.id || 'none'}`} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <Edit className="w-5 h-5" />
              Modifier la Parcelle
            </DialogTitle>
            <DialogDescription>Modifiez les informations de la parcelle</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Surface (ha)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Pieds Vanille</label>
                <Input
                  type="number"
                  value={formData.vanilla_plants}
                  onChange={(e) => setFormData({ ...formData, vanilla_plants: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Statut</label>
                <Select value={formData.conversion_status} onValueChange={(v) => setFormData({ ...formData, conversion_status: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organic">Biologique</SelectItem>
                    <SelectItem value="conversion">En conversion</SelectItem>
                    <SelectItem value="conventional">Conventionnelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.conversion_status === 'conversion' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Niveau de conversion</label>
                <Select value={formData.conversion_level} onValueChange={(v) => setFormData({ ...formData, conversion_level: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C1">C1</SelectItem>
                    <SelectItem value="C2">C2</SelectItem>
                    <SelectItem value="C3">C3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Culture principale</label>
                <Input
                  value={formData.main_crop}
                  onChange={(e) => setFormData({ ...formData, main_crop: e.target.value })}
                  placeholder="Ex: Vanille"
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Interculture</label>
                <Input
                  value={formData.intercrop}
                  onChange={(e) => setFormData({ ...formData, intercrop: e.target.value })}
                  placeholder="Ex: Girofle"
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Latitude</label>
                <Input
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Longitude</label>
                <Input
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button onClick={handleEdit} className="bg-[#1e3a5f] hover:bg-[#2d5a87] text-white" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <Map className="w-5 h-5" />
              Détails de la Parcelle
            </DialogTitle>
          </DialogHeader>
          {selectedParcel && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-[#e8f4fc] rounded-lg">
                <div className="w-14 h-14 rounded-xl bg-[#e8f4fc] flex items-center justify-center">
                  <Map className="w-7 h-7 text-[#1e3a5f]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#0a1628]">{selectedParcel.code}</h3>
                  <p className="text-sm text-[#5a7a9a]">{selectedParcel.producer_name || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a] flex items-center gap-1"><MapPin className="w-3 h-3" /> Région</p>
                  <p className="font-medium text-[#0a1628]">{selectedParcel.region_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Site</p>
                  <p className="font-medium text-[#0a1628]">{selectedParcel.site_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a] flex items-center gap-1"><Maximize2 className="w-3 h-3" /> Surface</p>
                  <p className="font-medium text-[#0a1628]">{(selectedParcel.area || 0).toFixed(2)} ha</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a] flex items-center gap-1"><TreeDeciduous className="w-3 h-3" /> Pieds</p>
                  <p className="font-medium text-[#0a1628]">{selectedParcel.vanilla_plants || 0} vanille</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a] flex items-center gap-1"><Navigation className="w-3 h-3" /> Coordonnées</p>
                  <p className="font-medium text-[#0a1628] font-mono text-sm">{selectedParcel.latitude || '-'}, {selectedParcel.longitude || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a] flex items-center gap-1"><Calendar className="w-3 h-3" /> Créée le</p>
                  <p className="font-medium text-[#0a1628]">{new Date(selectedParcel.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="pt-2">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[selectedParcel.conversion_status || 'new']?.class || statusConfig.new.class}`}>
                  {statusConfig[selectedParcel.conversion_status || 'new']?.label || selectedParcel.conversion_status || '-'}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Supprimer la Parcelle
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette parcelle ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {selectedParcel && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-[#0a1628]">{selectedParcel.code}</p>
                  <p className="text-xs text-[#5a7a9a]">{selectedParcel.producer_name || '-'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>Annuler</Button>
            <Button onClick={handleDelete} variant="destructive" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
