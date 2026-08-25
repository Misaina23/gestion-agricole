// @ts-nocheck
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, GeoJSON } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Search, MapPin, Navigation, Maximize2, TreeDeciduous, Maximize } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"

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
  region?: string
  commune?: string
  is_certified?: boolean
  polygon_coordinates?: string
}

interface Region {
  id: number
  name: string
  code: string
}

const parcelStatusClasses: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-700",
  fallow: "bg-amber-100 text-amber-700",
  new: "bg-blue-100 text-blue-700",
}

// Clean light basemap (CARTO Positron). Falls back to standard OSM if needed.
const MAP_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
const MAP_TILE_URL_FALLBACK = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

// Local, same-origin GeoJSON assets (reliable, no external dependency)
const MDG_COUNTRY_URL = "/geo/mdg-country.geojson"
const MDG_REGIONS_URL = "/geo/mdg-regions.geojson"

// Bounding box of Madagascar (used to frame the whole country on load)
const MADAGASCAR_BOUNDS: [[number, number], [number, number]] = [
  [-25.6, 43.2],
  [-12.0, 50.5],
]

const MADAGASCAR_CENTER: [number, number] = [-19.0, 47.0]

function MapController({
  parcels,
  countryGeo,
  regionGeo,
  regionActivity,
  onRegionClick,
}: {
  parcels: Parcel[]
  countryGeo?: any
  regionGeo?: any | null
  regionActivity?: Record<string, number>
  onRegionClick?: (val: string) => void
}) {
  const map = useMap()

  // Frame the whole country once on first load (smooth).
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    if (countryGeo && countryGeo.type === "FeatureCollection") {
      try {
        const layer = L.geoJSON(countryGeo)
        map.fitBounds(layer.getBounds(), { padding: [24, 24] })
        return
      } catch {
        /* fall through */
      }
    }
    map.fitBounds(MADAGASCAR_BOUNDS, { padding: [24, 24] })
  }, [map, countryGeo])

  return null
}

const createPointIcon = (code: string, color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.65);"></div>
        <div style="position: absolute; top: -28px; left: 50%; transform: translateX(-50%); background: #0a1628; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3); pointer-events: none;">${code}</div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

const polygonColor = (status: string) => {
  if (status === "active") return "#16a34a"
  if (status === "fallow") return "#f59e0b"
  if (status === "new") return "#2563eb"
  return "#0f766e"
}

const statusMarkerColor = (status: string) => {
  if (status === "active") return "#16a34a"
  if (status === "fallow") return "#f59e0b"
  if (status === "new") return "#2563eb"
  return "#0f766e"
}

const parseGeoJSON = (text?: string): [number, number][] | null => {
  if (!text) return null
  try {
    const raw = JSON.parse(text)
    const coords = raw?.coordinates?.[0] || raw?.geometry?.coordinates?.[0]
    if (!coords || !Array.isArray(coords)) return null
    return coords.map((c: [number, number]) => [c[1], c[0]] as [number, number])
  } catch {
    return null
  }
}

function CountryBoundary({ data }: { data: any }) {
  if (!data) return null
  return (
    <GeoJSON
      data={data}
      style={() => ({
        color: "#1e3a5f",
        weight: 2.5,
        fillColor: "#eef2f6",
        fillOpacity: 0.35,
      })}
    />
  )
}

