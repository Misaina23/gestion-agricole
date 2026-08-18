import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { useAutoSync } from './hooks/use-auto-sync';
import { ThemeProvider, useTheme } from './theme/ThemeContext';
import { AuthProvider, useAuth } from './lib/sync-service';
import NotificationBanner from './components/NotificationBanner';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import CollecteScreen from './screens/CollecteScreen';
import InspectionListScreen from './screens/InspectionListScreen';
import InspectionScreen from './screens/InspectionScreen';
import QRScannerScreen from './screens/QRScannerScreen';
import AIAdviceScreen from './screens/AIAdviceScreen';
import AIReportsScreen from './screens/AIReportsScreen';
import ProducersListScreen from './screens/ProducersListScreen';
import PhotoUploadScreen from './screens/PhotoUploadScreen';
import CINScanScreen from './screens/CINScanScreen';
import CINValidationScreen from './screens/CINValidationScreen';
import QRGeneratorScreen from './screens/QRGeneratorScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const { isOnline, syncStatus, pendingCount, triggerSync } = useAutoSync();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('success');
  const [errorShown, setErrorShown] = useState(false);

  useEffect(() => {
    if (syncStatus === 'success' && pendingCount > 0) {
      setNotificationType('success');
      setShowNotification(true);
      setErrorShown(false);
      setTimeout(() => setShowNotification(false), 3000);
    } else if (syncStatus === 'error' && !errorShown) {
      setNotificationType('error');
      setShowNotification(true);
      setErrorShown(true);
      setTimeout(() => setShowNotification(false), 4000);
    }
  }, [syncStatus]);

  useEffect(() => {
    if (syncStatus !== 'error') {
      setErrorShown(false);
    }
  }, [syncStatus]);

  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: theme.bg, card: theme.surface, text: theme.text, primary: theme.primary, border: theme.border } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.bg, card: theme.surface, text: theme.text, primary: theme.primary, border: theme.border } };

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Paramètres', headerStyle: { backgroundColor: theme.navy }, headerTintColor: '#fff' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={DashboardScreen} />
            <Stack.Screen
              name="Collecte"
              component={CollecteScreen}
              options={{
                headerShown: true,
                title: 'Nouvelle Collecte',
                headerStyle: { backgroundColor: theme.navy },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '700' },
              }}
            />
            <Stack.Screen name="InspectionList" component={InspectionListScreen} options={{ headerShown: true, title: 'Inspections', headerStyle: { backgroundColor: theme.navy }, headerTintColor: '#fff' }} />
            <Stack.Screen
              name="Inspection"
              component={InspectionScreen}
              options={{
                headerShown: true,
                title: 'Nouvelle Inspection',
                headerStyle: { backgroundColor: theme.navy },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '700' },
              }}
            />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ headerShown: false }} />
            <Stack.Screen name="QRGenerator" component={QRGeneratorScreen} options={{ headerShown: true, title: 'Générer QR Code', headerStyle: { backgroundColor: theme.navy }, headerTintColor: '#fff' }} />
            <Stack.Screen name="ProducersList" component={ProducersListScreen} options={{ headerShown: true, title: 'Liste des producteurs', headerStyle: { backgroundColor: theme.navy }, headerTintColor: '#fff' }} />
            <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} options={{ headerShown: true, title: 'Ajouter des photos', headerStyle: { backgroundColor: theme.navy }, headerTintColor: '#fff' }} />
            <Stack.Screen name="CINScan" component={CINScanScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CINValidation" component={CINValidationScreen} options={{ headerShown: true, title: 'Vérification CIN', headerStyle: { backgroundColor: theme.navy }, headerTintColor: '#fff' }} />
            <Stack.Screen name="AIAdvice" component={AIAdviceScreen} options={{ headerShown: true, title: 'Conseils IA', headerStyle: { backgroundColor: theme.navy }, headerTintColor: '#fff' }} />
            <Stack.Screen name="AIReports" component={AIReportsScreen} options={{ headerShown: true, title: 'Rapports IA', headerStyle: { backgroundColor: theme.navy }, headerTintColor: '#fff' }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: true, title: 'Historique', headerStyle: { backgroundColor: theme.navy }, headerTintColor: '#fff' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Paramètres', headerStyle: { backgroundColor: theme.navy }, headerTintColor: '#fff' }} />
          </>
        )}
      </Stack.Navigator>

      <NotificationBanner
        visible={showNotification}
        message={syncStatus === 'success' ? 'Synchronisation réussie' : 'Échec de synchronisation'}
        type={notificationType}
      />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
