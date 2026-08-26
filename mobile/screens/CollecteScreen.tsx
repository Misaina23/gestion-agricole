import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { addPendingRecord, initDB, getPendingRecords } from '../lib/db';
import { API_URL } from '../lib/db';
import ThemedDatePicker from '../components/ThemedDatePicker';

interface FormData {
  nomSite: string;
  nomPrenom: string;
  codeProducteur: string;
  telephone: string;
  dateIntegration: string;
  superficie: string;
  chiffreAffaires: string;
  dateDerniereInspection: string;
  codeUniqueParcelle: string;
  culture: string;
  interculture: string;
  nombreArbres: string;
  gpsParcelle1: string;
  gpsParcelle2: string;
  gpsParcelle3: string;
  gpsMenage: string;
  estimationRecolte: string;
  rendement: string;
  quantiteLivree: string;
  nomCI: string;
  commune: string;
  district: string;
  region: string;
  dateCollecte: string;
  agentCI: string;
}

const initialForm: FormData = {
  nomSite: '', nomPrenom: '', codeProducteur: '', telephone: '',
  dateIntegration: '', superficie: '', chiffreAffaires: '',
  dateDerniereInspection: '', codeUniqueParcelle: '', culture: '',
  interculture: '', nombreArbres: '', gpsParcelle1: '', gpsParcelle2: '',
  gpsParcelle3: '', gpsMenage: '', estimationRecolte: '', rendement: '',
  quantiteLivree: '', nomCI: '', commune: '', district: '', region: '',
  dateCollecte: '', agentCI: '',
};

type Tab = 'producer' | 'parcel' | 'financial';

const TAB_ITEMS: { key: Tab; label: string; icon: string }[] = [
  { key: 'producer', label: 'Producteur', icon: 'person-outline' },
  { key: 'parcel', label: 'Parcelle', icon: 'map-outline' },
  { key: 'financial', label: 'Finances', icon: 'cash-outline' },
];

