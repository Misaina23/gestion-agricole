import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../theme/ThemeContext';
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

export default function DashboardScreen({ navigation }: any) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [userName, setUserName] = useState('');

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
    setUserName(email || 'Utilisateur');
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
    await AsyncStorage.clear();
    navigation.replace('Login');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: theme.textMuted }]}>Bonjour 👋</Text>
          <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={toggleTheme}
          >
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.statusBar, { backgroundColor: isOnline ? theme.statusOnline : theme.statusOffline }]}>
        <Ionicons name={isOnline ? 'cloud-done' : 'cloud-offline'} size={16} color="#fff" />
        <Text style={styles.statusText}>{isOnline ? 'Connecté' : 'Mode hors ligne'}</Text>
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <View style={[styles.cardIconWrap, { backgroundColor: theme.warningBg }]}>
            <Ionicons name="time-outline" size={24} color={theme.warning} />
          </View>
          <Text style={[styles.cardNumber, { color: theme.text }]}>{pendingCount}</Text>
          <Text style={[styles.cardLabel, { color: theme.textMuted }]}>En attente</Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}>
          <View style={[styles.cardIconWrap, { backgroundColor: theme.successBg }]}>
            <Ionicons name="checkmark-done-outline" size={24} color={theme.success} />
          </View>
          <Text style={[styles.cardNumber, { color: theme.text }]}>{syncedCount}</Text>
          <Text style={[styles.cardLabel, { color: theme.textMuted }]}>Synchronisées</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Actions rapides</Text>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('Collecte')}
        activeOpacity={0.85}
      >
        <View style={styles.actionLeft}>
          <Ionicons name="add-circle-outline" size={28} color="#fff" />
          <View>
            <Text style={styles.actionTitle}>Nouvelle Collecte</Text>
            <Text style={styles.actionSub}>Saisir les données producteur</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: theme.accent }]}
        onPress={() => navigation.navigate('Inspection')}
        activeOpacity={0.85}
      >
        <View style={styles.actionLeft}>
          <Ionicons name="clipboard-outline" size={28} color="#fff" />
          <View>
            <Text style={styles.actionTitle}>Nouvelle Inspection</Text>
            <Text style={styles.actionSub}>Évaluer la conformité</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: theme.info }]}
        onPress={() => navigation.navigate('QRScanner')}
        activeOpacity={0.85}
      >
        <View style={styles.actionLeft}>
          <Ionicons name="qr-code-outline" size={28} color="#fff" />
          <View>
            <Text style={styles.actionTitle}>Scanner QR Code</Text>
            <Text style={styles.actionSub}>Producteurs / Parcelles</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('CINScan')}
        activeOpacity={0.85}
      >
        <View style={styles.actionLeft}>
          <Ionicons name="id-card-outline" size={28} color="#fff" />
          <View>
            <Text style={styles.actionTitle}>Scanner la CIN</Text>
            <Text style={styles.actionSub}>Lecture automatique CIN malgache</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: theme.accent }]}
        onPress={() => navigation.navigate('ProducersList')}
        activeOpacity={0.85}
      >
        <View style={styles.actionLeft}>
          <Ionicons name="people-outline" size={28} color="#fff" />
          <View>
            <Text style={styles.actionTitle}>Liste producteurs</Text>
            <Text style={styles.actionSub}>Rechercher et pré-remplir</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: theme.success }]}
        onPress={() => navigation.navigate('PhotoUpload', { type: 'parcel' })}
        activeOpacity={0.85}
      >
        <View style={styles.actionLeft}>
          <Ionicons name="camera-outline" size={28} color="#fff" />
          <View>
            <Text style={styles.actionTitle}>Ajouter des photos</Text>
            <Text style={styles.actionSub}>Galerie ou appareil photo</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.syncCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
        onPress={syncData}
        disabled={syncing}
        activeOpacity={0.85}
      >
        <Ionicons name="sync-outline" size={24} color={theme.primary} />
          <Text style={[styles.syncText, { color: theme.primary }]}> 
          {syncing ? 'Synchronisation...' : 'Synchroniser les données'}
        </Text>
        {pendingCount > 0 && (
          <View style={[styles.pendingBadge, { backgroundColor: theme.warning }]}>
            <Text style={styles.pendingBadgeText}>{pendingCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={theme.error} />
        <Text style={[styles.logoutText, { color: theme.error }]}>Déconnexion</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerActions: { flexDirection: 'row', gap: 10 },
  greeting: { fontSize: 14 },
  userName: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  themeBtn: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  statusBar: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    borderRadius: 10, marginBottom: 20, gap: 8,
  },
  statusText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  card: {
    flex: 1, borderRadius: 16, padding: 20, alignItems: 'center',
    borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  cardNumber: { fontSize: 32, fontWeight: '800' },
  cardLabel: { fontSize: 13, marginTop: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionCard: {
    borderRadius: 16, padding: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  actionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  actionSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  syncCard: {
    borderRadius: 16, padding: 16, flexDirection: 'row',
    alignItems: 'center', gap: 12, marginTop: 10, borderWidth: 1,
  },
  syncText: { fontSize: 15, fontWeight: '600', flex: 1 },
  pendingBadge: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center',
  },
  pendingBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 28, padding: 14,
  },
  logoutText: { fontSize: 15, fontWeight: '600' },
});
