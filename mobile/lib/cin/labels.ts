import { CinFieldKey } from './types';

/**
 * Dictionnaire des libellés malgaches (prioritaires) et français (traduction)
 * présents sur une CIN malgache. Le moteur donne la priorité au malgache.
 *
 * Les variantes incluent des formes raccourcies / altérées par l'usure,
 * les tampons ou les erreurs OCR courantes afin de reconnaître le champ
 * même lorsqu'une partie du mot est cachée.
 */
export interface LabelDef {
  key: CinFieldKey;
  /** libellés prioritaires (malgache) */
  mg: string[];
  /** traductions françaises possibles */
  fr: string[];
}

export const LABELS: LabelDef[] = [
  {
    key: 'nom',
    mg: ['ANARANA', 'ANARANA :', 'ANARANA:'],
    fr: ['NOM', 'NOM :', 'NOM:'],
  },
  {
    key: 'prenom',
    mg: ['ANARANA FANAMPINY', 'FANAMPINY', 'ANARANA FANAMPINY :', 'ANAR. FANAMPINY'],
    fr: ['PRENOM', 'PRENOM(S)', 'PRÉNOM', 'PRÉNOM(S)', 'PRENOM :', 'PRÉNOM :'],
  },
  {
    key: 'numero_cin',
    mg: ['LAHARANA', 'LAHARANA :', 'LAHARANA CIN', 'LAHARANA N°'],
    fr: ['NUMERO', 'N°', 'NUMÉRO', 'NUMERO CIN', 'N° CIN', 'CIN N°'],
  },
  {
    key: 'date_naissance',
    mg: ['TERAKA TAMIN\'NY', 'TERAKA', 'TERAKA TAMINY', 'TAmina'],
    fr: ['NE(E) LE', 'NÉ(E) LE', 'DATE DE NAISSANCE', 'NAISSANCE'],
  },
  {
    key: 'lieu_naissance',
    mg: ['TAO', 'TAO :', 'TAO NY'],
    fr: ['A', 'À', 'LIEU DE NAISSANCE', 'LIEU'],
  },
  {
    key: 'sexe',
    mg: ['LAHY', 'VAVY', 'SEXE'],
    fr: ['MASCULIN', 'FEMININ', 'FEMININ', 'SEXE'],
  },
  {
    key: 'pere',
    mg: ['RAY NITERAKA', 'RAY', 'RAINY', 'RAY NIT'],
    fr: ['PERE', 'PÈRE'],
  },
  {
    key: 'mere',
    mg: ['RENY NITERAKA', 'RENY', 'RENINY', 'RENY NIT'],
    fr: ['MERE', 'MÈRE'],
  },
  {
    key: 'profession',
    mg: ['ASA ATAO', 'ASA', 'ASA ATAO :'],
    fr: ['PROFESSION', 'METIER', 'MÉTIER'],
  },
  {
    key: 'adresse',
    mg: ['FONENANA', 'FONENANA :', 'ADRESSE'],
    fr: ['ADRESSE', 'DOMICILE'],
  },
  {
    key: 'arrondissement',
    mg: ['BORIBORITANY', 'BORIBORITRA', 'BORIBORITANY :'],
    fr: ['ARRONDISSEMENT', 'ARRONDISSEMENT'],
  },
  {
    key: 'date_delivrance',
    mg: ['NOVOA TAO', 'NOVOA', 'NAPAHOA TAO'],
    fr: ['DELIVRE LE', 'DÉLIVRÉ LE', 'DATE DE DELIVRANCE'],
  },
  {
    key: 'date_expiration',
    mg: ['LANY DATE', 'LANY', 'TAPITRA'],
    fr: ['EXPIRE LE', 'EXPIRE', 'DATE D\'EXPIRATION', 'VALIDITE'],
  },
];

/** Nettoyage de texte pour la comparaison de libellés. */
export function normalizeLabel(text: string): string {
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // supprime accents
    .replace(/[:=]/g, ' ')
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Compare deux chaînes avec tolérance (contient / préfixe / distance). */
function labelMatches(normalized: string, candidate: string): boolean {
  if (!normalized || !candidate) return false;
  if (normalized === candidate) return true;
  if (normalized.includes(candidate) || candidate.includes(normalized)) return true;
  // préfixe significatif (évite les faux positifs trop courts)
  if (candidate.length >= 4 && (normalized.startsWith(candidate) || candidate.startsWith(normalized))) {
    return true;
  }
  return false;
}

/**
 * Identifie la clé de champ correspondant à une ligne de libellé.
 * Renvoie null si aucun libellé reconnu.
 */
export function matchLabel(line: string): CinFieldKey | null {
  const n = normalizeLabel(line);
  if (n.length < 2) return null;

  for (const def of LABELS) {
    // Priorité au malgache
    for (const mg of def.mg) {
      if (labelMatches(n, normalizeLabel(mg))) return def.key;
    }
    for (const fr of def.fr) {
      if (labelMatches(n, normalizeLabel(fr))) return def.key;
    }
  }
  return null;
}

export const FIELD_LABELS_FR: Record<CinFieldKey, string> = {
  nom: 'Nom',
  prenom: 'Prénom(s)',
  numero_cin: 'Numéro CIN',
  date_naissance: 'Date de naissance',
  lieu_naissance: 'Lieu de naissance',
  sexe: 'Sexe',
  pere: 'Père',
  mere: 'Mère',
  profession: 'Profession',
  adresse: 'Adresse',
  arrondissement: 'Arrondissement',
  date_delivrance: 'Date de délivrance',
  date_expiration: "Date d'expiration",
};
