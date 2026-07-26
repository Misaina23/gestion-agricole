"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import nextDynamic from "next/dynamic"
import { CampaignsPage } from "@/components/dashboard/campaigns-page"
import { InputsPage } from "@/components/dashboard/inputs-page"
import { DeliveriesPage } from "@/components/dashboard/deliveries-page"

const ParcelsMapPage = nextDynamic(() => import('@/components/dashboard/parcels-map'), { ssr: false })
const ReportsPage = nextDynamic(() => import('@/components/dashboard/reports-page'), { ssr: false })
const AgriAssistant = nextDynamic(() => import('@/components/dashboard/agri-assistant'), { ssr: false })
const HistoryPage = nextDynamic(() => import('@/components/dashboard/history-page'), { ssr: false })
import { ProducersTable } from "@/components/dashboard/producers-table"
import { SyncStatus } from "@/components/dashboard/sync-status"
import { ProducersPage } from "@/components/dashboard/producers-page"
import { ParcelsPage } from "@/components/dashboard/parcels-page"
import { ProductionsPage } from "@/components/dashboard/productions-page"
import { InspectionsPage } from "@/components/dashboard/inspections-page"
import { UsersPage } from "@/components/dashboard/users-page"
import { SettingsPage } from "@/components/dashboard/settings-page"
import { Header } from "@/components/dashboard/header"
import { Sidebar } from "@/components/dashboard/sidebar"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { HarvestChart } from "@/components/dashboard/harvest-chart"
import { RegionStats } from "@/components/dashboard/region-stats"
import { useAuth } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"
import { Loader2, Lock } from "lucide-react"

function DashboardContent() {
  const [activeTab, setActiveTab] = useState("Tableau de bord")
  const [activeSidebarItem, setActiveSidebarItem] = useState("overview")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, isLoading, isAuthenticated, logout, canAccessUsers, canAccessSettings } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 rounded-[1.5rem] border border-border/70 bg-card/90 px-8 py-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.4)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const renderContent = () => {
    switch (activeSidebarItem) {
      case "producers":
        return <ProducersPage />
      case "map":
        return <ParcelsMapPage />
      case "parcels":
        return <ParcelsPage />
      case "productions":
        return <ProductionsPage />
      case "inspections":
        return <InspectionsPage />
      case "reports":
        return <ReportsPage />
      case "assistant":
        return <AgriAssistant />
      case "history":
        return <HistoryPage />
      case "campaigns":
        return <CampaignsPage />
      case "inputs":
        return <InputsPage />
      case "deliveries":
        return <DeliveriesPage />
      case "users":
        if (!canAccessUsers) {
          return (
            <div className="panel-surface flex h-64 flex-col items-center justify-center px-8 text-center">
              <Lock className="mb-4 h-8 w-8 text-red-500" />
              <h2 className="mb-2 text-xl font-semibold text-foreground">{t("restrictedAccess")}</h2>
              <p className="text-muted-foreground">{t("restrictedAccessUsers")}</p>
            </div>
          )
        }
        return <UsersPage />
      case "settings":
        if (!canAccessSettings) {
          return (
            <div className="panel-surface flex h-64 flex-col items-center justify-center px-8 text-center">
              <Lock className="mb-4 h-8 w-8 text-red-500" />
              <h2 className="mb-2 text-xl font-semibold text-foreground">{t("restrictedAccess")}</h2>
              <p className="text-muted-foreground">{t("restrictedAccessAdmin")}</p>
            </div>
          )
        }
        return <SettingsPage />
      case "overview":
      default:
        return (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground">
                {t("dashboardOverview")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("welcome")}, {user?.full_name || user?.username} - {user?.role_display || t("user")}
              </p>
            </div>

            <div className="space-y-6">
              <KPICards />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <HarvestChart />
                <RegionStats />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ProducersTable />
                <SyncStatus />
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(135,206,235,0.16),transparent_36%),linear-gradient(135deg,var(--background),color-mix(in srgb,var(--background)_85%,var(--accent)_15%))]">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        user={user}
        onNavigate={setActiveSidebarItem}
      />

      <div className="flex">
        <Sidebar
          activeItem={activeSidebarItem}
          onItemChange={setActiveSidebarItem}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={logout}
          userRole={user?.role}
          userName={user?.full_name || user?.username}
        />

        <main className="min-h-[calc(100vh-64px)] flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
