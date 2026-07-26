"use client"

import { MoonStar, SunMedium, Bell, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { GlobalSearch } from "./global-search"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from "@/lib/auth-context"
import { useLanguage } from "@/lib/language-context"

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  user?: User | null
  onNavigate?: (item: string) => void
}

const systemMenuItems = [
  { labelKey: "users", id: "users", roles: ['admin', 'manager'] },
  { labelKey: "settings", id: "settings", roles: ['admin'] },
]

export function Header({ activeTab, onTabChange, user, onLogout, onNavigate }: HeaderProps) {
  const { t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"
  const initials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : user?.username?.substring(0, 2).toUpperCase() || 'U'

  return (
    <header className="border-b border-border/70 bg-[linear-gradient(135deg,rgba(30,58,95,0.98),rgba(13,22,40,0.98))] px-6 py-3 text-white shadow-[0_16px_45px_-24px_rgba(15,23,42,0.7)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md">
            <Image
              src="/logo.jpg"
              alt="VIDEEKO VANILLA"
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-[0.2em]">
              VIDEEKO <span className="text-sky-300">VANILLA</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-sky-200/70">
              {t("dashboardOverview")}
            </div>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center px-6 md:flex">
          <div className="w-full max-w-xl">
            <GlobalSearch />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs text-sky-100">{t("online")}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="relative text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
          >
            {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" className="relative text-white/80 hover:bg-white/10 hover:text-white">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-white/10">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f4fc] text-sm font-bold text-[#1e3a5f] shadow-md">
                  {initials}
                </div>
                <div className="hidden text-left lg:block">
                  <div className="text-sm font-medium">{user?.full_name || user?.username || t("user")}</div>
                  <div className="text-[10px] text-sky-200/70">{user?.role_display || t("user")}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-2">
                <p className="text-sm font-medium">{user?.full_name || user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              {user && systemMenuItems.filter(item => item.roles.includes(user.role || '')).map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => onNavigate?.(item.id)}
                  className="cursor-pointer"
                >
                  {t(item.labelKey as any)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10 hover:text-white md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
