/**
 * Prétraitement d'image avant OCR (spec §4).
 *
 * Le but est de fournir à l'OCR une image propre et lisible :
 *   - correction de perspective / redressement
 *   - détection + recadrage des contours de la carte
 *   - suppression des reflets
 *   - augmentation du contraste / équilibrage de luminosité
 *   - réduction du bruit + netteté
 *
 * Sur le terrain, ces opérations sont effectuées par un moteur natif
 * (Vision Camera frame processor, ML Kit, ou une librairie comme
 * OpenCV/TensorFlow Lite). Cette couche abstrait le moteur : on injecte
 * un `ImageProcessor` concret selon la plateforme. Par défaut, en
 * l'absence de moteur natif, l'image d'origine est renvoyée et le flag
 * `applied` est à false pour information.
 */
export interface PreprocessPipelineStep {
  name: string;
  applied: boolean;
}

export interface PreprocessResult {
  /** URI de l'image optimisée transmise à l'OCR */
  enhancedUri: string;
  steps: PreprocessPipelineStep[];
  applied: boolean;
}

export type ImageProcessor = (uri: string) => Promise<PreprocessResult>;

const noopProcessor: ImageProcessor = async (uri) => ({
  enhancedUri: uri,
  applied: false,
  steps: [
    { name: 'correction_perspective', applied: false },
    { name: 'recadrage_contours', applied: false },
    { name: 'suppression_reflets', applied: false },
    { name: 'contraste', applied: false },
    { name: 'reduction_bruit', applied: false },
    { name: 'nettete', applied: false },
    { name: 'equilibrage_luminosite', applied: false },
    { name: 'redressement', applied: false },
  ],
});

let activeProcessor: ImageProcessor = noopProcessor;

export function setImageProcessor(processor: ImageProcessor): void {
  activeProcessor = processor;
}

export async function preprocessImage(uri: string): Promise<PreprocessResult> {
  return activeProcessor(uri);
}

export const PREPROCESS_STEPS = [
  'correction_perspective',
  'recadrage_contours',
  'suppression_reflets',
  'contraste',
  'reduction_bruit',
  'nettete',
  'equilibrage_luminosite',
  'redressement',
];
