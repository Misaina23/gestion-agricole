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
  last_name: string
  first_name?: string | null
  unit_name?: string | null
  phone?: string | null
  region: number
  region_name?: string
  district?: number | null
  district_name?: string | null
  commune: number
  commune_name?: string
  site_name?: string
  fokontany?: number | null
  fokontany_name?: string | null
  joined_at?: string | null
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  status_display?: string
  risk_category?: 'low' | 'medium' | 'high' | null
  identified_risks?: string | null
  member_processing?: 'yes' | 'no' | null
  processing_activities?: string | null
  last_internal_inspection_at?: string | null
  internal_inspector_name?: string | null
  last_external_inspection_at?: string | null
  eu_status?: 'active' | 'suspended' | 'withdrawn' | 'abandoned' | null
  nop_status?: 'active' | 'suspended' | 'abandoned' | null
  exclusion_reason?: string | null
  exclusion_date?: string | null
  synced: boolean
  registered_by?: number | null
  registered_by_name?: string | null
  parcels_count?: number
  total_area?: number
  total_plants?: number
  biological_area?: number
  conversion_area?: number
  conventional_area?: number
  created_at: string
  updated_at: string
}

export interface Parcel {
  id: number
  code: string
  name?: string | null
  producer: number
  producer_name?: string
  producer_code?: string
  region_name?: string
  site_name?: string
  commune_name?: string
  registration_date?: string | null
  area: number
  main_crop?: string | null
  intercrop?: string | null
  vanilla_plants: number
  productive_plants?: number
  bio_location?: 'oui' | 'non' | 'yes' | 'no' | null
  latitude?: string | null
  longitude?: string | null
  conversion_start_date?: string | null
  conversion_status?: 'organic' | 'conversion' | 'conventional' | null
  conversion_level?: 'C1' | 'C2' | 'C3' | null
  last_used_date?: string | null
  eu_status?: string | null
  nop_status?: string | null
  estimated_yield?: number | null
  actual_harvest?: number | null
  actual_yield?: number | null
  delivered_quantity?: number | null
  variety?: number | null
  variety_name?: string | null
  soil_type?: string | null
  soil_type_display?: string | null
  shade_percentage?: number
  irrigation?: boolean
  planting_date?: string | null
  first_harvest_date?: string | null
  status?: 'active' | 'inactive' | 'fallow' | 'new'
  status_display?: string
  is_certified?: boolean
  certification_date?: string | null
  plant_density?: number
  productivity_rate?: number
  register_harvests?: Array<{
    id: number
    period: string
    crop_slot: string
    estimated_yield?: number | null
    actual_harvest?: number | null
    actual_yield?: number | null
    delivered_quantity?: number | null
  }>
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface Production {
  id: number
  code: string
  parcel: number
  parcel_code?: string
  parcel_name?: string | null
  producer_name?: string
  producer_code?: string
  region_name?: string
  commune_name?: string
  season: string
  season_name?: string
  harvest_date: string
  harvest_time?: string | null
  actual_date?: string
  weight_green: number
  weight_prepared?: number | null
  conversion_rate?: number | null
  pods_count?: number
  pods_grade_a?: number
  pods_grade_b?: number
  pods_grade_c?: number
  pods_rejected?: number
  avg_pod_weight?: number | null
  quality_grade?: number | null
  quality_grade_name?: string | null
  vanillin_content?: number | null
  moisture_content?: number | null
  status: 'harvested' | 'drying' | 'curing' | 'ready' | 'sold'
  status_display?: string
  drying_start_date?: string | null
  drying_end_date?: string | null
  curing_start_date?: string | null
  curing_end_date?: string | null
  sale_date?: string | null
  sale_price?: number | null
  buyer?: string | null
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
  parcel_name?: string | null
  inspector: number
  inspector_name?: string | null
  region_name?: string
  commune_name?: string
  inspection_type: string
  type_display?: string
  planned_date: string
  actual_date?: string | null
  status: string
  status_display?: string
  result: string
  result_display?: string
  score_overall?: number | null
  score_cultivation?: number | null
  score_processing?: number | null
  score_storage?: number | null
  score_traceability?: number | null
  score_environment?: number | null
  observations?: string | null
  recommendations?: string | null
  non_conformities?: string | null
  corrective_actions?: string | null
  follow_up_required?: boolean
  follow_up_date?: string | null
  follow_up_notes?: string | null
  is_overdue?: boolean
  checklist_items?: Array<{
    id: number
    category: string
    item: string
    is_compliant: boolean
    score?: number | null
    comment?: string | null
  }>
  photos?: Array<{
    id: number
    photo: string
    caption?: string | null
    category?: string | null
  }>
  notes?: string | null
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
    total_area: number
    total_plants: number
    total_productive: number
    avg_area: number
    avg_plants_per_parcel: number
    certified: number
    by_status: Record<string, number>
    by_conversion_status?: Record<string, { count: number; area: number }>
    by_conversion_level?: Record<string, { count: number; area: number }>
    register_harvest?: {
      estimated_yield_average: number
      actual_yield_average: number
      actual_harvest_total: number
      delivered_quantity_total: number
    }
    by_region: Array<{
      producer__region__name: string
      count: number
      total_area: number
      total_plants: number
    }>
    by_variety: Array<{
      variety__name: string
      count: number
    }>
    by_soil_type: Array<{
      soil_type: string
      count: number
    }>
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

  exportExcel: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    await downloadFile(`/producers/export/${query}`, `producteurs_export_${Date.now()}.xlsx`)
  },

