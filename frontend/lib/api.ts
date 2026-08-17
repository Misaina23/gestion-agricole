"use client"

import { API_BASE_URL, buildApiUrl, getAuthHeaders, parseApiError } from './api-config'

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  const tokens = localStorage.getItem('auth_tokens')
  if (tokens) {
    const parsed = JSON.parse(tokens)
    return parsed.access
  }
  return null
}

const API_URL = API_BASE_URL

// Type definitions
export interface Producer {
  id: number
  code: string
  name: string
  region: string
  region_name?: string
  district?: string
  district_name?: string
  commune: string
  commune_name?: string
  fokontany?: string
  phone: string | null
  email?: string | null
  cin?: string | null
  status: 'active' | 'pending' | 'inactive'
  is_certified: boolean
  certification_date?: string | null
  certification_number?: string | null
  certification_expiry?: string | null
  cooperative?: number | null
  cooperative_name?: string | null
  parcels_count?: number
  total_surface?: number
  registered_by?: number
  created_at: string
  updated_at: string
  last_sync?: string | null
}

export interface Parcel {
  id: number
  code: string
  producer: number
  producer_name?: string
  producer_code?: string
  region: string
  region_name?: string
  commune: string
  commune_name?: string
  fokontany?: string
  area: number
  vanilla_plants: number
  tutor_trees: number
  latitude: string
  longitude: string
  altitude?: number | null
  status: 'active' | 'inactive' | 'fallow' | 'new'
  status_display?: string
  verification_date?: string | null
  verified_by?: number | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Production {
  id: number
  code: string
  parcel: number
  parcel_code?: string
  producer_name?: string
  producer_code?: string
  actual_date: string
  region_name?: string
  commune_name?: string
  harvest_date?: string
  weight_green: number
  weight_prepared: number
  quality?: string
  season: string
  status: 'harvested' | 'drying' | 'curing' | 'ready' | 'sold'
  collected_by?: number | null
  collection_date?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Inspection {
  id: number
  code: string
  producer: number
  producer_name?: string
  producer_code?: string
  parcel: number
  parcel_code?: string
  inspector: number
  inspector_name?: string
  actual_date: string
  inspection_type: 'initial' | 'followup' | 'certification'
  result: 'passed' | 'failed' | 'pending' | 'conditional'
  score: number
  observations: string
  next_inspection?: string | null
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  producers?: {
    total: number
    active: number
    pending: number
    inactive: number
    new_this_month: number
  }
  parcels?: {
    total: number
    verified: number
    pending: number
    rejected: number
    total_surface: number
    total_vanilla_trees: number
  }
  productions?: {
    total: number
    total_green_weight: number
    total_prepared_weight: number
    total_revenue: number
    by_quality: {
      premium: number
      standard: number
      second: number
      other: number
    }
    by_status: {
      collected: number
      processing: number
      shipped: number
      unknown?: number
    }
  }
  inspections?: {
    total: number
    passed: number
    failed: number
    pending: number
    conditional: number
    average_score: number
  }
  deliveries?: {
    total: number
    pending: number
    in_transit: number
    delivered: number
    total_quantity: number
    total_revenue: number
  }
  campaigns?: {
    total: number
    active: number
    pending: number
    completed: number
    cancelled: number
    producers_enrolled: number
  }
  inputs?: {
    total: number
    total_quantity: number
    total_value: number
  }
  monthly_harvest?: Array<{
    month: string
    green_weight: number
    prepared_weight: number
  }>
  recent_producers?: Array<{
    id: number
    code: string
    name: string
    status: string
    parcels_count: number
    region__name: string
    created_at: string
  }>
  regions?: Array<{
    name: string
    producers: number
    parcels: number
    surface: number
  }>
  agents?: {
    total: number
    active: number
  }
  current_season?: {
    id: number
    name: string
    year?: number
    is_current?: boolean
    target_weight?: number
  }
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API fetch wrapper with auth
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken()
  
  const headers = getAuthHeaders(token, options.headers)

  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    headers,
  })

