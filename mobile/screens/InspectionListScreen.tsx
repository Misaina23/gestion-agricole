import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

interface Record {
  type: string; nomPrenom?: string; nomProducteur?: string;
  codeProducteur?: string; createdAt: string; conformite?: string;
}

export default function InspectionListScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [records, setRecords] = useState<Record[]>([]);
  const [filter, setFilter] = useState<'all' | 'collecte' | 'inspection'>('all');

  useFocusEffect(useCallback(() => { loadRecords(); }, []));

  const loadRecords = async () => {
    const data = await AsyncStorage.getItem('pending_records');
    const all = data ? JSON.parse(data) : [];
    setRecords(all.reverse());
  };

  const filtered = filter === 'all' ? records : records.filter(r => r.type === filter);

  const getConformiteStyle = (c?: string) => {
    if (c === 'Conforme') return { bg: theme.successBg, color: theme.success };
    if (c === 'Non conforme') return { bg: theme.errorBg, color: theme.error };
    return { bg: theme.warningBg, color: theme.warning };
  };

  const renderItem = ({ item }: { item: Record }) => {
    const isInspection = item.type === 'inspection';
    return (
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
        <View style={[styles.iconCircle, { backgroundColor: isInspection ? theme.accent : theme.primary }]}>
          <Ionicons name={isInspection ? 'clipboard-outline' : 'document-text-outline'} size={18} color="#fff" />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {isInspection ? 'Inspection' : 'Collecte'}
            </Text>
            <Text style={[styles.cardDate, { color: theme.textMuted }]}>
              {new Date(item.createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          <Text style={[styles.cardName, { color: theme.textSecondary }]}>
            {item.nomPrenom || item.nomProducteur || 'N/A'}
          </Text>
          <Text style={[styles.cardCode, { color: theme.textMuted }]}>
            Code: {item.codeProducteur || 'N/A'}
          </Text>
          {item.conformite && (() => {
            const s = getConformiteStyle(item.conformite);
            return (
              <View style={[styles.badge, { backgroundColor: s.bg }]}>
                <Text style={[styles.badgeText, { color: s.color }]}>{item.conformite}</Text>
              </View>
            );
          })()}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Filter tabs */}
      <View style={[styles.filterRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {(['all', 'collecte', 'inspection'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && { backgroundColor: theme.primary }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: theme.textMuted }, filter === f && { color: '#fff' }]}>
              {f === 'all' ? 'Tout' : f === 'collecte' ? 'Collectes' : 'Inspections'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('Inspection')}
        activeOpacity={0.85}
      >
        <Ionicons name="add-outline" size={22} color="#fff" />
        <Text style={styles.addText}>Nouvelle Inspection</Text>
      </TouchableOpacity>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.surfaceElevated }]}>
            <Ionicons name="folder-open-outline" size={48} color={theme.textMuted} />
          </View>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucun enregistrement</Text>
          <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
            Les collectes et inspections apparaîtront ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  filterRow: {
    flexDirection: 'row', borderRadius: 12, padding: 4,
    marginBottom: 14, borderWidth: 1,
  },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  filterText: { fontSize: 13, fontWeight: '600' },
  addButton: {
    borderRadius: 14, padding: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16,
  },
  addText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  card: {
    borderRadius: 14, padding: 16, flexDirection: 'row',
    alignItems: 'flex-start', gap: 12, marginBottom: 10, borderWidth: 1,
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardName: { fontSize: 14, marginTop: 3 },
  cardCode: { fontSize: 12, marginTop: 2 },
  cardDate: { fontSize: 11 },
  badge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, marginTop: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: 17, fontWeight: '700' },
  emptySubtext: { fontSize: 14, marginTop: 4 },
});