export default function CollecteScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { alert } = useNotification();
  const [form, setForm] = useState<FormData>(initialForm);
  const [tab, setTab] = useState<Tab>('producer');
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [saving, setSaving] = useState(false);
  const [producerSearch, setProducerSearch] = useState('');
  const [producerResults, setProducerResults] = useState<any[]>([]);
  const [searchingProducer, setSearchingProducer] = useState(false);

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

  const searchProducers = useCallback(async (query: string) => {
    setProducerSearch(query);
    if (!query.trim()) {
      setProducerResults([]);
      return;
    }
    setSearchingProducer(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const baseUrl = `${API_URL.replace(/\/$/, '')}/api/producers/`;
      
      // Try exact code match first
      const exactUrl = `${baseUrl}?search=${encodeURIComponent(query.trim())}&page_size=1`;
      const exactRes = await fetch(exactUrl, { headers: { Authorization: `Bearer ${token}` } });
      let producerResults: any[] = [];
      if (exactRes.ok) {
        const data = await exactRes.json();
        producerResults = data.results || [];
      }
      
      // If no exact match, try broader search
      if (producerResults.length === 0) {
        const searchUrl = `${baseUrl}?search=${encodeURIComponent(query)}&page_size=10`;
        const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (searchRes.ok) {
          const data = await searchRes.json();
          producerResults = data.results || [];
        }
      }
      
      setProducerResults(producerResults);
      
      // Auto-fill if exact match found
      if (producerResults.length === 1) {
        const producer = producerResults[0];
        const exactMatch = producer.code?.toLowerCase() === query.trim().toLowerCase();
        if (exactMatch) {
          updateField('codeProducteur', producer.code);
          updateField('nomPrenom', producer.name || '');
          setProducerSearch(producer.code);
          setProducerResults([]);
        }
      }
    } catch {
      setProducerResults([]);
    } finally {
      setSearchingProducer(false);
    }
  }, []);

  const validateProducer = (): string | null => {
    if (!form.nomSite?.trim()) return 'Le nom du site est obligatoire';
    if (!form.nomPrenom?.trim()) return 'Le nom et prénom sont obligatoires';
    if (!form.dateCollecte?.trim()) return 'La date de collecte est obligatoire';
    if (!form.agentCI?.trim()) return 'Le nom de l\'agent / CI est obligatoires';
    return null;
  };

  const validateParcel = (): string | null => {
    if (!form.codeUniqueParcelle?.trim()) return 'Le code unique de la parcelle est obligatoire';
    if (!form.dateCollecte?.trim()) return 'La date de collecte est obligatoire';
    if (!form.agentCI?.trim()) return 'Le nom de l\'agent / CI est obligatoires';
    return null;
  };

  const validateFinancial = (): string | null => {
    if (!form.dateCollecte?.trim()) return 'La date de collecte est obligatoire';
    if (!form.agentCI?.trim()) return 'Le nom de l\'agent / CI est obligatoires';
    return null;
  };

  const saveProducer = async () => {
    const error = validateProducer();
    if (error) {
      Alert.alert('Validation', error);
      return;
    }
    setSaving(true);
    try {
      const record = {
        ...form,
        createdAt: new Date().toISOString(),
        type: 'collecte_producer',
      };
      addPendingRecord({
        type: 'collecte_producer',
        data: JSON.stringify(record),
        createdAt: new Date().toISOString(),
      });
      alert('Succès', 'Producteur enregistré localement', 'success');
      setForm(prev => ({ ...prev, nomSite: '', nomPrenom: '', telephone: '', region: '', district: '', commune: '' }));
    } catch {
      alert('Erreur', "Échec de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveParcel = async () => {
    const error = validateParcel();
    if (error) {
      Alert.alert('Validation', error);
      return;
    }
    setSaving(true);
    try {
      const record = {
        ...form,
        createdAt: new Date().toISOString(),
        type: 'collecte_parcel',
      };
      addPendingRecord({
        type: 'collecte_parcel',
        data: JSON.stringify(record),
        createdAt: new Date().toISOString(),
      });
      alert('Succès', 'Parcelle enregistrée localement', 'success');
      setForm(prev => ({ ...prev, codeUniqueParcelle: '', superficie: '', culture: '', interculture: '', nombreArbres: '', gpsParcelle1: '', gpsParcelle2: '', gpsParcelle3: '', gpsMenage: '' }));
    } catch {
      alert('Erreur', "Échec de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveFinancial = async () => {
    const error = validateFinancial();
    if (error) {
      Alert.alert('Validation', error);
      return;
    }
    setSaving(true);
    try {
      const record = {
        ...form,
        createdAt: new Date().toISOString(),
        type: 'collecte_financial',
      };
      addPendingRecord({
        type: 'collecte_financial',
        data: JSON.stringify(record),
        createdAt: new Date().toISOString(),
      });
      alert('Succès', 'Données financières enregistrées localement', 'success');
      setForm(prev => ({ ...prev, chiffreAffaires: '', estimationRecolte: '', rendement: '', quantiteLivree: '' }));
    } catch {
      alert('Erreur', "Échec de l'enregistrement", 'error');
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
          style={[styles.gpsButton, { backgroundColor: theme.navy }]}
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

  const renderProducerTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.sectionHeader, { borderBottomColor: theme.primaryMuted }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>👤 Informations Producteur</Text>
      </View>
      {renderInput('Nom du site *', 'nomSite')}
      {renderInput('Nom et prénom *', 'nomPrenom')}
      {renderInput('Téléphone', 'telephone', { keyboard: 'phone-pad' })}
      {renderInput('Code producteur', 'codeProducteur')}
      <ThemedDatePicker
        label="Date de collecte *"
        value={form.dateCollecte}
        onDateChange={(v) => updateField('dateCollecte', v)}
      />
      {renderInput('Nom de l\'agent / CI *', 'agentCI')}
      {renderInput('Commune', 'commune')}
      {renderInput('District', 'district')}
      {renderInput('Région', 'region')}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.navy }]}
        onPress={saveProducer}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
        <Text style={styles.submitText}>{saving ? 'Enregistrement...' : 'Enregistrer Producteur'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderParcelTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.sectionHeader, { borderBottomColor: theme.primaryMuted }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>🌱 Collecte Parcelle</Text>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Rechercher un producteur existant</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={producerSearch}
          onChangeText={searchProducers}
          placeholder="Code ou nom du producteur..."
          placeholderTextColor={theme.textMuted}
        />
        {searchingProducer && <ActivityIndicator color={theme.primary} style={{ marginTop: 8 }} />}
        {producerResults.length > 0 && (
          <View style={[styles.searchResults, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {producerResults.slice(0, 5).map((producer) => (
              <TouchableOpacity
                key={producer.id}
                style={styles.searchResultItem}
                onPress={() => {
                  updateField('codeProducteur', producer.code);
                  updateField('nomPrenom', producer.name || '');
                  setProducerSearch(producer.code);
                  setProducerResults([]);
                }}
              >
                <Text style={[styles.searchResultCode, { color: theme.primary }]}>{producer.code}</Text>
                <Text style={[styles.searchResultName, { color: theme.text }]}>{producer.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      {renderInput('Code unique parcelle *', 'codeUniqueParcelle')}
      {renderInput('Superficie (ha)', 'superficie', { keyboard: 'numeric' })}
      {renderInput('Culture', 'culture')}
      {renderInput('Interculture', 'interculture')}
      {renderInput("Nombre d'arbres", 'nombreArbres', { keyboard: 'numeric' })}
      <ThemedDatePicker
        label="Date de collecte *"
        value={form.dateCollecte}
        onDateChange={(v) => updateField('dateCollecte', v)}
      />
      {renderInput('Nom de l\'agent / CI *', 'agentCI')}
      <View style={[styles.sectionHeader, { borderBottomColor: theme.primaryMuted }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>📍 Coordonnées GPS</Text>
      </View>
      {renderGPSButton('GPS Parcelle 1 *', 'gpsParcelle1')}
      {renderGPSButton('GPS Parcelle 2', 'gpsParcelle2')}
      {renderGPSButton('GPS Parcelle 3', 'gpsParcelle3')}
      {renderGPSButton('GPS Ménage', 'gpsMenage')}
      {renderInput('Commune', 'commune')}
      {renderInput('District', 'district')}
      {renderInput('Région', 'region')}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.navy }]}
        onPress={saveParcel}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
        <Text style={styles.submitText}>{saving ? 'Enregistrement...' : 'Enregistrer Parcelle'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFinancialTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.sectionHeader, { borderBottomColor: theme.primaryMuted }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 Données Financières & Récolte</Text>
      </View>
      <ThemedDatePicker
        label="Date de collecte *"
        value={form.dateCollecte}
        onDateChange={(v) => updateField('dateCollecte', v)}
      />
      {renderInput('Nom de l\'agent / CI *', 'agentCI')}
      {renderInput("Chiffre d'affaires", 'chiffreAffaires', { keyboard: 'numeric' })}
      {renderInput('Estimation récolte', 'estimationRecolte')}
      {renderInput('Rendement', 'rendement')}
      {renderInput('Quantité livrée', 'quantiteLivree', { keyboard: 'numeric' })}
      <TouchableOpacity
        style={[styles.submitButton, { backgroundColor: theme.navy }]}
        onPress={saveFinancial}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
        <Text style={styles.submitText}>{saving ? 'Enregistrement...' : 'Enregistrer Finances'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    switch (tab) {
      case 'producer':
        return renderProducerTab();
      case 'parcel':
        return renderParcelTab();
      case 'financial':
        return renderFinancialTab();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.tabBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {TAB_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.tabItem,
                tab === item.key && { borderBottomColor: theme.navy, borderBottomWidth: 2 },
              ]}
              onPress={() => setTab(item.key)}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={tab === item.key ? theme.navy : theme.textMuted}
              />
              <Text style={[styles.tabLabel, { color: tab === item.key ? theme.navy : theme.textMuted }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {renderTabContent()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  tabContent: { flex: 1 },
  sectionHeader: { marginTop: 8, marginBottom: 14, paddingBottom: 8, borderBottomWidth: 1.5 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
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
  searchResults: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchResultCode: { fontSize: 13, fontWeight: '700' },
  searchResultName: { fontSize: 14, marginTop: 2 },
});
