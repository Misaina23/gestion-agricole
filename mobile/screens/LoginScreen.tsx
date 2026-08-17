import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../lib/sync-service';

export default function LoginScreen({ navigation }: any) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        navigation.replace('Main');
      } else {
        Alert.alert('Erreur', result.error || 'Identifiants incorrects');
      }

    } catch {
      Alert.alert('Erreur', 'Connexion échouée');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={[styles.themeToggle, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]} onPress={toggleTheme}>
        <Ionicons name={isDark ? 'sunny' : 'moon'} size={24} color={theme.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.settingsLink, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]} onPress={() => navigation.navigate('Settings')}>
        <Ionicons name="options-outline" size={20} color={theme.primary} />
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: theme.primary }]}>VIDEEKO VANILLA</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Plateforme de gestion agricole
        </Text>
      </View>

      <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="mail-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={[styles.inputWrapper, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholderTextColor={theme.textMuted}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <Text style={styles.buttonText}>Connexion...</Text>
          ) : (
            <>
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Se connecter</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={[styles.registerText, { color: theme.primary }]}>
            Pas encore de compte? S'inscrire
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.version, { color: theme.textMuted }]}>v1.0.0 • Mode hors ligne disponible</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  themeToggle: { position: 'absolute', top: 56, right: 24, zIndex: 10, padding: 8, borderRadius: 999, borderWidth: 1 },
  settingsLink: { position: 'absolute', top: 56, left: 24, zIndex: 10, padding: 8, borderRadius: 999, borderWidth: 1 },
  logoContainer: { alignItems: 'center', marginBottom: 36, marginTop: 24 },
  logo: { width: 150, height: 150, marginBottom: 12 },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 4 },
  formCard: {
    borderRadius: 20, padding: 24, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14,
    marginBottom: 14, height: 54,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  button: {
    borderRadius: 14, padding: 16, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  registerLink: { marginTop: 16, alignItems: 'center' },
  registerText: { fontSize: 14, fontWeight: '600' },
  version: { textAlign: 'center', marginTop: 24, fontSize: 12 },
});
