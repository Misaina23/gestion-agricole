import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { addPendingRecord, initDB, getPendingRecords } from '../lib/db';
import { request } from '../lib/api-client';

interface InspectionData {
  codeProducteur: string; nomProducteur: string; codeUniqueParcelle: string;
  dateInspection: string; observations: string; conformite: string;
  actionsCorrectives: string; gpsInspection: string; inspecteur: string;
  region?: string; commune?: string; district?: string;
}

const initialForm: InspectionData = {
  codeProducteur: '', nomProducteur: '', codeUniqueParcelle: '',
  dateInspection: new Date().toLocaleDateString('fr-FR'),
  observations: '', conformite: '', actionsCorrectives: '',
  gpsInspection: '', inspecteur: '',
};

export default function InspectionScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const [form, setForm] = useState<InspectionData>(initialForm);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProducer, setLoadingProducer] = useState(false);
  const codeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initDB();
    if (route?.params?.prefillProducer) {
      setForm(prev => ({ ...prev, codeProducteur: route.params.prefillProducer }));
      lookupProducer(route.params.prefillProducer);
    }
  }, [route?.params]);

  const lookupProducer = async (code: string) => {
    if (!code || code.trim().length < 2) {
      setForm(prev => ({ ...prev, nomProducteur: '', region: '', commune: '', district: '' }));
      return;
    }

    const trimmed = code.trim();
    const local = lookupProducerLocal(trimmed);
    if (local) {
      setForm(prev => ({
        ...prev,
        nomProducteur: local.name || prev.nomProducteur,
        region: local.region || prev.region,
        commune: local.commune || prev.commune,
        district: local.district || prev.district,
      }));
      return;
    }

    setLoadingProducer(true);
    try {
      const data = await request<any>(`/api/producers/?search=${encodeURIComponent(trimmed)}&page_size=1`);
      const producer = Array.isArray(data?.results) ? data.results[0] : data?.[0];
      if (producer) {
        setForm(prev => ({
          ...prev,
          nomProducteur: producer.name || prev.nomProducteur,
          region: producer.region_name || producer.region || prev.region,
          commune: producer.commune_name || producer.commune || prev.commune,
          district: producer.district_name || producer.district || prev.district,
        }));
      }
    } catch {
      // silent on lookup failure
    } finally {
      setLoadingProducer(false);
    }
  };

  const lookupProducerLocal = (code: string): { name?: string; region?: string; commune?: string; district?: string } | null => {
    try {
      const records = getPendingRecords();
      const lowered = code.toLowerCase();
      for (const record of records) {
        try {
          const data = JSON.parse(record.data);
          const candidate = (data.codeProducteur || data.code_producteur || '').toLowerCase();
          const name = data.nomProducteur || data.nom_producteur || data.name || '';
          if (candidate && lowered.includes(candidate) && name) {
            return {
              name,
              region: data.region || data.region_name || '',
              commune: data.commune || data.commune_name || '',
              district: data.district || data.district_name || '',
            };
          }
        } catch {
          // skip invalid local record
        }
      }
    } catch {
      // ignore storage errors
    }
    return null;
  };

  const handleCodeChange = (value: string) => {
    updateField('codeProducteur', value);
    if (codeTimeoutRef.current) clearTimeout(codeTimeoutRef.current);
    codeTimeoutRef.current = setTimeout(() => lookupProducer(value), 400);
  };

  useEffect(() => {
    return () => {
      if (codeTimeoutRef.current) clearTimeout(codeTimeoutRef.current);
    };
  }, []);

  const updateField = (key: keyof InspectionData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const captureGPS = async () => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission refusée'); return; }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      updateField('gpsInspection', `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`);
      Alert.alert('GPS capturé', `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`);
    } catch {
      Alert.alert('Erreur GPS', 'Impossible de capturer la position');
    } finally {
      setLoadingGPS(false);
    }
  };

  const validateForm = (): string | null => {
    if (!form.nomProducteur?.trim()) return 'Le nom du producteur est obligatoire';
    if (!form.gpsInspection) return 'Le GPS inspection est obligatoire';
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation', error);
      return;
    }
    setSaving(true);
    try {
      const record = { ...form, createdAt: new Date().toISOString(), type: 'inspection' };
      addPendingRecord({
        type: 'inspection',
        data: JSON.stringify(record),
        createdAt: new Date().toISOString(),
      });
      Alert.alert('✅ Succès', 'Inspection enregistrée');
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const conformiteOptions = [
    { label: 'Conforme', icon: 'checkmark-circle', color: theme.success },
    { label: 'Non conforme', icon: 'close-circle', color: theme.error },
    { label: 'Partiel', icon: 'alert-circle', color: theme.warning },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Code producteur *</Text>
        <View style={styles.inputRow}>
          <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, flex: 1 }]}
            value={form.codeProducteur}
            onChangeText={handleCodeChange}
            placeholderTextColor={theme.textMuted}
            placeholder="Code producteur"
            autoCapitalize="characters"
          />
          {loadingProducer && <ActivityIndicator color={theme.primary} style={styles.inlineLoader} />}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Nom du producteur *</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form.nomProducteur}
          onChangeText={(v) => updateField('nomProducteur', v)}
          placeholderTextColor={theme.textMuted}
          placeholder="Nom et prénom"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Code unique parcelle</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form.codeUniqueParcelle} onChangeText={(v) => updateField('codeUniqueParcelle', v)}
          placeholderTextColor={theme.textMuted} placeholder="Code parcelle" />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Date d'inspection</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form.dateInspection} onChangeText={(v) => updateField('dateInspection', v)}
          placeholderTextColor={theme.textMuted} placeholder="JJ/MM/AAAA" />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Conformité</Text>
        <View style={styles.optionsRow}>
          {conformiteOptions.map(opt => (
            <TouchableOpacity
              key={opt.label}
              style={[
                styles.optionChip,
                { borderColor: theme.border, backgroundColor: theme.surface },
                form.conformite === opt.label && { backgroundColor: opt.color, borderColor: opt.color },
              ]}
              onPress={() => updateField('conformite', opt.label)}
            >
              <Ionicons
                name={opt.icon as any}
                size={16}
                color={form.conformite === opt.label ? '#fff' : opt.color}
              />
              <Text style={[
                styles.optionText,
                { color: theme.text },
                form.conformite === opt.label && { color: '#fff' },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Observations</Text>
        <TextInput style={[styles.input, styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form.observations} onChangeText={(v) => updateField('observations', v)}
          multiline numberOfLines={4} placeholderTextColor={theme.textMuted} placeholder="Détaillez vos observations..." />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Actions correctives</Text>
        <TextInput style={[styles.input, styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form.actionsCorrectives} onChangeText={(v) => updateField('actionsCorrectives', v)}
          multiline numberOfLines={3} placeholderTextColor={theme.textMuted} placeholder="Actions à entreprendre..." />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>GPS Inspection *</Text>
        <View style={styles.gpsRow}>
          <TextInput style={[styles.input, { flex: 1, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            value={form.gpsInspection} editable={false} placeholder="Appuyez pour capturer" placeholderTextColor={theme.textMuted} />
          <TouchableOpacity style={[styles.gpsButton, { backgroundColor: theme.success }]} onPress={captureGPS} disabled={loadingGPS}>
            {loadingGPS ? <ActivityIndicator color="#fff" size="small" /> :
              <Ionicons name="locate-outline" size={22} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Nom de l'inspecteur</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form.inspecteur} onChangeText={(v) => updateField('inspecteur', v)}
          placeholderTextColor={theme.textMuted} placeholder="Votre nom" />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.success }]}
        onPress={handleSubmit}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
        <Text style={styles.submitText}>{saving ? 'Enregistrement...' : "Enregistrer l'inspection"}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inlineLoader: { marginRight: 6 },
  textArea: { height: 100, textAlignVertical: 'top' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  optionText: { fontSize: 13, fontWeight: '600' },
  gpsRow: { flexDirection: 'row', gap: 8 },
  gpsButton: { borderRadius: 12, width: 52, justifyContent: 'center', alignItems: 'center' },
  submitButton: {
    borderRadius: 16, padding: 18, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});