  if (!response.ok) {
    const message = await parseApiError(response)
    console.error('[api error]', endpoint, response.status, message)
    throw new Error(message || `HTTP error ${response.status}`)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// Producers API
export const producersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<Producer>>(`/producers/${query}`)
  },
  
  get: (id: number) => apiFetch<Producer>(`/producers/${id}/`),
  
  create: (data: Partial<Producer>) => 
    apiFetch<Producer>('/producers/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<Producer>) =>
    apiFetch<Producer>(`/producers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    apiFetch<void>(`/producers/${id}/`, { method: 'DELETE' }),
  
  stats: () => apiFetch<DashboardStats['producers']>('/producers/stats/'),
  
  parcels: (id: number) => apiFetch<Parcel[]>(`/producers/${id}/parcels/`),
  
  productions: (id: number) => apiFetch<Production[]>(`/producers/${id}/productions/`),
  
  inspections: (id: number) => apiFetch<Inspection[]>(`/producers/${id}/inspections/`),

  activate: (id: number) =>
    apiFetch<Producer>(`/producers/${id}/activate/`, {
      method: 'POST',
    }),

  exportExcel: async (_params?: Record<string, string>) => {
    console.warn('Export Excel non disponible dans cette version.')
  },

  exportPdf: async (_params?: Record<string, string>) => {
    console.warn('Export PDF non disponible dans cette version.')
  },
}

// Users API
export const usersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<any>>(`/accounts/users/${query}`)
  },

  get: (id: number) => apiFetch<any>(`/accounts/users/${id}/`),

  create: (data: Record<string, any>) =>
    apiFetch<any>('/accounts/users/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Record<string, any>) =>
    apiFetch<any>(`/accounts/users/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiFetch<void>(`/accounts/users/${id}/`, { method: 'DELETE' }),
}

// Parcels API
export const parcelsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<Parcel>>(`/parcels/${query}`)
  },
  
  get: (id: number) => apiFetch<Parcel>(`/parcels/${id}/`),
  
  create: (data: Partial<Parcel>) =>
    apiFetch<Parcel>('/parcels/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<Parcel>) =>
    apiFetch<Parcel>(`/parcels/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    apiFetch<void>(`/parcels/${id}/`, { method: 'DELETE' }),
  
  stats: () => apiFetch<DashboardStats['parcels']>('/parcels/stats/'),
  
  verify: (id: number) =>
    apiFetch<Parcel>(`/parcels/${id}/verify/`, { method: 'POST' }),
  
  mapData: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<Array<{
      id: number
      code: string
      latitude: string
      longitude: string
      producer_name?: string
      producer_code?: string
      status: string
      surface: number
      vanilla_plants: number
    }>>(`/parcels/map_data/${query}`)
  },
  
  exportExcel: async (_params?: Record<string, string>) => {
    console.warn('Export Excel non disponible dans cette version.')
  },
  
  exportPdf: async (_params?: Record<string, string>) => {
    console.warn('Export PDF non disponible dans cette version.')
  },
}

// Helper for client-side exports
import { exportToCsv } from './exports'

// Helper for file downloads from server
async function downloadFile(endpoint: string, filename: string): Promise<void> {
  const token = getAuthToken()
  const response = await fetch(buildApiUrl(endpoint), {
    headers: { Authorization: token ? `Bearer ${token}` : '' },
  })
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`)
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

// Productions API
export const productionsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<Production>>(`/productions/${query}`)
  },
  
  get: (id: number) => apiFetch<Production>(`/productions/${id}/`),
  
