const DEFAULT_API_URL = 'https://gestion-agricole-1-ajdy.onrender.com/api'

const normalizeApiUrl = (url: string) => url.replace(/\/+$/, '')

export const API_BASE_URL = normalizeApiUrl(
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
)

export function buildApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_BASE_URL}${normalizedEndpoint}`
}

export function getAuthHeaders(
  token?: string | null,
  extraHeaders: HeadersInit = {}
): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string>),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export async function parseApiError(
  response: Response,
  fallbackMessage = 'Une erreur est survenue'
): Promise<string> {
  const errorPayload = await response.json().catch(() => ({ detail: fallbackMessage }))

  if (typeof errorPayload === 'string') {
    return errorPayload
  }

  if (errorPayload && typeof errorPayload === 'object') {
    if ('detail' in errorPayload && typeof errorPayload.detail === 'string') {
      return errorPayload.detail
    }

    const values = Object.values(errorPayload).flatMap((value) =>
      Array.isArray(value) ? value : [value]
    )
    const filtered = values.filter((value) => typeof value === 'string' && value.trim())
    if (filtered.length > 0) {
      return filtered.join(' ')
    }
  }

  return fallbackMessage
}
