"use client"

// @ts-nocheck
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  MoreHorizontal,
  MapPin,
  Phone,
  Calendar,
  Loader2,
  CheckCircle,
} from "lucide-react"
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
import { useProducers, invalidateProducers, useRegions, useDistricts, useCommunes, useProducer, useParcels } from "@/lib/hooks"
import { producersApi, type Producer, type Parcel } from "@/lib/api"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { confirmDelete, successAlert, errorAlert } from "@/lib/sweetalert"

const statusConfig: Record<string, { label: string; class: string }> = {
  active: { label: "Actif", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  pending: { label: "En attente", class: "bg-amber-100 text-amber-700 border-amber-200" },
  inactive: { label: "Inactif", class: "bg-red-100 text-red-700 border-red-200" },
}

export function ProducersPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [producerParcels, setProducerParcels] = useState<Parcel[]>([])
  const [isLoadingParcels, setIsLoadingParcels] = useState(false)

  type ProducerFormData = {
    last_name: string
    first_name: string
    unit_name: string
    region: string
    district: string
    commune: string
    phone: string
    joined_at: string
    risk_category: string
    member_processing: string
    status: Producer['status']
  }

  const [formData, setFormData] = useState<ProducerFormData>({
    last_name: "",
    first_name: "",
    unit_name: "",
    region: "",
    district: "",
    commune: "",
    phone: "",
    joined_at: "",
    risk_category: "low",
    member_processing: "no",
    status: "pending",
  })

  const searchParams = useSearchParams()
  const producerQueryId = searchParams.get('producer')
  const producerAction = searchParams.get('action')
  const isQueryProducer = producerQueryId ? Number(producerQueryId) : null
  const { producer: queryProducer, isLoading: isLoadingQueryProducer } = useProducer(isQueryProducer)

  const { regions } = useRegions()
  const selectedRegionId = formData.region ? Number(formData.region) : undefined
  const { districts, isLoading: isLoadingDistricts } = useDistricts(selectedRegionId)
  const selectedDistrictId = formData.district ? Number(formData.district) : undefined
  const { communes, isLoading: isLoadingCommunes } = useCommunes(selectedRegionId)

  const params: Record<string, string> = { page_size: "4" }
  if (searchQuery) params.search = searchQuery
  if (statusFilter !== "all") params.status = statusFilter
  if (regionFilter && regionFilter !== "all" && regionFilter !== "undefined") params.region = regionFilter
  params.page = currentPage.toString()

  const { producers, total, isLoading, error, refresh } = useProducers(params)
  const totalPages = Math.max(1, Math.ceil((total || 0) / 4))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, regionFilter])

  const resetAddForm = () => {
    setFormData({
      last_name: "",
      first_name: "",
      unit_name: "",
      region: regions[0]?.id?.toString() || "",
      district: "",
      commune: "",
      phone: "",
      joined_at: "",
      risk_category: "low",
      member_processing: "no",
      status: "pending",
    })
  }

  const handleAdd = async () => {
    if (!formData.last_name.trim() || !formData.region || !formData.commune) {
      toast.error("Le nom, la région et la commune sont obligatoires")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        last_name: formData.last_name.trim(),
        first_name: formData.first_name.trim() || undefined,
        unit_name: formData.unit_name.trim() || undefined,
        region: Number(formData.region),
        district: formData.district ? Number(formData.district) : undefined,
        commune: Number(formData.commune),
        phone: formData.phone.trim() || undefined,
        joined_at: formData.joined_at || undefined,
        risk_category: (formData.risk_category || undefined) as any,
        member_processing: (formData.member_processing || undefined) as any,
        status: formData.status,
      }
      await producersApi.create(payload as any)
      toast.success("Producteur ajouté avec succès")
      resetAddForm()
      setIsAddDialogOpen(false)
      invalidateProducers()
      refresh()
    } catch (error: any) {
      console.error('Producer create failed', error)
      toast.error(error?.message || "Erreur lors de l'ajout du producteur")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedProducer) return
    if (!formData.last_name.trim() || !formData.region || !formData.commune) {
      toast.error("Le nom, la région et la commune sont obligatoires")
      return
    }
    setIsSubmitting(true)
    try {
      await producersApi.update(selectedProducer.id, {
        last_name: formData.last_name,
        first_name: formData.first_name || undefined,
        unit_name: formData.unit_name || undefined,
        region: Number(formData.region),
        district: formData.district ? Number(formData.district) : undefined,
        commune: Number(formData.commune),
        phone: formData.phone || undefined,
        joined_at: formData.joined_at || undefined,
        risk_category: (formData.risk_category || undefined) as any,
        member_processing: (formData.member_processing || undefined) as any,
        status: formData.status,
      } as any)
      toast.success("Producteur modifié avec succès")
      setIsEditDialogOpen(false)
      setSelectedProducer(null)
      invalidateProducers()
      refresh()
    } catch {
      toast.error("Erreur lors de la modification du producteur")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedProducer) return
    setIsSubmitting(true)
    try {
      await producersApi.delete(selectedProducer.id)
      successAlert("Suppression réussie", "Le producteur a été supprimé.")
      setSelectedProducer(null)
      invalidateProducers()
      refresh()
    } catch {
      errorAlert("Erreur", "Impossible de supprimer le producteur.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (producer: Producer) => {
    setSelectedProducer(producer)
    setFormData({
      last_name: producer.last_name || "",
      first_name: producer.first_name || "",
      unit_name: producer.unit_name || "",
      region: producer.region?.toString() || "",
      district: producer.district?.toString() || "",
      commune: producer.site_name?.toString() || "",
      phone: producer.phone || "",
      joined_at: producer.joined_at || "",
      risk_category: producer.risk_category || "low",
      member_processing: producer.member_processing || "no",
      status: producer.status,
    })
    setIsEditDialogOpen(true)
  }

  useEffect(() => {
    if (producerAction === 'view' && queryProducer) {
      openViewDialog(queryProducer)
    }
    if (producerAction === 'edit' && queryProducer) {
      openEditDialog(queryProducer)
    }
  }, [producerAction, queryProducer])

  const openViewDialog = async (producer: Producer) => {
    setSelectedProducer(producer)
    setIsLoadingParcels(true)
    setProducerParcels([])
    setIsViewDialogOpen(true)
    try {
      const data = await producersApi.parcels(producer.id)
      setProducerParcels(data)
    } catch {
      setProducerParcels([])
    } finally {
      setIsLoadingParcels(false)
    }
  }

  const openDeleteDialog = (producer: Producer) => {
    setSelectedProducer(producer)
    confirmDelete("Le producteur et ses données liées seront définitivement supprimés.").then((ok) => {
      if (ok) handleDelete()
    })
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await producersApi.exportExcel(params)
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
      await producersApi.exportPdf(params)
      toast.success("Export PDF réussi")
    } catch {
      toast.error("Erreur lors de l'export PDF")
    } finally {
      setIsExporting(false)
    }
  }

  const handleActivate = async (producer: Producer) => {
    try {
      await producersApi.activate(producer.id)
      toast.success("Producteur activé avec succès")
      invalidateProducers()
      refresh()
    } catch {
      toast.error("Erreur lors de l'activation du producteur")
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error instanceof Error ? error.message : t("loadError")}</p>
          <Button onClick={() => refresh()}>{t("retry")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0a1628] dark:text-foreground">Gestion des Producteurs</h1>
          <p className="mt-1 text-sm text-[#5a7a9a] dark:text-muted-foreground">
            {total} producteur{total !== 1 ? "s" : ""} enregistré{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-[#c5ddf5] text-[#1e3a5f] hover:bg-[#e8f4fc] dark:border-border dark:text-foreground dark:hover:bg-accent/40">
                <Download className="w-4 h-4" />
                Générer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf} disabled={isExporting}>PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-2 bg-[#1e3a5f] text-white hover:bg-[#2d5a87] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90" onClick={() => {
            resetAddForm()
            setIsAddDialogOpen(true)
          }}>
            <Plus className="w-4 h-4" />
            Nouveau Producteur
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#c5ddf5] bg-card/95 p-4 shadow-sm dark:border-border dark:bg-card/95">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
            <Input
              placeholder="Rechercher par nom, code ou commune..."
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
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
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
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Nom</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Région</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Site</TableHead>
                <TableHead className="text-center font-semibold text-[#1e3a5f] dark:text-foreground">Parcelles</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Statut</TableHead>
                <TableHead className="text-right font-semibold text-[#1e3a5f] dark:text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {producers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-[#5a7a9a]">
                    Aucun producteur trouvé
                  </TableCell>
                </TableRow>
              ) : (
                producers.map((producer) => (
                  <TableRow key={producer.id} className="hover:bg-muted/50 dark:hover:bg-muted/60">
                    <TableCell className="font-mono text-sm text-[#1e3a5f] dark:text-foreground">{producer.code}</TableCell>
                    <TableCell className="font-medium text-[#0a1628] dark:text-foreground">
                      {[producer.last_name, producer.first_name].filter(Boolean).join(' ') || producer.code}
                    </TableCell>
                    <TableCell className="text-[#5a7a9a] dark:text-muted-foreground">{producer.region_name || producer.region}</TableCell>
                    <TableCell className="text-[#5a7a9a] dark:text-muted-foreground">{producer.site_name || producer.site_name}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground dark:bg-muted/80 dark:text-foreground">
                        {producer.parcels_count || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[producer.status]?.class || statusConfig.pending.class}`}>
                        {statusConfig[producer.status]?.label || producer.status}
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
                          <DropdownMenuItem onClick={() => openViewDialog(producer)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(producer)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(producer)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                          {producer.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleActivate(producer)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activer
                            </DropdownMenuItem>
                          )}
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
              <Users className="w-5 h-5" />
              Nouveau Producteur
            </DialogTitle>
            <DialogDescription>Remplissez les informations du nouveau producteur</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Nom du membre *</label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Ex: GUI"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Prénom</label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Ex: Ramarson"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Unité de production</label>
              <Input
                value={formData.unit_name}
                onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                placeholder="Ex: Ambodiampana"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Région</label>
                <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v, district: "", commune: "" })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id.toString()}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">District</label>
                <Select value={formData.district} onValueChange={(v) => setFormData({ ...formData, district: v, commune: "" })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder={isLoadingDistricts ? "Chargement..." : "Sélectionner"} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district: { id: number; name: string }) => (
                      <SelectItem key={district.id} value={district.id.toString()}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Site</label>
                <Select value={formData.commune} onValueChange={(value) => setFormData({ ...formData, commune: value })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder={isLoadingCommunes ? "Chargement..." : "Sélectionner"} />
                  </SelectTrigger>
                  <SelectContent>
                    {communes.map((commune) => (
                      <SelectItem key={commune.id} value={commune.id.toString()}>
                        {commune.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Téléphone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+261 XX XX XXX XX"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Date d'intégration</label>
              <Input
                value={formData.joined_at}
                onChange={(e) => setFormData({ ...formData, joined_at: e.target.value })}
                placeholder="JJ/MM/AAAA"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Catégorie de risque</label>
              <Select value={formData.risk_category} onValueChange={(v) => setFormData({ ...formData, risk_category: v })}>
                <SelectTrigger className="border-[#c5ddf5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="high">Fort</SelectItem>
                </SelectContent>
              </Select>
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <Edit className="w-5 h-5" />
              Modifier le Producteur
            </DialogTitle>
            <DialogDescription>Modifiez les informations du producteur</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Nom du membre</label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Prénom</label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Unité de production</label>
              <Input
                value={formData.unit_name}
                onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Région</label>
                <Select value={formData.region} onValueChange={(v) => setFormData({ ...formData, region: v, district: "", commune: "" })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id.toString()}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">District</label>
                <Select value={formData.district} onValueChange={(v) => setFormData({ ...formData, district: v, commune: "" })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder={isLoadingDistricts ? "Chargement..." : "Sélectionner"} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district: { id: number; name: string }) => (
                      <SelectItem key={district.id} value={district.id.toString()}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Site</label>
                <Select value={formData.commune} onValueChange={(value) => setFormData({ ...formData, commune: value })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder={isLoadingCommunes ? "Chargement..." : "Sélectionner"} />
                  </SelectTrigger>
                  <SelectContent>
                    {communes.map((commune) => (
                      <SelectItem key={commune.id} value={commune.id.toString()}>
                        {commune.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Téléphone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Date d'intégration</label>
              <Input
                value={formData.joined_at}
                onChange={(e) => setFormData({ ...formData, joined_at: e.target.value })}
                placeholder="JJ/MM/AAAA"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Catégorie de risque</label>
              <Select value={formData.risk_category} onValueChange={(v) => setFormData({ ...formData, risk_category: v })}>
                <SelectTrigger className="border-[#c5ddf5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="high">Fort</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Préparation/transformation</label>
              <Select value={formData.member_processing} onValueChange={(v) => setFormData({ ...formData, member_processing: v })}>
                <SelectTrigger className="border-[#c5ddf5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">Non</SelectItem>
                  <SelectItem value="yes">Oui</SelectItem>
                </SelectContent>
              </Select>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <Users className="w-5 h-5" />
              Détails du Producteur
            </DialogTitle>
          </DialogHeader>
          {selectedProducer && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-[#e8f4fc] rounded-lg">
                <div className="w-14 h-14 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xl font-bold">
                  {(selectedProducer.last_name || '?')[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0a1628]">
                    {[selectedProducer.last_name, selectedProducer.first_name].filter(Boolean).join(' ') || selectedProducer.code}
                  </h3>
                  <p className="text-sm font-mono text-[#5a7a9a]">{selectedProducer.code}</p>
                  {selectedProducer.unit_name && (
                    <p className="text-xs text-[#5a7a9a]">{selectedProducer.unit_name}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a] flex items-center gap-1"><MapPin className="w-3 h-3" /> Région</p>
                  <p className="font-medium text-[#0a1628]">{selectedProducer.region_name || selectedProducer.region}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Site</p>
                  <p className="font-medium text-[#0a1628]">{selectedProducer.site_name || selectedProducer.commune}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a] flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone</p>
                  <p className="font-medium text-[#0a1628]">{selectedProducer.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Date d'intégration</p>
                  <p className="font-medium text-[#0a1628]">{selectedProducer.joined_at ? new Date(selectedProducer.joined_at).toLocaleDateString('fr-FR') : '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Parcelles</p>
                  <p className="font-medium text-[#0a1628]">{selectedProducer.parcels_count || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Surface totale</p>
                  <p className="font-medium text-[#0a1628]">{(selectedProducer.total_area || 0).toLocaleString('fr-FR')} ha</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Statut UE</p>
                  <p className="font-medium text-[#0a1628]">{selectedProducer.eu_status || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Statut NOP</p>
                  <p className="font-medium text-[#0a1628]">{selectedProducer.nop_status || '-'}</p>
                </div>
              </div>

              {/* Parcels list */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-[#0a1628] mb-2">Mes parcelles</h4>
                {isLoadingParcels ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#1e3a5f]" />
                  </div>
                ) : producerParcels.length === 0 ? (
                  <p className="text-sm text-[#5a7a9a]">Aucune parcelle enregistrée</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {producerParcels.map((parcel) => (
                      <div key={parcel.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-[#c5ddf5]">
                        <div>
                          <p className="font-medium text-sm text-[#0a1628]">Parcelle {parcel.code}</p>
                          <p className="text-xs text-[#5a7a9a]">
                            {parcel.main_crop || 'Culture non renseignée'}
                            {parcel.intercrop ? ` + ${parcel.intercrop}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#0a1628]">{Number(parcel.area).toLocaleString('fr-FR')} ha</p>
                          <p className="text-xs text-[#5a7a9a]">{parcel.conversion_status === 'organic' ? 'Biologique' : parcel.conversion_status === 'conversion' ? 'En conversion' : parcel.conversion_status === 'conventional' ? 'Conventionnelle' : '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

