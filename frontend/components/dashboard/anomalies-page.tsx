"use client"

import { useState, useEffect } from "react"
import { anomaliesApi } from "@/lib/api"
import { Loader2, AlertTriangle, Phone, MapPin, Ruler, User, Copy } from "lucide-react"

export function AnomaliesPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    anomaliesApi.detect().then(setData).catch(() => setLoading(false))
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-[#5a7a9a]">Impossible de charger les anomalies.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-[#1e3a5f]" />
        <h1 className="text-2xl font-bold text-[#0a1628]">
          Qualité des données
          <span className="ml-3 text-sm font-normal text-red-500">
            ({data.total_issues} anomalie{data.total_issues !== 1 ? 's' : ''})
          </span>
        </h1>
      </div>

      {data.total_issues === 0 ? (
        <p className="text-green-600">Aucune anomalie détectée.</p>
      ) : (
        <div className="space-y-4">
          {data.anomalies.invalid_phones.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e8f4fc] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-[#0a1628]">Téléphones invalides</h3>
              </div>
              {data.anomalies.invalid_phones.map((p: any) => (
                <div key={p.id} className="text-sm py-1">{p.name}: {p.phone}</div>
              ))}
            </div>
          )}

          {data.anomalies.invalid_gps.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e8f4fc] p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-[#0a1628]">Coordonnées GPS invalides</h3>
              </div>
              {data.anomalies.invalid_gps.map((p: any) => (
                <div key={p.id} className="text-sm py-1">{p.code}: ({p.latitude}, {p.longitude})</div>
              ))}
            </div>
          )}

          {data.anomalies.abnormal_areas.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e8f4fc] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Ruler className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-[#0a1628]">Surfaces anormales</h3>
              </div>
              {data.anomalies.abnormal_areas.map((p: any) => (
                <div key={p.id} className="text-sm py-1">{p.code}: {p.area} ha</div>
              ))}
            </div>
          )}

          {data.anomalies.odd_ages.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e8f4fc] p-5">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-[#0a1628]">Âges impossibles</h3>
              </div>
              {data.anomalies.odd_ages.map((p: any) => (
                <div key={p.id} className="text-sm py-1">{p.name}: {p.calculated_age} ans</div>
              ))}
            </div>
          )}

          {data.anomalies.duplicate_codes.length > 0 && (
            <div className="bg-white rounded-xl border border-[#e8f4fc] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Copy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-[#0a1628]">Codes dupliqués</h3>
              </div>
              {data.anomalies.duplicate_codes.map((d: any, i: number) => (
                <div key={i} className="text-sm py-1">{d.code} ({d.count} occurrences)</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}