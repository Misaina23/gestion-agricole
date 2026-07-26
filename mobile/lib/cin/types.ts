export type CinSide = 'recto' | 'verso';

export type CinFieldKey =
  | 'nom'
  | 'prenom'
  | 'numero_cin'
  | 'date_naissance'
  | 'lieu_naissance'
  | 'sexe'
  | 'pere'
  | 'mere'
  | 'profession'
  | 'adresse'
  | 'arrondissement'
  | 'date_delivrance'
  | 'date_expiration';

export interface CinField {
  key: CinFieldKey;
  label: string;
  value: string;
  confidence: number;
  /** true when the value was corrected by the validation engine */
  corrected: boolean;
  /** true when the value was manually entered/validated by the user */
  manual: boolean;
  /** raw OCR text before correction */
  raw: string;
}

export interface CinResult {
  fields: Record<CinFieldKey, CinField>;
  /** overall average confidence (0-100) */
  overallConfidence: number;
  /** keys whose confidence is below the manual-validation threshold */
  needsReview: CinFieldKey[];
  side: CinSide;
}

export interface CinScanRecord {
  nom: string;
  prenom: string;
  numero_cin: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: string;
  pere: string;
  mere: string;
  profession: string;
  adresse: string;
  arrondissement: string;
  date_delivrance: string;
  date_expiration: string;
  /** complementary info not printed on the card */
  telephone: string;
  email: string;
  photo_beneficiaire: string;
  observations: string;
  /** confidence scores, 0-100 per field */
  confidence: Record<string, number>;
  /** whether each field was manually corrected */
  corrected_fields: string[];
  /** capture metadata */
  scan_metadata: {
    recto_photo: string;
    verso_photo: string;
    enhanced_recto_photo: string;
    enhanced_verso_photo: string;
    scanned_at: string;
    agent_id: number | null;
    device: string;
    manual_mode: boolean;
  };
}

export const REQUIRED_FIELDS: CinFieldKey[] = [
  'nom',
  'prenom',
  'numero_cin',
  'date_naissance',
  'lieu_naissance',
  'sexe',
];

export const MANUAL_REVIEW_THRESHOLD = 90;
