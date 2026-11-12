"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft,
  Lock,
  UserCheck,
  Award,
  Compass
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { successAlert, errorAlert } from "@/lib/sweetalert"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null)
  const { login, loginAsDemo, user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      errorAlert("Champs requis", "Veuillez renseigner votre identifiant et votre mot de passe.")
      return
    }

    setIsLoading(true)
    const result = await login(username, password)
    setIsLoading(false)

    if (result.success) {
      successAlert("Connexion réussie", `Bienvenue sur la plateforme Vintsy, ${username}`)
      router.push('/dashboard')
    } else {
      errorAlert("Échec de connexion", result.error || "Identifiants invalides.")
    }
  }

  const handleQuickDemo = (role: 'admin' | 'manager' | 'inspector' | 'agent') => {
    setActiveDemoRole(role)
    setIsLoading(true)
    setTimeout(() => {
      loginAsDemo(role)
      setIsLoading(false)
    }, 350)
  }

  return (
    <div className="min-h-screen bg-[#0c1410] text-[#f1f5f2] relative flex flex-col justify-between overflow-x-hidden selection:bg-[#d97706] selection:text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-20 w-[550px] h-[550px] rounded-full bg-[#14532d]/25 blur-[120px]" />
        <div className="absolute -bottom-40 -left-20 w-[600px] h-[600px] rounded-full bg-[#78350f]/20 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#064e3b]/15 blur-[160px]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-[#94a3b8] hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Retour au site vitrine</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-[#64748b]">
          <span>Coopérative Vanille Bourbon</span>
          <span aria-hidden="true">·</span>
          <span>SAVA Madagascar</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Context & Quick Roles */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#141e17]/80 backdrop-blur-md rounded-2xl border border-white/10 p-6 lg:p-8 shadow-2xl">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#15803d] to-[#047857] flex items-center justify-center p-2.5 shadow-lg border border-white/20">
                  <Image
                    src="/logo.png"
                    alt="Vintsy Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                    Vintsy <span className="text-[#fbbf24] text-xs font-semibold px-1.5 py-0.5 rounded bg-[#78350f]/40 border border-[#f59e0b]/30">PRO</span>
                  </h2>
                  <p className="text-xs text-[#94a3b8]">Espace Sécurisé Coopérative</p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                <h3 className="text-sm font-semibold text-white/90">Accès Instantané Démo</h3>
                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  Testez immédiatement l'ensemble des modules selon votre rôle métier sans saisir de mot de passe :
                </p>
              </div>

              {/* Quick Role Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  disabled={isLoading}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                    activeDemoRole === 'admin'
                      ? 'bg-[#15803d]/30 border-[#22c55e] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-[#e2e8f0]'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-[#22c55e]/20 text-[#4ade80] shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Super Administrateur</span>
                      <span className="text-[10px] text-[#4ade80]">Tous accès</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] truncate mt-0.5">
                      Paramètres, utilisateurs, parcelles SIG et clôture de campagne
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('manager')}
                  disabled={isLoading}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                    activeDemoRole === 'manager'
                      ? 'bg-[#d97706]/30 border-[#f59e0b] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-[#e2e8f0]'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-[#f59e0b]/20 text-[#fbbf24] shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Responsable Coopérative</span>
                      <span className="text-[10px] text-[#fbbf24]">Pilotage</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] truncate mt-0.5">
                      Suivi des livraisons, stock affiné et rapports exportateurs
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('inspector')}
                  disabled={isLoading}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                    activeDemoRole === 'inspector'
                      ? 'bg-[#0284c7]/30 border-[#38bdf8] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-[#e2e8f0]'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-[#38bdf8]/20 text-[#38bdf8] shrink-0 mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Inspecteur Qualité & Bio</span>
                      <span className="text-[10px] text-[#38bdf8]">Certification</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] truncate mt-0.5">
                      Audits Bio / NOP / UE, teneur vanilline et notation
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('agent')}
                  disabled={isLoading}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                    activeDemoRole === 'agent'
                      ? 'bg-[#10b981]/30 border-[#34d399] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-[#e2e8f0]'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-[#34d399]/20 text-[#34d399] shrink-0 mt-0.5">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">Agent Terrain & Collecteur</span>
                      <span className="text-[10px] text-[#34d399]">Saisie mobile</span>
                    </div>
                    <p className="text-[11px] text-[#94a3b8] truncate mt-0.5">
                      Saisie récoltes, pesée gousses vertes et scan QR
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#94a3b8]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
                Serveur Django synchronisé
              </span>
              <span>v2.4 LTS</span>
            </div>
          </div>

          {/* Right Column: Standard Login Form */}
          <div className="lg:col-span-7 bg-[#16231a]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-8 lg:p-10 shadow-2xl flex flex-col justify-center">
            <div className="mb-8">
              <span className="text-xs font-medium text-[#fbbf24] tracking-wider uppercase mb-1 block">
                Authentification
              </span>
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                Connectez-vous à votre compte
              </h1>
              <p className="text-sm text-[#94a3b8] mt-2">
                Saisissez vos identifiants fournis par l'administration centrale ou votre coopérative.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label 
                  htmlFor="login-username" 
                  className="block text-xs font-semibold text-[#cbd5e1] mb-2"
                >
                  Nom d'utilisateur ou adresse email
                </label>
                <div className="relative">
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: direction@vintsy-vanilla.mg ou admin"
                    disabled={isLoading}
                    className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-[#64748b] text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/50 focus:border-[#22c55e] transition-all"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748b]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label 
                    htmlFor="login-password" 
                    className="block text-xs font-semibold text-[#cbd5e1]"
                  >
                    Mot de passe
                  </label>
                  <span className="text-[11px] text-[#94a3b8]">
                    Astuce: tapez <code className="text-[#fbbf24] bg-white/5 px-1 rounded">admin</code> pour démo
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={isLoading}
                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-[#64748b] text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/50 focus:border-[#22c55e] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-white transition-colors"
                    aria-label="Afficher le mot de passe"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#15803d] via-[#16a34a] to-[#15803d] hover:brightness-110 active:scale-[0.99] text-white font-medium text-sm shadow-lg shadow-[#15803d]/25 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Vérification des identifiants...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Se connecter à la plateforme</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94a3b8]">
              <span>Besoin d'aide ou mot de passe oublié ?</span>
              <a 
                href="mailto:support@vintsy-vanilla.mg" 
                className="text-[#fbbf24] hover:underline"
              >
                Contacter le support coopérative
              </a>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-[#64748b]">
        <p>© 2026 Vintsy Vanilla Madagascar — Plateforme numérique de filière agricole.</p>
      </footer>
    </div>
  )
}
