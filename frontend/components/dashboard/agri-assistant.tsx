"use client"

import { useEffect, useState } from "react"
import { Brain, Leaf, TrendingUp, Calendar, ChevronRight, Lightbulb, AlertTriangle, ShieldAlert, Info, MessageCircle, Sparkles, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useDashboardStats } from "@/lib/hooks"
import { aiApi } from "@/lib/api"
import { useLanguage } from "@/lib/language-context"
import { successAlert, errorAlert } from "@/lib/sweetalert"

export interface AgriAdvice {
  id: number
  title: string
  content: string
  category: string
  priority: string
  created_at: string
}

export interface AgriRecommendation {
  id: number
  type: string
  message: string
  parcel?: number
  parcel_code?: string
  created_at: string
}

export interface MonthlyReport {
  id: number
  month: string
  year: number
  summary: string
  yield_data: Record<string, number>
  recommendations: AgriRecommendation[]
  created_at: string
}

export interface AnomaliesResponse {
  generated_at: string
  inactive_producers: Array<{ id: number; name: string; region__name?: string | null }>
  low_yields: Array<{
    parcel_id: number
    parcel: string
    producer: string
    region?: string | null
    yield_kg_per_ha: number
    area_ha: number
  }>
  inconsistent_records: Array<{
    id: number
    parcel__code: string
    weight_green: number | null
    harvest_date: string | null
  }>
  counts: {
    inactive_producers: number
    low_yields: number
    inconsistent_records: number
  }
}

const GREETINGS = [
  "bonjour", "bonsoir", "salut", "hello", "hi", "good morning", "good evening", "bon matin", "bonne nuit",
  "merci", "thank you", "thanks", "comment allez-vous", "ca va", "ça va"
]

