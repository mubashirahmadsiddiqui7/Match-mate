// src/offline/TripQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createTrip } from '../services/trips';

const STORAGE_KEY = 'trip_queue_v1';

export type QueuedTrip = {
  localId: string;
  body: Record<string, any>;   // CreateTripBody
  createdAt: number;
  attempts: number;
  nextRetryAt?: number | null;
};

type QueueState = { items: QueuedTrip[] };

async function readQueue(): Promise<QueueState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    return JSON.parse(raw);
  } catch {
    return { items: [] };
  }
}

async function writeQueue(state: QueueState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  notify(); // let listeners refresh
}

/* ---------- Public helpers for UI ---------- */
export async function getQueuedItems(): Promise<QueuedTrip[]> {
  const s = await readQueue();
  // oldest first
  return s.items.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getQueueLength(): Promise<number> {
  const s = await readQueue();
  return s.items.length;
}

export async function enqueueTrip(body: Record<string, any>): Promise<QueuedTrip> {
  const s = await readQueue();
  const item: QueuedTrip = {
    localId: `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    body,
    createdAt: Date.now(),
    attempts: 0,
    nextRetryAt: null,
  };
  s.items.push(item);
  s.items.sort((a, b) => a.createdAt - b.createdAt);
  await writeQueue(s);
  return item;
}

export async function removeQueued(localId: string): Promise<void> {
  const s = await readQueue();
  s.items = s.items.filter(it => it.localId !== localId);
  await writeQueue(s);
}

export async function clearQueue(): Promise<void> {
  await writeQueue({ items: [] });
}

/* ---------- Retry & processing ---------- */
function isRetryDue(item: QueuedTrip): boolean {
  if (!item.nextRetryAt) return true;
  return Date.now() >= item.nextRetryAt;
}

// 5s, 15s, 30s, 60s (cap)
function computeNextDelay(attempts: number): number {
  if (attempts <= 0) return 5000;
  if (attempts === 1) return 15000;
  if (attempts === 2) return 30000;
  return 60000;
}

// Single-flight lock
let processing = false;

export async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return;

    let s = await readQueue();
    s.items.sort((a, b) => a.createdAt - b.createdAt);

    while (s.items.length > 0) {
      const ni = await NetInfo.fetch();
      if (!ni.isConnected) break;

      const item = s.items[0];
      if (!isRetryDue(item)) break;

      try {
        await createTrip(item.body as any);
        s.items.shift();
        await writeQueue(s);
      } catch (err: any) {
        const status = err?.response?.status ?? err?.status ?? 0;
        if (status >= 400 && status < 500) {
          // invalid payload, drop to unblock queue
          s.items.shift();
          await writeQueue(s);
          break;
        }
        item.attempts += 1;
        item.nextRetryAt = Date.now() + computeNextDelay(item.attempts);
        s.items[0] = item;
        await writeQueue(s);
        break;
      }
    }
  } finally {
    processing = false;
  }
}

/** Submit a single item now (ignores nextRetryAt); returns true on success */
export async function processOne(localId: string): Promise<boolean> {
  let s = await readQueue();
  const idx = s.items.findIndex(it => it.localId === localId);
  if (idx < 0) return false;

  const item = s.items[idx];
  try {
    await createTrip(item.body as any);
    s.items.splice(idx, 1);
    await writeQueue(s);
    return true;
  } catch (err: any) {
    const status = err?.response?.status ?? err?.status ?? 0;
    if (status >= 400 && status < 500) {
      // permanent error → drop
      s.items.splice(idx, 1);
      await writeQueue(s);
      return false;
    }
    // temporary → backoff
    item.attempts += 1;
    item.nextRetryAt = Date.now() + computeNextDelay(item.attempts);
    s.items[idx] = item;
    await writeQueue(s);
    return false;
  }
}

/* ---------- Live change listeners ---------- */
type Listener = (items: QueuedTrip[]) => void;
const listeners = new Set<Listener>();

function notify() {
  // Fire async to avoid blocking
  setTimeout(async () => {
    const items = await getQueuedItems();
    listeners.forEach(fn => {
      try { fn(items); } catch {}
    });
  }, 0);
}

/** Subscribe UI to queue changes */
export function onQueueChange(cb: Listener): () => void {
  listeners.add(cb);
  // push current state immediately
  getQueuedItems().then(cb).catch(() => {});
  return () => listeners.delete(cb);
}
