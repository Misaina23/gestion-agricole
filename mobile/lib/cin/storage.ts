import { Platform } from 'react-native';
import { addPendingRecord, addPhoto, addModificationHistory } from '../db';
import { CinResult, CinScanRecord, CinFieldKey } from './types';
import { computeAge, parseAndValidateDate } from './validate';

/**
 * Persistance hors ligne (spec §13 & §14). On réutilise la file d'attente
 * locale existante (`pending_records`, `photos`, `modification_history`).
 * La synchronisation vers le backend se fait via le mécanisme auto-sync
 * déjà en place, en ajoutant le endpoint `/api/cin/scans/sync/`.
 */
export interface SaveScanInput {
  result: CinResult;
  rectoUri: string;
  versoUri: string;
  enhancedRectoUri?: string;
  enhancedVersoUri?: string;
  manualMode: boolean;
  agentId: number | null;
  telephone?: string;
  email?: string;
  photoBeneficiaire?: string;
  observations?: string;
  /** corrections manuelles apportées par l'utilisateur (clé -> ancienne valeur) */
  manualCorrections?: Partial<Record<CinFieldKey, string>>;
}

export function buildScanRecord(input: SaveScanInput): CinScanRecord {
  const f = input.result.fields;
  const confidence: Record<string, number> = {};
  const corrected_fields: string[] = [];
  (Object.keys(f) as CinFieldKey[]).forEach(k => {
    confidence[k] = f[k].confidence;
    if (f[k].corrected || f[k].manual) corrected_fields.push(k);
  });

  return {
    nom: f.nom.value,
    prenom: f.prenom.value,
    numero_cin: f.numero_cin.value,
    date_naissance: f.date_naissance.value,
    lieu_naissance: f.lieu_naissance.value,
    sexe: f.sexe.value,
    pere: f.pere.value,
    mere: f.mere.value,
    profession: f.profession.value,
    adresse: f.adresse.value,
    arrondissement: f.arrondissement.value,
    date_delivrance: f.date_delivrance.value,
    date_expiration: f.date_expiration.value,
    telephone: input.telephone || '',
    email: input.email || '',
    photo_beneficiaire: input.photoBeneficiaire || '',
    observations: input.observations || '',
    confidence,
    corrected_fields,
    scan_metadata: {
      recto_photo: input.rectoUri,
      verso_photo: input.versoUri,
      enhanced_recto_photo: input.enhancedRectoUri || '',
      enhanced_verso_photo: input.enhancedVersoUri || '',
      scanned_at: new Date().toISOString(),
      agent_id: input.agentId,
      device: `${Platform.OS} ${Platform.Version}`,
      manual_mode: input.manualMode,
    },
  };
}

export function saveCinScan(input: SaveScanInput): { queuedId: number; age: number | null } {
  const record = buildScanRecord(input);
  const createdAt = new Date().toISOString();

  addPendingRecord({
    type: 'cin_scan',
    data: JSON.stringify(record),
    createdAt,
  });

  // Enregistrement des photos pour upload différé
  addPhoto({ uri: input.rectoUri, uploadStatus: 'pending', recordType: 'cin_scan', createdAt });
  if (input.versoUri) {
    addPhoto({ uri: input.versoUri, uploadStatus: 'pending', recordType: 'cin_scan', createdAt });
  }

  // Journal des corrections manuelles (audit)
  if (input.manualCorrections) {
    for (const [key, oldVal] of Object.entries(input.manualCorrections)) {
      const newVal = (record as any)[key];
      addModificationHistory({
        recordType: 'cin_scan',
        recordId: undefined,
        action: 'UPDATE',
        oldData: JSON.stringify({ [key]: oldVal }),
        newData: JSON.stringify({ [key]: newVal }),
        modifiedBy: input.agentId ? String(input.agentId) : 'agent',
        modifiedAt: createdAt,
      });
    }
  }

  const iso = parseAndValidateDate(record.date_naissance).iso;
  return { queuedId: Date.now(), age: computeAge(iso || '') };
}
