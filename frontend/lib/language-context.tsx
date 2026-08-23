// @ts-nocheck
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Locale = "fr" | "en";

type TranslationDictionary = {
  settings: string;
  manageSettings: string;
  profile: string;
  security: string;
  notifications: string;
  appearance: string;
  personalInfo: string;
  updateProfile: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  region: string;
  commune: string;
  save: string;
  securityTitle: string;
  securityDesc: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  changePassword: string;
  notifTitle: string;
  notifDesc: string;
  emailAlerts: string;
  emailAlertsDesc: string;
  reports: string;
  reportsDesc: string;
  sync: string;
  syncDesc: string;
  appearanceTitle: string;
  appearanceDesc: string;
  language: string;
  dateFormat: string;
  preferencesSaved: string;
  passwordUpdated: string;
  profileUpdated: string;
  passwordMismatch: string;
  passwordMinLength: string;
  passwordChangeError: string;
  loadError: string;
  retry: string;
  french: string;
  english: string;
  loading: string;
  online: string;
  logout: string;
  user: string;
  navigation: string;
  reports: string;
  system: string;
  overview: string;
  newWizard: string;
  producers: string;
  parcelsGps: string;
  parcelsMap: string;
  productions: string;
  inspections: string;
  aiAssistant: string;
  campaigns: string;
  inputs: string;
  deliveries: string;
  trainings: string;
  workflows: string;
  anomalies: string;
  history: string;
  administration: string;
  users: string;
  settings: string;
  restrictedAccess: string;
  restrictedAccessWorkflows: string;
  restrictedAccessAdmin: string;
  restrictedAccessUsers: string;
  welcome: string;
  dashboardOverview: string;
  activeProducers: string;
  noRegionalData: string;
  recentInspections: string;
  recentProducers: string;
  lastRegistered: string;
  add: string;
  viewAllProducers: string;
  viewDetails: string;
  edit: string;
  noRecentProducers: string;
  active: string;
  pending: string;
  inactive: string;
  alert: string;
  unknownRegion: string;
  parcels: string;
  surface: string;
  production: string;
  thisMonth: string;
  activeParcels: string;
  vanillaTrees: string;
  revenue: string;
  validated: string;
  waiting: string;
  alerts: string;
  noData: string;
  recent: string;
  quickSearch: string;
  noResults: string;
  noSearchResults: string;
  producer: string;
  filterByRegion: string;
  allRegions: string;
  geolocated: string;
  totalArea: string;
  searchParcel: string;
  loadingMap: string;
  noGeoParcels: string;
  monthlyReportGenerated: string;
  aiAssistantTitle: string;
  aiAssistantIntro: string;
  personalizedAdvice: string;
  basedOnCrops: string;
  generateMonthlyReport: string;
  recentRecommendations: string;
  noRecommendations: string;
  agriAdvice: string;
  noAdvice: string;
  viewAllAdvice: string;
  anomalyDetection: string;
  analyze: string;
  noAnalysis: string;
  lowYields: string;
  inactiveProducers: string;
  inconsistentRecords: string;
  detectedAt: string;
  generatedOn: string;
  yieldData: string;
  reportSummary: string;
  reportCreatedOn: string;
  dataUnavailable: string;
  fallow: string;
  new: string;
  high: string;
  medium: string;
  low: string;
  maintenance: string;
  sector: string;
  agent: string;
};

type TranslationKey = keyof TranslationDictionary;

