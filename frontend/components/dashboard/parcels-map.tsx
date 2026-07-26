"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useParcelMapData, useRegions } from "@/lib/hooks"

const MapContent = dynamic(() => import('./parcels-map-content'), { ssr: false })

interface Parcel {
  id: number
  code: string
  name?: string
  latitude?: string | number
  longitude?: string | number
  area?: number
  vanilla_plants?: number
  status: string
  producer_name?: string
  producer_code?: string
  producer__region__name?: string
  producer__commune__name?: string
  polygon_coordinates?: string
  is_certified?: boolean
}

export default function ParcelsMap() {
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const { regions, isLoading: isLoadingRegions } = useRegions()
  const { mapData, isLoading, error } = useParcelMapData(
    regionFilter && regionFilter !== "all" ? { producer__region: regionFilter } : undefined
  )

  const parcels: Parcel[] = (mapData as any[] | undefined)?.map((p) => ({
    ...p,
    region: p.producer__region__name,
    commune: p.producer__commune__name,
    area: p.area ?? p.surface,
  })) || []

  useEffect(() => {
    if (error) {
      console.error('Erreur chargement map_data', error)
    }
  }, [error])

  return (
    <MapContent
      parcels={parcels}
      isLoading={isLoading}
      regions={regions}
      isLoadingRegions={isLoadingRegions}
      regionFilter={regionFilter}
      onRegionFilterChange={setRegionFilter}
    />
  )
}
