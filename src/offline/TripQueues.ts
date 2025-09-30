// src/offline/TripQueues.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { createTrip, startTrip } from '../services/trips';
import { createFishingActivity, completeFishingActivity } from '../services/fishingActivity';
import { createFishSpecies } from '../services/fishSpecies';

const STORAGE_KEY = 'trip_queue_v3';
const MAP_KEY = 'trip_queue_idmap_v2';

/** ---------------- Types ---------------- */
export type JobType =
  | 'createTrip'
  | 'startTrip'
  | 'createActivity'
  | 'createSpecies'
  | 'completeActivity';

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
  
  /** Additional metadata for better tracking */
  metadata?: {
    tripId?: string;
    activityId?: string;
    description?: string;
  };
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

/** Count queued createActivity jobs for a given trip (server or local id) */
export async function countQueuedActivitiesForTrip(opts: { tripServerId?: number; tripLocalId?: string }): Promise<number> {
  const s = await readQueue();
  const serverId = opts.tripServerId;
  const localId = opts.tripLocalId;
  return s.items.filter(it => {
    if (it.type !== 'createActivity') return false;
    if (serverId && (it.serverId === serverId || Number(it.body?.trip_id) === serverId)) return true;
    if (localId && it.dependsOnLocalId === localId) return true;
    return false;
  }).length;
}

export async function removeQueued(localId: string): Promise<void> {
  const s = await readQueue();
  s.items = s.items.filter(it => it.localId !== localId);
  await writeQueue(s);
}

/** Remove a parent job and all dependent children (cascade by dependsOnLocalId) */
export async function removeCascade(rootLocalId: string): Promise<void> {
  const s = await readQueue();
  const toDelete = new Set<string>();
  const queue = [rootLocalId];

  // Build adjacency on dependsOnLocalId
  while (queue.length) {
    const current = queue.shift() as string;
    if (toDelete.has(current)) continue;
    toDelete.add(current);
    // Enqueue direct children
    s.items.forEach(it => {
      if (it.dependsOnLocalId && it.dependsOnLocalId === current) {
        queue.push(it.localId);
      }
    });
  }

  s.items = s.items.filter(it => !toDelete.has(it.localId));
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
    metadata: {
      tripId: body.trip_id || body.trip_name,
      description: `Create trip: ${body.trip_id || body.trip_name}`
    }
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
    metadata: {
      description: `Start trip: ${opts.serverId || opts.dependsOnLocalId}`
    }
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
  console.log(`[Queue] Enqueuing createActivity:`, {
    bodyTripId: body.trip_id,
    optsTripServerId: opts.tripServerId,
    optsTripLocalId: opts.tripLocalId
  });
  
  const s = await readQueue();
  const job: QueueJob = {
    localId: makeId('activity'),
    type: 'createActivity',
    body,
    // If we have a trip server ID, store it in serverId for easy access during processing
    // If we have a trip local ID, use dependsOnLocalId for dependency resolution
    serverId: opts.tripServerId ?? null,
    dependsOnLocalId: opts.tripServerId ? undefined : opts.tripLocalId,
    createdAt: Date.now(),
    attempts: 0,
    nextRetryAt: null,
    metadata: {
      activityId: body.activity_id || body.activity_number,
      tripId: body.trip_id,
      description: `Create activity: ${body.activity_id || body.activity_number} for trip: ${body.trip_id}`
    }
  };
  
  console.log(`[Queue] Created job:`, {
    localId: job.localId,
    serverId: job.serverId,
    dependsOnLocalId: job.dependsOnLocalId,
    bodyTripId: job.body.trip_id
  });
  
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
    metadata: {
      description: `Create species: ${body.species_name} for activity: ${opts.activityServerId || opts.activityLocalId}`
    }
  };
  s.items.push(job);
  s.items.sort((a, b) => a.createdAt - b.createdAt);
  await writeQueue(s);
  return job;
}

