"use client"

import { useState } from "react"
import { Download, Calendar, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { producersApi, parcelsApi, productionsApi, inspectionsApi } from "@/lib/api"

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

  const handleExportAll = async (format: "csv" | "excel" | "pdf") => {
    setIsExporting(true)
    try {
      const params = { ...filters }
      if (format === "csv") {
        await producersApi.exportCsv(params)
        await parcelsApi.exportCsv(params)
        await productionsApi.exportCsv(params)
        await inspectionsApi.exportCsv(params)
      } else if (format === "excel") {
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
        <p className="text-sm text-[#5a7a9a] mt-1">Générer des rapports détaillés</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Producteurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => producersApi.exportCsv()} disabled={isExporting} className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => producersApi.exportExcel()} disabled={isExporting} className="w-full justify-start">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => producersApi.exportPdf()} disabled={isExporting} className="w-full justify-start">
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
            <Button onClick={() => parcelsApi.exportCsv()} disabled={isExporting} className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => parcelsApi.exportExcel()} disabled={isExporting} className="w-full justify-start">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => parcelsApi.exportPdf()} disabled={isExporting} className="w-full justify-start">
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
            <Button onClick={() => productionsApi.exportCsv()} disabled={isExporting} className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => productionsApi.exportExcel()} disabled={isExporting} className="w-full justify-start">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => productionsApi.exportPdf()} disabled={isExporting} className="w-full justify-start">
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
            <Button onClick={() => inspectionsApi.exportCsv()} disabled={isExporting} className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => inspectionsApi.exportExcel()} disabled={isExporting} className="w-full justify-start">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={() => inspectionsApi.exportPdf()} disabled={isExporting} className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}