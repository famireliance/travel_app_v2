/**
 * KIRATABI Offline Check-in & Sync Engine
 * 圏外環境でもGPS到達記録・写真を端末内（IndexedDB）に一時保存し、
 * 電波復帰（オンライン）時に自動同期します。
 */

export interface OfflineCheckinItem {
  id: string;
  islandId: string;
  islandName: string;
  latitude: number;
  longitude: number;
  photoDataUrl?: string;
  checkinDate: string; // 'YYYY.MM.DD'
  timestamp: number;
}

const DB_NAME = 'kiratabi_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_checkins';

// IndexedDB の初期化ヘルパー
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 圏外チェックインをIndexedDB（またはlocalStorageフォールバック）に保存
 */
export async function saveOfflineCheckin(
  item: Omit<OfflineCheckinItem, 'id' | 'timestamp'>
): Promise<OfflineCheckinItem> {
  const newItem: OfflineCheckinItem = {
    ...item,
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: Date.now(),
  };

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(newItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    return newItem;
  } catch (err) {
    console.warn('IndexedDB save failed, falling back to localStorage:', err);
    // localStorage フォールバック
    if (typeof window !== 'undefined') {
      const existingStr = localStorage.getItem('kiratabi_offline_checkins_fallback') || '[]';
      const list = JSON.parse(existingStr) as OfflineCheckinItem[];
      list.push(newItem);
      localStorage.setItem('kiratabi_offline_checkins_fallback', JSON.stringify(list));
    }
    return newItem;
  }
}

// 同時実行ロック（多重発火防止）
let isSyncInProgress = false;

/**
 * 保存されている未同期チェックインをすべて取得（IndexedDB + localStorageをマージ）
 */
export async function getOfflineCheckins(): Promise<OfflineCheckinItem[]> {
  const itemsMap = new Map<string, OfflineCheckinItem>();

  // 1. IndexedDB からの取得
  try {
    const db = await openDatabase();
    const idbItems = await new Promise<OfflineCheckinItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    idbItems.forEach((item) => itemsMap.set(item.id, item));
  } catch (err) {
    // IndexedDB非対応またはエラー時はスキップ
  }

  // 2. localStorage フォールバックからの取得とマージ
  if (typeof window !== 'undefined') {
    try {
      const existingStr = localStorage.getItem('kiratabi_offline_checkins_fallback') || '[]';
      const localItems = JSON.parse(existingStr) as OfflineCheckinItem[];
      localItems.forEach((item) => {
        if (!itemsMap.has(item.id)) {
          itemsMap.set(item.id, item);
        }
      });
    } catch {}
  }

  return Array.from(itemsMap.values());
}

/**
 * 同期完了したチェックインをキューから削除（IndexedDBとlocalStorage双方から確実に削除）
 */
export async function removeOfflineCheckin(id: string): Promise<void> {
  // 1. IndexedDB から削除
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}

  // 2. localStorage からも削除
  if (typeof window !== 'undefined') {
    try {
      const existingStr = localStorage.getItem('kiratabi_offline_checkins_fallback') || '[]';
      const list = JSON.parse(existingStr) as OfflineCheckinItem[];
      const filtered = list.filter((i) => i.id !== id);
      localStorage.setItem('kiratabi_offline_checkins_fallback', JSON.stringify(filtered));
    } catch {}
  }
}

/**
 * オンライン復帰時の自動同期関数（排他ロック付き）
 */
export async function syncOfflineQueue(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSyncItem: (item: OfflineCheckinItem) => Promise<boolean>
): Promise<{ syncedCount: number; errors: any[] }> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { syncedCount: 0, errors: [] };
  }

  if (isSyncInProgress) {
    return { syncedCount: 0, errors: [] };
  }

  isSyncInProgress = true;

  try {
    const items = await getOfflineCheckins();
    if (items.length === 0) return { syncedCount: 0, errors: [] };

    let syncedCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors: any[] = [];

    for (const item of items) {
      try {
        const success = await onSyncItem(item);
        if (success) {
          await removeOfflineCheckin(item.id);
          syncedCount++;
        }
      } catch (err) {
        console.error(`Failed to sync offline checkin for island ${item.islandName}:`, err);
        errors.push({ id: item.id, error: err });
      }
    }

    return { syncedCount, errors };
  } finally {
    isSyncInProgress = false;
  }
}
