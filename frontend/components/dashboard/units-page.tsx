"use client"

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
  Mail,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUnits, invalidateUnits, useRegions, useDistricts, useCommunes } from "@/lib/hooks"
import { unitsApi, type ProductionUnit } from "@/lib/api"
import useSWR from 'swr'
import { API_BASE_URL, buildApiUrl, getAuthHeaders } from "@/lib/api-config"

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_tokens') : null
  const headers: Record<string, string> = {}
  if (token) {
    const parsed = JSON.parse(token)
    headers['Authorization'] = `Bearer ${parsed.access}`
  }
  const response = await fetch(buildApiUrl(url), { headers })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { confirmDelete, successAlert, errorAlert } from "@/lib/sweetalert"

const statusConfig: Record<string, { label: string; class: string }> = {
  active: { label: "Actif", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  inactive: { label: "Inactif", class: "bg-gray-100 text-gray-700 border-gray-200" },
  suspended: { label: "Suspendu", class: "bg-red-100 text-red-700 border-red-200" },
}

const unitTypeLabels: Record<string, string> = {
  group: "Groupe",
  site: "Site",
  village: "Village",
  region: "Region",
}

export function UnitsPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<ProductionUnit | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  type UnitFormData = {
    name: string
    code: string
    unit_type: ProductionUnit['unit_type']
    region: string
    district: string
    commune: string
    manager_name: string
    manager_function: string
    phone: string
    email: string
    members_count: string
    total_area: string
    creation_date: string
    status: ProductionUnit['status']
    notes: string
  }

  const [formData, setFormData] = useState<UnitFormData>({
    name: "",
    code: "",
    unit_type: "group",
    region: "",
    district: "",
    commune: "",
    manager_name: "",
    manager_function: "",
    phone: "",
    email: "",
    members_count: "0",
    total_area: "0",
    creation_date: "",
    status: "active",
    notes: "",
  })

  const searchParams = useSearchParams()
  const unitQueryId = searchParams.get('unit')
  const unitAction = searchParams.get('action')
  const isQueryUnit = unitQueryId ? Number(unitQueryId) : null
  const { unit: queryUnit, isLoading: isLoadingQueryUnit } = useUnit(isQueryUnit)

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

  const { units, total, isLoading, error, refresh } = useUnits(params)
  const totalPages = Math.max(1, Math.ceil((total || 0) / 4))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, regionFilter])

  const resetAddForm = () => {
    setFormData({
      name: "",
      code: "",
      unit_type: "group",
      region: regions[0]?.id?.toString() || "",
      district: "",
      commune: "",
      manager_name: "",
      manager_function: "",
      phone: "",
      email: "",
      members_count: "0",
      total_area: "0",
      creation_date: "",
      status: "active",
      notes: "",
    })
  }

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.code.trim() || !formData.region || !formData.commune) {
      toast.error("Le nom, le code, la région et la commune sont obligatoires")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        unit_type: formData.unit_type as ProductionUnit['unit_type'],
        region: Number(formData.region),
        district: formData.district ? Number(formData.district) : undefined,
        commune: Number(formData.commune),
        manager_name: formData.manager_name.trim() || undefined,
        manager_function: formData.manager_function.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        members_count: parseInt(formData.members_count) || 0,
        total_area: parseFloat(formData.total_area) || 0,
        creation_date: formData.creation_date || undefined,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      }
      await unitsApi.create(payload as any)
      toast.success("Unité ajoutée avec succès")
      resetAddForm()
      setIsAddDialogOpen(false)
      invalidateUnits()
      refresh()
    } catch (error: any) {
      console.error('Unit create failed', error)
      toast.error(error?.message || "Erreur lors de l'ajout de l'unité")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedUnit) return
    if (!formData.name.trim() || !formData.code.trim() || !formData.region || !formData.commune) {
      toast.error("Le nom, le code, la région et la commune sont obligatoires")
      return
    }
    setIsSubmitting(true)
    try {
      await unitsApi.update(selectedUnit.id, {
        name: formData.name.trim(),
        code: formData.code.trim(),
        unit_type: formData.unit_type as ProductionUnit['unit_type'],
        region: Number(formData.region),
        district: formData.district ? Number(formData.district) : undefined,
        commune: Number(formData.commune),
        manager_name: formData.manager_name.trim() || undefined,
        manager_function: formData.manager_function.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        members_count: parseInt(formData.members_count) || 0,
        total_area: parseFloat(formData.total_area) || 0,
        creation_date: formData.creation_date || undefined,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
      } as any)
      toast.success("Unité modifiée avec succès")
      setIsEditDialogOpen(false)
      setSelectedUnit(null)
      invalidateUnits()
      refresh()
    } catch {
      toast.error("Erreur lors de la modification de l'unité")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUnit) return
    setIsSubmitting(true)
    try {
      await unitsApi.delete(selectedUnit.id)
      successAlert("Suppression réussie", "L'unité a été supprimée.")
      setSelectedUnit(null)
      invalidateUnits()
      refresh()
    } catch {
      errorAlert("Erreur", "Impossible de supprimer l'unité.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (unit: ProductionUnit) => {
    setSelectedUnit(unit)
    setFormData({
      name: unit.name,
      code: unit.code,
      unit_type: unit.unit_type || "group",
      region: unit.region?.toString() || "",
      district: unit.district?.toString() || "",
      commune: unit.commune?.toString() || "",
      manager_name: unit.manager_name || "",
      manager_function: unit.manager_function || "",
      phone: unit.phone || "",
      email: unit.email || "",
      members_count: (unit.members_count || 0).toString(),
      total_area: (unit.total_area || 0).toString(),
      creation_date: unit.creation_date || "",
      status: unit.status,
      notes: unit.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  useEffect(() => {
    if (unitAction === 'view' && queryUnit) {
      openViewDialog(queryUnit)
    }
    if (unitAction === 'edit' && queryUnit) {
      openEditDialog(queryUnit)
    }
  }, [unitAction, queryUnit])

  const openViewDialog = (unit: ProductionUnit) => {
    setSelectedUnit(unit)
    setIsViewDialogOpen(true)
  }

  const openDeleteDialog = (unit: ProductionUnit) => {
    setSelectedUnit(unit)
    confirmDelete("L'unité et ses données liées seront définitivement supprimés.").then((ok) => {
      if (ok) handleDelete()
    })
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await unitsApi.list(params)
      toast.success("Export Excel réussi")
    } catch {
      toast.error("Erreur lors de l'export Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const handleActivate = async (unit: ProductionUnit) => {
    try {
      await unitsApi.update(unit.id, { status: 'active' })
      toast.success("Unité activée avec succès")
      invalidateUnits()
      refresh()
    } catch {
      toast.error("Erreur lors de l'activation de l'unité")
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-2">{t("loadError")}</p>
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
          <h1 className="text-2xl font-bold text-[#0a1628] dark:text-foreground">Unités de Production</h1>
          <p className="mt-1 text-sm text-[#5a7a9a] dark:text-muted-foreground">
            {total} unité{total !== 1 ? "s" : ""} enregistrée{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-[#c5ddf5] text-[#1e3a5f] hover:bg-[#e8f4fc] dark:border-border dark:text-foreground dark:hover:bg-accent/40" onClick={handleExportExcel} disabled={isExporting}>
            <Download className="w-4 h-4" />
            Exporter
          </Button>
          <Button className="gap-2 bg-[#1e3a5f] text-white hover:bg-[#2d5a87] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90" onClick={() => {
            resetAddForm()
            setIsAddDialogOpen(true)
          }}>
            <Plus className="w-4 h-4" />
            Nouvelle Unité
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#c5ddf5] bg-card/95 p-4 shadow-sm dark:border-border dark:bg-card/95">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
            <Input
              placeholder="Rechercher par nom, code ou responsable..."
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
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="suspended">Suspendu</SelectItem>
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
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Type</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Région</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Responsable</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Membres</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Surface</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Statut</TableHead>
                <TableHead className="text-right font-semibold text-[#1e3a5f] dark:text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-[#5a7a9a]">
                    Aucune unité trouvée
                  </TableCell>
                </TableRow>
              ) : (
                units.map((unit) => (
                  <TableRow key={unit.id} className="hover:bg-muted/50 dark:hover:bg-muted/60">
                    <TableCell className="font-mono text-sm text-[#1e3a5f] dark:text-foreground">{unit.code}</TableCell>
                    <TableCell className="font-medium text-[#0a1628] dark:text-foreground">{unit.name}</TableCell>
                    <TableCell className="text-[#5a7a9a] dark:text-muted-foreground">{unitTypeLabels[unit.unit_type] || unit.unit_type}</TableCell>
                    <TableCell className="text-[#5a7a9a] dark:text-muted-foreground">{unit.region_name || '-'}</TableCell>
                    <TableCell className="text-[#5a7a9a] dark:text-muted-foreground">{unit.manager_name || '-'}</TableCell>
                    <TableCell className="text-center text-[#0a1628] dark:text-foreground">{unit.members_count || 0}</TableCell>
                    <TableCell className="text-[#0a1628] dark:text-foreground">{(unit.total_area || 0).toLocaleString('fr-FR')} ha</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[unit.status]?.class || statusConfig.active.class}`}>
                        {statusConfig[unit.status]?.label || unit.status}
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
                          <DropdownMenuItem onClick={() => openViewDialog(unit)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(unit)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(unit)} className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                          {unit.status !== 'active' && (
                            <DropdownMenuItem onClick={() => handleActivate(unit)}>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <Users className="w-5 h-5" />
              Nouvelle Unité
            </DialogTitle>
            <DialogDescription>Remplissez les informations de la nouvelle unité</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Nom de l'unité *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Ambodiampana"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Code unité *</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: UNIT-001"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Type d'unité</label>
              <Select value={formData.unit_type} onValueChange={(v) => setFormData({ ...formData, unit_type: v as ProductionUnit['unit_type'] })}>
                <SelectTrigger className="border-[#c5ddf5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Groupe</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="village">Village</SelectItem>
                  <SelectItem value="region">Region</SelectItem>
                </SelectContent>
              </Select>
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
                <label className="text-sm font-medium text-[#0a1628]">Commune</label>
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
              <label className="text-sm font-medium text-[#0a1628]">Responsable</label>
              <Input
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                placeholder="Nom du responsable"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Fonction du responsable</label>
              <Input
                value={formData.manager_function}
                onChange={(e) => setFormData({ ...formData, manager_function: e.target.value })}
                placeholder="Fonction"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <label className="text-sm font-medium text-[#0a1628]">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemple@domain.com"
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Membres</label>
                <Input
                  type="number"
                  value={formData.members_count}
                  onChange={(e) => setFormData({ ...formData, members_count: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Superficie (ha)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_area}
                  onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Date de création</label>
              <Input
                value={formData.creation_date}
                onChange={(e) => setFormData({ ...formData, creation_date: e.target.value })}
                placeholder="JJ/MM/AAAA"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Statut</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as ProductionUnit['status'] })}>
                <SelectTrigger className="border-[#c5ddf5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Observations</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="border-[#c5ddf5]"
              />
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <Edit className="w-5 h-5" />
              Modifier l'Unité
            </DialogTitle>
            <DialogDescription>Modifiez les informations de l'unité</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Nom de l'unité</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Code unité</label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Type d'unité</label>
              <Select value={formData.unit_type} onValueChange={(v) => setFormData({ ...formData, unit_type: v as ProductionUnit['unit_type'] })}>
                <SelectTrigger className="border-[#c5ddf5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Groupe</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="village">Village</SelectItem>
                  <SelectItem value="region">Region</SelectItem>
                </SelectContent>
              </Select>
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
                <label className="text-sm font-medium text-[#0a1628]">Commune</label>
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
              <label className="text-sm font-medium text-[#0a1628]">Responsable</label>
              <Input
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Téléphone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Membres</label>
                <Input
                  type="number"
                  value={formData.members_count}
                  onChange={(e) => setFormData({ ...formData, members_count: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Superficie (ha)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_area}
                  onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Statut</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as ProductionUnit['status'] })}>
                <SelectTrigger className="border-[#c5ddf5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
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
              Détails de l'Unité
            </DialogTitle>
          </DialogHeader>
          {selectedUnit && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-[#e8f4fc] rounded-lg">
                <div className="w-14 h-14 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xl font-bold">
                  {selectedUnit.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0a1628]">{selectedUnit.name}</h3>
                  <p className="text-sm font-mono text-[#5a7a9a]">{selectedUnit.code}</p>
                  <p className="text-xs text-[#5a7a9a]">{unitTypeLabels[selectedUnit.unit_type] || selectedUnit.unit_type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a] flex items-center gap-1"><MapPin className="w-3 h-3" /> Région</p>
                  <p className="font-medium text-[#0a1628]">{selectedUnit.region_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Commune</p>
                  <p className="font-medium text-[#0a1628]">{selectedUnit.commune_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a] flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone</p>
                  <p className="font-medium text-[#0a1628]">{selectedUnit.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a] flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                  <p className="font-medium text-[#0a1628]">{selectedUnit.email || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Responsable</p>
                  <p className="font-medium text-[#0a1628]">{selectedUnit.manager_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Fonction</p>
                  <p className="font-medium text-[#0a1628]">{selectedUnit.manager_function || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Membres</p>
                  <p className="font-medium text-[#0a1628]">{selectedUnit.members_count || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Surface totale</p>
                  <p className="font-medium text-[#0a1628]">{(selectedUnit.total_area || 0).toLocaleString('fr-FR')} ha</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a] flex items-center gap-1"><Calendar className="w-3 h-3" /> Date de création</p>
                  <p className="font-medium text-[#0a1628]">{selectedUnit.creation_date ? new Date(selectedUnit.creation_date).toLocaleDateString('fr-FR') : '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Statut</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusConfig[selectedUnit.status]?.class || statusConfig.active.class}`}>
                    {statusConfig[selectedUnit.status]?.label || selectedUnit.status}
                  </span>
                </div>
              </div>
              {selectedUnit.notes && (
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Observations</p>
                  <p className="text-sm text-[#0a1628]">{selectedUnit.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function useUnit(id: number | null) {
  const { data, error, isLoading, mutate: refresh } = useSWR<ProductionUnit>(
    id ? `/production-units/${id}/` : null,
    fetcher
  )

  return {
    unit: data,
    isLoading,
    error,
    refresh,
  }
}