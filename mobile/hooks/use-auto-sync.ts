import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { autoSync } from '../lib/sync-service';
import { getPendingRecords } from '../lib/db';

export function useAutoSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false;
      setIsOnline(online);
      
      if (online) {
        handleSync();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      const records = getPendingRecords();
      setPendingCount(records.length);
      
      await autoSync((success, failed) => {
        if (success > 0) {
          setSyncStatus('success');
        } else if (failed > 0) {
          setSyncStatus('error');
        } else {
          setSyncStatus('idle');
        }
      });
    } catch {
      setSyncStatus('error');
    }
  };

  return { isOnline, syncStatus, pendingCount, triggerSync: handleSync };
}
