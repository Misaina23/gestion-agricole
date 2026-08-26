import { API_URL } from './db';

const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;

async function withTimeout<T>(promise: Promise<T>, ms = DEFAULT_TIMEOUT): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Délai de connexion dépassé')), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function request<T>(path: string, init: RequestInit = {}, retries = MAX_RETRIES): Promise<T> {
  const url = `${API_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const attempt = async (attemptNumber: number): Promise<T> => {
    try {
      const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
      const headers = new Headers(init.headers);
      if (!isFormData) {
        const contentType = headers.get('content-type');
        if (!contentType) {
          headers.set('Content-Type', 'application/json');
        }
      }
      const response = await withTimeout(fetch(url, {
        headers,
        ...init,
      }));

      if (!response.ok) {
        const text = await response.text();
        let message = `Erreur HTTP ${response.status}`;
        try {
          const payload = JSON.parse(text);
          message = payload.detail || payload.error || payload.message || JSON.stringify(payload);
        } catch {
          message = text || message;
        }
        throw new Error(message);
      }

      const text = await response.text();
      if (!text) return {} as T;

      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    } catch (error: any) {
      const isLastAttempt = attemptNumber >= retries;
      if (isLastAttempt || !error.message?.includes('Délai de connexion dépassé')) {
        throw error;
      }
      await new Promise(r => setTimeout(r, 1000 * attemptNumber));
      return attempt(attemptNumber + 1);
    }
  };

  return attempt(1);
}
