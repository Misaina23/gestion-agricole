import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { CinResult, CinFieldKey, REQUIRED_FIELDS, MANUAL_REVIEW_THRESHOLD } from '../lib/cin/types';
import { FIELD_LABELS_FR } from '../lib/cin/labels';
import { computeAge, parseAndValidateDate } from '../lib/cin/validate';
import { saveCinScan } from '../lib/cin/storage';
import { useAuth } from '../lib/sync-service';

interface RouteParams {
  rectoResult?: CinResult;
  versoResult?: CinResult;
  mergedResult?: CinResult;
  rectoUri?: string;
  versoUri?: string;
  manualMode?: boolean;
}

const ALL_KEYS: CinFieldKey[] = [
  'nom', 'prenom', 'numero_cin', 'date_naissance', 'lieu_naissance', 'sexe',
  'pere', 'mere', 'profession', 'adresse', 'arrondissement',
  'date_delivrance', 'date_expiration',
];

export default function CINValidationScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const params = route.params as RouteParams;
  const merged = params.mergedResult || (params.rectoResult as CinResult);

  const [values, setValues] = useState<Record<CinFieldKey, string>>(() => {
    const init = {} as Record<CinFieldKey, string>;
    ALL_KEYS.forEach(k => (init[k] = merged.fields[k]?.value || ''));
    return init;
  });
  const [manualFlags, setManualFlags] = useState<Record<CinFieldKey, boolean>>(() => {
    const init = {} as Record<CinFieldKey, boolean>;
    ALL_KEYS.forEach(k => (init[k] = merged.fields[k]?.manual || params.manualMode || false));
    return init;
  });
  const [complementary, setComplementary] = useState({ telephone: '', email: '', observations: '' });
  const [saving, setSaving] = useState(false);

  const confidenceMap = useMemo(() => {
    const m: Record<string, number> = {};
    ALL_KEYS.forEach(k => (m[k] = merged.fields[k]?.confidence || 0));
    return m;
  }, [merged]);

  const age = useMemo(() => {
    const iso = parseAndValidateDate(values.date_naissance).iso;
    return iso ? computeAge(iso) : null;
  }, [values.date_naissance]);

  const updateField = (key: CinFieldKey, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setManualFlags(prev => ({ ...prev, [key]: true }));
  };

  const needsFlag = (key: CinFieldKey): 'none' | 'low' | 'missing' => {
    const conf = confidenceMap[key];
    const val = values[key];
    if (REQUIRED_FIELDS.includes(key) && !val.trim()) return 'missing';
    if (val.trim() && conf > 0 && conf < MANUAL_REVIEW_THRESHOLD) return 'low';
    return 'none';
  };

  const validate = (): string | null => {
    for (const f of REQUIRED_FIELDS) {
      if (!values[f].trim()) return `${FIELD_LABELS_FR[f]} est obligatoire`;
    }
    if (!complementary.telephone.trim()) return 'Le numéro de téléphone est obligatoire';
    const d = parseAndValidateDate(values.date_naissance);
    if (values.date_naissance && !d.valid) return 'Date de naissance invalide';
    return null;
  };

  const handleSave = () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation', err);
      return;
    }
    setSaving(true);
    try {
      const manualCorrections: Partial<Record<CinFieldKey, string>> = {};
      ALL_KEYS.forEach(k => {
        const original = merged.fields[k]?.value || '';
        if (manualFlags[k] && original !== values[k]) {
          manualCorrections[k] = original;
        }
      });

      const { age: computedAge } = saveCinScan({
        result: merged,
        rectoUri: params.rectoUri || '',
        versoUri: params.versoUri || '',
        manualMode: params.manualMode || false,
        agentId: user?.id ?? null,
        telephone: complementary.telephone,
        email: complementary.email,
        observations: complementary.observations,
        manualCorrections,
      });

      Alert.alert(
        'Lecture de la CIN réussie',
        `Veuillez compléter les informations complémentaires.\n\nÂge calculé : ${computedAge ?? '—'} ans`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  const confidenceColor = (c: number) => {
    if (c >= MANUAL_REVIEW_THRESHOLD) return theme.success;
    if (c >= 70) return theme.warning;
    return theme.error;
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <View style={[styles.header, { backgroundColor: theme.primaryMuted }]}>
        <Ionicons name="id-card-outline" size={22} color={theme.primary} />
        <Text style={[styles.headerText, { color: theme.primary }]}>
          Vérification CIN {params.manualMode ? '(saisie manuelle)' : ''}
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Informations extraites</Text>

      {ALL_KEYS.map(key => {
        const flag = needsFlag(key);
        const conf = confidenceMap[key];
        const isRequired = REQUIRED_FIELDS.includes(key);
        return (
          <View key={key} style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                {FIELD_LABELS_FR[key]}
                {isRequired && <Text style={{ color: theme.error }}> *</Text>}
              </Text>
              {values[key].trim() && (
                <View style={[styles.confBadge, { backgroundColor: confidenceColor(conf) + '22' }]}>
                  <Text style={[styles.confText, { color: confidenceColor(conf) }]}>{conf}%</Text>
                </View>
              )}
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  borderColor:
                    flag === 'missing' ? theme.error : flag === 'low' ? theme.warning : theme.border,
                  color: theme.text,
                },
              ]}
              value={values[key]}
              onChangeText={v => updateField(key, v)}
              placeholder={FIELD_LABELS_FR[key]}
              placeholderTextColor={theme.textMuted}
            />
            {flag === 'low' && (
              <Text style={[styles.hint, { color: theme.warning }]}>
                Confiance faible — vérifiez et corrigez si besoin
              </Text>
            )}
            {flag === 'missing' && isRequired && (
              <Text style={[styles.hint, { color: theme.error }]}>Champ obligatoire manquant</Text>
            )}
          </View>
        );
      })}

      {age !== null && (
        <View style={[styles.ageBox, { backgroundColor: theme.infoBg }]}>
          <Ionicons name="calendar-outline" size={18} color={theme.info} />
          <Text style={[styles.ageText, { color: theme.info }]}>Âge calculé : {age} ans</Text>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Informations complémentaires</Text>

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Téléphone *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={complementary.telephone}
          onChangeText={v => setComplementary(p => ({ ...p, telephone: v }))}
          keyboardType="phone-pad"
          placeholder="Téléphone"
          placeholderTextColor={theme.textMuted}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>E-mail</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={complementary.email}
          onChangeText={v => setComplementary(p => ({ ...p, email: v }))}
          keyboardType="email-address"
          placeholder="E-mail"
          placeholderTextColor={theme.textMuted}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Observations</Text>
        <TextInput
          style={[styles.input, styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
          value={complementary.observations}
          onChangeText={v => setComplementary(p => ({ ...p, observations: v }))}
          placeholder="Observations"
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={[styles.submit, { backgroundColor: theme.success }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? <ActivityIndicatorInline /> : <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />}
        <Text style={styles.submitText}>{saving ? 'Enregistrement…' : 'Enregistrer le bénéficiaire'}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function ActivityIndicatorInline() {
  return <View style={{ width: 22, height: 22 }} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, marginBottom: 16 },
  headerText: { fontWeight: '800', fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  fieldGroup: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  confBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  confText: { fontSize: 12, fontWeight: '800' },
  input: { borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1 },
  textArea: { height: 80, textAlignVertical: 'top' },
  hint: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  ageBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginTop: 8 },
  ageText: { fontWeight: '700' },
  submit: {
    borderRadius: 16, padding: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
