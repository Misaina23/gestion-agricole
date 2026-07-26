import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput, Image, BackHandler,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { request } from '../lib/api-client';
import { useFocusEffect } from '@react-navigation/native';

interface Photo {
  uri: string;
  type?: string;
  name?: string;
}

export default function PhotoUploadScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const targetType = route?.params?.type || 'parcel';
  const targetId = route?.params?.id;

  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => {
        navigation.goBack();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => subscription.remove();
    }, [navigation])
  );

  useEffect(() => {
    requestPermission();
  }, []);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Activez l\'accès aux photos');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos(prev => [...prev, ...result.assets.map(a => ({
        uri: a.uri, type: a.mimeType, name: a.fileName || `photo_${Date.now()}.jpg`
      }))]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Activez l\'accès à la caméra');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos(prev => [...prev, {
        uri: result.assets[0].uri,
        type: result.assets[0].mimeType,
        name: result.assets[0].fileName || `photo_${Date.now()}.jpg`
      }]);
    }
  };

  const uploadPhotos = async () => {
    if (photos.length === 0) {
      Alert.alert('Aucune photo', 'Sélectionnez au moins une photo');
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const token = await AsyncStorage.getItem('user_token');
      let success = 0;
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const formData = new FormData();
        formData.append('photo', {
          uri: photo.uri,
          type: photo.type || 'image/jpeg',
          name: photo.name || `photo_${i}.jpg`,
        } as any);
        formData.append('caption', `Photo ${i + 1}`);
        formData.append('category', targetType);
        if (targetId) {
          formData.append(targetType === 'parcel' ? 'parcel' : 'producer', String(targetId));
        }
        const endpoint = targetType === 'parcel'
          ? `/api/parcels/${targetId}/add_photo/`
          : `/api/producers/${targetId}/add_photo/`;
        await request(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData as any,
        });
        success++;
        setProgress(Math.round(((i + 1) / photos.length) * 100));
      }
      Alert.alert('Upload terminé', `${success}/${photos.length} photos envoyées`);
      setPhotos([]);
    } catch {
      Alert.alert('Erreur', 'Échec de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Photos</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {targetType === 'parcel' ? 'Parcelle' : 'Producteur'}{targetId ? ` #${targetId}` : ''}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={pickImage}>
          <Ionicons name="images-outline" size={22} color="#fff" />
          <Text style={styles.actionBtnText}>Galerie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.success }]} onPress={takePhoto}>
          <Ionicons name="camera-outline" size={22} color="#fff" />
          <Text style={styles.actionBtnText}>Appareil photo</Text>
        </TouchableOpacity>
      </View>

      {photos.length > 0 && (
        <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: 16, gap: 10, marginBottom: 16 }}>
          {photos.map((photo, index) => (
            <View key={index} style={[styles.photoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(index)}>
                <Ionicons name="close-circle" size={22} color={theme.error} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {photos.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          {uploading && (
            <View style={{ height: 8, borderRadius: 4, backgroundColor: '#E0E0E0', marginBottom: 12, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${progress}%`, backgroundColor: theme.primary, borderRadius: 4 }} />
            </View>
          )}
          <TouchableOpacity
            style={[styles.uploadBtn, { backgroundColor: uploading ? theme.textMuted : theme.primary }]}
            onPress={uploadPhotos}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.uploadBtnText}>Envoyer {photos.length} photo(s)</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {photos.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="images-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Aucune photo sélectionnée</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  actionBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  photoCard: {
    width: 140, height: 140, borderRadius: 12, borderWidth: 1, overflow: 'hidden',
  },
  photoThumb: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 11 },
  uploadBtn: {
    paddingVertical: 16, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  uploadBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, marginTop: 12 },
});

