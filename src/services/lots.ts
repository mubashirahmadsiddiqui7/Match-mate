import { api } from './https';

export type CreateLotBody = {
  lot_no: string;                 // e.g. "LOT-20250819-003"
  trip_id: number;                // numeric trip id
  species: string;                // e.g. "Tuna"
  weight_kg: number;              // e.g. 200
  grade: string;                  // e.g. "A" | "B" | "C"
  port_location?: string | null;
  gps_latitude?: number | string | null;
  gps_longitude?: number | string | null;
  captured_at?: string;           // ISO is OK, server formats to Z
  photos?: any;                   // optional
  metadata?: any;                 // optional
};

export async function createLot(body: CreateLotBody) {
  const json = await api('/fish-lots', { method: 'POST', body });
  return json?.data ?? json;
}
export async function deleteLot(id: number | string): Promise<void> {
  // Your api() helper can return 204/empty; we don't need the response body.
  await api(`/fish-lots/${id}`, { method: 'DELETE' });
}


/** Nested types (trim to what you actually use in the app) */
export type TripSummary = {
  id: number;
  trip_id: string;             // e.g., "TRIP-20250819-001"
  fisherman_id: number;
  user_id: number;
  trip_type: string;           // e.g., "fishing"
  port_location?: string | null;
  departure_time?: string | null; // ISO
  departure_port?: string | null;
  crew_count?: number | null;
  target_species?: string | null;
};

export type UserSummary = {
  id: number;
  name: string;
  email: string;
  user_type?: string | null;
  role?: string | null;
  phone?: string | null;
  port_location?: string | null;
  // ... add other fields you read
};

export type FishLot = {
  id: number;
  lot_no: string;
  trip_id: number;
  fisherman_id: number;
  user_id: number;
  species: string | null;
  weight_kg: string | number | null;   // API returns strings for numbers sometimes
  grade: string | null;
  port_location: string | null;
  gps_latitude: string | null;
  gps_longitude: string | null;
  captured_at: string | null;          // ISO
  status: 'pending' | 'verified' | string;
  photos?: any | null;
  metadata?: any | null;
  created_at: string;                  // ISO
  updated_at: string;                  // ISO
  trip?: TripSummary;
  user?: UserSummary;
};

export type ListLotsParams = {
  page?: number | string;
  per_page?: number | string;
  trip_id?: number | string;
  fisherman_id?: number | string;
  status?: string;
  search?: string;
};

export type LotsPage = {
  items: FishLot[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
    /** Raw pagination block, if you need something extra later */
    _raw?: any;
  };
};

/**
 * Fetch a page of fish lots with optional filters.
 * Mirrors your API: { success, data: { current_page, data: [...], ... } }
 */
export async function fetchFishLots(params: ListLotsParams = {}): Promise<LotsPage> {
  const json = await api('/fish-lots', { method: 'GET', query: params });

  // Expecting { success: true, data: { data: [ ... ], ...pagination } }
  const envelope = json?.data;
  if (!envelope || !Array.isArray(envelope.data)) {
    throw new Error('Invalid server response for /fish-lots');
  }

  const items = envelope.data as FishLot[];
  const meta: LotsPage['meta'] = {
    current_page: Number(envelope.current_page ?? 1),
    per_page: Number(envelope.per_page ?? items.length),
    total: Number(envelope.total ?? items.length),
    last_page: Number(envelope.last_page ?? 1),
    next_page_url: envelope.next_page_url ?? null,
    prev_page_url: envelope.prev_page_url ?? null,
    path: envelope.path ?? '',
    from: envelope.from ?? null,
    to: envelope.to ?? null,
    links: Array.isArray(envelope.links) ? envelope.links : [],
    _raw: envelope,
  };

  return { items, meta };
}

/** Convenience: fetch lots by a specific trip id (page-aware) */
export function fetchLotsByTrip(tripId: number | string, page = 1, per_page = 15) {
  return fetchFishLots({ trip_id: tripId, page, per_page });
}

/**
 * Optional helper: load ALL pages (use cautiously).
 * This paginates until all items are fetched.
 */
export async function fetchAllFishLots(params: Omit<ListLotsParams, 'page' | 'per_page'> = {}) {
  const per_page = 100; // tune as needed
  let page = 1;
  const all: FishLot[] = [];

  // first page
  let { items, meta } = await fetchFishLots({ ...params, page, per_page });
  all.push(...items);

  // remaining pages
  while (meta.current_page < meta.last_page) {
    page += 1;
    const next = await fetchFishLots({ ...params, page, per_page });
    all.push(...next.items);
    meta = next.meta;
  }
  return all;
}

// ---- add near the top with other imports ----
// none

// ---- add these helpers (reuse your own if you already have) ----
function toFixed2(n: number | string | null | undefined) {
  if (n == null) return null;
  const v = typeof n === 'string' ? parseFloat(n) : Number(n);
  if (!Number.isFinite(v)) return null;
  return v.toFixed(2);
}

export type FishLotById = FishLot & {
  trip?: TripSummary & { trip_id: string };
  user?: UserSummary;
};

// GET /fish-lots/:id
export async function fetchFishLotById(id: number | string): Promise<FishLotById> {
  const json = await api(`/fish-lots/${id}`, { method: 'GET' });
  const dto = json?.data ?? json;

  // normalize a few numeric/string fields for easier rendering
  const lot: FishLotById = {
    ...dto,
    weight_kg: dto?.weight_kg ?? null,
    gps_latitude: dto?.gps_latitude ?? null,
    gps_longitude: dto?.gps_longitude ?? null,
    captured_at: dto?.captured_at ?? null,
    status: (dto?.status || 'pending') as any,
    trip: dto?.trip ?? undefined,
    user: dto?.user ?? undefined,
  };

  return lot;
}

// PUT/PATCH /fish-lots/:id (server usually accepts either; prefer PATCH)
export async function updateLot(
  id: number | string,
  body: Partial<CreateLotBody>
) {
  const json = await api(`/fish-lots/${id}`, { method: 'PUT', body });
  return json?.data ?? json;
}