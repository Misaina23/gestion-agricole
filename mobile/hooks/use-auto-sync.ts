import { useEffect, useState, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { autoSync, type SyncResult } from '../lib/sync-service';
import { getPendingRecords } from '../lib/db';
import { useAuth } from '../lib/sync-service';

export function useAutoSync() {
  const { isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [errorShown, setErrorShown] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<Array<{ type: string; code?: string }>>([]);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false;
      setIsOnline(online);
      
      if (online && !hasSyncedRef.current) {
        hasSyncedRef.current = true;
        setTimeout(() => {
          handleSync();
        }, 1500);
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleSync = async () => {
    setSyncStatus('syncing');
    setGeneratedCodes([]);
    try {
      const records = getPendingRecords();
      setPendingCount(records.length);
      
      const result: SyncResult = await autoSync((success, failed, codes) => {
        setGeneratedCodes(codes);
        if (success > 0) {
          setSyncStatus('success');
        } else if (failed > 0 && records.length > 0) {
          setSyncStatus('error');
        } else {
          setSyncStatus('idle');
        }
      });
      setPendingCount(result.remaining);
    } catch {
      setSyncStatus('error');
    }
  };

  return { isOnline, syncStatus, pendingCount, generatedCodes, triggerSync: handleSync };
}
