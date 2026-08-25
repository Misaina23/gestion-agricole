"use client"

import { useEffect, useState } from "react"
import { Download, Calendar, FileSpreadsheet, FileText, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { aiApi, producersApi, parcelsApi, productionsApi, inspectionsApi, coreApi, type MonthlyReport } from "@/lib/api"
import { toast } from "sonner"

interface ReportFilters {
  start_date: string
  end_date: string
  region: string
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    start_date: new Date().toISOString().slice(0, 7) + "-01",
    end_date: new Date().toISOString().slice(0, 10),
    region: "",
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [selectedType, setSelectedType] = useState("global")
  const [regions, setRegions] = useState<Array<{ id: number; name: string }>>([])

  const exportParams = () => ({
    start_date: filters.start_date,
    end_date: filters.end_date,
    ...(filters.region ? { region: filters.region } : {}),
  })

  useEffect(() => {
    Promise.all([aiApi.listReports({ page_size: "5" }), coreApi.regions()])
      .then(([reportResponse, regionResponse]) => {
        setReports(reportResponse.results || [])
        setRegions(regionResponse)
      })
      .catch(() => toast.error("Impossible de charger les rapports"))
  }, [])

  const generateReport = async () => {
    setIsGenerating(true)
    try {
      const report = await aiApi.generateReport({
        report_type: selectedType,
        period_start: filters.start_date,
        period_end: filters.end_date,
        region: filters.region,
      })
      setReports((current) => [report, ...current.filter((item) => item.id !== report.id)].slice(0, 5))
      toast.success("Rapport généré")
    } catch (error: any) {
      toast.error(error?.message || "Impossible de générer le rapport")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportAll = async (format: "excel" | "pdf") => {
    setIsExporting(true)
    try {
      const params = { ...filters }
      if (format === "excel") {
        await producersApi.exportExcel(params)
        await parcelsApi.exportExcel(params)
        await productionsApi.exportExcel(params)
        await inspectionsApi.exportExcel(params)
      } else {
        await producersApi.exportPdf(params)
        await parcelsApi.exportPdf(params)
        await productionsApi.exportPdf(params)
        await inspectionsApi.exportPdf(params)
      }
    } catch {
      console.error("Erreur lors de l'export")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0a1628]">Rapports et Exports</h1>
        <p className="text-sm text-[#5a7a9a] mt-1">Analyse des données réelles du registre et exports opérationnels</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Rapport analytique</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <label className="space-y-1 text-sm"><span>Type</span><select className="h-10 w-full rounded-md border bg-background px-3" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}><option value="global">Global</option><option value="producers">Producteurs</option><option value="parcels">Parcelles</option><option value="productions">Récoltes du registre</option><option value="inspections">Inspections</option><option value="region">Région</option></select></label>
          <label className="space-y-1 text-sm"><span>Début</span><input className="h-10 w-full rounded-md border bg-background px-3" type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} /></label>
          <label className="space-y-1 text-sm"><span>Fin</span><input className="h-10 w-full rounded-md border bg-background px-3" type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} /></label>
          <label className="space-y-1 text-sm"><span>Région</span><select className="h-10 w-full rounded-md border bg-background px-3" value={filters.region} onChange={(e) => setFilters({ ...filters, region: e.target.value })}><option value="">Toutes</option>{regions.map((region) => <option key={region.id} value={region.name}>{region.name}</option>)}</select></label>
          <Button className="mt-6" onClick={generateReport} disabled={isGenerating || filters.start_date > filters.end_date}>{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Générer</Button>
        </CardContent>
      </Card>

      {reports.length > 0 && <Card><CardHeader><CardTitle>Derniers rapports</CardTitle></CardHeader><CardContent className="space-y-3">{reports.map((report) => <div key={report.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{report.title}</p><p className="text-xs text-muted-foreground">{report.period_start} au {report.period_end} · {report.status}</p></div><span className="text-xs text-muted-foreground">{report.report_data?.kpis?.producers?.total ?? 0} producteurs · {report.report_data?.kpis?.parcels?.total ?? 0} parcelles</span></div><p className="mt-2 text-sm text-muted-foreground">{report.summary || "Aucun résumé disponible"}</p></div>)}</CardContent></Card>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Producteurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => producersApi.exportExcel(exportParams())} disabled={isExporting} className="w-full justify-start">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => producersApi.exportPdf(exportParams())} disabled={isExporting} className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parcelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => parcelsApi.exportExcel(exportParams())} disabled={isExporting} className="w-full justify-start">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => parcelsApi.exportPdf(exportParams())} disabled={isExporting} className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => productionsApi.exportExcel(exportParams())} disabled={isExporting} className="w-full justify-start">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => productionsApi.exportPdf(exportParams())} disabled={isExporting} className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inspections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => inspectionsApi.exportExcel(exportParams())} disabled={isExporting} className="w-full justify-start">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => inspectionsApi.exportPdf(exportParams())} disabled={isExporting} className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}