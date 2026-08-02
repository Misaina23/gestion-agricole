"use client"

import { useState, useEffect, useMemo } from "react"
import { Campaign, CampaignProducer, Producer, campaignsApi, campaignProducersApi } from "@/lib/api"
import { useCultures, useProducers, useRegions } from "@/lib/hooks"
import {
  Loader2,
  Sprout,
  Calendar,
  MapPin,
  Target,
  Search,
  Filter,
  TrendingUp,
  Trash2,
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { successAlert, errorAlert, confirmDelete } from "@/lib/sweetalert"

const statusConfig: Record<string, { label: string; class: string }> = {
  active: { label: "Active", class: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Terminée", class: "bg-blue-100 text-blue-700" },
  pending: { label: "En attente", class: "bg-amber-100 text-amber-700" },
  cancelled: { label: "Annulée", class: "bg-red-100 text-red-700" },
}

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
  const [isAssigningProducer, setIsAssigningProducer] = useState(false)
  const [isManageProducersOpen, setIsManageProducersOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [assignedProducers, setAssignedProducers] = useState<CampaignProducer[]>([])
  const [selectedProducerId, setSelectedProducerId] = useState<string>("")
  const [producerSearch, setProducerSearch] = useState<string>("")
  const [producerRegionFilter, setProducerRegionFilter] = useState<string>("all")
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
    culture: "",
    region: "23",
    start_date: "",
    end_date: "",
    budget: "",
    status: "active",
  })

  const { regions } = useRegions()
  const { cultures } = useCultures()
  const { producers: allActiveProducers, isLoading: isLoadingAvailableProducers } = useProducers({
    status: 'active',
    page_size: '500',
  })
  const visibleProducers = useMemo(() => {
    const q = producerSearch.trim().toLowerCase()
    const assignedIds = new Set((assignedProducers || []).map((a) => a.producer))
    return (allActiveProducers || []).filter((p: Producer) => {
      if (assignedIds.has(p.id)) return false
      const matchesSearch = !q || `${p.name} ${p.code}`.toLowerCase().includes(q)
      const matchesRegion =
        producerRegionFilter === 'all' ||
        String(p.region) === producerRegionFilter ||
        p.region_name === producerRegionFilter
      return matchesSearch && matchesRegion
    })
  }, [allActiveProducers, producerSearch, producerRegionFilter, assignedProducers])

  const loadCampaigns = async () => {
    try {
      const res = await campaignsApi.list()
      setCampaigns(res.results || [])
    } finally {
      setLoading(false)
    }
  }

  const loadAssignedProducers = async (campaignId: number) => {
    setIsLoadingAssignments(true)
    try {
      const res = await campaignProducersApi.list({ campaign: campaignId.toString() })
      setAssignedProducers(res.results || [])
    } catch (error) {
      console.error('Failed to load campaign producers', error)
      setAssignedProducers([])
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  useEffect(() => {
    if (isManageProducersOpen && selectedCampaign) {
      loadAssignedProducers(selectedCampaign.id)
    }
  }, [isManageProducersOpen, selectedCampaign])

  const handleAddCampaign = async () => {
    if (!campaignForm.name.trim() || !campaignForm.culture || !campaignForm.region || !campaignForm.start_date || !campaignForm.end_date) {
      errorAlert("Champs requis", "Veuillez remplir tous les champs obligatoires.")
      return
    }

    setIsCreatingCampaign(true)
    try {
      await campaignsApi.create({
        name: campaignForm.name.trim(),
        description: campaignForm.description.trim() || undefined,
        culture: Number(campaignForm.culture),
        region: Number(campaignForm.region),
        start_date: campaignForm.start_date,
        end_date: campaignForm.end_date,
        budget: campaignForm.budget ? Number(campaignForm.budget) : undefined,
        status: campaignForm.status as Campaign['status'],
      })
      successAlert("Campagne créée", "La campagne a été créée avec succès.")
      const res = await campaignsApi.list()
      setCampaigns(res.results || [])
      setCampaignForm({
        name: "",
        description: "",
        culture: "",
        region: regions[0]?.id?.toString() || "",
        start_date: "",
        end_date: "",
        budget: "",
        status: "active",
      })
      setIsAddDialogOpen(false)
    } catch (error: any) {
      console.error(error)
      errorAlert("Erreur", error?.message || "Impossible de créer la campagne.")
    } finally {
      setIsCreatingCampaign(false)
    }
  }

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.culture_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.region_name?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || c.status === statusFilter
      const matchesRegion =
        regionFilter === "all" ||
        c.region?.toString() === regionFilter ||
        c.region_name === regionFilter
      return matchesSearch && matchesStatus && matchesRegion
    })
  }, [campaigns, searchQuery, statusFilter, regionFilter])

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0)
  const totalProducers = campaigns.reduce((acc, c) => acc + (c.producers_count || 0), 0)

  const handleDeleteCampaign = async (campaign: Campaign) => {
    const ok = await confirmDelete(`La campagne "${campaign.name}" sera définitivement supprimée.`)
    if (!ok) return
    setIsCreatingCampaign(true)
    try {
      await campaignsApi.delete(campaign.id)
      successAlert("Campagne supprimée", "La campagne a été supprimée avec succès.")
      const res = await campaignsApi.list()
      setCampaigns(res.results || [])
    } catch (error: any) {
      errorAlert("Erreur", error?.message || "Impossible de supprimer la campagne.")
    } finally {
      setIsCreatingCampaign(false)
    }
  }

  const handleOpenManageProducers = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setSelectedProducerId("")
    setIsManageProducersOpen(true)
  }

  const handleAssignProducer = async () => {
    if (!selectedCampaign || !selectedProducerId) return

    if (assignedProducers.some((a) => String(a.producer) === String(selectedProducerId))) {
      errorAlert("Déjà assigné", "Ce producteur est déjà assigné à cette campagne.")
      setSelectedProducerId("")
      return
    }

    setIsAssigningProducer(true)
    try {
      await campaignProducersApi.create({
        campaign: selectedCampaign.id,
        producer: Number(selectedProducerId),
      })
      await loadAssignedProducers(selectedCampaign.id)
      await loadCampaigns()
      setSelectedProducerId("")
      successAlert("Producteur ajouté", "Le producteur a été assigné à la campagne.")
    } catch (error: any) {
      console.error('Failed to assign producer', error)
      const msg = error?.message || "Impossible d'assigner le producteur à la campagne."
      errorAlert("Erreur", msg)
    } finally {
      setIsAssigningProducer(false)
    }
  }

  const handleRemoveAssignedProducer = async (assignmentId: number) => {
    const ok = await confirmDelete("Le producteur sera retiré de cette campagne.")
    if (!ok) return
    setIsAssigningProducer(true)
    try {
      await campaignProducersApi.delete(assignmentId)
      if (selectedCampaign) {
        await loadAssignedProducers(selectedCampaign.id)
        await loadCampaigns()
      }
      successAlert("Producteur retiré", "Le producteur a été retiré de la campagne.")
    } catch (error) {
      console.error('Failed to remove assigned producer', error)
      errorAlert("Erreur", "Impossible de retirer le producteur de la campagne.")
    } finally {
      setIsAssigningProducer(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Sprout className="w-6 h-6 text-[#1e3a5f]" />
          <h1 className="text-2xl font-bold text-[#0a1628]">Campagnes agricoles</h1>
        </div>
        <button
          type="button"
          className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-white hover:bg-[#2d5a87]"
          onClick={() => setIsAddDialogOpen(true)}
        >
          Nouvelle campagne
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#e8f4fc] bg-card/95 p-4 dark:border-border dark:bg-card/95">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">Total Campagnes</p>
              <p className="text-2xl font-bold text-[#0a1628]">{campaigns.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e8f4fc] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">Actives</p>
              <p className="text-2xl font-bold text-[#0a1628]">{activeCampaigns}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e8f4fc] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">Producteurs</p>
              <p className="text-2xl font-bold text-[#0a1628]">{totalProducers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e8f4fc] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">Budget Total</p>
              <p className="text-2xl font-bold text-[#0a1628]">{totalBudget.toLocaleString()} €</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 p-4 dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
            <Input
              placeholder="Rechercher par nom, culture ou région..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#c5ddf5] focus:border-[#87ceeb]"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] border-[#c5ddf5]">
                <Filter className="w-4 h-4 mr-2 text-[#5a7a9a]" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-[150px] border-[#c5ddf5]">
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

        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-slate-900/70 dark:hover:bg-slate-900/70">
              <TableHead className="text-slate-700 dark:text-slate-200">Nom</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-200">Culture</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-200">Région</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-200">Dates</TableHead>
              <TableHead className="text-slate-700 dark:text-slate-200">Statut</TableHead>
              <TableHead className="text-right text-slate-700 dark:text-slate-200">Budget</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center py-4">
                    <Sprout className="w-8 h-8 text-[#5a7a9a] mb-2" />
                    <p className="text-[#5a7a9a]">Aucune campagne disponible.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                    {campaign.name}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    {campaign.culture_name || "-"}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    {campaign.region_name || "-"}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    {new Date(campaign.start_date).toLocaleDateString()} -
                    {" "}
                    {new Date(campaign.end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        statusConfig[campaign.status]?.class || "bg-gray-100"
                      }
                    >
                      {statusConfig[campaign.status]?.label || campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-slate-900 dark:text-slate-100">
                    {campaign.budget
                      ? `${Number(campaign.budget).toLocaleString()} €`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-xl bg-slate-800 px-3 py-1 text-sm text-white transition-colors hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                        onClick={() => handleOpenManageProducers(campaign)}
                      >
                        Gérer producteurs
                      </button>
                      <button
                        type="button"
                        className="rounded-xl bg-red-600 px-3 py-1 text-sm text-white transition-colors hover:bg-red-700"
                        onClick={() => handleDeleteCampaign(campaign)}
                        disabled={isCreatingCampaign}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isAddDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#0a1628]">Nouvelle campagne</h2>
                <p className="text-sm text-[#5a7a9a]">Créer une campagne 2026-2027 et l’associer à une région.</p>
              </div>
              <button
                type="button"
                className="text-[#1e3a5f] hover:text-[#0d304d]"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Fermer
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Nom de la campagne</label>
                <Input
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  placeholder="Campagne 2026-2027"
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Culture</label>
                <Select
                  value={campaignForm.culture}
                  onValueChange={(value) => setCampaignForm({ ...campaignForm, culture: value })}
                >
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {cultures.map((culture) => (
                      <SelectItem key={culture.id} value={culture.id.toString()}>
                        {culture.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Région</label>
                <Select
                  value={campaignForm.region}
                  onValueChange={(value) => setCampaignForm({ ...campaignForm, region: value })}
                >
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0a1628]">Début</label>
                  <Input
                    type="date"
                    value={campaignForm.start_date}
                    onChange={(e) => setCampaignForm({ ...campaignForm, start_date: e.target.value })}
                    className="border-[#c5ddf5]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0a1628]">Fin</label>
                  <Input
                    type="date"
                    value={campaignForm.end_date}
                    onChange={(e) => setCampaignForm({ ...campaignForm, end_date: e.target.value })}
                    className="border-[#c5ddf5]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Budget (€)</label>
                <Input
                  type="number"
                  value={campaignForm.budget}
                  onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Statut</label>
                <Select
                  value={campaignForm.status}
                  onValueChange={(value) => setCampaignForm({ ...campaignForm, status: value })}
                >
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Description</label>
                <Input
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Objectifs, notes, etc."
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-xl border border-[#c5ddf5] px-4 py-2 text-[#0a1628]"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Annuler
              </button>
               <button
                 type="button"
                 className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-white hover:bg-[#2d5a87]"
                 onClick={handleAddCampaign}
                 disabled={isCreatingCampaign}
               >
                 {isCreatingCampaign ? 'Enregistrement...' : 'Créer la campagne'}
               </button>
            </div>
          </div>
        </div>
      ) : null}

      {isManageProducersOpen && selectedCampaign ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Producteurs de {selectedCampaign.name}</h2>
                <p className="text-sm text-muted-foreground">Ajouter ou retirer des producteurs de cette campagne.</p>
              </div>
              <button
                type="button"
                className="rounded-xl border border-border px-4 py-2 text-foreground hover:bg-muted"
                onClick={() => setIsManageProducersOpen(false)}
              >
                Fermer
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Filtrer producteurs</label>
                <Input
                  placeholder="Rechercher un producteur..."
                  value={producerSearch}
                  onChange={(e) => setProducerSearch(e.target.value)}
                  className="border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Région</label>
                <Select
                  value={producerRegionFilter}
                  onValueChange={setProducerRegionFilter}
                >
                  <SelectTrigger className="border-border">
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

            <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-foreground">Assignation</p>
                  <p className="text-xs text-muted-foreground">Sélectionnez un producteur et cliquez sur Ajouter.</p>
                </div>
                <button
                  type="button"
                  className="rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                  onClick={handleAssignProducer}
                  disabled={!selectedProducerId || isAssigningProducer}
                >
                  Ajouter
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  value={selectedProducerId}
                  onValueChange={setSelectedProducerId}
                >
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Producteur à ajouter" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAvailableProducers ? (
                      <SelectItem value="__loading" disabled>Chargement...</SelectItem>
                    ) : visibleProducers.length === 0 ? (
                      <SelectItem value="__empty" disabled>Aucun producteur disponible</SelectItem>
                    ) : (
                      visibleProducers.map((producer: Producer) => (
                        <SelectItem key={producer.id} value={producer.id.toString()}>
                          {producer.code} - {producer.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold text-foreground">Producteurs assignés</h3>
              {isLoadingAssignments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : assignedProducers.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">Aucun producteur assigné à cette campagne.</p>
              ) : (
                <div className="space-y-3">
                  {assignedProducers.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{assignment.producer_name || assignment.producer}</p>
                        <p className="text-sm text-muted-foreground">{assignment.producer_code || ''} • Inscrit le {new Date(assignment.enrollment_date).toLocaleDateString()}</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-xl bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                        onClick={() => handleRemoveAssignedProducer(assignment.id)}
                        disabled={isAssigningProducer}
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
