import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Theme {
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  textSecondary: string;
  primary: string;
  primaryMuted: string;
  border: string;
  borderLight: string;
  tabBar: string;
  tabBarBorder: string;
  surfaceElevated: string;
  success: string;
  warning: string;
  error: string;
  accent: string;
  info: string;
  statusOnline: string;
  statusOffline: string;
  successBg: string;
  warningBg: string;
  errorBg: string;
  accentBg: string;
  infoBg: string;
  inputBg: string;
  navy: string;
  navyMuted: string;
}

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setLightTheme: () => void;
  setDarkTheme: () => void;
}

const STORAGE_KEY = 'agri_app_theme_preference';

const lightTheme: Theme = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  textSecondary: '#475569',
  primary: '#1E3A8A',
  primaryMuted: '#E0E7FF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  accent: '#1E3A8A',
  info: '#1E3A8A',
  statusOnline: '#16A34A',
  statusOffline: '#64748B',
  successBg: '#DCFCE7',
  warningBg: '#FEF3C7',
  errorBg: '#FEE2E2',
  accentBg: '#E0E7FF',
  infoBg: '#E0E7FF',
  inputBg: '#F1F5F9',
  navy: '#1E3A8A',
  navyMuted: '#E0E7FF',
};

const darkTheme: Theme = {
  bg: '#0B1220',
  surface: '#111827',
  surfaceElevated: '#1F2937',
  text: '#F8FAFC',
  textMuted: '#CBD5E1',
  textSecondary: '#E2E8F0',
  primary: '#60A5FA',
  primaryMuted: '#1E3A8A',
  border: '#334155',
  borderLight: '#475569',
  tabBar: '#111827',
  tabBarBorder: '#334155',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  accent: '#60A5FA',
  info: '#60A5FA',
  statusOnline: '#34D399',
  statusOffline: '#94A3B8',
  successBg: '#14532D',
  warningBg: '#78350F',
  errorBg: '#7F1D1D',
  accentBg: '#1E3A8A',
  infoBg: '#1E3A8A',
  inputBg: '#1F2937',
  navy: '#60A5FA',
  navyMuted: '#1E3A8A',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function loadPreference() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'dark') {
          setIsDark(true);
        } else if (stored === 'light') {
          setIsDark(false);
        } else {
          setIsDark(systemScheme === 'dark');
        }
      } catch {
        setIsDark(systemScheme === 'dark');
      } finally {
        setInitialized(true);
      }
    }

    loadPreference();
  }, [systemScheme]);

  const persistTheme = async (value: 'light' | 'dark') => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore persistence failure, fallback to in-memory theme.
    }
  };

  const setDarkTheme = () => {
    setIsDark(true);
    persistTheme('dark');
  };

  const setLightTheme = () => {
    setIsDark(false);
    persistTheme('light');
  };

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    persistTheme(nextTheme ? 'dark' : 'light');
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setLightTheme, setDarkTheme }}>
      {initialized ? children : null}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
