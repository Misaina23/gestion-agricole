import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getSyncLogs, getModificationHistory, SyncLog, ModificationHistory } from '../lib/db';

export default function HistoryScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [modifications, setModifications] = useState<ModificationHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'sync' | 'modif'>('sync');

  useFocusEffect(useCallback(() => {
    const loadHistory = () => {
      setSyncLogs(getSyncLogs());
      setModifications(getModificationHistory());
    };
    loadHistory();
  }, []));

  const renderSyncLog = ({ item }: { item: SyncLog }) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: item.status === 'success' ? theme.successBg : theme.errorBg }]}>
        <Ionicons 
          name={item.status === 'success' ? 'checkmark-circle' : 'alert-circle'} 
          size={20} 
          color={item.status === 'success' ? theme.success : theme.error} 
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.endpoint}</Text>
        <Text style={[styles.cardStatus, { color: item.status === 'success' ? theme.success : theme.error }]}>
          {item.status}
        </Text>
        {item.message && <Text style={[styles.cardMessage, { color: theme.textMuted }]}>{item.message}</Text>}
        <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
          {new Date(item.timestamp).toLocaleString('fr-FR')}
        </Text>
      </View>
    </View>
  );

  const renderModification = ({ item }: { item: ModificationHistory }) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.infoBg }]}>
        <Ionicons name="document-text-outline" size={20} color={theme.info} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          {item.action} - {item.recordType}
        </Text>
        <Text style={[styles.cardStatus, { color: theme.info }]}>Par: {item.modifiedBy}</Text>
        <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
          {new Date(item.modifiedAt).toLocaleString('fr-FR')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.appBar, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.appBarBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Historique</Text>
      </View>
      <View style={[styles.tabs, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sync' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('sync')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'sync' ? '#fff' : theme.text }]}>Synchronisation</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'modif' && { backgroundColor: theme.primary }]}
          onPress={() => setActiveTab('modif')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'modif' ? '#fff' : theme.text }]}>Modifications</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'sync' ? (
        <FlatList
          data={syncLogs}
          renderItem={renderSyncLog}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={64} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucun historique</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={modifications}
          renderItem={renderModification}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={64} color={theme.textMuted} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucune modification</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 48, paddingBottom: 12, paddingHorizontal: 8, gap: 8 },
  appBarBtn: { padding: 8, borderRadius: 12 },
  appBarTitle: { color: '#fff', fontSize: 20, fontWeight: '700', flex: 1 },
  tabs: { flexDirection: 'row', margin: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  tab: { flex: 1, padding: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  iconCircle: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardStatus: { fontSize: 12, marginTop: 2 },
  cardMessage: { fontSize: 12, marginTop: 4 },
  cardDate: { fontSize: 11, marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
});
