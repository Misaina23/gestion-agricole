import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';
import { request } from '@/lib/api-client';

interface Recommendation {
  id: number;
  title: string;
  description: string;
  priority: string;
  recommendation_type: string;
  is_read: boolean;
  is_applied: boolean;
  created_at: string;
}

export default function AIAdviceScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [tip, setTip] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDailyTip();
    loadRecommendations();
  }, []);

  const loadDailyTip = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const data = await request<{ tip: string }>('/api/ai/advice/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTip(data.tip);
    } catch {
      // silent
    }
  };

  const loadRecommendations = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const data = await request<any>('/api/ai/recommendations/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecommendations(data.results || data);
    } catch {
      // silent
    } finally {
      setRefreshing(false);
    }
  };

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const data = await request<any>('/api/ai/recommendations/generate_for_user/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      Alert.alert('Succès', data.message || `${data.count} recommandations générées`);
      loadRecommendations();
    } catch {
      Alert.alert('Erreur', 'Connexion échouée');
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      await request(`/api/ai/recommendations/${id}/mark_read/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecommendations(prev =>
        prev.map(r => (r.id === id ? { ...r, is_read: true } : r))
      );
    } catch {
      // silent
    }
  };

  const markApplied = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      await request(`/api/ai/recommendations/${id}/mark_applied/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecommendations(prev =>
        prev.map(r => (r.id === id ? { ...r, is_applied: true } : r))
      );
    } catch {
      // silent
    }
  };

  const priorityConfig: Record<string, { color: string; icon: string; label: string }> = {
    high: { color: theme.error, icon: 'alert-circle', label: 'Urgente' },
    medium: { color: theme.warning, icon: 'warning', label: 'Moyenne' },
    low: { color: theme.success, icon: 'checkmark-circle', label: 'Basse' },
    urgent: { color: theme.error, icon: 'alert', label: 'Urgente' },
  };

  const typeLabels: Record<string, string> = {
    yield: 'Rendement',
    cultural: 'Pratique culturale',
    pest: 'Parasite',
    weather: 'Météo',
    market: 'Marché',
    general: 'Général',
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Conseils Agricoles</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Recommandations intelligentes basées sur vos données
        </Text>
      </View>

      <View style={[styles.tipCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.tipHeader}>
          <Ionicons name="bulb" size={20} color={theme.warning} />
          <Text style={[styles.tipTitle, { color: theme.text }]}>Conseil du jour</Text>
        </View>
        <Text style={[styles.tipText, { color: theme.text }]}>{tip}</Text>
      </View>

      <TouchableOpacity
        style={[styles.generateBtn, { backgroundColor: theme.primary }]}
        onPress={generateRecommendations}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.generateBtnText}>Générer des recommandations</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Recommandations ({recommendations.length})
      </Text>

      {recommendations.length === 0 && !refreshing && (
        <View style={styles.emptyState}>
          <Ionicons name="leaf-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            Aucune recommandation. Générez-en pour commencer.
          </Text>
        </View>
      )}

      {recommendations.map(rec => {
        const pConfig = priorityConfig[rec.priority] || priorityConfig['medium'];
        const isApplied = rec.is_applied;
        return (
          <View
            key={rec.id}
            style={[
              styles.recCard,
              {
                backgroundColor: theme.surface,
                borderColor: isApplied ? theme.success : theme.border,
                opacity: isApplied ? 0.8 : 1,
              },
            ]}
          >
            <View style={styles.recHeader}>
              <View style={[styles.priorityBadge, { backgroundColor: pConfig.color }]}>
                <Ionicons name={pConfig.icon as any} size={14} color="#fff" />
                <Text style={styles.priorityText}>{pConfig.label}</Text>
              </View>
              <Text style={[styles.recType, { color: theme.textSecondary }]}>
                {typeLabels[rec.recommendation_type] || rec.recommendation_type}
              </Text>
            </View>
            <Text style={[styles.recTitle, { color: theme.text }]}>{rec.title}</Text>
            <Text style={[styles.recDesc, { color: theme.textSecondary }]}>
              {rec.description}
            </Text>
            <View style={styles.recActions}>
              {!rec.is_read && (
                <TouchableOpacity
                  style={[styles.recActionBtn, { backgroundColor: theme.primaryMuted }]}
                  onPress={() => markRead(rec.id)}
                >
                  <Text style={[styles.recActionText, { color: theme.primary }]}>Marquer lu</Text>
                </TouchableOpacity>
              )}
              {!rec.is_applied && (
                <TouchableOpacity
                  style={[styles.recActionBtn, { backgroundColor: theme.success }]}
                  onPress={() => markApplied(rec.id)}
                >
                  <Text style={[styles.recActionText, { color: '#fff' }]}>Appliqué</Text>
                </TouchableOpacity>
              )}
              {rec.is_applied && (
                <Text style={[styles.appliedText, { color: theme.success }]}>
                  <Ionicons name="checkmark-circle" size={16} /> Appliqué
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {refreshing && <ActivityIndicator style={{ marginVertical: 20 }} color={theme.primary} />}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  tipCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipTitle: { fontSize: 14, fontWeight: '700' },
  tipText: { fontSize: 14, lineHeight: 20 },
  generateBtn: {
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 20, marginVertical: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  recCard: { marginHorizontal: 16, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  recHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  priorityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  priorityText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  recType: { fontSize: 12 },
  recTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  recDesc: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  recActions: { flexDirection: 'row', gap: 10 },
  recActionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  recActionText: { fontSize: 13, fontWeight: '600' },
  appliedText: { fontSize: 13, fontWeight: '600' },
});

