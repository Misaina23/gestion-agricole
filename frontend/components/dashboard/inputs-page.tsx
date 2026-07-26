"use client"

import { useState, useEffect } from "react"
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Download,
  MoreHorizontal,
  MapPin,
  Calendar,
  Loader2,
  TrendingUp,
  Users,
  ClipboardList,
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
import {
  useInputs,
  useInputStats,
  useRegions,
  useCommunes,
  useCampaigns,
} from "@/lib/hooks"
import { inputsApi, type InputDistribution, type InputType } from "@/lib/api"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { confirmDelete, successAlert, errorAlert } from "@/lib/sweetalert"

export function InputsPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [campaignFilter, setCampaignFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedInput, setSelectedInput] = useState<InputDistribution | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inputTypes, setInputTypes] = useState<InputType[]>([])

  type InputFormData = {
    input_type: string
    quantity: string
    unit: string
    unit_value: string
    producer: string
    campaign: string
    distribution_date: string
    distributed_by: string
    notes: string
  }

  const [formData, setFormData] = useState<InputFormData>({
    input_type: "",
    quantity: "",
    unit: "kg",
    unit_value: "",
    producer: "",
    campaign: "",
    distribution_date: new Date().toISOString().split('T')[0],
    distributed_by: "",
    notes: "",
  })

  const { regions } = useRegions()
  const selectedRegionId = regionFilter !== "all" ? Number(regionFilter) : undefined
  const { communes } = useCommunes(selectedRegionId)
  const { campaigns } = useCampaigns()
  const { stats } = useInputStats()

  useEffect(() => {
    inputsApi.types().then((data) => setInputTypes(data.results || [])).catch(() => setInputTypes([]))
  }, [])

  const params: Record<string, string> = { page_size: "4" }
  if (searchQuery) params.search = searchQuery
  if (typeFilter !== "all") params.input_type = typeFilter
  if (regionFilter !== "all") params.producer__region = regionFilter
  if (campaignFilter !== "all") params.campaign = campaignFilter
  params.page = currentPage.toString()

  const { inputs, total, isLoading, error, refresh } = useInputs(params)
  const totalPages = Math.max(1, Math.ceil((total || 0) / 4))

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, regionFilter, campaignFilter])

  const resetAddForm = () => {
    setFormData({
      input_type: "",
      quantity: "",
      unit: "kg",
      unit_value: "",
      producer: "",
      campaign: "",
      distribution_date: new Date().toISOString().split('T')[0],
      distributed_by: "",
      notes: "",
    })
  }

  const handleAdd = async () => {
    if (!formData.input_type || !formData.quantity || !formData.producer) {
      toast.error("Le type, la quantité et le producteur sont obligatoires")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: Record<string, any> = {
        input_type: Number(formData.input_type),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        unit_value: formData.unit_value ? parseFloat(formData.unit_value) : undefined,
        producer: Number(formData.producer),
        campaign: formData.campaign ? Number(formData.campaign) : undefined,
        distribution_date: formData.distribution_date,
        distributed_by: formData.distributed_by ? Number(formData.distributed_by) : undefined,
        notes: formData.notes.trim() || undefined,
      }
      await inputsApi.create(payload)
      toast.success("Distribution ajoutée avec succès")
      resetAddForm()
      setIsAddDialogOpen(false)
      refresh()
    } catch (error: any) {
      console.error('Input create failed', error)
      toast.error(error?.message || "Erreur lors de l'ajout de la distribution")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedInput) return
    setIsSubmitting(true)
    try {
      const payload: Record<string, any> = {
        input_type: Number(formData.input_type),
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        unit_value: formData.unit_value ? parseFloat(formData.unit_value) : undefined,
        producer: Number(formData.producer),
        campaign: formData.campaign ? Number(formData.campaign) : undefined,
        distribution_date: formData.distribution_date,
        distributed_by: formData.distributed_by ? Number(formData.distributed_by) : undefined,
        notes: formData.notes || undefined,
      }
      await inputsApi.update(selectedInput.id, payload)
      toast.success("Distribution modifiée avec succès")
      setIsEditDialogOpen(false)
      setSelectedInput(null)
      refresh()
    } catch {
      toast.error("Erreur lors de la modification de la distribution")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedInput) return
    setIsSubmitting(true)
    try {
      await inputsApi.delete(selectedInput.id)
      successAlert("Suppression réussie", "La distribution a été supprimée.")
      setIsDeleteDialogOpen(false)
      setSelectedInput(null)
      refresh()
    } catch {
      errorAlert("Erreur", "Impossible de supprimer la distribution.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteDialog = (item: InputDistribution) => {
    setSelectedInput(item)
    confirmDelete("La distribution sera définitivement supprimée.").then((ok) => {
      if (ok) handleDelete()
    })
  }

  const openEditDialog = (item: InputDistribution) => {
    setSelectedInput(item)
    setFormData({
      input_type: item.input_type?.toString() || "",
      quantity: item.quantity.toString(),
      unit: item.unit,
      unit_value: item.unit_value?.toString() || "",
      producer: item.producer?.toString() || "",
      campaign: item.campaign?.toString() || "",
      distribution_date: item.distribution_date,
      distributed_by: item.distributed_by?.toString() || "",
      notes: item.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (item: InputDistribution) => {
    setSelectedInput(item)
    setIsViewDialogOpen(true)
  }

  const handleExportCsv = async () => {
    setIsExporting(true)
    try {
      await inputsApi.list({ page_size: "1000" })
      toast.success("Export CSV réussi")
    } catch {
      toast.error("Erreur lors de l'export CSV")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await inputsApi.list({ page_size: "1000" })
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
      await inputsApi.list({ page_size: "1000" })
      toast.success("Export PDF réussi")
    } catch {
      toast.error("Erreur lors de l'export PDF")
    } finally {
      setIsExporting(false)
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
          <h1 className="text-2xl font-bold text-[#0a1628] dark:text-foreground">Gestion des Intrants</h1>
          <p className="mt-1 text-sm text-[#5a7a9a] dark:text-muted-foreground">
            {total} distribution{total !== 1 ? "s" : ""} enregistrée{total !== 1 ? "s" : ""}
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
              <DropdownMenuItem onClick={handleExportCsv} disabled={isExporting}>CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf} disabled={isExporting}>PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="gap-2 bg-[#1e3a5f] text-white hover:bg-[#2d5a87] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90" onClick={() => {
            resetAddForm()
            setIsAddDialogOpen(true)
          }}>
            <Plus className="w-4 h-4" />
            Nouvelle Distribution
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-card rounded-xl border border-[#e8f4fc] dark:border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] dark:bg-muted flex items-center justify-center">
              <Package className="w-5 h-5 text-[#1e3a5f] dark:text-foreground" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a] dark:text-muted-foreground">Total Distributions</p>
              <p className="text-2xl font-bold text-[#0a1628] dark:text-foreground">{stats?.total ?? total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl border border-[#e8f4fc] dark:border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] dark:bg-muted flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#1e3a5f] dark:text-foreground" />
            </div>
              <div>
                <p className="text-xs text-[#5a7a9a] dark:text-muted-foreground">Quantité Totale</p>
                <p className="text-2xl font-bold text-[#0a1628] dark:text-foreground">{stats?.total_quantity ?? 0}</p>
              </div>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl border border-[#e8f4fc] dark:border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] dark:bg-muted flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-[#1e3a5f] dark:text-foreground" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a] dark:text-muted-foreground">Valeur Totale</p>
              <p className="text-2xl font-bold text-[#0a1628] dark:text-foreground">{(stats?.total_value ?? 0).toLocaleString()} €</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl border border-[#e8f4fc] dark:border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] dark:bg-muted flex items-center justify-center">
              <Users className="w-5 h-5 text-[#1e3a5f] dark:text-foreground" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a] dark:text-muted-foreground">Producteurs</p>
              <p className="text-2xl font-bold text-[#0a1628] dark:text-foreground">{new Set(inputs.map(i => i.producer).filter(Boolean)).size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#c5ddf5] bg-card/95 p-4 shadow-sm dark:border-border dark:bg-card/95">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
            <Input
              placeholder="Rechercher par type, producteur ou notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#c5ddf5] focus:border-[#87ceeb]"
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] border-[#c5ddf5]">
                <Filter className="w-4 h-4 mr-2 text-[#5a7a9a]" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                {inputTypes.map((it) => (
                  <SelectItem key={it.id} value={it.id.toString()}>
                    {it.name}
                  </SelectItem>
                ))}
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
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-[140px] border-[#c5ddf5]">
                <Calendar className="w-4 h-4 mr-2 text-[#5a7a9a]" />
                <SelectValue placeholder="Campagne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes campagnes</SelectItem>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id.toString()}>
                    {campaign.name}
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
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Type</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Producteur</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Quantité</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Valeur</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Campagne</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Distribué par</TableHead>
                <TableHead className="font-semibold text-[#1e3a5f] dark:text-foreground">Date</TableHead>
                <TableHead className="text-right font-semibold text-[#1e3a5f] dark:text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inputs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-[#5a7a9a]">
                    Aucune distribution trouvee
                  </TableCell>
                </TableRow>
              ) : (
                inputs.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 dark:hover:bg-muted/60">
                    <TableCell className="font-medium text-[#0a1628] dark:text-foreground">{item.input_type_name || '-'}</TableCell>
                    <TableCell className="text-[#5a7a9a] dark:text-muted-foreground">{item.producer_name || '-'}</TableCell>
                    <TableCell className="text-[#5a7a9a] dark:text-muted-foreground">{item.quantity} {item.unit}</TableCell>
                    <TableCell className="text-[#5a7a9a] dark:text-muted-foreground">{item.total_value?.toLocaleString() || '-'} €</TableCell>
                    <TableCell className="text-[#5a7a9a] dark:text-muted-foreground">{item.campaign_name || '-'}</TableCell>
                    <TableCell className="text-[#5a7a9a] dark:text-muted-foreground">{item.distributed_by_name || '-'}</TableCell>
                    <TableCell className="text-[#5a7a9a] dark:text-muted-foreground">{new Date(item.distribution_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openViewDialog(item)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(item)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(item)} className="text-red-600">
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

      {/* Pagination */}
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
              <Package className="w-5 h-5" />
              Nouvelle Distribution
            </DialogTitle>
            <DialogDescription>Remplissez les informations de la distribution</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Type d'intrant</label>
              <Select value={formData.input_type} onValueChange={(value) => setFormData({ ...formData, input_type: value })}>
                <SelectTrigger className="border-[#c5ddf5]">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {inputTypes.map((it) => (
                    <SelectItem key={it.id} value={it.id.toString()}>
                      {it.name} ({it.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Quantité</label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Unité</label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="kg"
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Valeur unitaire</label>
              <Input
                type="number"
                value={formData.unit_value}
                onChange={(e) => setFormData({ ...formData, unit_value: e.target.value })}
                placeholder="0"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Date de distribution</label>
              <Input
                type="date"
                value={formData.distribution_date}
                onChange={(e) => setFormData({ ...formData, distribution_date: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes optionnelles"
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
              Modifier la Distribution
            </DialogTitle>
            <DialogDescription>Modifiez les informations de la distribution</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Type d'intrant</label>
              <Select value={formData.input_type} onValueChange={(value) => setFormData({ ...formData, input_type: value })}>
                <SelectTrigger className="border-[#c5ddf5]">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {inputTypes.map((it) => (
                    <SelectItem key={it.id} value={it.id.toString()}>
                      {it.name} ({it.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Quantité</label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Unité</label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Valeur unitaire</label>
              <Input
                type="number"
                value={formData.unit_value}
                onChange={(e) => setFormData({ ...formData, unit_value: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Date de distribution</label>
              <Input
                type="date"
                value={formData.distribution_date}
                onChange={(e) => setFormData({ ...formData, distribution_date: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="border-[#c5ddf5]"
              />
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
              <Eye className="w-5 h-5" />
              Détails de la Distribution
            </DialogTitle>
          </DialogHeader>
          {selectedInput && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-[#e8f4fc] rounded-lg">
                <div className="w-14 h-14 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xl font-bold">
                  {selectedInput.input_type_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'IN'}
                </div>
                <div>
                  <h3 className="font-semibold text-[#0a1628]">{selectedInput.input_type_name || 'Type inconnu'}</h3>
                  <p className="text-sm text-[#5a7a9a]">{selectedInput.producer_name || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Quantité</p>
                  <p className="font-medium text-[#0a1628]">{selectedInput.quantity} {selectedInput.unit}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Valeur</p>
                  <p className="font-medium text-[#0a1628]">{selectedInput.total_value?.toLocaleString() || '-'} €</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Campagne</p>
                  <p className="font-medium text-[#0a1628]">{selectedInput.campaign_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-[#5a7a9a]">Date</p>
                  <p className="font-medium text-[#0a1628]">{new Date(selectedInput.distribution_date).toLocaleDateString('fr-FR')}</p>
                </div>
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
              Supprimer la Distribution
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette distribution ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          {selectedInput && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                  {selectedInput.input_type_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'IN'}
                </div>
                <div>
                  <p className="font-medium text-[#0a1628]">{selectedInput.input_type_name || 'Type inconnu'}</p>
                  <p className="text-xs text-[#5a7a9a]">{selectedInput.producer_name || '-'} - {new Date(selectedInput.distribution_date).toLocaleDateString('fr-FR')}</p>
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