  exportPdf: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    await downloadFile(`/producers/export/${query}`, `producteurs_export_${Date.now()}.pdf`)
  },
}

// Units API
export interface ProductionUnit {
  id: number
  name: string
  code: string
  unit_type: 'group' | 'site' | 'village' | 'region'
  region: number
  region_name?: string
  district?: number | null
  district_name?: string | null
  commune?: number | null
  commune_name?: string | null
  manager_name?: string | null
  manager_function?: string | null
  phone?: string | null
  email?: string | null
  members_count: number
  total_area: number
  creation_date?: string | null
  status: 'active' | 'inactive' | 'suspended'
  notes?: string | null
  producers_count?: number
  created_at: string
  updated_at: string
}

export const unitsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    return apiFetch<PaginatedResponse<ProductionUnit>>(`/production-units/${query}`)
  },

  get: (id: number) => apiFetch<ProductionUnit>(`/production-units/${id}/`),

  create: (data: Partial<ProductionUnit>) =>
    apiFetch<ProductionUnit>('/production-units/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<ProductionUnit>) =>
    apiFetch<ProductionUnit>(`/production-units/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiFetch<void>(`/production-units/${id}/`, { method: 'DELETE' }),
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

  exportExcel: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    await downloadFile(`/parcels/export/${query}`, `parcelles_export_${Date.now()}.xlsx`)
  },

  exportPdf: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    await downloadFile(`/parcels/export/${query}`, `parcelles_export_${Date.now()}.pdf`)
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

  exportExcel: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    await downloadFile(`/productions/export/${query}`, `productions_export_${Date.now()}.xlsx`)
  },

  exportPdf: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    await downloadFile(`/productions/export/${query}`, `productions_export_${Date.now()}.pdf`)
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

  exportExcel: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    await downloadFile(`/inspections/export/${query}`, `inspections_export_${Date.now()}.xlsx`)
  },

  exportPdf: async (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : ''
    await downloadFile(`/inspections/export/${query}`, `inspections_export_${Date.now()}.pdf`)
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

  qualityGrades: () => apiFetch<Array<{ id: number; name: string; code: string }>>('/quality-grades/'),

  seasons: () => apiFetch<Array<{ id: number; name: string; year: number; is_current: boolean }>>('/seasons/'),

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
    const now = new Date()
    const y = year || now.getFullYear()
    const parsedMonth = month ? parseInt(month, 10) : null
    const m = Number.isFinite(parsedMonth) && parsedMonth !== null ? parsedMonth : now.getMonth() + 1
    const period_start = `${y}-${String(m).padStart(2, '0')}-01`
    const lastDay = new Date(y, m + 1, 0).getDate()
    const period_end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const body: Record<string, any> = {
      report_type: 'global',
      period_start,
      period_end,
    }
    return apiFetch<MonthlyReport>('/ai/reports/generate_report/', {
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

export interface Campaign {
  id: number
  name: string
  code: string
  description?: string
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'pending' | 'cancelled'
  status_display?: string
  region?: number | null
  region_name?: string
  culture?: number | null
  culture_name?: string
  budget?: number | null
  producers_count?: number
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
