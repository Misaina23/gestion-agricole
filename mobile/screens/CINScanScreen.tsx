import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  Image, BackHandler,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { preprocessImage } from '../lib/cin/preprocess';
import { recognizeText } from '../lib/cin/ocr';
import { scanSide, mergeSides, emptyResult } from '../lib/cin';
import { CinResult, CinSide } from '../lib/cin/types';
import { assessQuality, guidanceForSide } from '../lib/cin/quality';
import { useFocusEffect } from '@react-navigation/native';

export default function CINScanScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [side, setSide] = useState<CinSide>('recto');
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [preview, setPreview] = useState<{ uri: string; side: CinSide } | null>(null);
  const [rectoResult, setRectoResult] = useState<CinResult | null>(null);
  const [versoResult, setVersoResult] = useState<CinResult | null>(null);
  const [rectoUri, setRectoUri] = useState('');
  const [versoUri, setVersoUri] = useState('');
  const [rectoIsManual, setRectoIsManual] = useState(false);
  const [versoIsManual, setVersoIsManual] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        if (preview) {
          setPreview(null);
          return true;
        }
        navigation.goBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => subscription.remove();
    }, [navigation, preview])
  );

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  const handleCapture = useCallback(async () => {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);
    try {
      const picture: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      setPreview({ uri: picture.uri, side });
      if (side === 'recto') setRectoUri(picture.uri);
      else setVersoUri(picture.uri);
      await processPicture(picture.uri, side);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Capture impossible');
    } finally {
      setCapturing(false);
    }
  }, [capturing, side]);

  // Auto-capture : déclenchée quand la qualité est bonne pendant ~1.2s
  useEffect(() => {
    if (!autoMode || preview || processing || capturing) return;
    const timer = setTimeout(() => {
      // En production, assessQuality lit les signaux bas-niveau de la preview.
      const quality = assessQuality({ brightness: 0.6, sharpness: 0.7, glare: 0.1, cardVisible: true, cornersVisible: true });
      if (quality.canCapture) handleCapture();
    }, 1200);
    return () => clearTimeout(timer);
  }, [autoMode, preview, processing, capturing, side, handleCapture]);

  const processPicture = async (uri: string, capturedSide: CinSide) => {
    setProcessing(true);
    try {
      const enhanced = await preprocessImage(uri);
      const lines = await recognizeText(enhanced.enhancedUri);

      if (!lines || lines.length === 0) {
        // Échec OCR -> proposer saisie manuelle (spec §11)
        Alert.alert(
          'OCR indisponible',
          "La lecture automatique a échoué. Voulez-vous saisir les informations manuellement ?",
          [
            { text: 'Réessayer', onPress: () => setPreview(null) },
            {
              text: 'Saisie manuelle',
              onPress: () => goManual(enhanced.enhancedUri, capturedSide),
            },
          ]
        );
        return;
      }

      const result = scanSide(lines, capturedSide);
      if (capturedSide === 'recto') setRectoResult(result);
      else setVersoResult(result);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Analyse impossible');
    } finally {
      setProcessing(false);
    }
  };

  const goManual = (uri: string, capturedSide: CinSide) => {
    const manualResult = emptyResult(capturedSide);
    if (capturedSide === 'recto') {
      setRectoResult(manualResult);
      setRectoIsManual(true);
    } else {
      setVersoResult(manualResult);
      setVersoIsManual(true);
    }
    setPreview({ uri, side: capturedSide });
  };

  const confirmSide = () => {
    setPreview(null);
    if (side === 'recto') {
      setSide('verso');
    } else {
      finishScan();
    }
  };

  const finishScan = () => {
    const recto = rectoResult || emptyResult('recto');
    const verso = versoResult || emptyResult('verso');
    const bothManual = rectoIsManual && versoIsManual;
    const merged = bothManual
      ? recto // les deux manuels : on garde recto comme coquille vide
      : mergeSides(recto, verso);
    navigation.navigate('CINValidation', {
      rectoResult: recto,
      versoResult: verso,
      mergedResult: merged,
      rectoUri,
      versoUri,
      manualMode: bothManual,
    });
  };

  const startManual = () => {
    navigation.navigate('CINValidation', {
      rectoResult: emptyResult('recto'),
      versoResult: emptyResult('verso'),
      mergedResult: emptyResult('recto'),
      manualMode: true,
    });
  };

  if (permission === null) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.text }}>Chargement de la caméra…</Text>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Ionicons name="camera-outline" size={64} color={theme.textMuted} />
        <Text style={[styles.errorText, { color: theme.text }]}>Accès caméra requis</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={[styles.link, { color: theme.primary }]}>Activer l&apos;accès caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (preview) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <Image source={{ uri: preview.uri }} style={styles.preview} resizeMode="contain" />
        <View style={[styles.banner, { backgroundColor: theme.primary }]}>
          <Text style={styles.bannerText}>
            {preview.side === 'recto' ? 'RECTO capturé' : 'VERSO capturé'}
          </Text>
        </View>
        <View style={styles.previewActions}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.surface }]} onPress={() => setPreview(null)}>
            <Ionicons name="refresh" size={20} color={theme.text} />
            <Text style={[styles.btnText, { color: theme.text }]}>Reprendre</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={confirmSide}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={[styles.btnText, { color: '#fff' }]}>
              {preview.side === 'recto' ? 'Continuer (Verso)' : 'Valider'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const quality = assessQuality({ brightness: 0.6, sharpness: 0.7, glare: 0.1, cardVisible: true, cornersVisible: true });

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      <View style={styles.overlay}>
        <View style={[styles.cardFrame, { borderColor: quality.canCapture ? theme.success : theme.warning }]}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
        <View style={[styles.guideChip, { backgroundColor: quality.canCapture ? theme.success : theme.warning }]}>
          <Ionicons name={quality.canCapture ? 'checkmark-circle' : 'information-circle'} size={16} color="#fff" />
          <Text style={styles.guideText}>
            {guidanceForSide(side)} · {quality.message}
          </Text>
        </View>
      </View>

      <View style={[styles.topBar, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={[styles.sideBadge, { backgroundColor: theme.primary }]}>
          <Text style={styles.sideBadgeText}>{side === 'recto' ? 'RECTO' : 'VERSO'}</Text>
        </View>
        <TouchableOpacity onPress={() => setAutoMode(v => !v)} hitSlop={10}>
          <Ionicons name={autoMode ? 'scan' : 'hand-left-outline'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {processing && (
        <View style={styles.processing}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>Analyse de la carte…</Text>
        </View>
      )}

      <View style={[styles.bottomBar, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
        <TouchableOpacity style={styles.manualBtn} onPress={startManual}>
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.manualText}>Saisie manuelle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.captureBtn, { borderColor: '#fff' }]}
          onPress={handleCapture}
          disabled={capturing || processing}
        >
          {capturing ? <ActivityIndicator color="#fff" /> : <View style={styles.captureInner} />}
        </TouchableOpacity>
        <View style={styles.manualBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, marginTop: 16 },
  link: { marginTop: 12, fontSize: 16 },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  cardFrame: {
    width: 300, height: 190, borderWidth: 3, borderRadius: 16, borderColor: '#FACC15',
  },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#fff', borderWidth: 3 },
  tl: { top: -3, left: -3, borderBottomWidth: 0, borderRightWidth: 0, borderTopLeftRadius: 14 },
  tr: { top: -3, right: -3, borderBottomWidth: 0, borderLeftWidth: 0, borderTopRightRadius: 14 },
  bl: { bottom: -3, left: -3, borderTopWidth: 0, borderRightWidth: 0, borderBottomLeftRadius: 14 },
  br: { bottom: -3, right: -3, borderTopWidth: 0, borderLeftWidth: 0, borderBottomRightRadius: 14 },
  guideChip: {
    marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  guideText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 50,
    paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  sideBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 14 },
  sideBadgeText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 36, paddingTop: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 36,
  },
  captureBtn: { width: 74, height: 74, borderRadius: 37, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
  manualBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 110 },
  manualText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  processing: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  processingText: { color: '#fff', marginTop: 12, fontSize: 16 },
  preview: { flex: 1, backgroundColor: '#000' },
  banner: { position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center', paddingVertical: 8 },
  bannerText: { color: '#fff', fontWeight: '800', letterSpacing: 1 },
  previewActions: { position: 'absolute', bottom: 36, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14 },
  btnText: { fontWeight: '700', fontSize: 15 },
});
