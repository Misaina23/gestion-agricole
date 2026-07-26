import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, BackHandler } from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from '../lib/api-client';
import { API_URL } from '../lib/db';
import { useFocusEffect } from '@react-navigation/native';

export default function QRScannerScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        navigation.goBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => subscription.remove();
    }, [navigation])
  );

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanning) return;
    setScanning(true);
    try {
      const data = result.data;
      const [type, code] = data.split(':');
      const token = await AsyncStorage.getItem('user_token');
      const res = await request<{ code: string; id: number; name?: string; phone?: string; region?: string; commune?: string; area?: number; producer?: { code: string } }>('/api/parse-qr/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ qr_data: data }),
      });
      if (type === 'producer') {
        navigation.navigate('Collecte', {
          prefillProducer: res.code,
          prefillProducerId: res.id,
          prefillData: {
            nomPrenom: res.name || '',
            telephone: res.phone || '',
            region: res.region || '',
            commune: res.commune || '',
          },
        });
      } else if (type === 'parcel') {
        navigation.navigate('Collecte', {
          prefillParcel: res.code,
          prefillParcelId: res.id,
          prefillProducer: res.producer?.code || '',
          prefillData: {
            superficie: res.area ? String(res.area) : '',
            codeUniqueParcelle: res.code || '',
          },
        });
      }
      navigation.goBack();
    } catch (e: any) {
      console.error('QR scan error:', e);
      Alert.alert('Erreur', e?.message || 'Analyse QR échouée');
      setScanning(false);
    }
  };

  if (permission === null) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.text }}>Chargement...</Text>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Ionicons name="camera-outline" size={64} color={theme.textMuted} />
        <Text style={[styles.errorText, { color: theme.text }]}>Accès caméra requis</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={[styles.link, { color: theme.primary }]}>Activer l'accès caméra</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openSettings()}>
          <Text style={[styles.link, { color: theme.primary }]}>Paramètres</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
        <View style={[styles.scanFrame, { borderColor: theme.primary }]} />
        <Text style={[styles.instructions, { color: '#fff' }]}>Placez le QR code dans le cadre</Text>
      </View>
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, marginTop: 16 },
  link: { marginTop: 12, fontSize: 16 },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: { width: 250, height: 250, borderWidth: 3, borderRadius: 16 },
  instructions: { marginTop: 20, fontSize: 16, fontWeight: '600' },
  closeBtn: { position: 'absolute', top: 48, right: 16, padding: 12, zIndex: 1, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.3)' },
});