import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_URL, addSyncLog, getPendingRecords, markSynced, clearSynced, normalizeApiUrl } from './db';
import { request } from './api-client';

export type UserRole = 'agent' | 'supervisor' | 'admin';

interface User {
  id: number;
  email: string;
  role: UserRole;
  name?: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const apiBase = normalizeApiUrl(API_URL);

export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const refreshTokenValue = await AsyncStorage.getItem('refresh_token');
    if (!refreshTokenValue) return false;

    const data = await request<{ access: string }>('/api/token/refresh/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshTokenValue }),
    });
    await AsyncStorage.setItem('user_token', data.access);
    return true;
  } catch {
    return false;
  }
};

const getEndpoint = (type: string): string => {
    switch (type) {
      case 'collecte': return '/api/mobile/collectes/sync/';
      case 'inspection': return '/api/mobile/field-inspections/sync/';
      case 'parcel': return '/api/mobile/parcels/sync/';
      case 'production': return '/api/mobile/productions/sync/';
      case 'cin_scan': return '/api/cin/scans/sync/';
      default: return '/api/mobile/collectes/sync/';
    }
};

const getErrorMessage = async (response: Response) => {
  const text = await response.text();
  if (!text) return `HTTP ${response.status}`;
  try {
    const data = JSON.parse(text);
    return data.detail || data.error || data.message || JSON.stringify(data);
  } catch {
    return text;
  }
};

export const syncPendingRecord = async (record: { id?: number; type: string; data: string }, token: string | null): Promise<void> => {
  const endpoint = getEndpoint(record.type);
  const payload = JSON.parse(record.data);

  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error('Pas de connexion internet');
  }

  await request(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (record.id) {
    await markSynced(record.id);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      const email = await AsyncStorage.getItem('user_email');
      const role = await AsyncStorage.getItem('user_role');
      const userId = await AsyncStorage.getItem('user_id');

      if (token && email) {
        const validRoles: UserRole[] = ['agent', 'supervisor', 'admin'];
        const userRole = validRoles.includes(role as UserRole) ? (role as UserRole) : 'agent';
        setUser({
          id: userId ? parseInt(userId, 10) : 0,
          email,
          role: userRole,
          token,
        });
      }
    } catch (error) {
      console.error('Failed to load user', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await request<{ access: string; refresh: string; user_id?: number; role?: string }>('/api/token/', {
        method: 'POST',
        body: JSON.stringify({ username: email, password }),
      });
      const validRoles: UserRole[] = ['agent', 'supervisor', 'admin'];
      const userRole = validRoles.includes(data.role as UserRole) ? (data.role as UserRole) : 'agent';
      const userData: User = {
        id: data.user_id || 0,
        email,
        role: userRole,
        token: data.access,
      };
      setUser(userData);
      await AsyncStorage.setItem('user_token', data.access);
      await AsyncStorage.setItem('user_email', email);
      await AsyncStorage.setItem('user_role', userRole);
      if (data.user_id) await AsyncStorage.setItem('user_id', String(data.user_id));
      await AsyncStorage.setItem('refresh_token', data.refresh || '');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Connexion échouée' };
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.clear();
  };

  const refreshToken = async (): Promise<boolean> => {
    const ok = await refreshAuthToken();
    if (ok && user) {
      const newToken = await AsyncStorage.getItem('user_token');
      setUser({ ...user, token: newToken || user.token });
    }
    return ok;
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    const roleHierarchy: Record<UserRole, number> = { agent: 1, supervisor: 2, admin: 3 };
    const userLevel = roleHierarchy[user.role];
    return roles.some(r => roleHierarchy[r] <= userLevel);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshToken, isAuthenticated: !!user, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const getAuthToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem('user_token');
};

export const autoSync = async (onSync?: (success: number, failed: number) => void): Promise<void> => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) return;

  const records = getPendingRecords();
  let token = await AsyncStorage.getItem('user_token');

  if (!token || records.length === 0) return;

  let successCount = 0;
  let failCount = 0;
  let tokenRefreshed = false;

  for (const record of records) {
    try {
      const data = await syncPendingRecord(record, token);
      await addSyncLog({
        recordId: record.id,
        endpoint: getEndpoint(record.type),
        status: 'success',
        message: 'Synchronisation réussie',
        timestamp: new Date().toISOString(),
      });
      successCount++;
    } catch (error: any) {
      // Tentative de refresh une seule fois si le token est expiré (401)
      const isAuthError = /401|non authent|token/i.test(error?.message || '');
      if (isAuthError && !tokenRefreshed) {
        tokenRefreshed = true;
        const ok = await refreshAuthToken();
        if (ok) {
          token = (await AsyncStorage.getItem('user_token')) || token;
          try {
            await syncPendingRecord(record, token);
            await addSyncLog({
              recordId: record.id,
              endpoint: getEndpoint(record.type),
              status: 'success',
              message: 'Synchronisation réussie',
              timestamp: new Date().toISOString(),
            });
            successCount++;
            continue;
          } catch (retryErr: any) {
            await addSyncLog({
              recordId: record.id,
              endpoint: getEndpoint(record.type),
              status: 'error',
              message: retryErr?.message || 'Échec de synchronisation',
              timestamp: new Date().toISOString(),
            });
            failCount++;
            continue;
          }
        }
      }
      await addSyncLog({
        recordId: record.id,
        endpoint: getEndpoint(record.type),
        status: 'error',
        message: error?.message || 'Échec de synchronisation',
        timestamp: new Date().toISOString(),
      });
      failCount++;
    }
  }

  if (successCount > 0) {
    await clearSynced();
  }

  onSync?.(successCount, failCount);
};

export const setupAutoSyncListener = (callback?: (count: number) => void) => {
  return NetInfo.addEventListener(state => {
    if (state.isConnected) {
      const records = getPendingRecords(); callback?.(records.length);
    }
  });
};
