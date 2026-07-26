import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';

const DEFAULT_API_URL = 'http://192.168.1.131:8000';

export const normalizeApiUrl = (url: string) => url.replace(/\/$/, '');

export const API_URL = normalizeApiUrl(
  process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl || DEFAULT_API_URL
);


const db = SQLite.openDatabaseSync('agricollecte.db');

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS pending_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recordId INTEGER,
      endpoint TEXT,
      status TEXT,
      message TEXT,
      timestamp TEXT
    );
    CREATE TABLE IF NOT EXISTS modification_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recordType TEXT NOT NULL,
      recordId TEXT,
      action TEXT NOT NULL,
      oldData TEXT,
      newData TEXT,
      modifiedBy TEXT,
      modifiedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uri TEXT NOT NULL,
      uploadStatus TEXT DEFAULT 'pending',
      recordType TEXT,
      recordId TEXT,
      createdAt TEXT
    );
  `);
};

export interface PendingRecord {
  id?: number;
  type: string;
  data: string;
  createdAt: string;
  synced: number;
}

export const addPendingRecord = (record: Omit<PendingRecord, 'id' | 'synced'>) => {
  db.runSync(
    `INSERT INTO pending_records (type, data, createdAt, synced) VALUES (?, ?, ?, 0)`,
    record.type,
    record.data,
    record.createdAt,
  );
};

export const getPendingRecords = (): PendingRecord[] => {
  return db.getAllSync<PendingRecord>(
    `SELECT * FROM pending_records WHERE synced = 0`
  );
};

export const markSynced = (id: number) => {
  db.runSync(`UPDATE pending_records SET synced = 1 WHERE id = ?`, id);
};

export const clearSynced = () => {
  db.runSync(`DELETE FROM pending_records WHERE synced = 1`);
};

export interface SyncLog {
  id?: number;
  recordId?: number;
  endpoint: string;
  status: string;
  message: string;
  timestamp: string;
}

export const addSyncLog = (log: SyncLog) => {
  db.runSync(
    `INSERT INTO sync_logs (recordId, endpoint, status, message, timestamp) VALUES (?, ?, ?, ?, ?)`,
    log.recordId ?? null,
    log.endpoint,
    log.status,
    log.message,
    log.timestamp,
  );
};

export const getSyncLogs = (): SyncLog[] => {
  return db.getAllSync<SyncLog>(`SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT 100`);
};

export interface ModificationHistory {
  id?: number;
  recordType: string;
  recordId?: string;
  action: string;
  oldData?: string;
  newData: string;
  modifiedBy: string;
  modifiedAt: string;
}

export const addModificationHistory = (history: ModificationHistory) => {
  db.runSync(
    `INSERT INTO modification_history (recordType, recordId, action, oldData, newData, modifiedBy, modifiedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    history.recordType,
    history.recordId ?? null,
    history.action,
    history.oldData ?? null,
    history.newData,
    history.modifiedBy,
    history.modifiedAt,
  );
};

export const getModificationHistory = (recordType?: string, recordId?: string): ModificationHistory[] => {
  let query = 'SELECT * FROM modification_history WHERE 1=1';
  const params: any[] = [];

  if (recordType) {
    query += ' AND recordType = ?';
    params.push(recordType);
  }
  if (recordId) {
    query += ' AND recordId = ?';
    params.push(recordId);
  }
  query += ' ORDER BY modifiedAt DESC';

  return params.length
    ? db.getAllSync<ModificationHistory>(query, ...params)
    : db.getAllSync<ModificationHistory>(query);
};

export interface Photo {
  id?: number;
  uri: string;
  uploadStatus: string;
  recordType?: string;
  recordId?: string;
  createdAt: string;
}

export const addPhoto = (photo: Photo) => {
  db.runSync(
    `INSERT INTO photos (uri, uploadStatus, recordType, recordId, createdAt) VALUES (?, ?, ?, ?, ?)`,
    photo.uri,
    photo.uploadStatus,
    photo.recordType ?? null,
    photo.recordId ?? null,
    photo.createdAt,
  );
};

export const getPendingPhotos = (): Photo[] => {
  return db.getAllSync<Photo>(`SELECT * FROM photos WHERE uploadStatus = 'pending'`);
};

export const updatePhotoStatus = (id: number, status: string) => {
  db.runSync(`UPDATE photos SET uploadStatus = ? WHERE id = ?`, status, id);
};