function RegionsOverlay({
  data,
  activity,
  onRegionClick,
}: {
  data: any
  activity?: Record<string, number>
  onRegionClick?: (val: string) => void
}) {
  const map = useMap()
  useEffect(() => {
    if (!data) return
    if (data.type === "Topology") return

    const max = activity ? Math.max(1, ...Object.values(activity)) : 1

    const activityColor = (intensity: number) => {
      const stops = ["#dbeafe", "#93c5fd", "#3b82f6", "#1e3a5f"]
      const idx = Math.min(stops.length - 1, Math.max(0, Math.round(intensity * (stops.length - 1))))
      return stops[idx]
    }

    const geo = L.geoJSON(data, {
      style: (feature: any) => {
        const name =
          feature.properties?.name ||
          feature.properties?.NAME_1 ||
          feature.properties?.NAME ||
          ""
        const count = activity?.[name] || 0
        const intensity = count / max
        return {
          color: "#1e3a5f",
          weight: 1.5,
          fillColor: activityColor(intensity),
          fillOpacity: 0.5,
        }
      },
      onEachFeature: (feature: any, layer: any) => {
        const name =
          feature.properties?.name ||
          feature.properties?.NAME_1 ||
          feature.properties?.NAME
        const count = activity?.[name] || 0
        if (name) {
          layer.bindPopup(
            `<div style="font-weight:700;color:#0a1628">${name}</div>` +
              `<div style="font-size:12px;color:#5a7a9a">Parcelles actives: ${count}</div>`
          )
        }
        layer.on("click", () => {
          if (onRegionClick) onRegionClick(name || "")
        })
      },
    }).addTo(map)

    const labels: L.Marker[] = []
    geo.eachLayer((l: any) => {
      try {
        const bounds = l.getBounds && l.getBounds()
        const center = bounds ? bounds.getCenter() : l.getLatLng && l.getLatLng()
        const label =
          l.feature?.properties?.name ||
          l.feature?.properties?.NAME_1 ||
          l.feature?.properties?.NAME
        const count = label ? activity?.[label] || 0 : 0
        if (center && label) {
          const marker = L.marker(center, {
            icon: L.divIcon({
              className: "region-label",
              html: `<div style="background: rgba(255,255,255,0.92); padding:4px 8px; border-radius:6px; font-size:12px; color:#0a1628; font-weight:700; border:1px solid rgba(0,0,0,0.08); box-shadow:0 1px 3px rgba(0,0,0,0.15)">${label} (${count})</div>`,
            }),
            interactive: false,
          }).addTo(map)
          labels.push(marker)
        }
      } catch {
        /* ignore */
      }
    })

    return () => {
      geo.remove()
      labels.forEach((m) => m.remove())
    }
  }, [data, map, activity])

  return null
}

function ResetViewControl() {
  const map = useMap()
  return (
    <button
      type="button"
      title="Afficher Madagascar"
      onClick={() => map.fitBounds(MADAGASCAR_BOUNDS, { padding: [24, 24] })}
      style={{
        position: "absolute",
        bottom: 90,
        left: 10,
        zIndex: 2000,
        width: 34,
        height: 34,
        borderRadius: 8,
        border: "1px solid rgba(0,0,0,0.1)",
        background: "#fff",
        color: "#1e3a5f",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }}
    >
      <Maximize size={18} />
    </button>
  )
}

