import { API_URL } from '../db';
import { OcrLine } from './extract';

/**
 * Abstraction du moteur OCR (spec §15). Le système est conçu pour brancher
 * plusieurs moteurs : Google ML Kit (local, hors ligne), Google Cloud Vision,
 * Azure AI Document Intelligence, Tesseract (malgache/français) ou un modèle
 * Vision (Gemini / GPT-4.1 Vision).
 *
 * Ordre de résolution :
 *   1. fournisseur injecté via `setOcrProvider` (ex : ML Kit local)
 *   2. endpoint OCR du backend (`/api/cin/ocr/`) si disponible
 *   3. échec -> renvoie null, l'UI bascule en saisie manuelle (spec §11)
 */
export type OcrProvider = (uri: string) => Promise<OcrLine[] | null>;

let customProvider: OcrProvider | null = null;

export function setOcrProvider(provider: OcrProvider | null): void {
  customProvider = provider;
}

/** Fournisseur par défaut : interroge l'endpoint OCR du backend. */
const cloudOcrProvider: OcrProvider = async (uri: string) => {
  try {
    const token = (await import('@react-native-async-storage/async-storage')).default;
    const auth = await token.getItem('user_token');
    const form = new FormData();
    // @ts-ignore – React Native FormData accepte un objet uri
    form.append('image', { uri, name: 'cin.jpg', type: 'image/jpeg' });
    const res = await fetch(`${API_URL.replace(/\/$/, '')}/api/cin/ocr/`, {
      method: 'POST',
      headers: auth ? { Authorization: `Bearer ${auth}` } : {},
      body: form,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.lines as OcrLine[]) || null;
  } catch {
    return null;
  }
};

export async function recognizeText(uri: string): Promise<OcrLine[] | null> {
  if (customProvider) {
    const lines = await customProvider(uri);
    if (lines && lines.length) return lines;
  }
  const cloud = await cloudOcrProvider(uri);
  return cloud;
}

/**
 * Reconnaissance OCR complète à partir de texte déjà reconnu.
 * Utile pour les tests, les modèles Vision, ou quand le texte est fourni
 * directement (coller/transcrire). Renvoie des lignes normalisées.
 */
export function linesFromText(text: string): OcrLine[] {
  return text
    .split(/\r?\n/)
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => ({ text: t, confidence: 0.9 }));
}
