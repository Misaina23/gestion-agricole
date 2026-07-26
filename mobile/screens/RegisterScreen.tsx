import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { request } from '../lib/api-client';
import { API_URL } from '../lib/db';

export default function RegisterScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    region: '',
    commune: '',
    is_supervisor: false,
    is_admin: false,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (formData.password !== formData.password_confirm) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL.replace(/\/$/, '')}/api/accounts/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          platform: 'mobile',
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Succès',
          `Inscription réussie! Votre compte est en attente d'approbation.`,
          [{ text: 'OK', onPress: () => navigation.replace('Login') }]
        );
      } else {
        const error = await response.json().catch(() => ({}));
        Alert.alert('Erreur', error.detail || `Erreur lors de l'inscription`);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de se connecter au serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Créer un compte</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.row}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border, flex: 1, marginRight: 8 }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Prénom"
                value={formData.first_name}
                onChangeText={(v) => handleChange('first_name', v)}
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border, flex: 1, marginLeft: 8 }]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Nom"
                value={formData.last_name}
                onChangeText={(v) => handleChange('last_name', v)}
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Nom d'utilisateur *"
              value={formData.username}
              onChangeText={(v) => handleChange('username', v)}
              autoCapitalize="none"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email *"
              value={formData.email}
              onChangeText={(v) => handleChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Téléphone"
              value={formData.phone}
              onChangeText={(v) => handleChange('phone', v)}
              keyboardType="phone-pad"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Mot de passe *"
              value={formData.password}
              onChangeText={(v) => handleChange('password', v)}
              secureTextEntry={!showPassword}
              placeholderTextColor={theme.textMuted}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Confirmer le mot de passe *"
              value={formData.password_confirm}
              onChangeText={(v) => handleChange('password_confirm', v)}
              secureTextEntry={!showPasswordConfirm}
              placeholderTextColor={theme.textMuted}
            />
            <TouchableOpacity onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}>
              <Ionicons name={showPasswordConfirm ? 'eye-off' : 'eye'} size={20} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.checkboxRow}>
            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => handleChange('is_supervisor', !formData.is_supervisor)}
            >
              <View style={[styles.checkbox, formData.is_supervisor && { backgroundColor: theme.primary }]}>
                {formData.is_supervisor && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>Superviseur</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => handleChange('is_admin', !formData.is_admin)}
            >
              <View style={[styles.checkbox, formData.is_admin && { backgroundColor: theme.primary }]}>
                {formData.is_admin && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>Admin</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>Inscription...</Text>
            ) : (
              <>
                <Ionicons name="person-add-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>S'inscrire</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  formCard: {
    borderRadius: 20, padding: 20, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  row: { flexDirection: 'row', marginBottom: 14 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14,
    marginBottom: 14, height: 54,
  },
  input: { flex: 1, fontSize: 16 },
  checkboxRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  checkboxItem: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#888',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  checkboxLabel: { fontSize: 16 },
  button: {
    borderRadius: 14, padding: 16, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
