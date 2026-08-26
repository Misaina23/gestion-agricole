"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, Loader2, MoonStar, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { successAlert, errorAlert } from "@/lib/sweetalert"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      errorAlert("Champs requis", "Veuillez remplir tous les champs")
      return
    }

    setIsLoading(true)
    const result = await login(username, password)
    setIsLoading(false)

    if (result.success) {
      successAlert("Connexion réussie", `Bienvenue ${username}`)
      router.push('/dashboard')
    } else {
      errorAlert("Échec de connexion", result.error || "Identifiants invalides")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#0a1628] to-[#1e3a5f] dark:from-[#0a1628] dark:via-[#1e3a5f] dark:to-[#0a1628] flex items-center justify-center p-4">
      {/* Theme toggle */}
      <button
        type="button"
        onClick={() => setTheme(mounted && theme === "dark" ? "light" : "dark")}
        aria-label="Changer de thème"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white shadow-lg backdrop-blur transition-colors hover:bg-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
      >
        {mounted && theme === "dark" ? (
          <SunMedium className="h-5 w-5" />
        ) : (
          <MoonStar className="h-5 w-5" />
        )}
      </button>

      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#1e3a5f]/40 blur-3xl dark:bg-[#1e3a5f]/20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#0a1628]/40 blur-3xl dark:bg-[#0a1628]/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#2d5a87]/10 blur-3xl dark:bg-[#2d5a87]/5" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 dark:bg-white/5 dark:border-white/10">
          {/* Header */}
            <div className="text-center mb-8">
              <div className="mb-4 flex justify-center">
                <Image
                src="/logo.png"
                alt="Vintsy"
                width={96}
                height={96}
                className="rounded-2xl shadow-lg object-contain"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide dark:text-white">
              Vintsy <span className="text-[#87ceeb]">VANILLA</span>
            </h1>
            <p className="text-[#87ceeb]/80 text-sm mt-2 dark:text-[#87ceeb]/60">
              Plateforme de gestion agricole
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/90 text-sm dark:text-white/80">
                Nom d&apos;utilisateur ou email
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre identifiant ou email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#87ceeb] focus:ring-[#87ceeb]/30 h-12 dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#87ceeb] dark:focus:ring-[#87ceeb]/30"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90 text-sm dark:text-white/80">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#87ceeb] focus:ring-[#87ceeb]/30 h-12 pr-12 dark:bg-white/10 dark:border-white/20 dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#87ceeb] dark:focus:ring-[#87ceeb]/30"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors dark:text-white/50 dark:hover:text-white/80"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] hover:from-[#2d5a87] hover:to-[#1e3a5f] text-white font-semibold text-base shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/register')}
              className="text-white/60 hover:text-white text-sm transition-colors dark:text-white/60 dark:hover:text-white"
            >
              Pas encore de compte? S'inscrire
            </button>
          </div>

          {/* Service availability notice */}
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 dark:bg-white/5 dark:border-white/10">
            <p className="text-xs text-white/60 text-center dark:text-white/60">
              Le backend Django est déjà déployé en production
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-6 dark:text-white/30">
          &copy; 2024 Vintsy. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
