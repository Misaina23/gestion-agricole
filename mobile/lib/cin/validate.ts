import { CinFieldKey } from './types';

/** Corrections OCR courantes (voir spec §7). */
const CHAR_CORRECTIONS: Record<string, (ctx: { prev: string; next: string; isNumeric: boolean }) => string | null> = {
  // 0 <-> O : O devient 0 en contexte numérique, sinon 0 -> O dans un mot
  O: ({ isNumeric }) => (isNumeric ? '0' : null),
  '0': ({ isNumeric, prev, next }) => (isNumeric ? null : 'O'),
  // 1 <-> I / l
  I: ({ isNumeric }) => (isNumeric ? '1' : null),
  l: ({ isNumeric }) => (isNumeric ? '1' : null),
  // 5 <-> S
  S: ({ isNumeric }) => (isNumeric ? '5' : null),
  '5': ({ isNumeric, prev, next }) => (isNumeric ? null : 'S'),
  // 8 <-> B
  B: ({ isNumeric }) => (isNumeric ? '8' : null),
  '8': ({ isNumeric }) => (isNumeric ? null : 'B'),
  Z: ({ isNumeric }) => (isNumeric ? '2' : null),
  '2': ({ isNumeric }) => (isNumeric ? null : 'Z'),
};

export function correctString(raw: string, isNumeric: boolean): { value: string; corrected: boolean } {
  let corrected = false;
  const chars = raw.split('');
  const out = chars.map((ch, i) => {
    const prev = chars[i - 1] || '';
    const next = chars[i + 1] || '';
    const rule = CHAR_CORRECTIONS[ch];
    if (!rule) return ch;
    const replacement = rule({ prev, next, isNumeric });
    if (replacement !== null && replacement !== ch) {
      corrected = true;
      return replacement;
    }
    return ch;
  });
  return { value: out.join(''), corrected };
}

/** Numéro CIN : uniquement des chiffres. Ex: 213O11033360 -> 213011033360 */
export function normalizeCin(raw: string): { value: string; corrected: boolean } {
  const digitsOnly = raw.replace(/[^0-9OoIilSsBbZz]/g, '');
  const { value, corrected } = correctString(digitsOnly.toUpperCase(), true);
  return { value, corrected: corrected || value !== raw.replace(/[^0-9OoIilSsBbZz]/g, '').toUpperCase() };
}

const DATE_RE = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/;

export interface ParsedDate {
  /** ISO jj/mm/aaaa */
  display: string;
  iso: string;
  valid: boolean;
}

/** Parse et valide une date (jj/mm/aaaa). Refuse 32/18/2005, 31/02/2004, etc. */
export function parseAndValidateDate(raw: string): ParsedDate {
  const cleaned = raw.replace(/\s+/g, '').trim();
  const m = DATE_RE.exec(cleaned);
  if (!m) return { display: raw, iso: '', valid: false };

  let day = parseInt(m[1], 10);
  let month = parseInt(m[2], 10);
  let year = parseInt(m[3], 10);

  if (year < 100) year += year < 50 ? 2000 : 1900;

  if (month < 1 || month > 12) return { display: cleaned, iso: '', valid: false };
  if (day < 1) return { display: cleaned, iso: '', valid: false };

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) return { display: cleaned, iso: '', valid: false };

  // années plausibles pour une CIN
  if (year < 1900 || year > new Date().getFullYear()) {
    return { display: cleaned, iso: '', valid: false };
  }

  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { display: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`, iso, valid: true };
}

export function computeAge(isoDate: string): number | null {
  if (!isoDate) return null;
  const birth = new Date(isoDate);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/** Détecte le sexe à partir d'un champ ou d'un mot LAHY/VAVY. */
export function detectSex(raw: string): string {
  const n = raw.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  if (/LAHY|^L$|^HOMME$|^MASCULIN/.test(n) || n.includes('LAHY')) return 'M';
  if (/VAVY|^V$|^FEMME$|^FEMININ/.test(n) || n.includes('VAVY')) return 'F';
  if (n === 'M' || n.startsWith('MAS')) return 'M';
  if (n === 'F' || n.startsWith('FEM')) return 'F';
  return '';
}

/**
 * Valide un champ selon sa nature et produit une valeur corrigée.
 * Renvoie aussi un facteur de pénalité de confiance (0-1) si invalide.
 */
export function validateField(
  key: CinFieldKey,
  raw: string
): { value: string; corrected: boolean; valid: boolean; penalty: number } {
  const text = (raw || '').replace(/\s+/g, ' ').trim();
  switch (key) {
    case 'numero_cin': {
      const { value, corrected } = normalizeCin(text);
      return { value, corrected, valid: value.length >= 8, penalty: value.length >= 8 ? 0 : 0.4 };
    }
    case 'date_naissance':
    case 'date_delivrance':
    case 'date_expiration': {
      const d = parseAndValidateDate(text);
      return { value: d.valid ? d.display : text, corrected: d.valid && d.display !== text, valid: d.valid, penalty: d.valid ? 0 : 0.5 };
    }
    case 'sexe': {
      const s = detectSex(text);
      return { value: s, corrected: s !== text.toUpperCase(), valid: s !== '', penalty: s ? 0 : 0.5 };
    }
    case 'nom':
    case 'prenom':
    case 'pere':
    case 'mere': {
      const { value, corrected } = correctString(text.toUpperCase(), false);
      return { value, corrected, valid: value.length >= 2, penalty: value.length >= 2 ? 0 : 0.3 };
    }
    default: {
      return { value: text, corrected: false, valid: text.length > 0, penalty: 0 };
    }
  }
}
