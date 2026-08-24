import useSWR, { mutate } from 'swr'
import { API_BASE_URL, buildApiUrl, getAuthHeaders } from './api-config'
import {
  producersApi,
  parcelsApi,
  productionsApi,
  inspectionsApi,
  dashboardApi,
  coreApi,
  deliveriesApi,
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
  type Delivery,
  type InputDistribution,
  type Campaign,
  type ActivityLogEntry,
} from './api'

const API_URL = API_BASE_URL

// Generic fetcher for SWR
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  const tokens = localStorage.getItem('auth_tokens')
  if (tokens) {
    const parsed = JSON.parse(tokens)
    return parsed.access
  }
  return null
}

async function fetcher<T>(url: string): Promise<T> {
  const token = getAuthToken()
  const headers = getAuthHeaders(token)
  
  const response = await fetch(buildApiUrl(url), { headers })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Une erreur est survenue' }))
    throw new Error(error.detail || `HTTP error ${response.status}`)
  }
  
  return response.json()
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
    producer_name?: string
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
    mapData: data || [],
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

// Deliveries hooks
export function useDeliveries(params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params)}` : ''
  const key = `/deliveries/deliveries/${query}`
  const { data, error, isLoading, mutate: refresh } = useSWR<PaginatedResponse<Delivery>>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )
  
  return {
    deliveries: data?.results || [],
    total: data?.count || 0,
    isLoading,
    error,
    refresh,
  }
}

export function useDeliveryStats() {
  const { data, error, isLoading } = useSWR<DashboardStats['deliveries']>(
    '/deliveries/stats/',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )
  return { stats: data, isLoading, error }
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