export default function MapContent({
  parcels,
  isLoading,
  regions,
  isLoadingRegions,
  regionFilter,
  onRegionFilterChange,
}: {
  parcels: Parcel[]
  isLoading: boolean
  regions: Region[]
  isLoadingRegions: boolean
  regionFilter: string
  onRegionFilterChange: (value: string) => void
}) {
  const { t } = useLanguage()
  const [search, setSearch] = useState("")
  const [mdgGeo, setMdgGeo] = useState<any | null>(null)
  const [mdgRegionsGeo, setMdgRegionsGeo] = useState<any | null>(null)
  const [tileError, setTileError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(MDG_COUNTRY_URL)
      .then((r) => r.json())
      .then((json) => !cancelled && setMdgGeo(json))
      .catch(() => !cancelled && setMdgGeo(null))

    fetch(MDG_REGIONS_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json && json.type !== "Topology") setMdgRegionsGeo(json)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  const getStatusLabel = (status: string) => {
    if (status === "active") return t("active")
    if (status === "inactive") return t("inactive")
    if (status === "fallow") return t("fallow")
    if (status === "new") return t("new")
    return status
  }

  const validParcels = useMemo(
    () =>
      parcels.filter(
        (p) =>
          p.latitude &&
          p.longitude &&
          !isNaN(parseFloat(String(p.latitude))) &&
          !isNaN(parseFloat(String(p.longitude)))
      ),
    [parcels]
  )

  const matchedParcels = useMemo(() => {
    if (!search.trim()) return validParcels
    const q = search.toLowerCase()
    return validParcels.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.producer_name?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q)
    )
  }, [validParcels, search])

  const totalArea = useMemo(
    () => matchedParcels.reduce((acc, p) => acc + (Number(p.area) || 0), 0),
    [matchedParcels]
  )
  const totalPlants = useMemo(
    () => matchedParcels.reduce((acc, p) => acc + (p.vanilla_plants || 0), 0),
    [matchedParcels]
  )
  const regionActivity = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const p of matchedParcels) {
      const key = p.region || "Inconnue"
      acc[key] = (acc[key] || 0) + 1
    }
    return acc
  }, [matchedParcels])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-[#c5ddf5] bg-card/95 p-4 shadow-sm dark:border-border dark:bg-card/95">
          <div className="text-xs text-[#5a7a9a] mb-2">{t("filterByRegion")}</div>
          <Select value={regionFilter} onValueChange={onRegionFilterChange}>
            <SelectTrigger className="w-full border-[#c5ddf5] bg-white">
              <SelectValue placeholder={t("allRegions")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allRegions")}</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id.toString()}>
                  {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-[#5a7a9a] mt-3">
            {isLoadingRegions ? t("loading") : `${regions.length} ${t("region")}`}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#c5ddf5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">{t("parcels")}</p>
              <p className="text-xl font-bold text-[#0a1628]">
                {isLoading ? "..." : matchedParcels.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#c5ddf5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <Navigation className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">{t("geolocated")}</p>
              <p className="text-xl font-bold text-[#0a1628]">
                {isLoading ? "..." : validParcels.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#c5ddf5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <Maximize2 className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">{t("totalArea")}</p>
              <p className="text-xl font-bold text-[#0a1628]">
                {isLoading ? "..." : `${totalArea.toFixed(2)} ha`}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#c5ddf5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8f4fc] flex items-center justify-center">
              <TreeDeciduous className="w-5 h-5 text-[#1e3a5f]" />
            </div>
            <div>
              <p className="text-xs text-[#5a7a9a]">{t("vanillaTrees")}</p>
              <p className="text-xl font-bold text-[#0a1628]">
                {isLoading ? "..." : totalPlants.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
        <Input
          placeholder={t("searchParcel")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 border-[#c5ddf5] focus:border-[#87ceeb] bg-white"
        />
      </div>

      <div className="relative overflow-hidden rounded-xl border border-[#c5ddf5] bg-card/95 shadow-sm dark:border-border dark:bg-card/95">
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-[#1e3a5f] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#5a7a9a]">Chargement de la carte...</p>
            </div>
          </div>
        ) : (
          <>
            <MapContainer
              center={MADAGASCAR_CENTER}
              zoom={6}
              minZoom={5}
              maxZoom={18}
              zoomSnap={0.5}
              wheelPxPerZoomLevel={120}
              zoomAnimation
              preferCanvas
              style={{ height: "600px", width: "100%", backgroundColor: "#eef2f6" }}
              className="z-0"
            >
              <TileLayer
                key={tileError ? "osm" : "carto"}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                url={tileError ? MAP_TILE_URL_FALLBACK : MAP_TILE_URL}
                subdomains={["a", "b", "c", "d"]}
                eventHandlers={{
                  tileerror: () => setTileError(true),
                }}
              />

              {mdgGeo && <CountryBoundary data={mdgGeo} />}
              {mdgRegionsGeo && (
                <RegionsOverlay
                  data={mdgRegionsGeo}
                  activity={regionActivity}
                  onRegionClick={(val) => onRegionFilterChange(val || "all")}
                />
              )}

              <MapController
                parcels={matchedParcels}
                countryGeo={mdgGeo}
                regionGeo={mdgRegionsGeo}
                regionActivity={regionActivity}
                onRegionClick={(val) => onRegionFilterChange(val || "all")}
              />

              {matchedParcels.map((parcel) => {
                const position = [
                  parseFloat(String(parcel.latitude)),
                  parseFloat(String(parcel.longitude)),
                ] as [number, number]
                return (
                  <Marker
                    key={`m-${parcel.id}`}
                    position={position}
                    icon={createPointIcon(parcel.code, statusMarkerColor(parcel.status))}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <div className="font-semibold text-[#0a1628] text-sm">
                          {parcel.name || parcel.code}
                        </div>
                        <div className="text-xs text-[#5a7a9a] mb-1">{parcel.code}</div>
                        {parcel.producer_name && (
                          <div className="text-sm text-[#0a1628]">
                            <span className="font-medium">Producteur :</span> {parcel.producer_name}
                            {parcel.producer_code ? ` (${parcel.producer_code})` : ""}
                          </div>
                        )}
                        {parcel.region && (
                          <div className="text-xs text-[#5a7a9a] mt-0.5">
                            <span className="font-medium">Région :</span> {parcel.region}
                          </div>
                        )}
                        {parcel.commune && (
                          <div className="text-xs text-[#5a7a9a]">
                            <span className="font-medium">Site :</span> {parcel.commune}
                          </div>
                        )}
                        {parcel.latitude != null && parcel.longitude != null && (
                          <div className="text-xs text-[#5a7a9a]">
                            <span className="font-medium">GPS :</span> {Number(parcel.latitude).toFixed(5)}, {Number(parcel.longitude).toFixed(5)}
                          </div>
                        )}
                        <div className="text-sm mt-1 flex items-center gap-2">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              parcelStatusClasses[parcel.status] ||
                              "bg-gray-100 text-slate-700"
                            }`}
                          >
                            {getStatusLabel(parcel.status)}
                          </span>
                          {parcel.is_certified && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                              Certifié
                            </span>
                          )}
                        </div>
                        {parcel.area != null && (
                          <div className="text-xs text-[#5a7a9a] mt-1">
                            <span className="font-medium">Surface exploitée :</span> {Number(parcel.area).toFixed(2)} ha
                          </div>
                        )}
                        {parcel.vanilla_plants != null && (
                          <div className="text-xs text-[#5a7a9a]">
                            <span className="font-medium">Pieds de vanille :</span> {parcel.vanilla_plants}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              })}

              {matchedParcels.map((parcel) => {
                const polygon = parseGeoJSON(parcel.polygon_coordinates)
                if (!polygon) return null
                return (
                  <Polygon
                    key={`p-${parcel.id}`}
                    positions={polygon}
                    pathOptions={{
                      color: polygonColor(parcel.status),
                      fillColor: polygonColor(parcel.status),
                      weight: 4,
                      fillOpacity: 0.45,
                    }}
                  />
                )
              })}

              <ResetViewControl />
            </MapContainer>

            {/* Legend and filter control */}
            <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2000 }}>
              <div className="rounded-lg border border-border/70 bg-card/95 p-3 text-sm shadow-md dark:border-border dark:bg-card/95 max-w-[220px]">
                <div className="font-semibold text-[#0a1628] mb-2 dark:text-foreground">Légende</div>
                <div className="text-xs font-medium text-[#0a1628] dark:text-foreground mb-1">Statut des parcelles</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#16a34a", border: "2px solid #fff" }} />
                    <div className="text-xs text-[#5a7a9a] dark:text-muted-foreground">Actif</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#2563eb", border: "2px solid #fff" }} />
                    <div className="text-xs text-[#5a7a9a] dark:text-muted-foreground">Nouveau</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#f59e0b", border: "2px solid #fff" }} />
                    <div className="text-xs text-[#5a7a9a] dark:text-muted-foreground">En jachère</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-[#0a1628] dark:text-foreground mt-3 mb-1">Activité par région</div>
                <div className="space-y-1">
                  {["#dbeafe", "#93c5fd", "#3b82f6", "#1e3a5f"].map((c, i) => (
                    <div key={c} className="flex items-center gap-2">
                      <div style={{ width: 18, height: 12, background: c, border: "1px solid #1e3a5f" }} />
                      <div className="text-xs text-[#5a7a9a] dark:text-muted-foreground">
                        {i === 0 ? "Faible" : i === 3 ? "Élevée" : `Niveau ${i}`}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-border/60">
                  <div className="text-xs text-[#5a7a9a] dark:text-muted-foreground">
                    Filtre actif: {regionFilter === "all" ? "Aucun" : regionFilter}
                  </div>
                  {regionFilter !== "all" && (
                    <button
                      onClick={() => onRegionFilterChange("all")}
                      className="mt-1 inline-block text-xs text-blue-600 underline"
                    >
                      Effacer le filtre
                    </button>
                  )}
                </div>
              </div>
            </div>

            {matchedParcels.length === 0 && parcels.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 pointer-events-none">
                <div className="text-center">
                  <MapPin className="w-10 h-10 text-[#5a7a9a] mx-auto mb-2" />
                  <p className="text-[#5a7a9a] font-medium">{t("noSearchResults")}</p>
                </div>
              </div>
            )}

            {parcels.length === 0 && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 pointer-events-none">
                <div className="text-center">
                  <MapPin className="w-10 h-10 text-[#5a7a9a] mx-auto mb-2" />
                  <p className="text-[#5a7a9a] font-medium">{t("noGeoParcels")}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
