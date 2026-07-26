import {
  CinField,
  CinFieldKey,
  CinResult,
  CinSide,
  MANUAL_REVIEW_THRESHOLD,
  REQUIRED_FIELDS,
} from './types';
import { extractFields, OcrLine } from './extract';
import { validateField } from './validate';
import { FIELD_LABELS_FR } from './labels';

const ALL_KEYS: CinFieldKey[] = [
  'nom',
  'prenom',
  'numero_cin',
  'date_naissance',
  'lieu_naissance',
  'sexe',
  'pere',
  'mere',
  'profession',
  'adresse',
  'arrondissement',
  'date_delivrance',
  'date_expiration',
];

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/** Calcule la confiance finale (0-100) d'un champ extrait + validé. */
export function computeFieldConfidence(
  raw: string,
  sourceConfidence: number,
  penalty: number,
  corrected: boolean
): number {
  const base = clamp(sourceConfidence * 100);
  let score = base * (1 - penalty);
  if (corrected) score -= 5; // légère pénalité pour correction automatique
  if (!raw) score = 0;
  return Math.round(clamp(score));
}

/** Construit un CinResult à partir des lignes OCR d'une face. */
export function scanSide(lines: OcrLine[], side: CinSide): CinResult {
  const extracted = extractFields(lines, side);
  const fields = {} as Record<CinFieldKey, CinField>;

  for (const key of ALL_KEYS) {
    const ex = extracted.find(e => e.key === key);
    if (ex) {
      const v = validateField(key, ex.raw);
      const confidence = computeFieldConfidence(ex.raw, ex.sourceConfidence, v.penalty, v.corrected);
      fields[key] = {
        key,
        label: FIELD_LABELS_FR[key],
        value: v.value,
        confidence,
        corrected: v.corrected,
        manual: false,
        raw: ex.raw,
      };
    } else {
      fields[key] = {
        key,
        label: FIELD_LABELS_FR[key],
        value: '',
        confidence: 0,
        corrected: false,
        manual: false,
        raw: '',
      };
    }
  }

  const present = Object.values(fields).filter(f => f.value);
  const overallConfidence = present.length
    ? Math.round(present.reduce((s, f) => s + f.confidence, 0) / present.length)
    : 0;

  const needsReview = (Object.values(fields) as CinField[])
    .filter(f => f.value && f.confidence < MANUAL_REVIEW_THRESHOLD)
    .map(f => f.key);

  return { fields, overallConfidence, needsReview, side };
}

/** Fusionne recto + verso : conserve la meilleure confiance par champ. */
export function mergeSides(recto: CinResult, verso: CinResult): CinResult {
  const fields = {} as Record<CinFieldKey, CinField>;

  for (const key of ALL_KEYS) {
    const r = recto.fields[key];
    const v = verso.fields[key];
    // préférer la valeur la plus confiante
    let best: CinField;
    if (!r.value && !v.value) best = r;
    else if (!v.value) best = r;
    else if (!r.value) best = v;
    else best = r.confidence >= v.confidence ? r : v;
    fields[key] = { ...best };
  }

  const present = Object.values(fields).filter(f => f.value);
  const overallConfidence = present.length
    ? Math.round(present.reduce((s, f) => s + f.confidence, 0) / present.length)
    : 0;

  const needsReview = (Object.values(fields) as CinField[])
    .filter(f => f.value && f.confidence < MANUAL_REVIEW_THRESHOLD)
    .map(f => f.key);

  return { fields, overallConfidence, needsReview, side: 'recto' };
}

export { REQUIRED_FIELDS, MANUAL_REVIEW_THRESHOLD };

export function emptyResult(side: CinSide): CinResult {
  return scanSide([], side);
}
