import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, TextInput, Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { request } from '@/lib/api-client';

interface Report {
  id: number;
  title: string;
  report_type: string;
  period_start: string;
  period_end: string;
  status: string;
  summary: string;
  created_at: string;
}

export default function AIReportsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [reportType, setReportType] = useState('global');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [region, setRegion] = useState('');

  const typeLabels: Record<string, string> = {
    producers: 'Producteurs',
    parcels: 'Parcelles',
    productions: 'Productions',
    inspections: 'Inspections',
    global: 'Global',
    region: 'Région',
  };

  const loadReports = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const data = await request<any>('/ai/reports/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(data.results || data || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      Alert.alert('Erreur', 'Veuillez remplir les dates');
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const body: any = {
        report_type: reportType,
        period_start: startDate,
        period_end: endDate,
        include_charts: true,
        include_recommendations: true,
      };
      if (region) body.region = region;

      await request('/ai/reports/generate_report/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      Alert.alert('Succès', 'Rapport généré avec succès');
      setModalVisible(false);
      loadReports();
    } catch {
      Alert.alert('Erreur', 'Connexion échouée');
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    completed: { color: theme.success, label: 'Terminé' },
    generating: { color: theme.warning, label: 'En cours' },
    pending: { color: theme.textMuted, label: 'En attente' },
    failed: { color: theme.error, label: 'Échec' },
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Rapports Intelligents</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Génération automatique de rapports mensuels
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.generateBtn, { backgroundColor: theme.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="document-text" size={20} color="#fff" />
        <Text style={styles.generateBtnText}>Générer un rapport</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Rapports récents</Text>

      {reports.map(report => {
        const sConfig = statusConfig[report.status] || statusConfig['pending'];
        return (
          <View
            key={report.id}
            style={[styles.reportCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={styles.reportHeader}>
              <View style={[styles.reportTypeBadge, { backgroundColor: theme.primaryMuted }]}>
                <Text style={[styles.reportTypeText, { color: theme.primary }]}>
                  {typeLabels[report.report_type] || report.report_type}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: sConfig.color }]}>
                <Text style={styles.statusText}>{sConfig.label}</Text>
              </View>
            </View>
            <Text style={[styles.reportTitle, { color: theme.text }]}>{report.title}</Text>
            <Text style={[styles.reportPeriod, { color: theme.textSecondary }]}>
              {report.period_start} â†’ {report.period_end}
            </Text>
            {report.summary && (
              <Text style={[styles.reportSummary, { color: theme.text }]}>{report.summary}</Text>
            )}
          </View>
        );
      })}

      {reports.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Aucun rapport généré pour le moment
          </Text>
        </View>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Nouveau Rapport</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.text }]}>Type de rapport</Text>
            <View style={styles.typeRow}>
              {Object.entries(typeLabels).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: reportType === key ? theme.primary : theme.inputBg,
                      borderColor: reportType === key ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setReportType(key)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: reportType === key ? '#fff' : theme.text },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.text }]}>Date de début</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2024-01-01"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.label, { color: theme.text }]}>Date de fin</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2024-12-31"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[styles.label, { color: theme.text }]}>Région (optionnel)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
              value={region}
              onChangeText={setRegion}
              placeholder="Ex: Diana"
              placeholderTextColor={theme.textMuted}
            />

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: theme.primary }]}
              onPress={generateReport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Générer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  generateBtn: {
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 20, marginVertical: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  reportCard: { marginHorizontal: 16, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  reportTypeBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  reportTypeText: { fontSize: 12, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  reportTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  reportPeriod: { fontSize: 12, marginBottom: 6 },
  reportSummary: { fontSize: 13, lineHeight: 18 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
  },
  typeChipText: { fontSize: 13, fontWeight: '600' },
  input: {
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, fontSize: 14,
  },
  submitBtn: {
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
    marginTop: 20, marginBottom: 12,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