const fr: TranslationDictionary = {
  settings: "Paramètres",
  manageSettings: "Gérer les paramètres du compte et de l'application",
  profile: "Profil",
  security: "Sécurité",
  notifications: "Notifications",
  appearance: "Apparence",
  personalInfo: "Informations Personnelles",
  updateProfile: "Mettez à jour vos informations de profil",
  firstName: "Prénom",
  lastName: "Nom",
  email: "Email",
  phone: "Téléphone",
  region: "Région",
  commune: "Commune",
  save: "Enregistrer",
  securityTitle: "Sécurité du Compte",
  securityDesc: "Modifiez votre mot de passe",
  currentPassword: "Mot de passe actuel",
  newPassword: "Nouveau mot de passe",
  confirmPassword: "Confirmer le nouveau mot de passe",
  changePassword: "Changer le mot de passe",
  notifTitle: "Préférences de Notifications",
  notifDesc: "Choisissez les notifications que vous souhaitez recevoir",
  emailAlerts: "Alertes par email",
  emailAlertsDesc: "Recevez des alertes importantes par email",
  reports: "Rapports périodiques",
  reportsDesc: "Recevez un résumé hebdomadaire",
  sync: "Synchronisation",
  syncDesc: "Notifications lors de la synchronisation des données",
  appearanceTitle: "Apparence",
  appearanceDesc: "Personnalisez l'apparence de l'application",
  language: "Langue",
  dateFormat: "Format de date",
  preferencesSaved: "Préférences enregistrées",
  passwordUpdated: "Mot de passe modifié avec succès",
  profileUpdated: "Profil mis à jour avec succès",
  passwordMismatch: "Les mots de passe ne correspondent pas",
  passwordMinLength: "Le mot de passe doit contenir au moins 8 caractères",
  passwordChangeError: "Erreur lors du changement de mot de passe. Vérifiez l'ancien mot de passe.",
  loadError: "Erreur lors du chargement des données",
  retry: "Réessayer",
  french: "Français",
  english: "Anglais",
  loading: "Chargement...",
  online: "En ligne",
  logout: "Déconnexion",
  user: "Utilisateur",
  navigation: "NAVIGATION",
  reports: "RAPPORTS",
  system: "SYSTÈME",
  overview: "Vue générale",
  newWizard: "Nouveau wizard",
  producers: "Producteurs",
  parcelsGps: "Parcelles GPS",
  parcelsMap: "Carte Parcelles",
  productions: "Productions",
  inspections: "Inspections",
  aiAssistant: "Assistant IA",
  campaigns: "Campagnes",
  inputs: "Intrants",
  deliveries: "Livraisons",
  trainings: "Formations",
  workflows: "Workflows",
  anomalies: "Anomalies",
  history: "Historique",
  administration: "Administration",
  users: "Utilisateurs",
  settings: "Paramètres",
  restrictedAccess: "Accès restreint",
  restrictedAccessWorkflows: "Seuls les administrateurs et managers peuvent accéder aux workflows.",
  restrictedAccessAdmin: "Seuls les administrateurs peuvent accéder à cette section.",
  restrictedAccessUsers: "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
  welcome: "Bienvenue",
  dashboardOverview: "Vue d'ensemble",
  activeProducers: "producteurs actifs",
  noRegionalData: "Aucune donnée régionale disponible.",
  recentInspections: "Inspections récentes",
  recentProducers: "Producteurs Récents",
  lastRegistered: "derniers enregistrés",
  add: "Ajouter",
  viewAllProducers: "Voir tous les producteurs",
  viewDetails: "Voir détails",
  edit: "Modifier",
  noRecentProducers: "Aucun producteur récent disponible.",
  active: "Actif",
  pending: "En attente",
  inactive: "Inactif",
  alert: "Alerte",
  unknownRegion: "Région inconnue",
  parcels: "parcelles",
  surface: "Superficie",
  production: "Production",
  thisMonth: "ce mois",
  activeParcels: "actives",
  vanillaTrees: "pieds vanille",
  revenue: "CA",
  validated: "validées",
  waiting: "en attente",
  alerts: "alertes",
  noData: "Aucune donnée disponible",
  recent: "récents",
  quickSearch: "Recherche rapide...",
  noResults: "Aucun résultat",
  noSearchResults: "Aucune parcelle trouvée pour cette recherche.",
  producer: "Producteur",
  filterByRegion: "Filtrer par région",
  allRegions: "Toutes les régions",
  geolocated: "Géolocalisées",
  totalArea: "Surface Totale",
  searchParcel: "Rechercher une parcelle par code, nom ou producteur...",
  loadingMap: "Chargement de la carte...",
  noGeoParcels: "Aucune parcelle géolocalisée disponible.",
  monthlyReportGenerated: "Rapport mensuel généré",
  aiAssistantTitle: "Assistant IA Agricole",
  aiAssistantIntro: "Basé sur vos cultures et données terrain",
  personalizedAdvice: "Conseils personnalisés",
  basedOnCrops: "Basés sur vos cultures et météo locale",
  generateMonthlyReport: "Générer le rapport mensuel",
  recentRecommendations: "Recommandations récentes",
  noRecommendations: "Aucune recommandation disponible",
  agriAdvice: "Conseils agricoles",
  noAdvice: "Aucun conseil disponible",
  viewAllAdvice: "Voir tous les conseils",
  anomalyDetection: "Détection d'anomalies",
  analyze: "Analyser",
  noAnalysis: "Aucune analyse lancée",
  lowYields: "Rendements faibles",
  inactiveProducers: "Producteurs inactifs",
  inconsistentRecords: "Données incohérentes",
  detectedAt: "Détecté",
  generatedOn: "Généré le",
  yieldData: "Données de rendement",
  reportSummary: "Résumé du rapport",
  reportCreatedOn: "Rapport généré le",
  dataUnavailable: "Données non disponibles",
  fallow: "En jachère",
  new: "Nouveau",
  high: "Élevée",
  medium: "Moyenne",
  low: "Faible",
  maintenance: "Maintenance",
  sector: "Secteur",
  agent: "Agent",
};

