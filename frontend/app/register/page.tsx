"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { buildApiUrl } from "@/lib/api-config"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    phone: "",
    region: "",
    commune: "",
    is_supervisor: false,
    is_admin: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.username.trim() || !formData.password.trim() || !formData.email.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }
    
    if (formData.password !== formData.password_confirm) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch(buildApiUrl("/accounts/register/"), {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        toast.success("Inscription reussie! Votre compte est en attente d approbation.")
        router.push("/login")
      } else {
        const error = await response.json().catch(() => ({}))
        toast.error(error.detail || "Erreur lors de l inscription")
      }
    } catch {
      toast.error("Erreur de connexion au serveur")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#0a1628] to-[#1e3a5f] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#87ceeb]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#4a90c2]/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#2d5a87]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8">
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center">
              <Image
                src="/logo.jpg"
                alt="VIDEEKO VANILLA"
                width={96}
                height={96}
                className="rounded-2xl shadow-lg object-contain"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              VIDEEKO <span className="text-[#87ceeb]">VANILLA</span>
            </h1>
            <p className="text-[#87ceeb]/60 text-sm mt-2">
              Creer un compte
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-white/80 text-sm">
                  Prenom
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  placeholder="Prenom"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#87ceeb] h-12"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-white/80 text-sm">
                  Nom
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  placeholder="Nom"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#87ceeb] h-12"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/80 text-sm">
                Nom dutilisateur *
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="Entrez votre identifiant"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#87ceeb] h-12"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80 text-sm">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Entrez votre email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#87ceeb] h-12"
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/80 text-sm">
                Telephone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Entrez votre telephone"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#87ceeb] h-12"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 text-sm">
                Mot de passe *
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#87ceeb] h-12 pr-12"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirm" className="text-white/80 text-sm">
                Confirmer le mot de passe *
              </Label>
              <div className="relative">
                <Input
                  id="password_confirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  value={formData.password_confirm}
                  onChange={(e) => handleChange("password_confirm", e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#87ceeb] h-12 pr-12"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                >
                  {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_supervisor"
                  checked={formData.is_supervisor}
                  onChange={(e) => handleChange("is_supervisor", e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-[#87ceeb] focus:ring-[#87ceeb]/30"
                />
                <Label htmlFor="is_supervisor" className="text-white/80 text-sm">
                  Superviseur
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={formData.is_admin}
                  onChange={(e) => handleChange("is_admin", e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-[#87ceeb] focus:ring-[#87ceeb]/30"
                />
                <Label htmlFor="is_admin" className="text-white/80 text-sm">
                  Admin
                </Label>
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
                  Inscription en cours...
                </>
              ) : (
                "Sinscrire"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-[#87ceeb]/60 hover:text-[#87ceeb] text-sm transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour a la connexion
            </button>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-[#87ceeb]/60 text-center">
              Votre compte sera approuve par un administrateur apres inscription.
            </p>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          &copy; 2024 VIDEEKO VANILLA. Tous droits reserves.
        </p>
      </div>
    </div>
  )
}

