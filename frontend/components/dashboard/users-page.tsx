"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  MoreHorizontal,
  Shield,
  UserCheck,
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
import { toast } from "sonner"
import { useUsers, useUserStats } from "@/lib/hooks"
import { usersApi } from "@/lib/api"
import { confirmDelete, successAlert, errorAlert } from "@/lib/sweetalert"

interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: "admin" | "manager" | "agent" | "inspector" | "viewer"
  is_active: boolean
  date_joined: string
  phone?: string
  region?: string
}

const roleConfig = {
  admin: { label: "Administrateur", class: "bg-red-100 text-red-700 border-red-200" },
  manager: { label: "Superviseur", class: "bg-[#e8f4fc] text-[#1e3a5f] border-[#c5ddf5]" },
  agent: { label: "Agent de terrain", class: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  inspector: { label: "Inspecteur", class: "bg-amber-100 text-amber-700 border-amber-200" },
  viewer: { label: "Observateur", class: "bg-gray-100 text-gray-700 border-gray-200" },
}

export function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    role: "agent",
    phone: "",
    region: "",
  })

  const params: Record<string, string> = { page_size: "4" }
  if (searchQuery) params.search = searchQuery
  if (roleFilter !== "all") params.role = roleFilter
  params.page = currentPage.toString()

  const { data: users = [], total, isLoading, mutate } = useUsers(params)
  const totalPages = Math.max(1, Math.ceil((total || 0) / 4))
  const { stats: userStats } = useUserStats()

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter])

  const handleAdd = async () => {
    setIsSubmitting(true)
    try {
      await usersApi.create({
        username: formData.username,
        email: formData.email,
        first_name: formData.full_name.split(' ')[0] || '',
        last_name: formData.full_name.split(' ').slice(1).join(' ') || '',
        password: formData.password,
        password_confirm: formData.password,
        role: formData.role,
        phone: formData.phone,
        region: formData.region,
      })
      toast.success("Utilisateur ajoute avec succes")
      mutate()
      setFormData({ username: "", email: "", full_name: "", password: "", role: "agent", phone: "", region: "" })
      setIsAddDialogOpen(false)
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de l&apos;ajout")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)
    try {
      const nameParts = (formData.full_name || '').trim().split(/\s+/)
      await usersApi.update(selectedUser.id, {
        email: formData.email,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        role: formData.role,
        phone: formData.phone,
        region: formData.region,
      })
      toast.success("Utilisateur modifie avec succes")
      mutate()
      setIsEditDialogOpen(false)
      setSelectedUser(null)
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la modification")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)
    try {
      await usersApi.delete(selectedUser.id)
      successAlert("Suppression réussie", "L'utilisateur a été supprimé avec succès.")
      mutate()
      setSelectedUser(null)
    } catch {
      errorAlert("Erreur", "Impossible de supprimer l'utilisateur.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      password: "",
      role: user.role,
      phone: user.phone || "",
      region: user.region || "",
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (user: User) => {
    setSelectedUser(user)
    setIsViewDialogOpen(true)
  }

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    confirmDelete("Cet utilisateur sera définitivement supprimé.").then((ok) => {
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
          <h1 className="text-2xl font-bold text-[#0a1628]">Gestion des Utilisateurs</h1>
          <p className="text-sm text-[#5a7a9a] mt-1">
            {total} utilisateur{total !== 1 ? "s" : ""} enregistré{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87] text-white" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Nouvel Utilisateur
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Total" value={total} icon={<Users className="w-5 h-5" />} />
        <StatCard title="Administrateurs" value={userStats?.admin ?? 0} icon={<Shield className="w-5 h-5" />} />
        <StatCard title="Superviseurs" value={userStats?.manager ?? 0} icon={<UserCheck className="w-5 h-5" />} />
        <StatCard title="Actifs" value={userStats?.active ?? 0} icon={<UserCheck className="w-5 h-5 text-emerald-600" />} />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-[#c5ddf5] bg-card/95 p-4 shadow-sm dark:border-border dark:bg-card/95">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
            <Input
              placeholder="Rechercher par nom, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-[#c5ddf5] focus:border-[#87ceeb]"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px] border-[#c5ddf5]">
              <Filter className="w-4 h-4 mr-2 text-[#5a7a9a]" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les roles</SelectItem>
              <SelectItem value="admin">Administrateur</SelectItem>
              <SelectItem value="manager">Superviseur</SelectItem>
                <SelectItem value="agent">Agent de terrain</SelectItem>
              <SelectItem value="inspector">Inspecteur</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#c5ddf5] bg-card/95 shadow-sm dark:border-border dark:bg-card/95">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#e8f4fc] hover:bg-[#e8f4fc]">
              <TableHead className="font-semibold text-[#1e3a5f]">Nom</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Email</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Role</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f]">Statut</TableHead>
              <TableHead className="font-semibold text-[#1e3a5f] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#5a7a9a]">
                    Aucun utilisateur trouve
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user: User) => (
                <TableRow key={user.id} className="hover:bg-[#f0f7ff]">
                  <TableCell>
                    <div>
                      <p className="font-medium text-[#0a1628]">{user.full_name}</p>
                      <p className="text-xs text-[#5a7a9a]">@{user.username}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#5a7a9a]">{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${roleConfig[user.role]?.class || "bg-gray-100"}`}>
                      {roleConfig[user.role]?.label || user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${user.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                      {user.is_active ? "Actif" : "Inactif"}
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
                        <DropdownMenuItem onClick={() => openViewDialog(user)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(user)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(user)} className="text-red-600">
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
              <Users className="w-5 h-5" />
              Nouvel Utilisateur
            </DialogTitle>
            <DialogDescription>Creez un nouveau compte utilisateur</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Nom complet</label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Jean Dupont"
                  className="border-[#c5ddf5]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Nom utilisateur</label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="jdupont"
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean@example.com"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Mot de passe</label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="********"
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Role</label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="manager">Superviseur</SelectItem>
                    <SelectItem value="agent">Agent de terrain</SelectItem>
                    <SelectItem value="inspector">Inspecteur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Telephone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+261 XX XXX XX"
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Region</label>
              <Input
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="SAVA"
                className="border-[#c5ddf5]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-[#c5ddf5]">
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={isSubmitting} className="bg-[#1e3a5f] hover:bg-[#2d5a87]">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Creer
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
              Modifier l&apos;Utilisateur
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Nom complet</label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="border-[#c5ddf5]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Role</label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger className="border-[#c5ddf5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="manager">Superviseur</SelectItem>
                    <SelectItem value="agent">Agent de terrain</SelectItem>
                    <SelectItem value="inspector">Inspecteur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#0a1628]">Telephone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="border-[#c5ddf5]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0a1628]">Region</label>
              <Input
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="border-[#c5ddf5]"
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
              Details de l&apos;Utilisateur
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#5a7a9a]">Nom complet</p>
                  <p className="font-medium">{selectedUser.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Nom utilisateur</p>
                  <p className="font-medium">@{selectedUser.username}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Role</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${roleConfig[selectedUser.role]?.class || "bg-gray-100"}`}>
                    {roleConfig[selectedUser.role]?.label || selectedUser.role}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Telephone</p>
                  <p className="font-medium">{selectedUser.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Region</p>
                  <p className="font-medium">{selectedUser.region || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Statut</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${selectedUser.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                    {selectedUser.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-[#5a7a9a]">Date inscription</p>
                  <p className="font-medium">{selectedUser.date_joined}</p>
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
    </div>
  )
}
