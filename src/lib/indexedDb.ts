import { REGIONAL_PACKS, SEED_BATCH_REGISTRY } from '../data/seedRegistry.ts';
import type { InspectorAlertPacket, RegionalPackMeta, SeedBatchRecord } from '../types.ts';

const DB_NAME = 'BeejRakshakDB';
const DB_VERSION = 1;

const STORES = {
  BATCHES: 'batches',
  SCAN_COUNTS: 'scanCounts',
  ALERTS: 'inspectorAlerts',
  PACKS: 'regionalPacks',
} as const;

interface ScanCountEntry {
  key: string;
  count: number;
  lastScannedAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.BATCHES)) {
        const batchStore = db.createObjectStore(STORES.BATCHES, { keyPath: 'id' });
        batchStore.createIndex('qrSerial', 'qrSerial', { unique: false });
        batchStore.createIndex('batchNumber', 'batchNumber', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.SCAN_COUNTS)) {
        db.createObjectStore(STORES.SCAN_COUNTS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.ALERTS)) {
        db.createObjectStore(STORES.ALERTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.PACKS)) {
        db.createObjectStore(STORES.PACKS, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function initializeOfflineDatabase(): Promise<{
  batches: SeedBatchRecord[];
  packs: RegionalPackMeta[];
}> {
  const db = await openDatabase();

  const existingBatches = await promisifyRequest<SeedBatchRecord[]>(
    db.transaction(STORES.BATCHES, 'readonly').objectStore(STORES.BATCHES).getAll()
  );

  if (existingBatches.length === 0) {
    const tx = db.transaction([STORES.BATCHES, STORES.PACKS], 'readwrite');
    const batchStore = tx.objectStore(STORES.BATCHES);
    for (const batch of SEED_BATCH_REGISTRY) {
      batchStore.put(batch);
    }
    const packStore = tx.objectStore(STORES.PACKS);
    for (const pack of REGIONAL_PACKS) {
      packStore.put(pack);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  const batches = await getAllBatches();
  const packs = await getAllPacks();
  return { batches, packs };
}

export async function getAllBatches(): Promise<SeedBatchRecord[]> {
  const db = await openDatabase();
  return promisifyRequest<SeedBatchRecord[]>(
    db.transaction(STORES.BATCHES, 'readonly').objectStore(STORES.BATCHES).getAll()
  );
}

export async function getAllPacks(): Promise<RegionalPackMeta[]> {
  const db = await openDatabase();
  const packs = await promisifyRequest<RegionalPackMeta[]>(
    db.transaction(STORES.PACKS, 'readonly').objectStore(STORES.PACKS).getAll()
  );
  return packs.length > 0 ? packs : REGIONAL_PACKS;
}

export async function syncRegionalPack(packId: string): Promise<RegionalPackMeta[]> {
  const db = await openDatabase();
  const tx = db.transaction([STORES.BATCHES, STORES.PACKS], 'readwrite');
  const batchStore = tx.objectStore(STORES.BATCHES);
  const packStore = tx.objectStore(STORES.PACKS);

  for (const b of SEED_BATCH_REGISTRY) {
    if (b.regionPack === packId || packId === 'all') {
      batchStore.put(b);
    }
  }

  const targetPacks = REGIONAL_PACKS.map((p) =>
    p.id === packId || packId === 'all'
      ? { ...p, downloaded: true, updatedAt: new Date().toISOString().slice(0, 10) }
      : p
  );
  for (const p of targetPacks) {
    packStore.put(p);
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  return getAllPacks();
}

export async function incrementLocalScanCount(key: string): Promise<number> {
  const normalized = key.trim().toUpperCase();
  if (!normalized) return 0;
  const db = await openDatabase();
  const store = db.transaction(STORES.SCAN_COUNTS, 'readwrite').objectStore(STORES.SCAN_COUNTS);
  const existing = await promisifyRequest<ScanCountEntry | undefined>(store.get(normalized));
  const nextCount = (existing?.count ?? 0) + 1;
  await promisifyRequest(
    store.put({
      key: normalized,
      count: nextCount,
      lastScannedAt: new Date().toISOString(),
    })
  );
  return nextCount;
}

export async function getLocalScanCount(key: string): Promise<number> {
  const normalized = key.trim().toUpperCase();
  if (!normalized) return 0;
  const db = await openDatabase();
  const entry = await promisifyRequest<ScanCountEntry | undefined>(
    db.transaction(STORES.SCAN_COUNTS, 'readonly').objectStore(STORES.SCAN_COUNTS).get(normalized)
  );
  return entry?.count ?? 0;
}

export async function saveLocalAlert(alert: InspectorAlertPacket): Promise<void> {
  const db = await openDatabase();
  await promisifyRequest(
    db.transaction(STORES.ALERTS, 'readwrite').objectStore(STORES.ALERTS).put(alert)
  );
}

export async function getLocalAlerts(): Promise<InspectorAlertPacket[]> {
  const db = await openDatabase();
  const alerts = await promisifyRequest<InspectorAlertPacket[]>(
    db.transaction(STORES.ALERTS, 'readonly').objectStore(STORES.ALERTS).getAll()
  );
  return alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
