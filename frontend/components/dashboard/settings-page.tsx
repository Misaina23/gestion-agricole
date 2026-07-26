"use client"

import { useState } from "react"
import {
  User,
  Shield,
  Bell,
  Palette,
  Save,
  Lock,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Check,
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { usersApi, apiFetch } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"

export function SettingsPage() {
  const { user } = useAuth()
  const { t, locale, setLocale } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    region: user?.region || "",
    commune: user?.commune || "",
  })

  const [securityForm, setSecurityForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  const [notifications, setNotifications] = useState({
    email_alerts: true,
    reports: true,
    sync_notifications: true,
  })

  const handleProfileSave = async () => {
    setIsLoading(true)
    try {
      await usersApi.update(Number(user?.id), profileForm)
      toast.success(t("profileUpdated"))
    } catch {
      toast.error(t("loadError"))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (securityForm.new_password !== securityForm.confirm_password) {
      toast.error(t("passwordMismatch"))
      return
    }
    if ((securityForm.new_password?.length || 0) < 8) {
      toast.error(t("passwordMinLength"))
      return
    }
    setIsLoading(true)
    try {
      await apiFetch('/accounts/users/change_password/', {
        method: 'POST',
        body: JSON.stringify({
          old_password: securityForm.current_password,
          new_password: securityForm.new_password,
          new_password_confirm: securityForm.confirm_password,
        }),
      })
      toast.success(t("passwordUpdated"))
      setSecurityForm({ current_password: "", new_password: "", confirm_password: "" })
    } catch {
      toast.error(t("passwordChangeError"))
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: "profile", label: t("profile"), icon: User },
    { id: "security", label: t("security"), icon: Shield },
    { id: "notifications", label: t("notifications"), icon: Bell },
    { id: "appearance", label: t("appearance"), icon: Palette },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0a1628]">{t("settings")}</h1>
          <p className="text-sm text-[#5a7a9a] mt-1">
            {t("manageSettings")}
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Tabs Sidebar */}
        <div className="hidden md:flex flex-col gap-2 w-56 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[#1e3a5f] text-white"
                  : "text-[#5a7a9a] hover:bg-[#e8f4fc] hover:text-[#1e3a5f]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-[#1e3a5f] text-white"
                  : "border border-[#c5ddf5] bg-card/95 text-[#5a7a9a] hover:bg-[#e8f4fc] dark:border-border dark:bg-card/95 dark:text-muted-foreground dark:hover:bg-accent/40"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <Card className="bg-white border border-[#c5ddf5]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1e3a5f]">
                  <User className="w-5 h-5" />
                  {t("personalInfo")}
                </CardTitle>
                <CardDescription>
                  {t("updateProfile")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">{t("firstName")}</Label>
                    <Input
                      id="first_name"
                      value={profileForm.first_name}
                      onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                      className="border-[#c5ddf5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">{t("lastName")}</Label>
                    <Input
                      id="last_name"
                      value={profileForm.last_name}
                      onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                      className="border-[#c5ddf5]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-3 h-3 inline mr-1" />
                    {t("email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="border-[#c5ddf5]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="w-3 h-3 inline mr-1" />
                    {t("phone")}
                  </Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="border-[#c5ddf5]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {t("region")}
                    </Label>
                    <Input
                      id="region"
                      value={profileForm.region}
                      onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
                      className="border-[#c5ddf5]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commune">{t("commune")}</Label>
                    <Input
                      id="commune"
                      value={profileForm.commune}
                      onChange={(e) => setProfileForm({ ...profileForm, commune: e.target.value })}
                      className="border-[#c5ddf5]"
                    />
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <Button
                    onClick={handleProfileSave}
                    disabled={isLoading}
                    className="gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87]"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {t("save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="bg-white border border-[#c5ddf5]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1e3a5f]">
                  <Lock className="w-5 h-5" />
                  {t("securityTitle")}
                </CardTitle>
                <CardDescription>
                  {t("securityDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">{t("currentPassword")}</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={securityForm.current_password}
                    onChange={(e) => setSecurityForm({ ...securityForm, current_password: e.target.value })}
                    className="border-[#c5ddf5]"
                    placeholder={t("currentPassword")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_password">{t("newPassword")}</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={securityForm.new_password}
                    onChange={(e) => setSecurityForm({ ...securityForm, new_password: e.target.value })}
                    className="border-[#c5ddf5]"
                    placeholder={t("passwordMinLength")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">{t("confirmPassword")}</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={securityForm.confirm_password}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirm_password: e.target.value })}
                    className="border-[#c5ddf5]"
                    placeholder={t("confirmPassword")}
                  />
                </div>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <Button
                    onClick={handlePasswordChange}
                    disabled={isLoading || !securityForm.current_password || !securityForm.new_password}
                    className="gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87]"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {t("changePassword")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="bg-white border border-[#c5ddf5]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1e3a5f]">
                  <Bell className="w-5 h-5" />
                  {t("notifTitle")}
                </CardTitle>
                <CardDescription>
                  {t("notifDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("emailAlerts")}</Label>
                    <p className="text-xs text-[#5a7a9a]">{t("emailAlertsDesc")}</p>
                  </div>
                  <Switch
                    checked={notifications.email_alerts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email_alerts: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("reports")}</Label>
                    <p className="text-xs text-[#5a7a9a]">{t("reportsDesc")}</p>
                  </div>
                  <Switch
                    checked={notifications.reports}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, reports: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("sync")}</Label>
                    <p className="text-xs text-[#5a7a9a]">{t("syncDesc")}</p>
                  </div>
                  <Switch
                    checked={notifications.sync_notifications}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, sync_notifications: checked })
                    }
                  />
                </div>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <Button
                    onClick={() => toast.success(t("preferencesSaved"))}
                    className="gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87]"
                  >
                    <Save className="w-4 h-4" />
                    {t("save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card className="bg-white border border-[#c5ddf5]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#1e3a5f]">
                  <Palette className="w-5 h-5" />
                  {t("appearanceTitle")}
                </CardTitle>
                <CardDescription>
                  {t("appearanceDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("language")}</Label>
                  <Select value={locale} onValueChange={(v) => setLocale(v as "fr" | "en")}>
                    <SelectTrigger className="w-full sm:w-[240px] border-[#c5ddf5]">
                      <SelectValue placeholder={t("language")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">{t("french")}</SelectItem>
                      <SelectItem value="en">{t("english")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("dateFormat")}</Label>
                  <Select defaultValue="dd/mm/yyyy">
                    <SelectTrigger className="w-full sm:w-[240px] border-[#c5ddf5]">
                      <SelectValue placeholder={t("dateFormat")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">JJ/MM/AAAA</SelectItem>
                      <SelectItem value="mm/dd/yyyy">MM/JJ/AAAA</SelectItem>
                      <SelectItem value="yyyy-mm-dd">AAAA-MM-JJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <Button
                    onClick={() => toast.success(t("preferencesSaved"))}
                    className="gap-2 bg-[#1e3a5f] hover:bg-[#2d5a87]"
                  >
                    <Save className="w-4 h-4" />
                    {t("save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