const en: TranslationDictionary = {
  ...fr,
  settings: "Settings",
  manageSettings: "Manage account and application settings",
  profile: "Profile",
  security: "Security",
  notifications: "Notifications",
  appearance: "Appearance",
  personalInfo: "Personal Information",
  updateProfile: "Update your profile information",
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  phone: "Phone",
  region: "Region",
  commune: "Commune",
  save: "Save",
  securityTitle: "Account Security",
  securityDesc: "Change your password",
  currentPassword: "Current password",
  newPassword: "New password",
  confirmPassword: "Confirm new password",
  changePassword: "Change password",
  notifTitle: "Notification Preferences",
  notifDesc: "Choose which notifications you want to receive",
  emailAlerts: "Email alerts",
  emailAlertsDesc: "Receive important alerts by email",
  reports: "Periodic reports",
  reportsDesc: "Receive a weekly summary",
  sync: "Synchronization",
  syncDesc: "Notifications when data is synchronized",
  appearanceTitle: "Appearance",
  appearanceDesc: "Customize the application appearance",
  language: "Language",
  dateFormat: "Date format",
  preferencesSaved: "Preferences saved",
  passwordUpdated: "Password updated successfully",
  profileUpdated: "Profile updated successfully",
  passwordMismatch: "Passwords do not match",
  passwordMinLength: "Password must contain at least 8 characters",
  passwordChangeError: "Error changing password. Check your current password.",
  loadError: "Error loading data",
  retry: "Retry",
  french: "French",
  english: "English",
  loading: "Loading...",
  online: "Online",
  logout: "Logout",
  user: "User",
  navigation: "NAVIGATION",
  reports: "REPORTS",
  system: "SYSTEM",
  overview: "Overview",
  newWizard: "New wizard",
  producers: "Producers",
  parcelsGps: "GPS parcels",
  parcelsMap: "Parcels map",
  productions: "Productions",
  inspections: "Inspections",
  aiAssistant: "AI Assistant",
  campaigns: "Campaigns",
  inputs: "Inputs",
  deliveries: "Deliveries",
  trainings: "Trainings",
  workflows: "Workflows",
  anomalies: "Anomalies",
  history: "History",
  administration: "Administration",
  users: "Users",
  settings: "Settings",
  restrictedAccess: "Restricted access",
  restrictedAccessWorkflows: "Only administrators and managers can access workflows.",
  restrictedAccessAdmin: "Only administrators can access this section.",
  restrictedAccessUsers: "You do not have the required permissions to access this page.",
  welcome: "Welcome",
  dashboardOverview: "Overview",
  activeProducers: "active producers",
  noRegionalData: "No regional data available.",
  recentInspections: "Recent inspections",
  recentProducers: "Recent Producers",
  lastRegistered: "last registered",
  add: "Add",
  viewAllProducers: "View all producers",
  viewDetails: "View details",
  edit: "Edit",
  noRecentProducers: "No recent producers available.",
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
  alert: "Alert",
  unknownRegion: "Unknown region",
  parcels: "parcels",
  surface: "Surface",
  production: "Production",
  thisMonth: "this month",
  activeParcels: "active",
  vanillaTrees: "vanilla trees",
  revenue: "Revenue",
  validated: "validated",
  waiting: "pending",
  alerts: "alerts",
  noData: "No data available",
  recent: "recent",
  quickSearch: "Quick search...",
  noResults: "No results",
  noSearchResults: "No parcels found for this search.",
  producer: "Producer",
  filterByRegion: "Filter by region",
  allRegions: "All regions",
  geolocated: "Geolocated",
  totalArea: "Total area",
  searchParcel: "Search a parcel by code, name or producer...",
  loadingMap: "Loading map...",
  noGeoParcels: "No geolocated parcels available.",
  monthlyReportGenerated: "Monthly report generated",
  aiAssistantTitle: "AI Agriculture Assistant",
  aiAssistantIntro: "Based on your crops and field data",
  personalizedAdvice: "Personalized advice",
  basedOnCrops: "Based on your crops and weather",
  generateMonthlyReport: "Generate monthly report",
  recentRecommendations: "Recent recommendations",
  noRecommendations: "No recommendations available",
  agriAdvice: "Agriculture advice",
  noAdvice: "No advice available",
  viewAllAdvice: "View all advice",
  anomalyDetection: "Anomaly detection",
  analyze: "Analyze",
  noAnalysis: "No analysis started",
  lowYields: "Low yields",
  inactiveProducers: "Inactive producers",
  inconsistentRecords: "Inconsistent records",
  detectedAt: "Detected",
  generatedOn: "Generated on",
  yieldData: "Yield data",
  reportSummary: "Report summary",
  reportCreatedOn: "Report created on",
  dataUnavailable: "Data unavailable",
  fallow: "Fallow",
  new: "New",
  high: "High",
  medium: "Medium",
  low: "Low",
  maintenance: "Maintenance",
  sector: "Sector",
  agent: "Agent",
};

const dictionaries: Record<Locale, TranslationDictionary> = { fr, en };

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("app_locale", next);
      document.documentElement.lang = next;
      document.documentElement.setAttribute("lang", next);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("app_locale") as Locale | null;
      if (stored === "fr" || stored === "en") {
        setLocaleState(stored);
        document.documentElement.lang = stored;
        document.documentElement.setAttribute("lang", stored);
      } else {
        document.documentElement.lang = "fr";
        document.documentElement.setAttribute("lang", "fr");
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.setAttribute("lang", locale);
    }
  }, [locale]);

  const t = (key: TranslationKey) => dictionaries[locale][key] ?? dictionaries.fr[key] ?? "";

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
