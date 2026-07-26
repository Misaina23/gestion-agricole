import { CinFieldKey, CinSide } from './types';
import { LABELS, matchLabel, normalizeLabel } from './labels';

export interface OcrLine {
  text: string;
  confidence?: number; // 0-1, fourni par le moteur OCR si disponible
}

export interface ExtractedField {
  key: CinFieldKey;
  raw: string;
  /** confiance de la ligne OCR source (0-1) */
  sourceConfidence: number;
  /** ligne source ayant fourni la valeur */
  sourceLine: string;
}

const MULTI_LINE_VALUE: CinFieldKey[] = [
  'nom',
  'prenom',
  'lieu_naissance',
  'pere',
  'mere',
  'profession',
  'adresse',
  'arrondissement',
];

const CIN_TOKEN_RE = /\b\d[\dOoIlSsBbZz]{7,}\b/;

/**
 * Extrait les champs structurés à partir des lignes OCR d'une face de CIN.
 * Tolère les libellés partiellement masqués, les tampons et les erreurs OCR.
 */
export function extractFields(lines: OcrLine[], side: CinSide): ExtractedField[] {
  const results: Partial<Record<CinFieldKey, ExtractedField>> = {};
  const cleaned = lines.map(l => ({ ...l, text: (l.text || '').trim() }));

  const takeValue = (idx: number, key: CinFieldKey): { raw: string; src: string } => {
    const line = cleaned[idx];
    const matchedKey = matchLabel(line.text);
    // retirer le libellé du début de la ligne
    let rest = line.text;
    if (matchedKey) {
      for (const def of LABELS) {
        if (def.key !== key) continue;
        const candidates = [...def.mg, ...def.fr].map(normalizeLabel);
        for (const c of candidates) {
          const nl = normalizeLabel(line.text);
          if (nl.startsWith(c)) {
            rest = line.text.substring(line.text.toLowerCase().indexOf(c.toLowerCase()) + c.length).trim();
            rest = rest.replace(/^[:=\-]\s*/, '');
            break;
          }
        }
      }
    }

    if (rest && rest.length >= 1) {
      return { raw: rest, src: line.text };
    }

    // valeur sur la/les lignes suivantes (champs multi-lignes)
    if (MULTI_LINE_VALUE.includes(key)) {
      for (let j = idx + 1; j < cleaned.length; j++) {
        const next = cleaned[j].text;
        if (!next) continue;
        if (matchLabel(next)) break; // nouveau libellé
        return { raw: next, src: next };
      }
    }
    return { raw: '', src: line.text };
  };

  cleaned.forEach((line, idx) => {
    if (!line.text) return;
    const key = matchLabel(line.text);
    if (!key) return;
    if (results[key]) return; // premier libellé gagnant
    const { raw, src } = takeValue(idx, key);
    const conf = typeof line.confidence === 'number' ? line.confidence : estimateLineConfidence(line.text);
    results[key] = { key, raw, sourceConfidence: conf, sourceLine: src };
  });

  // Sexe : détection du mot LAHY / VAVY même sans libellé "SEXE"
  if (!results.sexe) {
    for (let i = 0; i < cleaned.length; i++) {
      const n = normalizeLabel(cleaned[i].text);
      if (n === 'LAHY' || n === 'VAVY' || n.includes('LAHY') || n.includes('VAVY')) {
        results.sexe = {
          key: 'sexe',
          raw: n.includes('LAHY') ? 'LAHY' : 'VAVY',
          sourceConfidence: typeof cleaned[i].confidence === 'number' ? cleaned[i].confidence! : 0.9,
          sourceLine: cleaned[i].text,
        };
        break;
      }
    }
  }

  // Numéro CIN : recherche d'un token numérique long sur n'importe quelle ligne
  if (!results.numero_cin) {
    for (let i = 0; i < cleaned.length; i++) {
      const m = CIN_TOKEN_RE.exec(cleaned[i].text);
      if (m) {
        results.numero_cin = {
          key: 'numero_cin',
          raw: m[0],
          sourceConfidence: typeof cleaned[i].confidence === 'number' ? cleaned[i].confidence! : 0.85,
          sourceLine: cleaned[i].text,
        };
        break;
      }
    }
  }

  // Le verso contient souvent la date de délivrance / expiration
  if (side === 'verso') {
    cleaned.forEach((line, idx) => {
      const n = normalizeLabel(line.text);
      if (/NOVOA|DELIVRE|DELI/.test(n) && !results.date_delivrance) {
        const { raw, src } = takeValue(idx, 'date_delivrance');
        if (raw) {
          results.date_delivrance = { key: 'date_delivrance', raw, sourceConfidence: 0.8, sourceLine: src };
        }
      }
      if (/LANY|EXPIR|VALID/.test(n) && !results.date_expiration) {
        const { raw, src } = takeValue(idx, 'date_expiration');
        if (raw) {
          results.date_expiration = { key: 'date_expiration', raw, sourceConfidence: 0.8, sourceLine: src };
        }
      }
    });
  }

  return Object.values(results).filter(Boolean) as ExtractedField[];
}

/** Confiance estimée d'une ligne quand l'OCR ne la fournit pas. */
export function estimateLineConfidence(text: string): number {
  if (!text) return 0;
  // lettres bien formées + peu de caractères douteux = confiance élevée
  const suspicious = (text.match(/[O0I1S5B8Z2]/g) || []).length;
  const base = 0.9;
  const penalty = Math.min(0.4, suspicious * 0.04);
  return Math.max(0.5, base - penalty);
}
