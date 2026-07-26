import { CinSide } from './types';

export type QualityIssue =
  | 'card_not_detected'
  | 'card_incomplete'
  | 'blurry'
  | 'low_light'
  | 'glare'
  | 'ok';

export interface QualityReport {
  issue: QualityIssue;
  message: string;
  /** 0-1, qualité globale estimée */
  score: number;
  /** true quand la capture peut être déclenchée automatiquement */
  canCapture: boolean;
  details: {
    brightness: number;
    sharpness: number;
    cardVisible: boolean;
    cornersVisible: boolean;
    glare: number;
  };
}

/**
 * Évaluation de la qualité de la capture AVANT la prise de vue.
 *
 * Les indicateurs `brightness`, `sharpness`, `glare` et `cornersVisible`
 * sont calculés par le moteur de capture natif (expo-camera + analyse
 * des pixels). Cette fonction agrège ces signaux et décide si l'on peut
 * déclencher l'Auto Capture (spec §2).
 *
 * En l'absence de mesure bas-niveau (ex : preview non analysée), on se
 * base sur les heuristiques fournies par l'appelant.
 */
export function assessQuality(input: {
  brightness?: number; // 0-1, 0 = noir, 1 = blanc
  sharpness?: number; // 0-1, variance perçue
  glare?: number; // 0-1, reflets
  cardVisible?: boolean;
  cornersVisible?: boolean;
}): QualityReport {
  const brightness = input.brightness ?? 0.5;
  const sharpness = input.sharpness ?? 0.6;
  const glare = input.glare ?? 0;
  const cardVisible = input.cardVisible ?? true;
  const cornersVisible = input.cornersVisible ?? true;

  let issue: QualityIssue = 'ok';
  let message = 'Carte détectée';

  if (!cardVisible) {
    issue = 'card_not_detected';
    message = 'Carte non détectée';
  } else if (!cornersVisible) {
    issue = 'card_incomplete';
    message = 'Carte incomplète';
  } else if (sharpness < 0.3) {
    issue = 'blurry';
    message = 'Photo floue';
  } else if (brightness < 0.15) {
    issue = 'low_light';
    message = 'Lumière insuffisante';
  } else if (glare > 0.6) {
    issue = 'glare';
    message = 'Reflets importants détectés';
  }

  const score = Math.round(
    ((cardVisible ? 0.25 : 0) +
      (cornersVisible ? 0.25 : 0) +
      sharpness * 0.25 +
      (1 - Math.abs(brightness - 0.5) * 2) * 0.15 +
      (1 - glare) * 0.1) *
      100
  );

  const canCapture = issue === 'ok';

  return {
    issue,
    message,
    score,
    canCapture,
    details: { brightness, sharpness, cardVisible, cornersVisible, glare },
  };
}

export const QUALITY_MESSAGES: Record<Exclude<QualityIssue, 'ok'>, string> = {
  card_not_detected: 'Carte non détectée',
  card_incomplete: 'Carte incomplète',
  blurry: 'Photo floue',
  low_light: 'Lumière insuffisante',
  glare: 'Reflets importants',
};

export function guidanceForSide(side: CinSide): string {
  return side === 'recto' ? 'Placez le RECTO de la CIN dans le cadre' : 'Retournez la carte : placez le VERSO';
}
