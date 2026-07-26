import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export default function SettingsScreen({ navigation }: any) {
  const { theme, isDark, setLightTheme, setDarkTheme } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.text }]}>Paramètres</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Choisissez votre thème préféré.</Text>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <TouchableOpacity style={styles.optionRow} onPress={setLightTheme}>
          <View style={styles.optionTextRow}>
            <Ionicons name="sunny-outline" size={22} color={theme.primary} />
            <View style={styles.optionCopy}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Mode clair</Text>
              <Text style={[styles.optionSubtitle, { color: theme.textMuted }]}>Interface lumineuse</Text>
            </View>
          </View>
          { !isDark && <Ionicons name="checkmark-circle" size={22} color={theme.primary} /> }
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionRow} onPress={setDarkTheme}>
          <View style={styles.optionTextRow}>
            <Ionicons name="moon-outline" size={22} color={theme.primary} />
            <View style={styles.optionCopy}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>Mode sombre</Text>
              <Text style={[styles.optionSubtitle, { color: theme.textMuted }]}>Interface sombre</Text>
            </View>
          </View>
          { isDark && <Ionicons name="checkmark-circle" size={22} color={theme.primary} /> }
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.backButton, { borderColor: theme.border }]} onPress={() => navigation.goBack()}>
        <Text style={[styles.backButtonText, { color: theme.primary }]}>Retour</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 8 },
  optionTextRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  optionCopy: { marginLeft: 12 },
  optionTitle: { fontSize: 16, fontWeight: '700' },
  optionSubtitle: { fontSize: 13, marginTop: 2 },
  backButton: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
  backButtonText: { fontSize: 15, fontWeight: '700' },
});