  create: (data: Partial<Production>) =>
    apiFetch<Production>('/productions/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<Production>) =>
    apiFetch<Production>(`/productions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    apiFetch<void>(`/productions/${id}/`, { method: 'DELETE' }),
  
  stats: () => apiFetch<DashboardStats['productions']>('/productions/stats/'),
  
  exportExcel: async (_params?: Record<string, string>) => {
    console.warn('Export Excel non disponible dans cette version.')
  },
  
  exportPdf: async (_params?: Record<string, string>) => {
    console.warn('Export PDF non disponible dans cette version.')
  },
}

// Inspections API
export const inspectionsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<Inspection>>(`/inspections/${query}`)
  },
  
  get: (id: number) => apiFetch<Inspection>(`/inspections/${id}/`),
  
  create: (data: Partial<Inspection>) =>
    apiFetch<Inspection>('/inspections/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<Inspection>) =>
    apiFetch<Inspection>(`/inspections/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number) =>
    apiFetch<void>(`/inspections/${id}/`, { method: 'DELETE' }),
  
  stats: () => apiFetch<DashboardStats['inspections']>('/inspections/stats/'),
  
  exportExcel: async (_params?: Record<string, string>) => {
    console.warn('Export Excel non disponible dans cette version.')
  },
  
  exportPdf: async (_params?: Record<string, string>) => {
    console.warn('Export PDF non disponible dans cette version.')
  },
}

// Dashboard API
export const dashboardApi = {
  stats: () => apiFetch<DashboardStats>('/dashboard/'),
  
  recentActivity: () => apiFetch<Array<{
    id: number
    type: string
    message: string
    timestamp: string
    user: string
  }>>('/dashboard/activity/'),
  
  syncStatus: () => apiFetch<{
    last_sync: string
    is_online: boolean
    pending_sync: number
  }>('/dashboard/sync-status/'),
}

// Core API (regions, communes, districts, etc.)
export const coreApi = {
  regions: () => apiFetch<Array<{ id: number; name: string; code: string }>>('/regions/'),

  districts: (regionId?: number) => {
    const query = regionId ? `?region=${regionId}` : ''
    return apiFetch<Array<{ id: number; name: string; code: string; region: number }>>(`/districts/${query}`)
  },

  communes: (regionId?: number) => {
    const query = regionId ? `?region=${regionId}` : ''
    return apiFetch<Array<{ id: number; name: string; code: string; region: number }>>(`/communes/${query}`)
  },

  fokontany: (communeId?: number) => {
    const query = communeId ? `?commune=${communeId}` : ''
    return apiFetch<Array<{ id: number; name: string; commune: number }>>(`/fokontanys/${query}`)
  },
}

// AI Agri Assistant API
export interface AgriAdvice {
  id: number
  title: string
  content: string
  category: 'planting' | 'pest' | 'harvest' | 'fertilizer' | 'general'
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

export interface AgriRecommendation {
  id: number
  type: 'yield_improvement' | 'seasonal_tip' | 'maintenance'
  message: string
  parcel?: number
  parcel_code?: string
  expected_impact?: string
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

export interface AnomalyPoint {
  id: number
  name: string
  sector?: string | null
  agent?: string | null
  type: 'producer' | 'parcel' | 'production'
  severity: 'high' | 'medium' | 'low'
  description: string
  detected_at: string
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
  points?: AnomalyPoint[]
  summary?: {
    low_yields: number
    inactive_producers: number
    inconsistent_records: number
    low_yields_top: Array<{ name: string; value: number; unit: string }>
  }
}

export const aiApi = {
  getAdvice: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<AgriAdvice>(`/ai/advice/${query}`)
  },
  
  getRecommendations: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<AgriRecommendation>>(`/ai/recommendations/${query}`)
  },
  
