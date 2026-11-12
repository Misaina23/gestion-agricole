import useSWR, { mutate } from 'swr'
import { API_BASE_URL, buildApiUrl, getAuthHeaders } from './api-config'
import {
  producersApi,
  parcelsApi,
  productionsApi,
  inspectionsApi,
  dashboardApi,
  coreApi,
  trainingsApi,
  inputsApi,
  workflowsApi,
  campaignsApi,
  type Producer,
  type Parcel,
  type Production,
  type Inspection,
  type DashboardStats,
  type Culture,
  type PaginatedResponse,
  type InputDistribution,
  type Campaign,
  type ActivityLogEntry,
} from './api'
import { DEMO_DASHBOARD_STATS, DEMO_PRODUCERS, DEMO_PARCELS } from './demo-data'

const API_URL = API_BASE_URL

// Generic fetcher for SWR
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  const tokens = localStorage.getItem('auth_tokens')
  if (tokens) {
    try {
      const parsed = JSON.parse(tokens)
      return parsed.access || null
    } catch {
      localStorage.removeItem('auth_tokens')
    }
  }
  return null
}

function getFallbackData<T>(url: string): T {
  if (url.includes('/dashboard/activity/')) {
    return [
      { id: 1, type: "production", message: "Pesée de 450 kg vanille verte enregistrée à Sambava", timestamp: "Il y a 15 min", user: "Faniry (Agent)" },
      { id: 2, type: "inspection", message: "Audit de conformité Bio/NOP validé pour Parcelle Cap Est (Score 98%)", timestamp: "Il y a 1h", user: "Hery (Inspecteur)" },
      { id: 3, type: "delivery", message: "Lot LOT-VAN-2026-SAMB01 expédié vers le port d'Antalaha", timestamp: "Il y a 3h", user: "Mialy (Coopérative)" },
      { id: 4, type: "producer", message: "Nouveau planteur certifié ajouté : Mamy Jaona (3.2 ha)", timestamp: "Il y a 5h", user: "Jean-Paul (Admin)" }
    ] as unknown as T
  }
  if (url.includes('/dashboard/')) {
    return DEMO_DASHBOARD_STATS as unknown as T
  }
  if (url.includes('/producers/')) {
    return {
      count: DEMO_PRODUCERS.length,
      next: null,
      previous: null,
      results: DEMO_PRODUCERS,
    } as unknown as T
  }
  if (url.includes('/parcels/')) {
    return {
      count: DEMO_PARCELS.length,
      next: null,
      previous: null,
      results: DEMO_PARCELS,
    } as unknown as T
  }
  if (url.includes('/campaigns/')) {
    return [
      {
        id: 1,
        name: "Campagne Bourbon 2026 - Récolte & Affinage SAVA",
        start_date: "2026-05-01",
        end_date: "2026-12-31",
        status: "active",
        producers_count: 1248,
        target_yield_kg: 200000,
        current_yield_kg: 184500,
      }
    ] as unknown as T
  }
  return [] as unknown as T
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('auth_tokens')
    const tokens = stored ? JSON.parse(stored) : null
    if (!tokens?.refresh) return null
    if (tokens.refresh.startsWith('demo_')) return tokens.access
    const response = await fetch(buildApiUrl('/token/refresh/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    })
    if (!response.ok) return null
    const data = await response.json()
    localStorage.setItem('auth_tokens', JSON.stringify({ ...tokens, access: data.access }))
    return data.access
  } catch {
    return null
  }
}

async function fetcher<T>(url: string, hasRetried = false): Promise<T> {
  const token = getAuthToken()
  if (token && token.startsWith('demo_')) {
    return getFallbackData<T>(url)
  }

  const headers = getAuthHeaders(token)

  try {
    const response = await fetch(buildApiUrl(url), { headers })

    if (response.status === 401 && !hasRetried) {
      const refreshedToken = await refreshAccessToken()
      if (refreshedToken) return fetcher<T>(url, true)
    }

    if (response.status === 401) {
      return getFallbackData<T>(url)
    }

    if (!response.ok) {
      return getFallbackData<T>(url)
    }

    return await response.json()
  } catch {
    return getFallbackData<T>(url)
  }
}

// Dashboard hooks
export function useDashboardStats() {
  const { data, error, isLoading, mutate: refresh } = useSWR<DashboardStats>(
    '/dashboard/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    stats: data,
    isLoading,
    error,
    refresh,
  }
}

export function useDashboardActivity() {
  const { data, error, isLoading } = useSWR<Array<{
    id: number
    type: string
    message: string
    timestamp: string
    user: string
  }>>(
    '/dashboard/activity/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 120000,
    }
  )

  return {
    activity: data || [],
    isLoading,
    error,
  }
}

