import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { API_URL, addSyncLog, getPendingRecords, markSynced, clearSynced, normalizeApiUrl } from './db';
import { request } from './api-client';

// Cached credentials let privileged accounts (super admin, supervisors) reopen
// the app and work fully offline after they have authenticated once online.
const SECURE = {
  email: 'vid_offline_email',
  password: 'vid_offline_password',
  role: 'vid_offline_role',
  token: 'vid_offline_token',
  userId: 'vid_offline_userid',
};

async function cacheCredentials(email: string, password: string, role: string, token?: string, userId?: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(SECURE.email, email);
    await SecureStore.setItemAsync(SECURE.password, password);
    await SecureStore.setItemAsync(SECURE.role, role);
    if (token) await SecureStore.setItemAsync(SECURE.token, token);
    if (userId) await SecureStore.setItemAsync(SECURE.userId, String(userId));
  } catch {
    /* secure store unavailable (e.g. web) -> offline login simply disabled */
  }
}

async function getCachedCredentials(): Promise<{ email: string; password: string; role: string; token?: string; userId?: string } | null> {
  try {
    const email = await SecureStore.getItemAsync(SECURE.email);
    const password = await SecureStore.getItemAsync(SECURE.password);
    if (!email || !password) return null;
    return {
      email,
      password,
      role: (await SecureStore.getItemAsync(SECURE.role)) || 'admin',
      token: await SecureStore.getItemAsync(SECURE.token) || undefined,
      userId: await SecureStore.getItemAsync(SECURE.userId) || undefined,
    };
  } catch {
    return null;
  }
}

const restoreFromCache = async (
  setUser: (u: User | null) => void,
  email: string,
  role: string,
  token?: string,
  userId?: string,
): Promise<void> => {
  const validRoles: UserRole[] = ['agent', 'supervisor', 'admin'];
  const userRole = validRoles.includes(role as UserRole) ? (role as UserRole) : 'admin';
  await AsyncStorage.setItem('user_token', token || '');
  await AsyncStorage.setItem('user_email', email);
  await AsyncStorage.setItem('user_role', userRole);
  if (userId) await AsyncStorage.setItem('user_id', userId);
  setUser({ id: userId ? parseInt(userId, 10) : 0, email, role: userRole, token: token || '' });
};

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

export const syncPendingRecord = async (record: { id?: number; type: string; data: string }, token: string | null): Promise<any> => {
  const endpoint = getEndpoint(record.type);
  const payload = JSON.parse(record.data);

  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error('Pas de connexion internet');
  }

  if (!token || token === 'null' || token === 'undefined') {
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  const response = await request(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (record.id) {
    await markSynced(record.id);
  }

  return response;
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
        return;
      }

      // Offline restore: a privileged user who authenticated online before can
      // reopen the app without a network connection.
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        const cached = await getCachedCredentials();
        if (cached && cached.email) {
          await restoreFromCache(setUser, cached.email, cached.role, cached.token, cached.userId);
        }
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
      await cacheCredentials(email, password, userRole, data.access, data.user_id ? String(data.user_id) : undefined);
      return { success: true };
    } catch (error: any) {
      // Offline fallback: if the server is unreachable, a privileged user who
      // authenticated online before can still sign in using cached credentials.
      const netInfo = await NetInfo.fetch();
      const cached = await getCachedCredentials();
      if (!netInfo.isConnected && cached && cached.email === email && cached.password === password) {
        await restoreFromCache(setUser, cached.email, cached.role, cached.token, cached.userId);
        return { success: true };
      }
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

export interface SyncResult {
  remaining: number;
  successCount: number;
  failCount: number;
  generatedCodes: Array<{ type: string; code?: string }>;
}

export const autoSync = async (onSync?: (success: number, failed: number, codes: Array<{ type: string; code?: string }>) => void): Promise<SyncResult> => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    onSync?.(0, 0, []);
    return { remaining: 0, successCount: 0, failCount: 0, generatedCodes: [] };
  }

  const records = getPendingRecords();
  let token = await AsyncStorage.getItem('user_token');

  if (!token || token === 'null' || token === 'undefined' || records.length === 0) {
    onSync?.(0, 0, []);
    return { remaining: records.length, successCount: 0, failCount: 0, generatedCodes: [] };
  }

  if (token.split('.').length !== 3) {
    const refreshed = await refreshAuthToken();
    if (refreshed) {
      token = (await AsyncStorage.getItem('user_token')) || token;
    }
  }

  if (!token || token === 'null' || token === 'undefined') {
    onSync?.(0, 0, []);
    return { remaining: records.length, successCount: 0, failCount: 0, generatedCodes: [] };
  }

  let successCount = 0;
  let failCount = 0;
  let tokenRefreshed = false;
  const generatedCodes: Array<{ type: string; code?: string }> = [];

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
      if (data && typeof data === 'object') {
        const code = (data as any).code || (data as any).producer_code || (data as any).parcel_code;
        if (code) {
          generatedCodes.push({ type: record.type, code });
        }
      }
    } catch (error: any) {
      const isAuthError = /401|non authent|token|session expirée/i.test(error?.message || '');
      if (isAuthError && !tokenRefreshed) {
        tokenRefreshed = true;
        const ok = await refreshAuthToken();
        if (ok) {
          token = (await AsyncStorage.getItem('user_token')) || token;
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
            if (data && typeof data === 'object') {
              const code = (data as any).code || (data as any).producer_code || (data as any).parcel_code;
              if (code) {
                generatedCodes.push({ type: record.type, code });
              }
            }
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

  const remaining = getPendingRecords().length;
  onSync?.(successCount, failCount, generatedCodes);
  return { remaining, successCount, failCount, generatedCodes };
};

export const setupAutoSyncListener = (callback?: (count: number) => void) => {
  return NetInfo.addEventListener(state => {
    if (state.isConnected) {
      const records = getPendingRecords(); callback?.(records.length);
    }
  });
};