export default function AgriAssistantPanel() {
  const { stats, isLoading: statsLoading } = useDashboardStats()
  const { t, locale } = useLanguage()
  const [advice, setAdvice] = useState<AgriAdvice[]>([])
  const [recommendations, setRecommendations] = useState<AgriRecommendation[]>([])
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null)
  const [isAnomaliesLoading, setIsAnomaliesLoading] = useState(false)
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatResponse, setChatResponse] = useState<string | null>(null)
  const [chatSuggestions, setChatSuggestions] = useState<string[]>([])
  const [isChatSending, setIsChatSending] = useState(false)

  const loadAdvice = async () => {
    try {
      const res = await aiApi.getAdvice()
      setAdvice(Array.isArray(res) ? res : [res].filter(Boolean))
    } catch {
      setAdvice([])
    }
  }

  const loadRecommendations = async () => {
    setIsRecommendationsLoading(true)
    try {
      const res = await aiApi.getRecommendations({ page_size: "5" })
      setRecommendations(res.results || [])
    } catch {
      toast.error(t("dataUnavailable"))
    } finally {
      setIsRecommendationsLoading(false)
    }
  }

  const loadAnomalies = async () => {
    setIsAnomaliesLoading(true)
    try {
      const res = await aiApi.getAnomalies()
      setAnomalies(res)
      successAlert("Anomalies détectées", "Analyse terminée")
    } catch {
      errorAlert("Erreur", "Impossible de charger les anomalies")
    } finally {
      setIsAnomaliesLoading(false)
    }
  }

  useEffect(() => {
    loadAdvice()
    loadRecommendations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generateMonthlyReport = async () => {
    try {
      if (!stats) {
        toast.error(t("dataUnavailable"))
        return
      }

      const report = await aiApi.generateMonthlyReport()
      setMonthlyReport(report)
      successAlert("Rapport généré", "Le rapport mensuel a été généré avec succès.")
    } catch (error: any) {
      console.error(error)
      errorAlert("Erreur", error?.message || "Impossible de générer le rapport mensuel.")
    }
  }

  const handleViewAllAdvice = async () => {
    await loadAdvice()
    successAlert("Conseils actualisés", "La liste des conseils a été rechargée.")
  }

  const isGreeting = (text: string) => {
    const lower = text.toLowerCase().trim()
    return GREETINGS.some((g) => lower.includes(g))
  }

  const sendChat = async (message?: string) => {
    const prompt = (message || chatInput).trim()
    if (!prompt) return
    setIsChatSending(true)
    try {
      if (isGreeting(prompt)) {
        const greetingsResponse = locale === "fr"
          ? "Bonjour ! Je suis votre assistant agricole. Comment puis-je vous aider aujourd'hui ?"
          : "Hello! I'm your agricultural assistant. How can I help you today?"
        setChatResponse(greetingsResponse)
        setChatSuggestions([
          "Quels sont les risques climatiques pour cette semaine ?",
          "Comment améliorer le rendement des parcelles en attente ?",
          "Quelles actions prioriser pour les producteurs inactifs ?",
        ])
        return
      }

      const res = await aiApi.llm(prompt, { model: 'gpt-4o', max_tokens: 800 })
      const response = res.response || (res.raw && JSON.stringify(res.raw, null, 2)) || ''
      setChatResponse(response)
      const suggestions = [
        "Quels sont les risques climatiques pour cette semaine ?",
        "Comment améliorer le rendement des parcelles en attente ?",
        "Quelles actions prioriser pour les producteurs inactifs ?",
      ]
      setChatSuggestions(suggestions)
      toast.success("Réponse reçue")
    } catch (e) {
      setChatResponse("L'assistant n'a pas pu répondre. Vérifiez la connexion et réessayez.")
      setChatSuggestions([])
      toast.error(t("dataUnavailable") || "Erreur")
    } finally {
      setIsChatSending(false)
      setChatInput("")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/8 via-background to-accent/10">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Brain className="h-5 w-5 text-primary" />
            {t("aiAssistantTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/50 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("personalizedAdvice")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("basedOnCrops")}</p>
            </div>
          </div>
          <Button onClick={generateMonthlyReport} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Calendar className="mr-2 h-4 w-4" />
            {t("generateMonthlyReport")}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Info className="h-5 w-5 text-primary" />
            Posez une question à l'IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Tapez votre question..."
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
            />
            <Button onClick={() => sendChat()} disabled={isChatSending} className="min-w-[120px]">
              {isChatSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isChatSending ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
          {chatSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chatSuggestions.map((suggestion) => (
                <Button key={suggestion} variant="outline" size="sm" onClick={() => sendChat(suggestion)} className="rounded-full">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
          {chatResponse && (
            <div className="rounded-2xl border border-border/70 bg-muted/50 p-4 text-sm text-foreground shadow-sm">
              <div className="mb-2 flex items-center gap-2 font-medium text-primary">
                <MessageCircle className="h-4 w-4" />
                Réponse de l'assistant
              </div>
              <p className="whitespace-pre-line leading-6">{chatResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            {t("recentRecommendations")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadRecommendations}
            disabled={isRecommendationsLoading}
            className="gap-1.5"
          >
            {isRecommendationsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <ul className="space-y-3">
              {recommendations.map((rec) => (
                <li key={rec.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
                  <TrendingUp className="mt-0.5 h-5 w-5 text-emerald-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{rec.message}</p>
                    {rec.parcel_code && (
                      <p className="mt-1 text-xs text-muted-foreground">{t("parcels")}: {rec.parcel_code}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {rec.type === "yield_improvement" ? t("production") :
                     rec.type === "seasonal_tip" ? t("thisMonth") : t("maintenance")}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noRecommendations")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">{t("agriAdvice")}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAllAdvice}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            {t("viewAllAdvice")}
          </Button>
        </CardHeader>
        <CardContent>
          {advice.length > 0 ? (
            <ul className="space-y-3">
              {advice.map((tip) => (
                <li key={tip.id} className="rounded-2xl border border-border/60 bg-background/60 p-3">
                  <p className="text-sm font-medium text-foreground">{tip.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{tip.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noAdvice")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {t("anomalyDetection")}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadAnomalies} disabled={isAnomaliesLoading}>
            {isAnomaliesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isAnomaliesLoading ? t("analyze") + "..." : t("analyze")}
          </Button>
        </CardHeader>
        <CardContent>
          {!anomalies ? (
            <p className="text-sm text-muted-foreground">{t("noAnalysis")}</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{t("lowYields")}</p>
                  <p className="mt-1 text-lg font-semibold text-red-600">{anomalies.counts.low_yields}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{t("inactiveProducers")}</p>
                  <p className="mt-1 text-lg font-semibold text-amber-600">{anomalies.counts.inactive_producers}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">{t("inconsistentRecords")}</p>
                  <p className="mt-1 text-lg font-semibold text-primary">{anomalies.counts.inconsistent_records}</p>
                </div>
              </div>

              {anomalies.low_yields.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium text-foreground">{t("lowYields")}</p>
                  <ul className="space-y-2">
                    {anomalies.low_yields.slice(0, 10).map((point) => (
                      <li key={point.parcel_id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-2.5">
                        <ShieldAlert className="mt-0.5 h-4 w-4 text-red-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{point.producer}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {point.parcel} - {point.yield_kg_per_ha} kg/ha
                            {point.region ? ` - ${point.region}` : ''}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {anomalies.inactive_producers.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium text-foreground">{t("inactiveProducers")}</p>
                  <ul className="space-y-2">
                    {anomalies.inactive_producers.slice(0, 10).map((point) => (
                      <li key={point.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-2.5">
                        <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{point.name}</p>
                          {point.region__name && (
                            <p className="mt-1 text-xs text-muted-foreground">{point.region__name}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {anomalies.inconsistent_records.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-medium text-foreground">{t("inconsistentRecords")}</p>
                  <ul className="space-y-2">
                    {anomalies.inconsistent_records.slice(0, 10).map((point) => (
                      <li key={point.id} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/60 p-2.5">
                        <ShieldAlert className="mt-0.5 h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{point.parcel__code}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Poids: {point.weight_green ?? '-'}
                            {point.harvest_date ? ` - Récolte: ${point.harvest_date}` : ''}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {anomalies.low_yields.length === 0 &&
                anomalies.inactive_producers.length === 0 &&
                anomalies.inconsistent_records.length === 0 && (
                  <p className="text-xs text-muted-foreground">{t("noAnalysis")}</p>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {monthlyReport && (
        <Card className="border-border/70 bg-card/95 shadow-sm">
          <CardHeader>
            <CardTitle className="text-foreground">
              {t("reportSummary")} - {monthlyReport.month ?? '-'} {monthlyReport.year ?? '-'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-foreground">{monthlyReport.summary || ''}</p>
            <p className="mb-3 text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("generatedOn")} {monthlyReport.created_at ? new Date(monthlyReport.created_at).toLocaleString(locale === "fr" ? "fr-FR" : "en-US") : '-'}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(monthlyReport.yield_data && Object.keys(monthlyReport.yield_data).length > 0) ? (
                Object.entries(monthlyReport.yield_data).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-border/60 bg-muted/50 p-2.5">
                    <span className="text-muted-foreground">{key}</span>
                    <p className="mt-1 font-semibold text-foreground">{value}</p>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-xs text-muted-foreground">{t("noData")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