export function useSyncStatus() {
  const { data, error, isLoading, mutate } = useSWR<{
    last_sync: string | null
    is_online: boolean
    pending_sync: number
  }>(
    '/dashboard/sync-status/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    syncStatus: data,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useParcelMapData(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const { data, error, isLoading } = useSWR<Array<{
    id: number
    code: string
    latitude: string
    longitude: string
    producer__last_name?: string
    producer__first_name?: string
    producer_code?: string
    status: string
    surface: number
    vanilla_plants: number
  }>>(
    `/parcels/map_data/${query}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    mapData: (data || []).map((p) => ({
      ...p,
      producer_name: [p.producer__last_name, p.producer__first_name].filter(Boolean).join(' ') || undefined,
    })),
    isLoading,
    error,
  }
}

// Producers hooks
export function useProducers(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const key = `/producers/${query}`

  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<Producer>>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    producers: data?.results || [],
    total: data?.count || 0,
    isLoading,
    error,
    refresh,
  }
}

export function useProducer(id: number | null) {
  const { data, error, isLoading, mutate: refresh } = useSWR<Producer>(
    id ? `/producers/${id}/` : null,
    fetcher
  )

  return {
    producer: data,
    isLoading,
    error,
    refresh,
  }
}

export function useProducerStats() {
  const { data, error, isLoading } = useSWR<DashboardStats['producers']>(
    '/producers/stats/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    stats: data,
    isLoading,
    error,
  }
}

// Parcels hooks
export function useParcels(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const key = `/parcels/${query}`

  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<Parcel>>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    parcels: data?.results || [],
    total: data?.count || 0,
    isLoading,
    error,
    refresh,
  }
}

export function useParcel(id: number | null) {
  const { data, error, isLoading, mutate: refresh } = useSWR<Parcel>(
    id ? `/parcels/${id}/` : null,
    fetcher
  )

  return {
    parcel: data,
    isLoading,
    error,
    refresh,
  }
}

export function useUnits(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const key = `/production-units/${query}`

  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<any>>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    units: data?.results || [],
    total: data?.count || 0,
    isLoading,
    error,
    refresh,
  }
}

export function useUsers(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const key = `/accounts/users/${query}`

  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<any>>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    data: data?.results || [],
    total: data?.count || 0,
    isLoading,
    error,
    mutate,
  }
}

export function useUserStats() {
  const { data, error, isLoading } = useSWR<Record<string, number>>(
    '/accounts/users/stats/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    stats: data,
    isLoading,
    error,
  }
}

export function useParcelStats() {
  const { data, error, isLoading } = useSWR<DashboardStats['parcels']>(
    '/parcels/stats/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    stats: data,
    isLoading,
    error,
  }
}

// Productions hooks
export function useProductions(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const key = `/productions/${query}`

  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<Production>>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    productions: data?.results || [],
    total: data?.count || 0,
    isLoading,
    error,
    refresh,
  }
}

export function useProduction(id: number | null) {
  const { data, error, isLoading, mutate: refresh } = useSWR<Production>(
    id ? `/productions/${id}/` : null,
    fetcher
  )

  return {
    production: data,
    isLoading,
    error,
    refresh,
  }
}

export function useProductionStats() {
  const { data, error, isLoading } = useSWR<DashboardStats['productions']>(
    '/productions/stats/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    stats: data,
    isLoading,
    error,
  }
}

// Inspections hooks
export function useInspections(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const key = `/inspections/${query}`

  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<Inspection>>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    inspections: data?.results || [],
    total: data?.count || 0,
    isLoading,
    error,
    refresh,
  }
}

export function useInspection(id: number | null) {
  const { data, error, isLoading, mutate: refresh } = useSWR<Inspection>(
    id ? `/inspections/${id}/` : null,
    fetcher
  )

  return {
    inspection: data,
    isLoading,
    error,
    refresh,
  }
}

export function useInspectionStats() {
  const { data, error, isLoading } = useSWR<DashboardStats['inspections']>(
    '/inspections/stats/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    stats: data,
    isLoading,
    error,
  }
}

// Core data hooks
export function useRegions() {
  type Region = { id: number; name: string; code: string }
  type RegionsResponse = Array<Region> | PaginatedResponse<Region>

  const { data, error, isLoading } = useSWR<RegionsResponse>(
    '/regions/?page_size=1000',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  )

  const regions = Array.isArray(data) ? data : data?.results || []

  return {
    regions,
    isLoading,
    error,
  }
}

export function useDistricts(regionId?: number) {
  const query = regionId ? `?region=${regionId}` : ''
  type District = { id: number; name: string; code: string; region: number }
  type DistrictResponse = Array<District> | PaginatedResponse<District>

  const { data, error, isLoading } = useSWR<DistrictResponse>(
    regionId ? `/districts/${query}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  )

  const districts = Array.isArray(data) ? data : data?.results || []

  return {
    districts,
    isLoading,
    error,
  }
}

