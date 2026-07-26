"use client"

import { useEffect, useState } from "react"
import { Brain, Leaf, TrendingUp, Calendar, ChevronRight, Lightbulb, AlertTriangle, ShieldAlert, Info } from "lucide-react"
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
  const [isChatSending, setIsChatSending] = useState(false)

  const generateMonthlyReport = async () => {
    try {
      if (!stats) {
        toast.error(t("dataUnavailable"))
        return
      }

      const month = new Date().toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { month: "long" })
      const year = new Date().getFullYear()

      const report: MonthlyReport = {
        id: 0,
        month,
        year,
        summary: `${t("reportSummary")}: ${stats.producers?.total || 0} ${t("producer").toLowerCase()}s, ${stats.parcels?.total || 0} ${t("parcels")}`,
        yield_data: {
          [t("production")]: stats.productions?.total_green_weight || 0,
          [t("totalArea")]: stats.parcels?.total_surface || 0,
        },
        recommendations: [],
        created_at: new Date().toISOString(),
      }
      setMonthlyReport(report)
      toast.success(t("monthlyReportGenerated"))
    } catch {
      toast.error(t("dataUnavailable"))
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
    loadRecommendations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendChat = async () => {
    if (!chatInput || chatInput.trim().length === 0) return
    setIsChatSending(true)
    try {
      const res = await aiApi.llm(chatInput.trim(), { model: 'gpt-4o', max_tokens: 800 })
      setChatResponse(res.response || (res.raw && JSON.stringify(res.raw, null, 2)) || '')
      // no structured suggestions from LLM proxy by default
      toast.success("Réponse reçue")
    } catch (e) {
      toast.error(t("dataUnavailable") || "Erreur")
    } finally {
      setIsChatSending(false)
      setChatInput("")
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#1e3a5f]" />
            {t("aiAssistantTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-[#e8f4fc] rounded-lg mb-4">
            <Leaf className="w-10 h-10 text-[#1e3a5f]" />
            <div>
              <h3 className="font-semibold text-[#0a1628]">{t("personalizedAdvice")}</h3>
              <p className="text-sm text-[#5a7a9a]">{t("basedOnCrops")}</p>
            </div>
          </div>
          <Button onClick={generateMonthlyReport} className="w-full bg-[#1e3a5f] hover:bg-[#2d5a87]">
            <Calendar className="w-4 h-4 mr-2" />
            {t("generateMonthlyReport")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-[#1e3a5f]" />
            Posez une question à l'IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={"Tapez votre question..."}
              className="flex-1 rounded-md border px-3 py-2"
            />
            <Button onClick={sendChat} disabled={isChatSending}>
              {isChatSending ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
          {chatResponse && (
            <div className="mt-4 rounded-md border p-3 bg-white/5 text-sm">
              <p className="whitespace-pre-line">{chatResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            {t("recentRecommendations")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <ul className="space-y-3">
              {recommendations.map((rec) => (
                <li key={rec.id} className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0a1628]">{rec.message}</p>
                    {rec.parcel_code && (
                      <p className="text-xs text-[#5a7a9a]">{t("parcels")}: {rec.parcel_code}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {rec.type === "yield_improvement" ? t("production") :
                     rec.type === "seasonal_tip" ? t("thisMonth") : t("maintenance")}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#5a7a9a]">{t("noRecommendations")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("agriAdvice")}</CardTitle>
        </CardHeader>
        <CardContent>
          {advice.length > 0 ? (
            <ul className="space-y-3">
              {advice.map((tip) => (
                <li key={tip.id} className="border-l-2 border-[#1e3a5f] pl-3">
                  <p className="text-sm font-medium text-[#0a1628]">{tip.title}</p>
                  <p className="text-xs text-[#5a7a9a] mt-1">{tip.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#5a7a9a]">{t("noAdvice")}</p>
          )}
          <Button variant="ghost" size="sm" className="mt-4 w-full justify-between">
            {t("viewAllAdvice")}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {t("anomalyDetection")}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadAnomalies} disabled={isAnomaliesLoading}>
            {isAnomaliesLoading ? t("analyze") + "..." : t("analyze")}
          </Button>
        </CardHeader>
        <CardContent>
          {!anomalies ? (
            <p className="text-sm text-[#5a7a9a]">{t("noAnalysis")}</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-[#c5ddf5] bg-[#f8fbff]">
                  <p className="text-xs text-[#5a7a9a]">{t("lowYields")}</p>
                  <p className="text-lg font-bold text-red-600">{anomalies.counts.low_yields}</p>
                </div>
                <div className="p-3 rounded-lg border border-[#c5ddf5] bg-[#f8fbff]">
                  <p className="text-xs text-[#5a7a9a]">{t("inactiveProducers")}</p>
                  <p className="text-lg font-bold text-amber-600">{anomalies.counts.inactive_producers}</p>
                </div>
                <div className="p-3 rounded-lg border border-[#c5ddf5] bg-[#f8fbff]">
                  <p className="text-xs text-[#5a7a9a]">{t("inconsistentRecords")}</p>
                  <p className="text-lg font-bold text-[#1e3a5f]">{anomalies.counts.inconsistent_records}</p>
                </div>
              </div>

              {anomalies.low_yields.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[#0a1628] mb-1">{t("lowYields")}</p>
                  <ul className="space-y-1">
                    {anomalies.low_yields.slice(0, 10).map((point) => (
                      <li key={point.parcel_id} className="flex items-start gap-3 p-2 rounded-lg border border-[#e8f4fc]">
                        <ShieldAlert className="w-4 h-4 mt-0.5 text-red-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#0a1628]">{point.producer}</p>
                          <p className="text-xs text-[#5a7a9a]">
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
                  <p className="text-sm font-medium text-[#0a1628] mb-1">{t("inactiveProducers")}</p>
                  <ul className="space-y-1">
                    {anomalies.inactive_producers.slice(0, 10).map((point) => (
                      <li key={point.id} className="flex items-start gap-3 p-2 rounded-lg border border-[#e8f4fc]">
                        <ShieldAlert className="w-4 h-4 mt-0.5 text-amber-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#0a1628]">{point.name}</p>
                          {point.region__name && (
                            <p className="text-xs text-[#5a7a9a]">{point.region__name}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {anomalies.inconsistent_records.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[#0a1628] mb-1">{t("inconsistentRecords")}</p>
                  <ul className="space-y-1">
                    {anomalies.inconsistent_records.slice(0, 10).map((point) => (
                      <li key={point.id} className="flex items-start gap-3 p-2 rounded-lg border border-[#e8f4fc]">
                        <ShieldAlert className="w-4 h-4 mt-0.5 text-[#1e3a5f]" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#0a1628]">{point.parcel__code}</p>
                          <p className="text-xs text-[#5a7a9a]">
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
                  <p className="text-xs text-[#5a7a9a]">{t("noAnalysis")}</p>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {monthlyReport && (
        <Card className="rounded-xl border border-[#c5ddf5] bg-card/95 text-foreground">
          <CardHeader>
            <CardTitle>{t("reportSummary")} - {monthlyReport.month} {monthlyReport.year}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">{monthlyReport.summary}</p>
            <p className="text-[10px] opacity-70 mb-2">{t("generatedOn")} {new Date(monthlyReport.created_at).toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(monthlyReport.yield_data).map(([key, value]) => (
                <div key={key} className="bg-white/10 p-2 rounded">
                  <span className="opacity-70">{key}</span>
                  <p className="font-bold">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}