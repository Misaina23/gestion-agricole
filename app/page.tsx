"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  ArrowRight, 
  MapPin, 
  Check, 
  ChevronRight, 
  Search, 
  QrCode, 
  ShieldCheck, 
  Leaf, 
  TrendingUp, 
  Award, 
  Compass, 
  Layers, 
  BarChart3, 
  Calendar,
  Send,
  Sparkles,
  Info
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { successAlert } from "@/lib/sweetalert"

export default function HomePage() {
  const { user, loginAsDemo } = useAuth()

  // Simulator state
  const [surfaceHa, setSurfaceHa] = useState<number>(2.5)
  const [plantsPerHa, setPlantsPerHa] = useState<number>(1200)
  const [yieldPerPlantKg, setYieldPerPlantKg] = useState<number>(0.65)
  const [marketPriceUsd, setMarketPriceUsd] = useState<number>(160)

  // Calculations
  const totalPlants = Math.round(surfaceHa * plantsPerHa)
  const greenVanillaKg = Math.round(totalPlants * yieldPerPlantKg)
  const preparedRatio = 4.8
  const preparedVanillaKg = Math.round(greenVanillaKg / preparedRatio)
  const estimatedRevenueUsd = Math.round(preparedVanillaKg * marketPriceUsd)
  const producerShareUsd = Math.round(estimatedRevenueUsd * 0.72)

  // Traceability demo lot state
  const [selectedLot, setSelectedLot] = useState<string>("LOT-VAN-2026-SAMB01")
  const [verifiedLotData, setVerifiedLotData] = useState<{
    code: string
    producer: string
    village: string
    harvestDate: string
    weightGreen: string
    curedWeight: string
    vanillin: string
    moisture: string
    cert: string
    curingDuration: string
  } | null>({
    code: "LOT-VAN-2026-SAMB01",
    producer: "Mamy Jaona Randrianasolo (PRD-SAMB-2026-001)",
    village: "Ankoalabe, Commune Farahalana, Sambava",
    harvestDate: "18 Juillet 2026",
    weightGreen: "1 520 kg gousses vertes sélectionnées",
    curedWeight: "316 kg Vanille Bourbon Noire Gourmet A",
    vanillin: "2.18% (Norme ISO > 1.8%)",
    moisture: "33.4% (Gousse souple & grasse)",
    cert: "Biologique Ecocert & USDA NOP",
    curingDuration: "125 jours (échaudage, étuvage, séchage et affinage)"
  })

  // Contact form state
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactMessage, setContactMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLotInspect = (code: string) => {
    setSelectedLot(code)
    if (code === "LOT-VAN-2026-SAMB01") {
      setVerifiedLotData({
        code: "LOT-VAN-2026-SAMB01",
        producer: "Mamy Jaona Randrianasolo (PRD-SAMB-2026-001)",
        village: "Ankoalabe, Commune Farahalana, Sambava",
        harvestDate: "18 Juillet 2026",
        weightGreen: "1 520 kg gousses vertes sélectionnées",
        curedWeight: "316 kg Vanille Bourbon Noire Gourmet A",
        vanillin: "2.18% (Norme ISO > 1.8%)",
        moisture: "33.4% (Gousse souple & grasse)",
        cert: "Biologique Ecocert & USDA NOP",
        curingDuration: "125 jours"
      })
    } else if (code === "LOT-VAN-2026-ANT014") {
      setVerifiedLotData({
        code: "LOT-VAN-2026-ANT014",
        producer: "Chantal Soa Rasoazanany (PRD-ANT-2026-014)",
        village: "Ambohitralanana Sud, Cap Est, Antalaha",
        harvestDate: "02 Août 2026",
        weightGreen: "1 180 kg gousses vertes",
        curedWeight: "245 kg Vanille Bourbon Extra 18cm+",
        vanillin: "2.24% (Teneur d'exception)",
        moisture: "32.8% (Qualité gastronomique)",
        cert: "Biologique & Fair Trade certifié",
        curingDuration: "135 jours"
      })
    } else {
      setVerifiedLotData({
        code: "LOT-VAN-2026-AND027",
        producer: "Olivier Bao Rakotoniaina (PRD-AND-2026-027)",
        village: "Doany Haut, Cuvette d'Andapa",
        harvestDate: "10 Août 2026",
        weightGreen: "2 240 kg gousses vertes de montagne",
        curedWeight: "468 kg Vanille Bourbon Noire",
        vanillin: "2.31% (Maturation lente en altitude)",
        moisture: "34.0%",
        cert: "Biologique NOP & UE",
        curingDuration: "140 jours"
      })
    }
  }

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      successAlert("Demande transmise", "Notre équipe de la coopérative Vintsy vous répondra sous 24h ouvrées.")
      setContactName("")
      setContactEmail("")
      setContactMessage("")
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#0a110d] text-[#f8fafc] font-sans antialiased selection:bg-[#d97706] selection:text-white">
      
      {/* Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (4-5 Nav Links) - Zone 3 (1 Primary Action) */}
      <header className="sticky top-0 z-50 bg-[#0a110d]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
          
          {/* Zone 1: Brand Wordmark */}
          <Link href="/" className="flex items-center gap-3 whitespace-nowrap shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16a34a] to-[#047857] flex items-center justify-center p-2 shadow-md border border-white/20">
              <Image 
                src="/logo.png" 
                alt="Vintsy Logo" 
                width={36} 
                height={36} 
                className="object-contain" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-[#4ade80] transition-colors">
                Vintsy
              </span>
              <span className="text-[10px] text-[#94a3b8] tracking-widest uppercase">
                Filière Vanille Madagascar
              </span>
            </div>
          </Link>

          {/* Zone 2: Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#cbd5e1]">
            <a href="#filiere" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Filière & Savoir-faire
            </a>
            <a href="#sig" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Parcelles & SIG
            </a>
            <a href="#tracabilite" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Traçabilité & Qualité
            </a>
            <a href="#simulateur" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Simulateur Récolte
            </a>
            <a href="#cooperative" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Coopérative SAVA
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#15803d] hover:bg-[#16a34a] text-white shadow-lg transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>Mon Espace ({user.role_display})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => loginAsDemo('admin')}
                  className="hidden sm:inline-flex px-3.5 py-2 text-xs font-medium text-[#fbbf24] bg-[#78350f]/30 hover:bg-[#78350f]/50 border border-[#f59e0b]/40 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Accès Démo 1-Clic
                </button>
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-white hover:bg-[#e2e8f0] text-[#0a110d] shadow-lg transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <span>Connexion</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        {/* Ambient lighting */}
        <div className="absolute top-0 right-1/4 w-[650px] h-[650px] rounded-full bg-[#15803d]/15 blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -left-40 w-[600px] h-[600px] rounded-full bg-[#78350f]/15 blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Proposition */}
            <div className="lg:col-span-7 space-y-6">
              {/* Unboxed natural kicker */}
              <div className="flex items-center gap-2 text-xs text-[#4ade80] font-semibold tracking-wide uppercase">
                <span>Coopérative Agricole & Traçabilité Numérique</span>
                <span aria-hidden="true">·</span>
                <span>Région SAVA Madagascar</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] [text-wrap:balance]">
                La vanille bourbon d'excellence, tracée de la liane à l'export.
              </h1>

              <p className="text-base sm:text-lg text-[#94a3b8] leading-relaxed max-w-2xl">
                Plateforme numérique intégrée pour coopératives, producteurs et exportateurs. 
                Cartographie SIG des parcelles agroforestières, pesée contrôlée des gousses vertes, 
                audits de conformité Bio & NOP, et passeport digital par lot QR code.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href="/login"
                  className="px-6 py-3.5 text-sm font-semibold text-white bg-[#15803d] hover:bg-[#16a34a] rounded-xl shadow-xl shadow-[#15803d]/25 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <span>Accéder à l'Espace Coopérative</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#filiere"
                  className="px-6 py-3.5 text-sm font-medium text-[#cbd5e1] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all whitespace-nowrap"
                >
                  Découvrir la Filière
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-[#94a3b8]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
                  <span>Certifié Bio ECOCERT & NOP</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#fbbf24]" />
                  <span>Madagascar (Sambava · Antalaha · Vohémar · Andapa)</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl group">
                <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] w-full">
                  <Image
                    src="/images/hero-plantation.jpg"
                    alt="Plantation de vanille bourbon agroforestière à Sambava Madagascar"
                    fill
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a110d] via-transparent to-transparent opacity-80" />
                </div>

                {/* Floating Meta Card */}
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-[#0e1711]/90 backdrop-blur-md border border-white/15">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white">Parcelle Ankoalabe · Sambava</span>
                    <span className="text-[#4ade80] font-mono tabular-nums">14°16'S 50°09'E</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
                    <span>Vanilla planifolia</span>
                    <span aria-hidden="true">·</span>
                    <span>Agroforesterie sous tuteurs vivants</span>
                    <span aria-hidden="true">·</span>
                    <span>Bio certifié</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 4-Column Proof KPI Strip (Adjacency to Hero Claim) */}
          <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            <div className="space-y-1">
              <p className="text-3xl lg:text-4xl font-bold text-white font-mono tabular-nums tracking-tight">
                1 248
              </p>
              <p className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">
                Producteurs affilés
              </p>
              <p className="text-[11px] text-[#64748b]">Fokontanys de la région SAVA</p>
            </div>

            <div className="space-y-1">
              <p className="text-3xl lg:text-4xl font-bold text-[#4ade80] font-mono tabular-nums tracking-tight">
                3 845 ha
              </p>
              <p className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">
                Parcelles cartographiées
              </p>
              <p className="text-[11px] text-[#64748b]">Limites GeoJSON & relevés GPS</p>
            </div>

            <div className="space-y-1">
              <p className="text-3xl lg:text-4xl font-bold text-[#fbbf24] font-mono tabular-nums tracking-tight">
                98.4%
              </p>
              <p className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">
                Conformité Bio & NOP
              </p>
              <p className="text-[11px] text-[#64748b]">1 860 audits annuels menés</p>
            </div>

            <div className="space-y-1">
              <p className="text-3xl lg:text-4xl font-bold text-white font-mono tabular-nums tracking-tight">
                38.4 t
              </p>
              <p className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">
                Vanille Bourbon Préparée
              </p>
              <p className="text-[11px] text-[#64748b]">Taux vanilline moyen &gt; 2.15%</p>
            </div>
          </div>

        </div>
      </section>

      {/* Section 2: Filière & Savoir-faire (Asymmetric Bento Grid) */}
      <section id="filiere" className="py-20 lg:py-28 bg-[#0e1611] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mb-16 space-y-4">
            <span className="text-xs font-semibold text-[#fbbf24] uppercase tracking-wider">
              01. Savoir-Faire Traditionnel & Rigueur Scientifique
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              De la fleur fécondée à la main jusqu'à l'exportation des malles d'affinage
            </h2>
            <p className="text-base text-[#94a3b8] leading-relaxed">
              La vanille de Madagascar exige 9 mois de maturation sur la liane puis 4 à 6 mois de 
              préparation artisanale minutieuse. Vintsy digitalise chaque étape critique.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bento Card 1 (Large 8 cols): Curing & Sun Drying */}
            <div className="md:col-span-7 bg-[#141e17] rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between group">
              <div className="p-8 space-y-3">
                <div className="flex items-center gap-2 text-xs text-[#fbbf24] font-medium">
                  <span>Étape Clé 02</span>
                  <span aria-hidden="true">·</span>
                  <span>Séchage & Affinage Artisanal</span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Échaudage, étuvage en couvertures et séchage sur claies
                </h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">
                  Arrêt de la vie végétale par immersion à 65°C, puis étuvage sous laine pour développer 
                  la couleur brune chocolatée. Les gousses sont ensuite étalées au soleil matinal puis 
                  affinées des mois en malles de bois aromatique.
                </p>
              </div>

              <div className="relative aspect-[16/9] w-full mt-4">
                <Image
                  src="/images/beans-curing.jpg"
                  alt="Séchage et préparation de vanille Bourbon sur claies en bois"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141e17] via-transparent to-transparent" />
              </div>
            </div>

            {/* Bento Card 2 (5 cols): Quality Lab */}
            <div className="md:col-span-5 bg-[#141e17] rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between group">
              <div className="p-8 space-y-3">
                <div className="flex items-center gap-2 text-xs text-[#4ade80] font-medium">
                  <span>Étape Clé 03</span>
                  <span aria-hidden="true">·</span>
                  <span>Laboratoire & Analyse</span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Contrôle vanilline & humidité
                </h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">
                  Mesure spectrophotométrique de la vanilline, calibres gourmet (16 à 22 cm), 
                  taux d'humidité entre 30% et 35% pour prévenir toute moisissure.
                </p>
              </div>

              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/images/lab-quality.jpg"
                  alt="Contrôle qualité laboratoire coopérative vanille"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141e17] via-transparent to-transparent" />
              </div>
            </div>

            {/* Bento Card 3 (5 cols): Farmers & Community */}
            <div className="md:col-span-5 bg-[#141e17] rounded-2xl border border-white/10 overflow-hidden flex flex-col justify-between group">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/images/cooperative-farmers.jpg"
                  alt="Producteurs de vanille et inspecteur sur le terrain à Madagascar"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#141e17] via-transparent to-transparent" />
              </div>

              <div className="p-8 space-y-3">
                <div className="flex items-center gap-2 text-xs text-[#fbbf24] font-medium">
                  <span>Étape Clé 01</span>
                  <span aria-hidden="true">·</span>
                  <span>Agroforesterie & Collecte</span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Planteurs certifiés & pesée numérique
                </h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">
                  Chaque récolte verte est enregistrée sur l'application mobile même hors-connexion. 
                  Pesée digitale, bordereau horodaté et rétribution juste pour les ménages agricoles.
                </p>
              </div>
            </div>

            {/* Bento Card 4 (7 cols): Tech Pillars */}
            <div className="md:col-span-7 bg-[#141e17] rounded-2xl border border-white/10 p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-[#4ade80] font-medium">
                  <span>Architecture Plateforme</span>
                  <span aria-hidden="true">·</span>
                  <span>Module Intégré</span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Quatre piliers technologiques dédiés à la filière
                </h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed">
                  Vintsy remplace les registres papier et les cahiers de brousse par une solution 
                  sécurisée connectée aux standards d'audit internationaux.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Compass className="w-4 h-4 text-[#4ade80]" />
                    <span>SIG & Cadastre Végétal</span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Délimitation des parcelles, tuteurs et identification des sols.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <QrCode className="w-4 h-4 text-[#fbbf24]" />
                    <span>Passeport Numérique QR</span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Traçabilité de chaque botte de vanille jusqu'à l'acheteur final.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
                    <span>Audits Bio NOP / UE</span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Grilles d'inspection réglementaires et gestion des non-conformités.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <BarChart3 className="w-4 h-4 text-[#ec4899]" />
                    <span>Campagnes & Stocks</span>
                  </div>
                  <p className="text-xs text-[#94a3b8]">
                    Prévisions de rendement, perte au séchage et exportations.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Section 3: Interactive Yield & Price Simulator */}
      <section id="simulateur" className="py-20 lg:py-28 bg-[#0a110d] relative">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mb-12 space-y-3">
            <span className="text-xs font-semibold text-[#fbbf24] uppercase tracking-wider">
              02. Simulateur Économique & Agronomique
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Estimez le rendement et la valorisation de votre récolte
            </h2>
            <p className="text-base text-[#94a3b8]">
              Ajustez les paramètres de votre parcelle (surface, densité, cours mondial) 
              pour calculer instantanément la production verte et préparée gourmet.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Controls Box */}
            <div className="lg:col-span-7 bg-[#141e17] rounded-2xl border border-white/10 p-6 sm:p-8 space-y-6">
              
              {/* Slider 1: Surface */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor="sim-surface" className="text-white font-medium">
                    Superficie de la plantation
                  </label>
                  <span className="font-mono text-[#4ade80] font-semibold tabular-nums text-base">
                    {surfaceHa.toFixed(1)} hectares
                  </span>
                </div>
                <input
                  id="sim-surface"
                  type="range"
                  min="0.5"
                  max="15.0"
                  step="0.5"
                  value={surfaceHa}
                  onChange={(e) => setSurfaceHa(parseFloat(e.target.value))}
                  className="w-full accent-[#16a34a] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#64748b]">
                  <span>0.5 ha (Familial)</span>
                  <span>7.5 ha (Coopérative)</span>
                  <span>15.0 ha (Domaine)</span>
                </div>
              </div>

              {/* Slider 2: Density */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor="sim-density" className="text-white font-medium">
                    Densité de plantation (tuteurs & lianes)
                  </label>
                  <span className="font-mono text-[#4ade80] font-semibold tabular-nums text-base">
                    {plantsPerHa.toLocaleString('fr-FR')} lianes / ha
                  </span>
                </div>
                <input
                  id="sim-density"
                  type="range"
                  min="800"
                  max="2000"
                  step="100"
                  value={plantsPerHa}
                  onChange={(e) => setPlantsPerHa(parseInt(e.target.value))}
                  className="w-full accent-[#16a34a] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#64748b]">
                  <span>800 (Agroforesterie extensive)</span>
                  <span>1 400 (Standard SAVA)</span>
                  <span>2 000 (Sous ombrière intensive)</span>
                </div>
              </div>

              {/* Slider 3: Yield per plant */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor="sim-yield" className="text-white font-medium">
                    Rendement vert par liane
                  </label>
                  <span className="font-mono text-[#fbbf24] font-semibold tabular-nums text-base">
                    {yieldPerPlantKg.toFixed(2)} kg vert / pied
                  </span>
                </div>
                <input
                  id="sim-yield"
                  type="range"
                  min="0.3"
                  max="1.5"
                  step="0.05"
                  value={yieldPerPlantKg}
                  onChange={(e) => setYieldPerPlantKg(parseFloat(e.target.value))}
                  className="w-full accent-[#d97706] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#64748b]">
                  <span>0.30 kg (Jeune plant)</span>
                  <span>0.70 kg (Pleine maturité)</span>
                  <span>1.50 kg (Année record)</span>
                </div>
              </div>

              {/* Slider 4: Market Price USD */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <label htmlFor="sim-price" className="text-white font-medium">
                    Cours FOB vanille préparée Grade A
                  </label>
                  <span className="font-mono text-[#fbbf24] font-semibold tabular-nums text-base">
                    ${marketPriceUsd} USD / kg
                  </span>
                </div>
                <input
                  id="sim-price"
                  type="range"
                  min="80"
                  max="350"
                  step="10"
                  value={marketPriceUsd}
                  onChange={(e) => setMarketPriceUsd(parseInt(e.target.value))}
                  className="w-full accent-[#d97706] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-[#64748b]">
                  <span>$80 USD (Marché bas)</span>
                  <span>$160 USD (Moyenne 2026)</span>
                  <span>$350 USD (Gourmet Grand Cru)</span>
                </div>
              </div>

            </div>

            {/* Results Display Box */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#16291a] to-[#0f1d13] rounded-2xl border border-[#22c55e]/30 p-8 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="text-xs uppercase tracking-wider text-[#4ade80] font-semibold">
                  Résultats Prévisionnels
                </span>
                <span className="text-xs text-[#94a3b8] font-mono">Ratio 4.8:1 vert/sec</span>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#cbd5e1]">Total lianes productives</span>
                  <span className="text-lg font-bold text-white font-mono tabular-nums">
                    {totalPlants.toLocaleString('fr-FR')} pieds
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#cbd5e1]">Récolte vanille verte</span>
                  <span className="text-xl font-bold text-white font-mono tabular-nums">
                    {greenVanillaKg.toLocaleString('fr-FR')} kg
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#cbd5e1]">Vanille préparée Gourmet A</span>
                  <span className="text-2xl font-bold text-[#4ade80] font-mono tabular-nums">
                    {preparedVanillaKg.toLocaleString('fr-FR')} kg
                  </span>
                </div>
              </div>

              {/* Financial Box */}
              <div className="pt-6 border-t border-white/10 space-y-3">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <span className="text-xs text-[#94a3b8]">Valeur brute export estimée</span>
                  <p className="text-3xl font-bold text-[#fbbf24] font-mono tabular-nums tracking-tight">
                    ${estimatedRevenueUsd.toLocaleString('fr-FR')} USD
                  </p>
                  <p className="text-[11px] text-[#94a3b8]">
                    ≈ {(estimatedRevenueUsd * 4700).toLocaleString('fr-FR')} Ariary (MGA)
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#14532d]/30 border border-[#22c55e]/30 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/90 font-medium">Revenu direct planteurs (72%)</span>
                    <span className="text-xs font-mono text-[#4ade80] font-semibold">Équitable</span>
                  </div>
                  <p className="text-2xl font-bold text-white font-mono tabular-nums">
                    ${producerShareUsd.toLocaleString('fr-FR')} USD
                  </p>
                  <p className="text-[11px] text-[#94a3b8]">
                    Paiement garanti à la pesée + bonus qualité à l'affinage
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full py-3 rounded-xl bg-[#15803d] hover:bg-[#16a34a] text-white text-xs font-semibold text-center block transition-all shadow-lg"
                >
                  Intégrer vos parcelles dans Vintsy
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Section 4: Interactive Traceability Inspector */}
      <section id="tracabilite" className="py-20 lg:py-28 bg-[#0e1611] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mb-12 space-y-3">
            <span className="text-xs font-semibold text-[#4ade80] uppercase tracking-wider">
              03. Traçabilité & Passeport Numérique Inviolable
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Vérifiez en direct l'origine et les analyses d'un lot certifié
            </h2>
            <p className="text-base text-[#94a3b8]">
              Chaque carton et malle exportée porte un identifiant unique. Scanné depuis un smartphone 
              ou recherché ici, il révèle l'intégralité du cycle de vie agronomique.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Lot Selector Tabs */}
            <div className="lg:col-span-4 space-y-4">
              <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider block">
                Sélectionnez un lot d'exemple :
              </span>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleLotInspect("LOT-VAN-2026-SAMB01")}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedLot === "LOT-VAN-2026-SAMB01"
                      ? "bg-[#14532d]/40 border-[#22c55e] text-white shadow-lg"
                      : "bg-[#141e17] border-white/10 hover:border-white/20 text-[#cbd5e1]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-[#fbbf24]">
                      LOT-VAN-2026-SAMB01
                    </span>
                    <span className="text-[10px] text-[#4ade80]">Gourmet Grade A</span>
                  </div>
                  <p className="text-xs text-white font-medium">Sambava · Coopérative Nord</p>
                  <p className="text-[11px] text-[#94a3b8] mt-1">Parcelle Ankoalabe · Récolte Juil. 2026</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleLotInspect("LOT-VAN-2026-ANT014")}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedLot === "LOT-VAN-2026-ANT014"
                      ? "bg-[#14532d]/40 border-[#22c55e] text-white shadow-lg"
                      : "bg-[#141e17] border-white/10 hover:border-white/20 text-[#cbd5e1]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-[#fbbf24]">
                      LOT-VAN-2026-ANT014
                    </span>
                    <span className="text-[10px] text-[#38bdf8]">Extra 18cm+</span>
                  </div>
                  <p className="text-xs text-white font-medium">Antalaha · Cap Est Vallée</p>
                  <p className="text-[11px] text-[#94a3b8] mt-1">Parcelle Ambohitralanana · Récolte Août 2026</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleLotInspect("LOT-VAN-2026-AND027")}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedLot === "LOT-VAN-2026-AND027"
                      ? "bg-[#14532d]/40 border-[#22c55e] text-white shadow-lg"
                      : "bg-[#141e17] border-white/10 hover:border-white/20 text-[#cbd5e1]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-[#fbbf24]">
                      LOT-VAN-2026-AND027
                    </span>
                    <span className="text-[10px] text-[#ec4899]">Altitude Cru</span>
                  </div>
                  <p className="text-xs text-white font-medium">Andapa · Contreforts Marojejy</p>
                  <p className="text-[11px] text-[#94a3b8] mt-1">Parcelle Doany · Récolte Août 2026</p>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-[#94a3b8] space-y-2">
                <div className="flex items-center gap-2 text-white font-medium">
                  <QrCode className="w-4 h-4 text-[#fbbf24]" />
                  <span>Compatibilité Mobile Terrain</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  L'application mobile Vintsy Android scanne les codes-barres 2D même en brousse sans réseau 4G.
                </p>
              </div>
            </div>

            {/* Passport Certificate Card */}
            <div className="lg:col-span-8 bg-[#141e17] rounded-2xl border border-white/15 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#16a34a]/10 rounded-full blur-3xl pointer-events-none" />

              {verifiedLotData && (
                <div className="space-y-6 relative z-10">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#4ade80] font-semibold uppercase tracking-wider">
                          Passeport Numérique Conforme
                        </span>
                        <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
                      </div>
                      <h3 className="text-2xl font-bold font-mono text-white mt-1">
                        {verifiedLotData.code}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-[#94a3b8] block">Statut Réglementaire</span>
                      <span className="text-xs font-semibold text-[#fbbf24] px-2.5 py-1 rounded bg-[#78350f]/30 border border-[#f59e0b]/30">
                        {verifiedLotData.cert}
                      </span>
                    </div>
                  </div>

                  {/* Grid of verified points */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[#94a3b8]">Producteur & Exploitation</span>
                      <p className="font-semibold text-white">{verifiedLotData.producer}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[#94a3b8]">Commune & District</span>
                      <p className="font-semibold text-white">{verifiedLotData.village}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[#94a3b8]">Date Récolte Gousses Vertes</span>
                      <p className="font-semibold text-white">{verifiedLotData.harvestDate}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                      <span className="text-[#94a3b8]">Durée d'Affinage en Malles</span>
                      <p className="font-semibold text-white">{verifiedLotData.curingDuration}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#14532d]/20 border border-[#22c55e]/30 space-y-1">
                      <span className="text-[#4ade80] font-medium">Teneur en Vanilline Analysée</span>
                      <p className="font-bold text-white text-sm">{verifiedLotData.vanillin}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#14532d]/20 border border-[#22c55e]/30 space-y-1">
                      <span className="text-[#4ade80] font-medium">Taux d'Humidité Résiduelle</span>
                      <p className="font-bold text-white text-sm">{verifiedLotData.moisture}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[#94a3b8]">Volume Préparé Export</span>
                      <p className="font-bold text-white text-sm">{verifiedLotData.curedWeight}</p>
                    </div>

                    <Link
                      href="/login"
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center gap-1.5"
                    >
                      <span>Voir la fiche complète dans le dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* Section 5: Les 4 Districts Iconiques de la Région SAVA */}
      <section id="sig" className="py-20 lg:py-28 bg-[#0a110d] relative">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mb-16 space-y-3">
            <span className="text-xs font-semibold text-[#fbbf24] uppercase tracking-wider">
              04. Cartographie & Terroirs
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Les 4 bassins vanilliers de la côte Nord-Est de Madagascar
            </h2>
            <p className="text-base text-[#94a3b8]">
              Le triangle Sambava-Antalaha-Vohémar-Andapa concentre plus de 75% de la production 
              mondiale de vanille gourmet Bourbon. Vintsy connecte les coopératives de chaque vallée.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Sambava */}
            <div className="bg-[#141e17] rounded-2xl border border-white/10 p-6 space-y-4 hover:border-[#22c55e]/40 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#4ade80]">District 01</span>
                <span className="text-xs text-[#94a3b8]">Côte Océane</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#4ade80] transition-colors">
                Sambava
              </h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Capitale économique de la vanille. Terres d'alluvions fertiles et séchoirs historiques 
                au bord de l'océan Indien.
              </p>
              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-[#cbd5e1]">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Planteurs suivis :</span>
                  <span className="font-mono text-white font-semibold">460 membres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Superficie SIG :</span>
                  <span className="font-mono text-white font-semibold">1 420 ha</span>
                </div>
              </div>
            </div>

            {/* Antalaha */}
            <div className="bg-[#141e17] rounded-2xl border border-white/10 p-6 space-y-4 hover:border-[#22c55e]/40 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#fbbf24]">District 02</span>
                <span className="text-xs text-[#94a3b8]">Berceau Historique</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#fbbf24] transition-colors">
                Antalaha
              </h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Cité historique des préparateurs artisanaux et du Cap Est. Réputée pour ses longues 
                gousses noires huileuses de qualité grand cru.
              </p>
              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-[#cbd5e1]">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Planteurs suivis :</span>
                  <span className="font-mono text-white font-semibold">385 membres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Superficie SIG :</span>
                  <span className="font-mono text-white font-semibold">1 180 ha</span>
                </div>
              </div>
            </div>

            {/* Vohémar */}
            <div className="bg-[#141e17] rounded-2xl border border-white/10 p-6 space-y-4 hover:border-[#22c55e]/40 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#38bdf8]">District 03</span>
                <span className="text-xs text-[#94a3b8]">Nord & Baie</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#38bdf8] transition-colors">
                Vohémar
              </h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Port d'embarquement septentrional. Microclimat plus sec propice à un séchage 
                rapide et uniforme des gousses après étuvage.
              </p>
              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-[#cbd5e1]">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Planteurs suivis :</span>
                  <span className="font-mono text-white font-semibold">215 membres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Superficie SIG :</span>
                  <span className="font-mono text-white font-semibold">690 ha</span>
                </div>
              </div>
            </div>

            {/* Andapa */}
            <div className="bg-[#141e17] rounded-2xl border border-white/10 p-6 space-y-4 hover:border-[#22c55e]/40 transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#ec4899]">District 04</span>
                <span className="text-xs text-[#94a3b8]">Haute Cuvette</span>
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-[#ec4899] transition-colors">
                Andapa
              </h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                Vallée d'altitude entourée du parc national de Marojejy. Maturation lente des lianes 
                offrant les plus forts taux de vanilline naturelle.
              </p>
              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-[#cbd5e1]">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Planteurs suivis :</span>
                  <span className="font-mono text-white font-semibold">188 membres</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Superficie SIG :</span>
                  <span className="font-mono text-white font-semibold">555.6 ha</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Section 6: Cooperative Engagement & Contact */}
      <section id="cooperative" className="py-20 lg:py-28 bg-[#0e1611] border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Cooperative Commitment */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-semibold text-[#fbbf24] uppercase tracking-wider">
                Rejoignez le Réseau Vintsy
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Pour les coopératives, les exportateurs et les acheteurs responsables
              </h2>
              <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
                Que vous soyez président d'une association de planteurs à Madagascar ou importateur 
                de vanille en Europe ou aux États-Unis, notre plateforme simplifie vos audits 
                et garantit une conformité totale avec le règlement européen anti-déforestation (EUDR).
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-[#22c55e]/20 text-[#4ade80] shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Conformité EUDR (Zéro Déforestation)</h4>
                    <p className="text-xs text-[#94a3b8]">
                      Géolocalisation précise des parcelles et preuve temporelle de non-déforestation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-[#22c55e]/20 text-[#4ade80] shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Application Hors Ligne pour Agents de Brousse</h4>
                    <p className="text-xs text-[#94a3b8]">
                      Collecte sans connexion internet avec synchronisation automatique dès retour en ville.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-[#22c55e]/20 text-[#4ade80] shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Intégration API & Export Excel/PDF</h4>
                    <p className="text-xs text-[#94a3b8]">
                      Exportation directe des bordereaux de livraison et rapports de campagne officiels.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-6 bg-[#141e17] rounded-2xl border border-white/10 p-8 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2">
                Prendre contact avec la coopérative
              </h3>
              <p className="text-xs text-[#94a3b8] mb-6">
                Renseignez vos coordonnées pour organiser une démonstration ou échanger sur vos approvisionnements.
              </p>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                    Votre nom ou entité
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ex: Coopérative Fanambana ou Maison de Saveurs"
                    className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-[#64748b] text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/50 focus:border-[#22c55e] transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                    Adresse email professionnelle
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contact@entreprise.com"
                    className="w-full h-11 px-3.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-[#64748b] text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/50 focus:border-[#22c55e] transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="contact-msg" className="block text-xs font-semibold text-[#cbd5e1] mb-1.5">
                    Objet de votre demande
                  </label>
                  <textarea
                    id="contact-msg"
                    rows={3}
                    required
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Précisez votre zone géographique ou le volume recherché..."
                    className="w-full p-3.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-[#64748b] text-sm focus:outline-none focus:ring-2 focus:ring-[#22c55e]/50 focus:border-[#22c55e] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-[#15803d] hover:bg-[#16a34a] text-white text-xs font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Envoi en cours..." : "Envoyer ma demande"}</span>
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="py-12 bg-[#080d0a] border-t border-white/10 text-xs text-[#64748b]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#16a34a]/20 border border-white/15 flex items-center justify-center p-1">
              <Image src="/logo.png" alt="Vintsy" width={24} height={24} className="object-contain" />
            </div>
            <span className="font-semibold text-white">Vintsy Vanilla Madagascar</span>
            <span aria-hidden="true">·</span>
            <span>Sambava & Antananarivo</span>
          </div>

          <div className="flex items-center gap-6 text-[#94a3b8]">
            <a href="#filiere" className="hover:text-white transition-colors">Filière</a>
            <a href="#sig" className="hover:text-white transition-colors">SIG Parcelles</a>
            <a href="#tracabilite" className="hover:text-white transition-colors">Traçabilité</a>
            <Link href="/login" className="hover:text-white transition-colors">Connexion Espace Membre</Link>
          </div>

          <p>© 2026 Vintsy. Tous droits réservés.</p>
        </div>
      </footer>

    </div>
  )
}