/** enqueue: Complete Fishing Activity — depends on activity (server id) */
export async function enqueueCompleteActivity(opts: {
  activityServerId?: number;
  activityLocalId?: string;
}) {
  const s = await readQueue();
  const job: QueueJob = {
    localId: makeId('completeActivity'),
    type: 'completeActivity',
    serverId: opts.activityServerId ?? null,
    dependsOnLocalId: opts.activityServerId ? undefined : opts.activityLocalId,
    createdAt: Date.now(),
    attempts: 0,
    nextRetryAt: null,
    metadata: {
      description: `Complete activity: ${opts.activityServerId || opts.activityLocalId}`,
    },
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

    // Process items in order, respecting dependencies
    let processedCount = 0;
    const maxPerRun = 5; // Limit to avoid blocking UI

    for (const job of [...q.items]) {
      if (processedCount >= maxPerRun) break;
      
      const ni = await NetInfo.fetch();
      if (!ni.isConnected) break;
      if (!retryDue(job)) continue;

      const ok = await processOne(job.localId);
      if (ok) {
        processedCount++;
      } else {
        // Stop on failure to avoid hammering
        break;
      }
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

  console.log(`[Queue] Processing ${job.type} ${job.localId}:`, {
    serverId: job.serverId,
    dependsOnLocalId: job.dependsOnLocalId,
    resolvedId,
    idmap: Object.keys(idmap).length > 0 ? 'has mappings' : 'no mappings',
    bodyTripId: job.body?.trip_id
  });

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
        await writeQueue(q2);
        
        // Remove this job after successful processing
        q.items.splice(idx, 1);
        await writeQueue(q);
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
        // For activities, we need to resolve the trip ID from either:
        // 1. The job's serverId (if it was set to the trip's server ID)
        // 2. The job's dependsOnLocalId (if it depends on a local trip)
        // 3. The body's trip_id (if it's already a server ID)
        let tripServerId: number | undefined;
        
        if (job.serverId && job.serverId > 0) {
          // This activity job has the trip's server ID directly
          tripServerId = job.serverId;
          console.log(`[Queue] Using job.serverId as trip server ID: ${tripServerId}`);
        } else if (job.dependsOnLocalId) {
          // This activity depends on a local trip, wait for it to be resolved
          tripServerId = resolvedId;
          if (!tripServerId) {
            console.log(`[Queue] Waiting for trip dependency to resolve for activity ${job.localId}`);
            job.attempts += 1;
            job.nextRetryAt = Date.now() + nextDelay(job.attempts);
            q.items[idx] = job;
            await writeQueue(q);
            return false;
          }
          console.log(`[Queue] Resolved trip dependency to server ID: ${tripServerId}`);
        } else if (job.body?.trip_id) {
          // Check if the body already has a valid server trip ID
          const bodyTripId = Number(job.body.trip_id);
          if (!isNaN(bodyTripId) && bodyTripId > 0) {
            tripServerId = bodyTripId;
            console.log(`[Queue] Using body.trip_id as trip server ID: ${tripServerId}`);
          }
        }
        
        if (!tripServerId) {
          console.log(`[Queue] No valid trip server ID found for activity ${job.localId}`, {
            jobServerId: job.serverId,
            dependsOnLocalId: job.dependsOnLocalId,
            bodyTripId: job.body?.trip_id,
            resolvedId
          });
          job.attempts += 1;
          job.nextRetryAt = Date.now() + nextDelay(job.attempts);
          q.items[idx] = job;
          await writeQueue(q);
          return false;
        }
        
        const body = { ...(job.body || {}) };
        body.trip_id = tripServerId;
        
        console.log(`[Queue] Creating activity with body:`, body);
        
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
          await writeQueue(q2);
        }
        
        // Remove this job after successful processing
        q.items.splice(idx, 1);
        await writeQueue(q);
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

      case 'completeActivity': {
        // needs activity server id
        if (!resolvedId) {
          job.attempts += 1;
          job.nextRetryAt = Date.now() + nextDelay(job.attempts);
          q.items[idx] = job;
          await writeQueue(q);
          return false;
        }
        await completeFishingActivity(resolvedId);
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
    console.error(`Queue processing error for ${job.type}:`, err);
    
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
