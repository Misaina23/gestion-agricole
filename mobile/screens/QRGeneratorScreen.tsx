import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView, TextInput, Image, BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from '../lib/api-client';
import { API_URL } from '../lib/db';
import { useFocusEffect } from '@react-navigation/native';

export default function QRGeneratorScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const { type = 'producer', code = '' } = route?.params || {};
  const [searchCode, setSearchCode] = useState(code);
  const [searchType, setSearchType] = useState(type);
  const [qrUri, setQrUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const generateQR = async (qrType: string, qrCode: string) => {
    if (!qrCode?.trim()) {
      Alert.alert('Validation', 'Veuillez saisir un code');
      return;
    }
    setLoading(true);
    setQrUri(null);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const res = await fetch(
        `${API_URL}/api/generate-qr/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ type: qrType, code: qrCode.trim() }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        let message = 'Génération impossible';
        try {
          const data = JSON.parse(text);
          message = data.error || message;
        } catch { /* ignore */ }
        Alert.alert('Erreur', message);
        return;
      }
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => setQrUri(reader.result as string);
      reader.readAsDataURL(blob);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Génération impossible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) generateQR(type, code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.segment, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.segmentBtn, searchType === 'producer' && { backgroundColor: theme.primary }]}
            onPress={() => setSearchType('producer')}
          >
            <Text style={[styles.segmentText, { color: searchType === 'producer' ? '#fff' : theme.text }]}>Producteur</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, searchType === 'parcel' && { backgroundColor: theme.primary }]}
            onPress={() => setSearchType('parcel')}
          >
            <Text style={[styles.segmentText, { color: searchType === 'parcel' ? '#fff' : theme.text }]}>Parcelle</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Code</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={searchCode}
          onChangeText={setSearchCode}
          placeholder="Ex: PRD-2026-0042"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: theme.primary }]}
          onPress={() => generateQR(searchType, searchCode)}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="qr-code-outline" size={20} color="#fff" />
              <Text style={styles.generateText}>Générer</Text>
            </>
          )}
        </TouchableOpacity>

        {qrUri && (
          <View style={[styles.qrCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Image source={{ uri: qrUri }} style={styles.qrImage} resizeMode="contain" />
            <Text style={[styles.qrCaption, { color: theme.textSecondary }]}>
              {searchType}:{searchCode}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, alignItems: 'center' },
  segment: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden', width: '100%', marginBottom: 20 },
  segmentBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  segmentText: { fontSize: 14, fontWeight: '600' },
  label: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { width: '100%', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, marginBottom: 16 },
  generateBtn: { width: '100%', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  generateText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  qrCard: { marginTop: 24, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', width: '100%' },
  qrImage: { width: 240, height: 240, backgroundColor: '#fff', borderRadius: 8 },
  qrCaption: { marginTop: 12, fontSize: 14, fontWeight: '600' },
});
