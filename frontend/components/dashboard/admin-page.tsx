"use client"

import { useState } from "react"
import { FolderCog, Database, Bell, Shield, Leaf, MapPin, FileBarChart, Repeat, Upload, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { infoAlert } from "@/lib/sweetalert"
import { getAuthToken } from "@/lib/api"
import { buildApiUrl } from "@/lib/api-config"

interface AdminSection {
  icon: any
  title: string
  description: string
  id: string
}

export function AdminPage() {
  const router = useRouter()
  const [workbook, setWorkbook] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const sections: AdminSection[] = [
    { icon: Leaf, title: "Paramétrage des cultures", description: "Gérer les campagnes et cultures", id: "campaigns" },
    { icon: MapPin, title: "Régions et districts", description: "Consulter les zones géographiques", id: "producers" },
    { icon: Repeat, title: "Workflows de validation", description: "Suivre les validations opérationnelles", id: "workflows" },
    { icon: FileBarChart, title: "Formulaires de collecte", description: "Saisir producteurs, parcelles et productions", id: "productions" },
    { icon: Database, title: "Référentiels", description: "Consulter les données de référence", id: "parcels" },
    { icon: Bell, title: "Notifications", description: "Configurer les préférences de notification", id: "settings" },
  ]

  const handleSectionClick = (section: AdminSection) => {
    router.push(`/dashboard?tab=${section.id}`)
  }

  const handleImport = async () => {
    if (!workbook) return
    setImporting(true)
    try {
      const body = new FormData()
      body.append("workbook", workbook)
      const response = await fetch(buildApiUrl("imports/vintsy-register/"), {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        body,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.detail || "Import impossible")
      infoAlert("Import terminé", result.result || "Les données réelles ont été chargées.")
      setWorkbook(null)
    } catch (error) {
      infoAlert("Échec de l’import", error instanceof Error ? error.message : "Une erreur est survenue.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FolderCog className="w-6 h-6 text-[#1e3a5f]" />
        <h1 className="text-2xl font-bold text-[#0a1628]">Administration système</h1>
      </div>

      <section className="rounded-xl border border-[#c5ddf5] bg-white p-5">
        <div className="flex items-start gap-3">
          <Upload className="mt-1 h-6 w-6 text-[#1e3a5f]" />
          <div className="flex-1">
            <h2 className="font-semibold text-[#0a1628]">Importer le registre réel Vintsy</h2>
            <p className="mt-1 text-sm text-[#5a7a9a]">Le fichier reste privé : il est traité par le backend puis supprimé. Seuls les administrateurs peuvent lancer cet import.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => setWorkbook(event.target.files?.[0] || null)} />
              <button onClick={handleImport} disabled={!workbook || importing} className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                {importing ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Importer"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(section => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section)}
              className="bg-white rounded-xl border border-[#e8f4fc] p-5 text-left hover:shadow-md transition-shadow"
            >
              <Icon className="w-8 h-8 text-[#4a90c2] mb-3" />
              <h3 className="font-semibold text-[#0a1628] mb-1">{section.title}</h3>
              <p className="text-sm text-[#5a7a9a]">{section.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
