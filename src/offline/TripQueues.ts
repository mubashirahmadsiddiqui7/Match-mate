// src/offline/TripQueues.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createTrip, startTrip } from '../services/trips';
import { createFishingActivity } from '../services/fishingActivity';
import { createFishSpecies } from '../services/fishSpecies';

const STORAGE_KEY = 'trip_queue_v2';
const MAP_KEY = 'trip_queue_idmap_v1';

/** ---------------- Types ---------------- */
export type JobType =
  | 'createTrip'
  | 'startTrip'
  | 'createActivity'
  | 'createSpecies';

export type QueueJob = {
  localId: string;
  type: JobType;

  /** payload for the API call */
  body?: Record<string, any>;

  /** if server id already known, set it (e.g., startTrip when created online) */
  serverId?: number | null;

  /** this job depends on the serverId produced by the job with this localId */
  dependsOnLocalId?: string;

  createdAt: number;
  attempts: number;
  nextRetryAt?: number | null;
};

type QueueState = { items: QueueJob[] };

/** map of localId -> serverId (created once the upstream job succeeds) */
type IdMap = Record<string, number>;

/** ---------------- Storage helpers ---------------- */
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
  notify();
}

async function readMap(): Promise<IdMap> {
  try {
    const raw = await AsyncStorage.getItem(MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeMap(map: IdMap): Promise<void> {
  await AsyncStorage.setItem(MAP_KEY, JSON.stringify(map));
}

/** ---------------- Public UI helpers (kept) ---------------- */
export async function getQueuedItems(): Promise<QueueJob[]> {
  const s = await readQueue();
  return s.items.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getQueueLength(): Promise<number> {
  const s = await readQueue();
  return s.items.length;
}

export async function removeQueued(localId: string): Promise<void> {
  const s = await readQueue();
  s.items = s.items.filter(it => it.localId !== localId);
  await writeQueue(s);
}

export async function clearQueue(): Promise<void> {
  await writeQueue({ items: [] });
  await writeMap({});
}

/** ---------------- Enqueue helpers ---------------- */
function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** enqueue: Create Trip (same as your enqueueTrip, but returns localId) */
export async function enqueueTrip(body: Record<string, any>) {
  const s = await readQueue();
  const job: QueueJob = {
    localId: makeId('trip'),
    type: 'createTrip',
    body,
    createdAt: Date.now(),
    attempts: 0,
    nextRetryAt: null,
  };
  s.items.push(job);
  s.items.sort((a, b) => a.createdAt - b.createdAt);
  await writeQueue(s);
  return job;
}

/** enqueue: Start Trip — use serverId if known, else depend on the createTrip localId */
export async function enqueueStartTrip(opts: {
  serverId?: number;
  dependsOnLocalId?: string; // the localId of the createTrip job
}) {
  const s = await readQueue();
  // de-dupe (one start per create)
  if (opts.dependsOnLocalId) {
    const existing = s.items.find(
      j => j.type === 'startTrip' && j.dependsOnLocalId === opts.dependsOnLocalId,
    );
    if (existing) return existing;
  }
  const job: QueueJob = {
    localId: makeId('start'),
    type: 'startTrip',
    serverId: opts.serverId ?? null,
    dependsOnLocalId: opts.serverId ? undefined : opts.dependsOnLocalId,
    createdAt: Date.now(),
    attempts: 0,
    nextRetryAt: null,
  };
  s.items.push(job);
  s.items.sort((a, b) => a.createdAt - b.createdAt);
  await writeQueue(s);
  return job;
}

/** enqueue: Create Fishing Activity — depends on trip (server id) */
export async function enqueueCreateActivity(body: Record<string, any>, opts: {
  tripServerId?: number;
  tripLocalId?: string;
}) {
  const s = await readQueue();
  const job: QueueJob = {
    localId: makeId('activity'),
    type: 'createActivity',
    body,
    serverId: opts.tripServerId ?? null, // the *trip* server id for API body.trip_id resolution
    dependsOnLocalId: opts.tripServerId ? undefined : opts.tripLocalId,
    createdAt: Date.now(),
    attempts: 0,
    nextRetryAt: null,
  };
  s.items.push(job);
  s.items.sort((a, b) => a.createdAt - b.createdAt);
  await writeQueue(s);
  return job;
}

/** enqueue: Create Fish Species — depends on activity (server id) */
export async function enqueueCreateSpecies(body: Record<string, any>, opts: {
  activityServerId?: number;
  activityLocalId?: string;
}) {
  const s = await readQueue();
  const job: QueueJob = {
    localId: makeId('species'),
    type: 'createSpecies',
    body,
    serverId: opts.activityServerId ?? null, // the *activity* server id for API
    dependsOnLocalId: opts.activityServerId ? undefined : opts.activityLocalId,
    createdAt: Date.now(),
    attempts: 0,
    nextRetryAt: null,
  };
  s.items.push(job);
  s.items.sort((a, b) => a.createdAt - b.createdAt);
  await writeQueue(s);
  return job;
}

/** ---------------- Processing ---------------- */
function retryDue(j: QueueJob) {
  return !j.nextRetryAt || Date.now() >= j.nextRetryAt;
}

// 5s, 15s, 30s, 60s (cap)
function nextDelay(attempts: number) {
  if (attempts <= 0) return 5000;
  if (attempts === 1) return 15000;
  if (attempts === 2) return 30000;
  return 60000;
}

let processing = false;

export async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return;

    let q = await readQueue();
    q.items.sort((a, b) => a.createdAt - b.createdAt);

    // Try one item per tick (simple, safe)
    for (const job of [...q.items]) {
      const ni = await NetInfo.fetch();
      if (!ni.isConnected) break;
      if (!retryDue(job)) continue;

      const ok = await processOne(job.localId);
      if (!ok) break; // stop on failure/backoff to avoid hammering
    }
  } finally {
    processing = false;
  }
}

/** Submit a single item now (ignores nextRetryAt if due); returns true on success */
export async function processOne(localId: string): Promise<boolean> {
  const q = await readQueue();
  const idx = q.items.findIndex(it => it.localId === localId);
  if (idx < 0) return false;
  const job = q.items[idx];

  // resolve dependencies
  const idmap = await readMap();
  let resolvedId: number | undefined;

  if (job.serverId != null) {
    resolvedId = job.serverId || undefined;
  } else if (job.dependsOnLocalId) {
    resolvedId = idmap[job.dependsOnLocalId];
    if (resolvedId) {
      job.serverId = resolvedId;
      job.dependsOnLocalId = undefined;
      q.items[idx] = job;
      await writeQueue(q);
    }
  }

  try {
    switch (job.type) {
      case 'createTrip': {
        const res: any = await createTrip(job.body as any);
        const trip = res?.trip ?? res;
        const serverId = Number(trip?.id);
        if (!serverId) throw new Error('No server id from createTrip');
        // record mapping: localId (this job) -> server id for downstream jobs
        const map = await readMap();
        map[job.localId] = serverId;
        await writeMap(map);

        // also upgrade any waiting jobs that depend on this localId
        const q2 = await readQueue();
        q2.items.forEach(it => {
          if (it.dependsOnLocalId === job.localId) {
            it.serverId = serverId;
            it.dependsOnLocalId = undefined;
          }
        });
        await writeQueue({ items: q2.items.filter(j => j.localId !== job.localId) });
        return true;
      }

      case 'startTrip': {
        // need server trip id
        if (!resolvedId) {
          // still waiting for create
          job.attempts += 1;
          job.nextRetryAt = Date.now() + nextDelay(job.attempts);
          q.items[idx] = job;
          await writeQueue(q);
          return false;
        }
        await startTrip(resolvedId);
        q.items.splice(idx, 1);
        await writeQueue(q);
        return true;
      }

      case 'createActivity': {
        // needs trip server id to put into body.trip_id if missing
        if (!resolvedId && (job.dependsOnLocalId || job.serverId == null)) {
          job.attempts += 1;
          job.nextRetryAt = Date.now() + nextDelay(job.attempts);
          q.items[idx] = job;
          await writeQueue(q);
          return false;
        }
        const body = { ...(job.body || {}) };
        if (!body.trip_id && resolvedId) body.trip_id = resolvedId;
        const created: any = await createFishingActivity(body);
        const act = created?.data ?? created?.activity ?? created;
        const actId = Number(act?.id);
        if (actId) {
          // link local activity job id -> server activity id (lets species depend on it)
          const map = await readMap();
          map[job.localId] = actId;
          await writeMap(map);
          // upgrade species jobs waiting on this activity
          const q2 = await readQueue();
          q2.items.forEach(it => {
            if (it.dependsOnLocalId === job.localId) {
              it.serverId = actId;
              it.dependsOnLocalId = undefined;
            }
          });
          await writeQueue({ items: q2.items.filter(j => j.localId !== job.localId) });
        } else {
          // even if we didn't get the id, we consider success (server accepted). Remove to avoid deadlocks.
          q.items.splice(idx, 1);
          await writeQueue(q);
        }
        return true;
      }

      case 'createSpecies': {
        // needs activity server id
        if (!resolvedId) {
          job.attempts += 1;
          job.nextRetryAt = Date.now() + nextDelay(job.attempts);
          q.items[idx] = job;
          await writeQueue(q);
          return false;
        }
        const body = { ...(job.body || {}), activity_id: resolvedId };
        await createFishSpecies(resolvedId, body);
        q.items.splice(idx, 1);
        await writeQueue(q);
        return true;
      }

      default: {
        // unknown job type — drop
        q.items.splice(idx, 1);
        await writeQueue(q);
        return true;
      }
    }
  } catch (err: any) {
    const status = err?.response?.status ?? err?.status ?? 0;
    if (status >= 400 && status < 500 && job.type !== 'createSpecies') {
      // Permanent (most likely validation). Drop to unblock.
      q.items.splice(idx, 1);
      await writeQueue(q);
      return false;
    }
    job.attempts += 1;
    job.nextRetryAt = Date.now() + nextDelay(job.attempts);
    q.items[idx] = job;
    await writeQueue(q);
    return false;
  }
}

/** ---------------- Live change listeners (kept) ---------------- */
type Listener = (items: QueueJob[]) => void;
const listeners = new Set<Listener>();

function notify() {
  setTimeout(async () => {
    const items = await getQueuedItems();
    listeners.forEach(fn => {
      try { fn(items); } catch {}
    });
  }, 0);
}

export function onQueueChange(cb: Listener): () => void {
  listeners.add(cb);
  getQueuedItems().then(cb).catch(() => {});
  return () => listeners.delete(cb);
}
