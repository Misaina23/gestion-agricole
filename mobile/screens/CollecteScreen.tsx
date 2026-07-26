import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { addPendingRecord, initDB } from '../lib/db';

interface FormData {
  nomSite: string; nomPrenom: string; codeProducteur: string; telephone: string;
  dateIntegration: string; superficie: string; chiffreAffaires: string;
  dateDerniereInspection: string; codeUniqueParcelle: string; culture: string;
  interculture: string; nombreArbres: string; gpsParcelle1: string;
  gpsParcelle2: string; gpsParcelle3: string; gpsMenage: string;
  estimationRecolte: string; rendement: string; quantiteLivree: string; nomCI: string;
  commune: string; district: string; region: string;
}

const initialForm: FormData = {
  nomSite: '', nomPrenom: '', codeProducteur: '', telephone: '',
  dateIntegration: '', superficie: '', chiffreAffaires: '',
  dateDerniereInspection: '', codeUniqueParcelle: '', culture: '',
  interculture: '', nombreArbres: '', gpsParcelle1: '', gpsParcelle2: '',
  gpsParcelle3: '', gpsMenage: '', estimationRecolte: '', rendement: '',
  quantiteLivree: '', nomCI: '', commune: '', district: '', region: '',
};

export default function CollecteScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const [form, setForm] = useState<FormData>(initialForm);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    initDB();
    let updates: Partial<FormData> = {};
    if (route?.params?.prefillProducer) {
      updates.codeProducteur = route.params.prefillProducer;
    }
    if (route?.params?.prefillParcel) {
      updates.codeUniqueParcelle = route.params.prefillParcel;
    }
    if (route?.params?.prefillData) {
      const data = route.params.prefillData as Partial<FormData>;
      if (data.nomPrenom) updates.nomPrenom = data.nomPrenom;
      if (data.telephone) updates.telephone = data.telephone;
      if (data.superficie) updates.superficie = data.superficie;
    }
    if (Object.keys(updates).length) {
      setForm(prev => ({ ...prev, ...updates }));
    }
  }, [route?.params]);

  const updateField = (key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const captureGPS = async (field: 'gpsParcelle1' | 'gpsParcelle2' | 'gpsParcelle3' | 'gpsMenage') => {
    setLoadingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Activez la localisation');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
      updateField(field, coords);

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const nextLocationData = {
        commune: geocode?.city || geocode?.subregion || geocode?.district || '',
        district: geocode?.subregion || geocode?.district || geocode?.city || '',
        region: geocode?.region || geocode?.subregion || '',
      };

      setForm(prev => ({ ...prev, ...nextLocationData }));
      Alert.alert('GPS capturé', `${coords}\nCommune: ${nextLocationData.commune || '—'}\nDistrict: ${nextLocationData.district || '—'}\nRégion: ${nextLocationData.region || '—'}`);
    } catch {
      Alert.alert('Erreur GPS', 'Impossible de capturer la position');
    } finally {
      setLoadingGPS(false);
    }
  };

  const validateForm = (): string | null => {
    if (!form.nomSite?.trim()) return 'Le nom du site est obligatoire';
    if (!form.nomPrenom?.trim()) return 'Le nom et prénom sont obligatoires';
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Validation', error);
      return;
    }
    if (!form.gpsParcelle1) {
      Alert.alert('GPS requis', 'Captez au moins le GPS Parcelle 1 avant d\'enregistrer');
      return;
    }
    setSaving(true);
    try {
      const record = { ...form, createdAt: new Date().toISOString(), type: 'collecte' };
      addPendingRecord({
        type: 'collecte',
        data: JSON.stringify(record),
        createdAt: new Date().toISOString(),
      });
      Alert.alert('✅ Succès', 'Données enregistrées localement');
      setForm(initialForm);
    } catch {
      Alert.alert('Erreur', "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (label: string, key: keyof FormData, options?: {
    keyboard?: 'default' | 'numeric' | 'phone-pad'; placeholder?: string;
  }) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
        value={form[key]}
        onChangeText={(v) => updateField(key, v)}
        keyboardType={options?.keyboard || 'default'}
        placeholder={options?.placeholder || label}
        placeholderTextColor={theme.textMuted}
      />
    </View>
  );

  const renderGPSButton = (label: string, field: 'gpsParcelle1' | 'gpsParcelle2' | 'gpsParcelle3' | 'gpsMenage') => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.gpsRow}>
        <TextInput
          style={[styles.input, styles.gpsInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={form[field]}
          editable={false}
          placeholder="Appuyez pour capturer"
          placeholderTextColor={theme.textMuted}
        />
        <TouchableOpacity
          style={[styles.gpsButton, { backgroundColor: theme.primary }]}
          onPress={() => captureGPS(field)}
          disabled={loadingGPS}
        >
          {loadingGPS ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="locate-outline" size={22} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <View style={[styles.sectionHeader, { borderBottomColor: theme.primaryMuted }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{icon} {title}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[styles.appBar, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.appBarBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Nouvelle Collecte</Text>
      </View>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={styles.content}
      >
      <SectionHeader icon="👤" title="Informations Producteur" />
      {renderInput('Nom du site *', 'nomSite')}
      {renderInput('Nom et prénom *', 'nomPrenom')}
      {renderInput("Code producteur (généré automatiquement)", 'codeProducteur')}
      {renderInput('Téléphone', 'telephone', { keyboard: 'phone-pad' })}
      {renderInput("Date d'intégration", 'dateIntegration', { placeholder: 'JJ/MM/AAAA' })}

      <SectionHeader icon="🌱" title="Parcelle" />
      {renderInput('Superficie (ha)', 'superficie', { keyboard: 'numeric' })}
      {renderInput('Code unique parcelle', 'codeUniqueParcelle')}
      {renderInput('Culture', 'culture')}
      {renderInput('Interculture', 'interculture')}
      {renderInput("Nombre d'arbres", 'nombreArbres', { keyboard: 'numeric' })}

      <SectionHeader icon="📍" title="Coordonnées GPS" />
      {renderGPSButton('GPS Parcelle 1 *', 'gpsParcelle1')}
      {renderGPSButton('GPS Parcelle 2', 'gpsParcelle2')}
      {renderGPSButton('GPS Parcelle 3', 'gpsParcelle3')}
      {renderGPSButton('GPS Ménage', 'gpsMenage')}
      {renderInput('Commune', 'commune')}
      {renderInput('District', 'district')}
      {renderInput('Région', 'region')}

      <SectionHeader icon="📊" title="Données Financières & Récolte" />
      {renderInput("Chiffre d'affaires", 'chiffreAffaires', { keyboard: 'numeric' })}
      {renderInput('Estimation récolte', 'estimationRecolte')}
      {renderInput('Rendement', 'rendement')}
      {renderInput('Quantité livrée', 'quantiteLivree', { keyboard: 'numeric' })}

      <SectionHeader icon="🔍" title="Inspection" />
      {renderInput('Date dernière inspection', 'dateDerniereInspection', { placeholder: 'JJ/MM/AAAA' })}
      {renderInput('Nom du CI', 'nomCI')}

      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.primary }]}
        onPress={handleSubmit}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
        <Text style={styles.submitText}>
          {saving ? 'Enregistrement...' : 'Enregistrer la collecte'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: {
    flexDirection: 'row', alignItems: 'center', paddingTop: 48,
    paddingBottom: 12, paddingHorizontal: 8, gap: 8,
  },
  appBarBtn: { padding: 8, borderRadius: 12 },
  appBarTitle: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1 },
  content: { padding: 16 },
  sectionHeader: { marginTop: 24, marginBottom: 14, paddingBottom: 8, borderBottomWidth: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  fieldGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1 },
  gpsRow: { flexDirection: 'row', gap: 8 },
  gpsInput: { flex: 1 },
  gpsButton: { borderRadius: 12, width: 52, justifyContent: 'center', alignItems: 'center' },
  submitButton: {
    borderRadius: 16, padding: 18, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});