"use client"

import { FolderCog, Database, Bell, Shield, Leaf, MapPin, FileBarChart, Repeat } from "lucide-react"

interface AdminSection {
  icon: any
  title: string
  description: string
  id: string
}

export function AdminPage() {
  const sections: AdminSection[] = [
    {
      icon: Leaf,
      title: "Paramétrage des cultures",
      description: "Gérer les types de cultures et variétés",
      id: "cultures",
    },
    {
      icon: MapPin,
      title: "Régions et districts",
      description: "Gestion des zones géographiques",
      id: "regions",
    },
    {
      icon: Repeat,
      title: "Workflows de validation",
      description: "Configuration des processus de validation",
      id: "workflows",
    },
    {
      icon: FileBarChart,
      title: "Formulaires de collecte",
      description: "Personnalisation des formulaires",
      id: "forms",
    },
    {
      icon: Database,
      title: "Référentiels",
      description: "Gestion des listes de référence",
      id: "references",
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Configuration des alertes",
      id: "notifications",
    },
    {
      icon: Shield,
      title: "Sauvegardes",
      description: "Gestion des backups",
      id: "backups",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FolderCog className="w-6 h-6 text-[#1e3a5f]" />
        <h1 className="text-2xl font-bold text-[#0a1628]">Administration système</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(section => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
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