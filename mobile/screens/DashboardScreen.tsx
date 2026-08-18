import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../lib/sync-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { initDB, getPendingRecords, markSynced, clearSynced, API_URL, addSyncLog, normalizeApiUrl } from '../lib/db';
import { request } from '../lib/api-client';

interface PendingRecord {
  id?: number;
  type: string;
  data: string;
  createdAt: string;
  synced: number;
}

const ActionCard = ({ icon, title, subtitle, onPress, theme }: any) => (
  <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.actionIcon, { backgroundColor: theme.navyMuted }]}>
      <Ionicons name={icon as any} size={22} color={theme.navy} />
    </View>
    <View style={styles.actionBody}>
      <Text style={[styles.actionTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.actionSub, { color: theme.textMuted }]}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
  </TouchableOpacity>
);

export default function DashboardScreen({ navigation }: any) {
  const { logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    initDB();
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    loadData();
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    const records = getPendingRecords();
    setPendingCount(records.length);
    const email = await AsyncStorage.getItem('user_email');
    setUserEmail(email || '');
  };

  const getEndpoint = (type: string): string => {
    switch (type) {
    case 'collecte': return '/api/mobile/collectes/sync/';
    case 'inspection': return '/api/mobile/field-inspections/sync/';
    case 'parcel': return '/api/mobile/parcels/sync/';
    case 'production': return '/api/mobile/productions/sync/';
    case 'cin_scan': return '/api/cin/scans/sync/';
    default: return '/api/mobile/collectes/sync/';
    }
  };

  const syncData = async () => {
    if (!isOnline) {
      Alert.alert('Hors ligne', 'Connexion internet requise pour synchroniser');
      return;
    }
    setSyncing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const records: PendingRecord[] = getPendingRecords();
      const token = await AsyncStorage.getItem('user_token');

      for (const record of records) {
        try {
          const endpoint = getEndpoint(record.type);
          const payload = JSON.parse(record.data);
          await request(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          await markSynced(record.id!);
          await addSyncLog({
            recordId: record.id,
            endpoint,
            status: 'success',
            message: 'Synchronisation réussie',
            timestamp: new Date().toISOString(),
          });
          successCount++;
        } catch (error: any) {
          await addSyncLog({
            recordId: record.id,
            endpoint: getEndpoint(record.type),
            status: 'error',
            message: error?.message || 'Échec de synchronisation',
            timestamp: new Date().toISOString(),
          });
          failCount++;
        }
      }

      if (successCount > 0) {
        await clearSynced();
      }
      setSyncedCount(prev => prev + successCount);
      setPendingCount(prev => Math.max(prev - successCount, 0));
      Alert.alert('Synchronisation', `${successCount} succès, ${failCount} échecs`);
    } catch (error: any) {
      Alert.alert('Erreur', error?.message || 'Échec de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const displayEmail = userEmail || 'Utilisateur';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerEmail, { color: theme.textSecondary }]} numberOfLines={1}>
            {displayEmail}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: isOnline ? theme.successBg : theme.errorBg }]}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? theme.success : theme.error }]} />
            <Text style={[styles.statusText, { color: isOnline ? theme.success : theme.error }]}>
              {isOnline ? 'En ligne' : 'Mode hors ligne'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={toggleTheme}
          >
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <View style={[styles.statIconWrap, { backgroundColor: theme.warningBg }]}>
            <Ionicons name="cloud-offline-outline" size={22} color={theme.warning} />
          </View>
          <Text style={[styles.statNumber, { color: theme.text }]}>{pendingCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Non synchronisées</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <View style={[styles.statIconWrap, { backgroundColor: theme.successBg }]}>
            <Ionicons name="cloud-done-outline" size={22} color={theme.success} />
          </View>
          <Text style={[styles.statNumber, { color: theme.text }]}>{syncedCount}</Text>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>Synchronisées</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: theme.navy }]}>Actions rapides</Text>

      <View style={styles.actionsGrid}>
        <ActionCard icon="add-circle-outline" title="Nouvelle Collecte" subtitle="Saisir les données producteur" onPress={() => navigation.navigate('Collecte')} theme={theme} />
        <ActionCard icon="clipboard-outline" title="Nouvelle Inspection" subtitle="Évaluer la conformité" onPress={() => navigation.navigate('Inspection')} theme={theme} />
        <ActionCard icon="qr-code-outline" title="Scanner QR" subtitle="Producteurs / Parcelles" onPress={() => navigation.navigate('QRScanner')} theme={theme} />
        <ActionCard icon="id-card-outline" title="Scanner CIN" subtitle="Lecture automatique" onPress={() => navigation.navigate('CINScan')} theme={theme} />
        <ActionCard icon="people-outline" title="Producteurs" subtitle="Rechercher et pré-remplir" onPress={() => navigation.navigate('ProducersList')} theme={theme} />
        <ActionCard icon="camera-outline" title="Photos" subtitle="Galerie ou appareil photo" onPress={() => navigation.navigate('PhotoUpload', { type: 'parcel' })} theme={theme} />
        <ActionCard icon="time-outline" title="Historique" subtitle="Voir l'historique" onPress={() => navigation.navigate('History')} theme={theme} />
      </View>

      <TouchableOpacity
        style={[styles.syncButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
        onPress={syncData}
        disabled={syncing}
        activeOpacity={0.85}
      >
        <Ionicons name={syncing ? 'sync-outline' : 'sync'} size={22} color={theme.navy} />
        <Text style={[styles.syncLabel, { color: theme.navy }]}>
          {syncing ? 'Synchronisation...' : 'Synchroniser les données'}
        </Text>
        {pendingCount > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.navy }]}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  headerEmail: { fontSize: 13, fontWeight: '500', marginRight: 10 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 18, alignItems: 'center',
    borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statIconWrap: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center',
    alignItems: 'center', marginBottom: 10,
  },
  statNumber: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  actionsGrid: { gap: 10, marginBottom: 16 },
  actionCard: {
    borderRadius: 14, padding: 16, flexDirection: 'row',
    alignItems: 'center', borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  actionBody: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '700' },
  actionSub: { fontSize: 12, marginTop: 2 },
  syncButton: {
    borderRadius: 14, padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginTop: 4, borderWidth: 1,
  },
  syncLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
  badge: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