  generateMonthlyReport: (month?: string, year?: number) => {
    const body: Record<string, any> = { report_type: 'global' }
    if (month) body.period_start = month
    if (year) body.period_start = `${year}-${month || '01'}-01`
    return apiFetch<MonthlyReport>('/ai/reports/generate/', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  
  getAnomalies: () => apiFetch<AnomaliesResponse>('/ai/anomalies/'),
  
  summarizeData: () => {
    return apiFetch<{ summary: string; key_metrics: Record<string, number> }>(`/ai/`)
  },
  ask: (message: string) =>
    apiFetch<{ response: string; suggestions?: string[]; session_id?: number }>(`/ai/advice/ask/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
  llm: (prompt: string, opts?: Record<string, any>) => {
    const body = { prompt, ...(opts || {}) }
    return apiFetch<{ response: string; raw?: any }>(`/ai/llm/`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}

export const searchApi = {
  global: (query: string) => {
    return apiFetch<{ results: Record<string, any[]> }>(`/search/?q=${encodeURIComponent(query)}`)
  },
}

// SIG/GIS API
export interface ProducerLocation {
  id: number
  code: string
  name: string
  latitude: number
  longitude: number
  region: string
}

export interface ParcelPolygon {
  id: number
  code: string
  producer: number
  producer_name: string
  coordinates: Array<{ lat: number; lng: number }>
  area: number
  status: string
}

export interface ProductionZone {
  id: number
  name: string
  region: string
  center_lat: number
  center_lng: number
  total_surface: number
  total_plants: number
  parcels_count: number
}

export interface Delivery {
  id: number
  product: string
  quantity: number
  quantity_unit: string
  unit_price: number
  total_price?: number
  quality_bonus?: number
  buyer: string
  collection_center?: string
  delivery_date: string
  producer?: number
  producer_name?: string
  producer_code?: string
  campaign?: number
  campaign_name?: string
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled'
  received_by?: number
  received_by_name?: string
  notes?: string
  created_at: string
  updated_at: string
}

export const deliveriesApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<Delivery>>(`/deliveries/deliveries/${query}`)
  },
  get: (id: number) => apiFetch<Delivery>(`/deliveries/deliveries/${id}/`),
  create: (data: Partial<Delivery>) =>
    apiFetch<Delivery>('/deliveries/deliveries/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Delivery>) =>
    apiFetch<Delivery>(`/deliveries/deliveries/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiFetch<void>(`/deliveries/deliveries/${id}/`, { method: 'DELETE' }),
  stats: () => apiFetch<Record<string, number>>('/deliveries/stats/'),
}

export interface Campaign {
  id: number
  name: string
  description?: string
  start_date: string
  end_date: string
  culture: number
  culture_name?: string
  region: number
  region_name?: string
  objectives?: Record<string, number>
  budget?: number
  status: 'active' | 'completed' | 'pending' | 'cancelled'
  managed_by?: number
  managed_by_name?: string
  producers_count?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export const campaignsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<Campaign>>(`/campaigns/campaigns/${query}`)
  },
  get: (id: number) => apiFetch<Campaign>(`/campaigns/campaigns/${id}/`),
  create: (data: Partial<Campaign>) =>
    apiFetch<Campaign>('/campaigns/campaigns/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Campaign>) =>
    apiFetch<Campaign>(`/campaigns/campaigns/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiFetch<void>(`/campaigns/campaigns/${id}/`, { method: 'DELETE' }),
}

export interface CampaignProducer {
  id: number
  campaign: number
  producer: number
  producer_name?: string
  producer_code?: string
  enrollment_date: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export const campaignProducersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<CampaignProducer>>(`/campaigns/campaign-producers/${query}`)
  },
  get: (id: number) => apiFetch<CampaignProducer>(`/campaigns/campaign-producers/${id}/`),
  create: (data: Partial<CampaignProducer>) =>
    apiFetch<CampaignProducer>('/campaigns/campaign-producers/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<CampaignProducer>) =>
    apiFetch<CampaignProducer>(`/campaigns/campaign-producers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiFetch<void>(`/campaigns/campaign-producers/${id}/`, { method: 'DELETE' }),
}

export interface Culture {
  id: number
  name: string
  variety?: string
  culture_type: 'cash' | 'food' | 'vegetable' | 'fruit' | 'other'
  growth_duration_days?: number
  average_yield?: number
  yield_unit?: string
  ideal_season?: string
  market_price?: number
  price_unit?: string
  description?: string
  is_active: boolean
  campaigns_count?: number
}

export const culturesApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<Culture>>(`/cultures/cultures/${query}`)
  },
  get: (id: number) => apiFetch<Culture>(`/cultures/cultures/${id}/`),
}

export interface InputType {
  id: number
  name: string
  type: 'fertilizer' | 'seed' | 'pesticide' | 'tool' | 'plant' | 'other'
  unit: string
  description?: string
  is_active: boolean
}

export interface InputDistribution {
  id: number
  input_type: number
  input_type_name?: string
  producer?: number
  producer_name?: string
  quantity: number
  unit: string
  unit_value?: number
  total_value?: number
  distribution_date: string
  distributed_by?: number
  distributed_by_name?: string
  campaign?: number
  campaign_name?: string
  notes?: string
}

export const inputsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<InputDistribution>>(`/inputs/${query}`)
  },
  get: (id: number) => apiFetch<InputDistribution>(`/inputs/${id}/`),
  create: (data: Partial<InputDistribution>) =>
    apiFetch<InputDistribution>('/inputs/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<InputDistribution>) =>
    apiFetch<InputDistribution>(`/inputs/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiFetch<void>(`/inputs/${id}/`, { method: 'DELETE' }),
  types: () => apiFetch<PaginatedResponse<InputType>>('/inputs/input-types/'),
  stats: () => apiFetch<Record<string, number>>('/inputs/stats/'),
}

export interface Training {
  id: number
  title: string
  subject: string
  description?: string
  training_date: string
  location?: string
  trainer?: number
  trainer_name?: string
  max_participants?: number
  evaluation_criteria?: Record<string, any>
  notes?: string
  created_at: string
  updated_at: string
}

export const trainingsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<Training>>(`/trainings/trainings/${query}`)
  },
  get: (id: number) => apiFetch<Training>(`/trainings/trainings/${id}/`),
  create: (data: Partial<Training>) =>
    apiFetch<Training>('/trainings/trainings/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Training>) =>
    apiFetch<Training>(`/trainings/trainings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    apiFetch<void>(`/trainings/trainings/${id}/`, { method: 'DELETE' }),
  stats: () => apiFetch<Record<string, number>>('/trainings/stats/'),
}

export interface Project {
  id: number
  name: string
  description?: string
  donor?: string
  budget?: number
  start_date: string
  end_date: string
  intervention_zone?: Record<string, any>
  objectives?: Record<string, any>
  status: 'draft' | 'active' | 'completed' | 'suspended' | 'cancelled'
  managed_by?: number
  managed_by_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const projectsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<Project>>(`/projects/projects/${query}`)
  },
  get: (id: number) => apiFetch<Project>(`/projects/projects/${id}/`),
}

export interface WorkflowInstance {
  id: number
  workflow_step: number
  step_name?: string
  entity_type: string
  entity_id: number
  status: string
  current_step: number
  initiated_by?: number
  initiated_by_name?: string
  assigned_to?: number
  assigned_to_name?: string
  comment?: string
  action?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export const workflowsApi = {
  instances: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ results: WorkflowInstance[] }>(`/workflows/workflow-instances/${query}`).then(res => res.results || [])
  },
  steps: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<{ results: any[] }>(`/workflows/workflow-steps/${query}`).then(res => res.results || [])
  },
  stats: () => apiFetch<Record<string, number>>('/workflows/stats/'),
}

export const anomaliesApi = {
  detect: () => {
    return apiFetch<{
      total_issues: number
      anomalies: {
        invalid_phones: any[]
        invalid_gps: any[]
        duplicate_codes: any[]
        abnormal_areas: any[]
        odd_ages: any[]
      }
    }>('/anomalies/detect/')
  },
}

export interface ActivityLogEntry {
  id: number
  user: number | null
  user_name: string | null
  user_username: string | null
  action: string
  action_display: string
  module: string
  object_repr: string | null
  object_id: string | null
  old_value: Record<string, any> | null
  new_value: Record<string, any> | null
  ip_address: string | null
  timestamp: string
}

export const auditLogsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<ActivityLogEntry>>(`/audit-logs/${query}`)
  },

  resetHistory: (password: string) =>
    apiFetch<{ message: string; deleted: number }>('/audit-logs/reset_history/', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
}
