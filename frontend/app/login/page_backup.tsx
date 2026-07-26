"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  if (user) {
    if (user.role === 'admin' || user.role === 'manager') {
      router.replace('/dashboard')
    } else {
      router.replace('/dashboard')
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    setIsLoading(true)
    const result = await login(username, password)
    setIsLoading(false)

    if (result.success) {
      toast.success("Connexion réussie")
      router.push('/dashboard')
    } else {
      toast.error(result.error || "Erreur de connexion")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#0a1628] to-[#1e3a5f] flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#87ceeb]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#4a90c2]/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#2d5a87]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#87ceeb] to-[#4a90c2] shadow-lg mb-4">
              <MapPin className="w-8 h-8 text-[#0a1628]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              VIDEEKO <span className="text-[#87ceeb]">VANILLA</span>
            </h1>
            <p className="text-[#87ceeb]/60 text-sm mt-2">
              Plateforme de gestion agricole
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/80 text-sm">
                Nom d&apos;utilisateur
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre identifiant"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#87ceeb] focus:ring-[#87ceeb]/30 h-12"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 text-sm">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#87ceeb] focus:ring-[#87ceeb]/30 h-12 pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
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
              className="w-full h-12 bg-gradient-to-r from-[#87ceeb] to-[#4a90c2] hover:from-[#6bb8d9] hover:to-[#3a80b2] text-[#0a1628] font-semibold text-base shadow-lg transition-all duration-200"
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

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-[#87ceeb]/60 text-center">
              Pour tester, connectez votre backend Django sur le port 8000
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          &copy; 2024 VIDEEKO VANILLA. Tous droits réservés.
        </p>
      </div>
    </div>
  )
}
