import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { API_URL } from '../lib/db';

type Harvest = { period: string; crop_slot: string; estimated_yield?: number | null; actual_harvest?: number | null; actual_yield?: number | null; delivered_quantity?: number | null };
type Parcel = { id: number; code: string; area: number; main_crop?: string | null; intercrop?: string | null; conversion_status?: string | null; conversion_level?: string | null; latitude?: string | null; longitude?: string | null; estimated_yield?: number | null; register_harvests?: Harvest[] };

const label: Record<string, string> = { organic: 'Biologique', conversion: 'En conversion', conventional: 'Conventionnelle' };

export default function ProducerDetailScreen({ route }: any) {
  const { theme } = useTheme();
  const producer = route.params.producer;
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadParcels = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(false);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const response = await fetch(`${API_URL.replace(/\/$/, '')}/api/producers/${producer.id}/parcels/`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Chargement impossible');
      setParcels(await response.json());
    } catch { setError(true); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadParcels(); }, [producer.id]);

  const area = parcels.reduce((sum, parcel) => sum + Number(parcel.area || 0), 0);
  return <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadParcels(true)} tintColor={theme.primary} />}>
    <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.name, { color: theme.text }]}>{producer.name}</Text>
      <Text style={[styles.code, { color: theme.primary }]}>{producer.code}</Text>
      <View style={styles.metrics}><Metric label="Parcelles" value={String(parcels.length)} color={theme.text} /><Metric label="Surface totale" value={`${area.toFixed(2)} ha`} color={theme.text} /></View>
    </View>
    <Text style={[styles.heading, { color: theme.text }]}>Mes parcelles</Text>
    {loading ? <ActivityIndicator color={theme.primary} /> : error ? <Text style={{ color: theme.error }}>Impossible de charger les parcelles. Tirez pour réessayer.</Text> : parcels.length === 0 ? <Text style={{ color: theme.textMuted }}>Aucune parcelle renseignée</Text> : parcels.map(parcel => <View key={parcel.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.line}><Text style={[styles.parcelCode, { color: theme.text }]}>{parcel.code}</Text><Text style={[styles.area, { color: theme.primary }]}>{Number(parcel.area).toFixed(2)} ha</Text></View>
      <Text style={{ color: theme.textSecondary }}>{parcel.main_crop || 'Non renseigné'} {parcel.intercrop ? `· ${parcel.intercrop}` : ''}</Text>
      <Text style={[styles.small, { color: theme.textMuted }]}>{label[parcel.conversion_status || ''] || 'Non renseigné'}{parcel.conversion_level ? ` (${parcel.conversion_level})` : ''}</Text>
      <Text style={[styles.small, { color: theme.textMuted }]}><Ionicons name="location-outline" size={12} /> {parcel.latitude && parcel.longitude ? `${parcel.latitude}, ${parcel.longitude}` : 'GPS non renseigné'}</Text>
      {parcel.register_harvests?.filter(item => item.period === 'current').map(item => <Text key={`${item.period}-${item.crop_slot}`} style={[styles.small, { color: theme.textMuted }]}>Récolte {item.crop_slot === 'main' ? 'principale' : item.crop_slot}: {item.actual_harvest ?? 'Non renseigné'} kg · livré {item.delivered_quantity ?? 'Non renseigné'} kg</Text>)}
    </View>)}
  </ScrollView>;
}
function Metric({ label, value, color }: { label: string; value: string; color: string }) { return <View><Text style={styles.small}>{label}</Text><Text style={[styles.metric, { color }]}>{value}</Text></View>; }
const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: 16, gap: 12 }, summary: { borderWidth: 1, borderRadius: 14, padding: 16 }, name: { fontSize: 20, fontWeight: '700' }, code: { marginTop: 4, fontWeight: '700' }, metrics: { flexDirection: 'row', gap: 42, marginTop: 18 }, metric: { fontSize: 18, fontWeight: '700' }, heading: { fontSize: 17, fontWeight: '700', marginTop: 8 }, card: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 5 }, line: { flexDirection: 'row', justifyContent: 'space-between' }, parcelCode: { fontWeight: '700', fontSize: 16 }, area: { fontWeight: '700' }, small: { fontSize: 12, color: '#6b7280' } });
