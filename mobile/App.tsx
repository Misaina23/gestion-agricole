import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar, BackHandler, View } from 'react-native';
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
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { theme } = useTheme();
  const { hasRole, user } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Accueil') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Collecte') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'Inspections') iconName = focused ? 'clipboard' : 'clipboard-outline';
          else if (route.name === 'Producteurs') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'Historique') iconName = focused ? 'time' : 'time-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen name="Accueil" component={DashboardScreen} options={{ title: 'Tableau de bord' }} />
      <Tab.Screen name="Collecte" component={CollecteScreen} options={{ title: 'Nouvelle Collecte' }} />
      <Tab.Screen name="Inspections" component={InspectionListScreen} options={{ title: 'Inspections' }} />
      <Tab.Screen name="Producteurs" component={ProducersListScreen} options={{ title: 'Producteurs' }} />
      <Tab.Screen name="Historique" component={HistoryScreen} options={{ title: 'Historique' }} />
    </Tab.Navigator>
  );
}

// Tous les hooks de navigation/état sont appelés ICI, car ce composant est
// rendu À L'INTÉRIEUR du NavigationContainer (voir AppRoot).
function RootNavigator() {
  const { theme, isDark } = useTheme();
  const { isAuthenticated, loading } = useAuth();
  const { isOnline, syncStatus, pendingCount } = useAutoSync();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('success');

  useFocusEffect(
    React.useCallback(() => {
      const onBack = () => false;
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    if (syncStatus === 'success' && pendingCount > 0) {
      setNotificationType('success');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } else if (syncStatus === 'error') {
      setNotificationType('error');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
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
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Paramètres', headerStyle: { backgroundColor: theme.primary }, headerTintColor: '#fff' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Inspection"
              component={InspectionScreen}
              options={{
                headerShown: true,
                title: 'Nouvelle Inspection',
                headerStyle: { backgroundColor: theme.primary },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '700' },
              }}
            />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ headerShown: false }} />
            <Stack.Screen name="QRGenerator" component={QRGeneratorScreen} options={{ headerShown: true, title: 'Générer QR Code', headerStyle: { backgroundColor: theme.primary }, headerTintColor: '#fff' }} />
            <Stack.Screen name="ProducersList" component={ProducersListScreen} options={{ headerShown: true, title: 'Liste des producteurs', headerStyle: { backgroundColor: theme.primary }, headerTintColor: '#fff' }} />
            <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} options={{ headerShown: true, title: 'Ajouter des photos', headerStyle: { backgroundColor: theme.primary }, headerTintColor: '#fff' }} />
            <Stack.Screen name="CINScan" component={CINScanScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CINValidation" component={CINValidationScreen} options={{ headerShown: true, title: 'Vérification CIN', headerStyle: { backgroundColor: theme.primary }, headerTintColor: '#fff' }} />
            <Stack.Screen name="AIAdvice" component={AIAdviceScreen} options={{ headerShown: true, title: 'Conseils IA', headerStyle: { backgroundColor: theme.primary }, headerTintColor: '#fff' }} />
            <Stack.Screen name="AIReports" component={AIReportsScreen} options={{ headerShown: true, title: 'Rapports IA', headerStyle: { backgroundColor: theme.primary }, headerTintColor: '#fff' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Paramètres', headerStyle: { backgroundColor: theme.primary }, headerTintColor: '#fff' }} />
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

// Racine : Providers + NavigationContainer (une seule fois).
// Aucun hook de navigation n'est appelé ici, ni dans App().
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
