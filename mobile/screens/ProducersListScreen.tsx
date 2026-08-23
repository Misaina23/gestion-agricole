import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { request } from '../lib/api-client';
import { API_URL } from '../lib/db';

interface Producer {
  id: number;
  code: string;
  name: string;
  region?: string;
  commune?: string;
  phone?: string;
}

export default function ProducersListScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducers();
  }, []);

  const loadProducers = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('user_token');
      const url = search
        ? `${API_URL.replace(/\/$/, '')}/api/producers/?search=${encodeURIComponent(search)}`
        : `${API_URL.replace(/\/$/, '')}/api/producers/`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducers(data.results || data || []);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les producteurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducers();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Rechercher un producteur..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Chargement...</Text>
        </View>
      ) : producers.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="people-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucun producteur trouvé</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
          {producers.map(producer => (
            <TouchableOpacity
              key={producer.id}
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderLight }]}
              onPress={() => navigation.navigate('ProducerDetail', { producer })}
              activeOpacity={0.85}
            >
              <View style={[styles.iconWrap, { backgroundColor: theme.primaryMuted }]}>
                <Ionicons name="person-outline" size={20} color={theme.primary} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{producer.name}</Text>
                  <View style={[styles.badge, { backgroundColor: theme.successBg }]}>
                    <Text style={[styles.badgeText, { color: theme.success }]}>{producer.code}</Text>
                  </View>
                </View>
                {(producer.region || producer.commune) && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color={theme.textMuted} />
                    <Text style={[styles.locationText, { color: theme.textSecondary }]}>
                      {[producer.commune, producer.region].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                )}
                {producer.phone && (
                  <View style={styles.locationRow}>
                    <Ionicons name="call-outline" size={13} color={theme.textMuted} />
                    <Text style={[styles.locationText, { color: theme.textSecondary }]}>{producer.phone}</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, height: 50,
  },
  searchInput: { flex: 1, fontSize: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  emptyText: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  locationText: { fontSize: 12 },
});
