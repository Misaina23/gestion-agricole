import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface ThemedDatePickerProps {
  label: string;
  value: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
}

function parseDate(value: string): Date {
  if (!value) return new Date();
  const parts = value.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    if (day && month && year) {
      return new Date(year, month - 1, day);
    }
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function ThemedDatePicker({ label, value, onDateChange, placeholder = 'JJ/MM/AAAA' }: ThemedDatePickerProps) {
  const { theme, isDark } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const currentDateRef = useRef(parseDate(value));

  const displayValue = value || placeholder;

  const openPicker = () => {
    currentDateRef.current = parseDate(value);
    setShowPicker(true);
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      currentDateRef.current = selectedDate;
      onDateChange(formatDate(selectedDate));
    }
  };

  if (!showPicker) {
    return (
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        <TouchableOpacity
          onPress={openPicker}
          style={[styles.dateButton, { backgroundColor: theme.inputBg, borderColor: theme.border }]}
        >
          <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
          <Text style={[styles.dateText, { color: value ? theme.text : theme.textMuted }]}>
            {displayValue}
          </Text>
          <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <DateTimePicker
        value={currentDateRef.current}
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
        maximumDate={new Date()}
        onChange={handleChange}
        themeVariant={isDark ? 'dark' : 'light'}
        textColor={theme.text}
        accentColor={theme.navy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  dateButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, padding: 14, borderWidth: 1,
  },
  dateText: { flex: 1, fontSize: 15 },
});
