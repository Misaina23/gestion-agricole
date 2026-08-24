"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  Users,
  Map,
  MapPin,
  BarChart3,
  ClipboardCheck,
  FileSpreadsheet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sprout,
  Package,
  Truck,
  UsersRound,
  Settings,
  Bot,
  History,
  Warehouse,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"

interface SidebarProps {
  activeItem: string
  onItemChange: (item: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  onLogout?: () => void
  userRole?: string
  userName?: string
}

type NavigationItem = { icon: typeof LayoutDashboard; labelKey: string; id: string; roles?: string[] }

const navigationItems: NavigationItem[] = [
  { icon: LayoutDashboard, labelKey: "overview", id: "overview" },
  { icon: Users, labelKey: "producers", id: "producers" },
  { icon: Warehouse, labelKey: "units", id: "units" },
  { icon: Map, labelKey: "parcelsGps", id: "parcels" },
  { icon: MapPin, labelKey: "parcelsMap", id: "map" },
  { icon: BarChart3, labelKey: "productions", id: "productions" },
  { icon: ClipboardCheck, labelKey: "inspections", id: "inspections" },
  { icon: Sprout, labelKey: "campaigns", id: "campaigns" },
  { icon: Package, labelKey: "inputs", id: "inputs" },
  { icon: Truck, labelKey: "deliveries", id: "deliveries" },
]

const reportItems: NavigationItem[] = [
  { icon: FileSpreadsheet, labelKey: "reports", id: "reports" },
]

const intelligenceItems: NavigationItem[] = [
  { icon: Bot, labelKey: "aiAssistant", id: "assistant" },
  { icon: History, labelKey: "history", id: "history" },
]

const systemItems: NavigationItem[] = [
  { icon: UsersRound, labelKey: "users", id: "users", roles: ['admin', 'manager'] },
  { icon: Settings, labelKey: "settings", id: "settings", roles: ['admin'] },
]

export function Sidebar({ 
  activeItem, 
  onItemChange, 
  collapsed = false, 
  onToggleCollapse,
  onLogout,
  userRole,
  userName
}: SidebarProps) {
  const { t } = useLanguage()
  const filteredNavigationItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(userRole || '')
  )
  const filteredReportItems = reportItems.filter(item => 
    !item.roles || item.roles.includes(userRole || '')
  )
  const filteredIntelligenceItems = intelligenceItems.filter(item => 
    !item.roles || item.roles.includes(userRole || '')
  )
  const filteredSystemItems = systemItems.filter(item => 
    !item.roles || item.roles.includes(userRole || '')
  )

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} flex min-h-[calc(100vh-64px)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)] transition-all duration-300`}>
      <div className="flex justify-end p-2">
        <button
          onClick={onToggleCollapse}
          className="rounded-lg p-1.5 transition-colors hover:bg-sidebar-accent/70"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <SidebarSection title={t("navigation")} collapsed={collapsed}>
          {filteredNavigationItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={t(item.labelKey as any)}
              isActive={activeItem === item.id}
              onClick={() => onItemChange(item.id)}
              collapsed={collapsed}
            />
          ))}
        </SidebarSection>

        <SidebarSection title={t("reports")} collapsed={collapsed}>
          {filteredReportItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={t(item.labelKey as any)}
              isActive={activeItem === item.id}
              onClick={() => onItemChange(item.id)}
              collapsed={collapsed}
            />
          ))}
        </SidebarSection>

        <SidebarSection title="Intelligence" collapsed={collapsed}>
          {filteredIntelligenceItems.map((item) => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={t(item.labelKey as any)}
              isActive={activeItem === item.id}
              onClick={() => onItemChange(item.id)}
              collapsed={collapsed}
            />
          ))}
        </SidebarSection>

      </div>

      <div className="border-t border-sidebar-border/80 p-3">
        <ProfileBlock
          userName={userName}
          collapsed={collapsed}
          onItemChange={onItemChange}
          onLogout={onLogout}
          t={t}
        />
      </div>
    </aside>
  )
}

function ProfileBlock({ userName, collapsed, onItemChange, onLogout, t }:{ userName?: string, collapsed: boolean, onItemChange: (s:string)=>void, onLogout?: ()=>void, t: any }){
  return (
    <div className="flex flex-col gap-2">
      <div className={`flex items-center gap-3 rounded-lg p-2 ${collapsed ? 'justify-center' : 'justify-start'}`}>
        <UsersRound className="h-4 w-4" />
        {!collapsed && <span className="flex-1 text-sm">{userName || t('user')}</span>}
      </div>
      {!collapsed && (
        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('logout')}</span>
        </button>
      )}
      {collapsed && (
        <button
          onClick={onLogout}
          title={t('logout')}
          className="flex justify-center rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function SidebarSection({
  title,
  children,
  collapsed,
}: {
  title: string
  children: React.ReactNode
  collapsed: boolean
}) {
  return (
    <div className="mb-4">
      {!collapsed && (
        <div className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-500/80">
          {title}
        </div>
      )}
      <div className="flex flex-col gap-0.5 px-2">{children}</div>
    </div>
  )
}

function SidebarItem({
  icon: Icon,
  label,
  isActive,
  onClick,
  collapsed,
}: {
  icon: React.ElementType
  label: string
  isActive: boolean
  onClick: () => void
  collapsed: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 ${
        isActive
          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <Icon className={`${isActive ? 'h-5 w-5' : 'h-4 w-4'} transition-all`} />
      {!collapsed && label}
    </button>
  )
}