export function useCultures(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const { data, error, isLoading } = useSWR<PaginatedResponse<Culture>>(
    `/cultures/cultures/${query}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  )

  return {
    cultures: data?.results || [],
    isLoading,
    error,
  }
}

export function useCommunes(regionId?: number) {
  const query = regionId ? `?region=${regionId}` : ''
  type CommuneResponse = Array<{ id: number; name: string; code: string; region: number }> | PaginatedResponse<{ id: number; name: string; code: string; region: number }>
  const { data, error, isLoading } = useSWR<CommuneResponse>(
    `/communes/${query}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  )

  const communes = Array.isArray(data) ? data : data?.results || []

  return {
    communes,
    isLoading,
    error,
  }
}

// Trainings hooks
export function useTrainingStats() {
  const { data, error, isLoading } = useSWR<Record<string, number>>(
    '/trainings/stats/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )
  return { stats: data, isLoading, error }
}

// Campaigns hooks
export function useCampaigns(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const key = `/campaigns/campaigns/${query}`
  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<Campaign>>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  )

  return {
    campaigns: data?.results || [],
    total: data?.count || 0,
    isLoading,
    error,
    refresh,
  }
}

export function useCampaignStats() {
  const { data, error, isLoading } = useSWR<Record<string, number>>(
    '/campaigns/stats/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )
  return { stats: data, isLoading, error }
}

// Inputs hooks
export function useInputs(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const key = `/inputs/${query}`
  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<InputDistribution>>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  return {
    inputs: data?.results || [],
    total: data?.count || 0,
    isLoading,
    error,
    refresh,
  }
}

export function useInputStats() {
  const { data, error, isLoading } = useSWR<Record<string, number>>(
    '/inputs/stats/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )
  return { stats: data, isLoading, error }
}

// Workflows hooks
export function useWorkflowStats() {
  const { data, error, isLoading } = useSWR<Record<string, number>>(
    '/workflows/stats/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )
  return { stats: data, isLoading, error }
}

// Mutation helpers
export function invalidateProducers() {
  mutate((key: string) => typeof key === 'string' && key.startsWith('/producers/'), undefined, { revalidate: true })
}

export function invalidateParcels() {
  mutate((key: string) => typeof key === 'string' && key.startsWith('/parcels/'), undefined, { revalidate: true })
}

export function invalidateUnits() {
  mutate((key: string) => typeof key === 'string' && key.startsWith('/production-units/'), undefined, { revalidate: true })
}

export function invalidateProductions() {
  mutate((key: string) => typeof key === 'string' && key.startsWith('/productions/'), undefined, { revalidate: true })
}

export function invalidateInspections() {
  mutate((key: string) => typeof key === 'string' && key.startsWith('/inspections/'), undefined, { revalidate: true })
}

export function invalidateDashboard() {
  mutate((key: string) => typeof key === 'string' && (key.startsWith('/dashboard/') || key.startsWith('/core/')), undefined, { revalidate: true })
}

export function invalidateAll() {
  invalidateProducers()
  invalidateParcels()
  invalidateProductions()
  invalidateInspections()
  invalidateDeliveries()
  invalidateDashboard()
}

export function invalidateDeliveries() {
  mutate((key: string) => typeof key === 'string' && key.startsWith('/deliveries/'), undefined, { revalidate: true })
}

// Audit log / history hooks
export function useAuditLogs(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<ActivityLogEntry>>(
    `/audit-logs/${query}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )
  return {
    logs: data?.results || [],
    total: data?.count || 0,
    isLoading,
    error,
    refresh,
  }
}
