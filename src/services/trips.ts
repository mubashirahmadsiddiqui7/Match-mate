// src/services/trips.ts
import { api, upload } from './https';
import { stripUndefined } from '../utils/json';

/* =========================
 * Core types / constants
 * ========================= */
export const TRIP_STATUSES = ['pending','pending_approval' ,'approved', 'active', 'completed', 'cancelled'] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];
export type ID = number | string;

/** Legacy lightweight Trip type (kept for list/search APIs) */
export type Trip = {
  fisherman_id?: number;
  trip_name: string;
  boat_id: number | null;
  departure_port: string | null;
  destination_port: string | null;
  status: TripStatus;
  departure_date?: string | null;
  expected_return_date?: string | null;
  actual_return_date?: string | null;
  crew_size?: number | null;
  fishing_method?: string | null;
  target_species?: string | null;
  estimated_catch?: number | null;
  fuel_cost?: number | null;
  crew_cost?: number | null;
  equipment_cost?: number | null;
  other_costs?: number | null;
  notes?: string | null;
};

/* =========================
 * New detailed server schema (GET /api/trips/:id)
 * ========================= */
export type ServerFisherman = {
  id: number;
  name: string;
  email: string | null;
  user_type: string | null;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  boat_registration_number: string | null;
  fishing_zone: string | null;
  port_location: string | null;
  verification_status: string | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  // other profile fields returned by backend (kept as optional)
  [k: string]: any;
};

export type ServerFishingActivity = {
  id: number | string;
  activity_id: string;
  trip_id: number | string;
  fisherman_id: number | string;
  activity_number: number | null;
  activity_date: string | null;
  activity_time: string | null;
  gps_latitude: string | null;
  gps_longitude: string | null;
  time_of_netting: string | null;
  time_of_hauling: string | null;
  gear_type: string | null;
  mesh_size: string | null;
  net_length: string | null;
  net_width: string | null;
  status: string | null;
  status_label?: string | null;
  gear_type_label?: string | null;
  mesh_size_label?: string | null;
  location_formatted?: string | null;
  fish_species?: Array<any>;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ServerTripDTO = {
  id: number | string;
  trip_id: string;
  fisherman_id: number;
  user_id: number | null;
  boat_registration_number: string | null;
  boat_name: string | null;
  trip_type: string | null;
  trip_purpose: string | null;
  fishing_zone: string | null;
  port_location: string | null;
  departure_time: string | null; // ISO
  departure_latitude: string | null;
  departure_longitude: string | null;
  departure_port: string | null;
  departure_notes: string | null;

  arrival_time: string | null; // ISO
  arrival_latitude: string | null;
  arrival_longitude: string | null;
  arrival_port: string | null;
  arrival_notes: string | null;

  landing_site: string | null;
  landing_time: string | null; // ISO

  fishing_activity_count: number | null;
  trip_started: boolean | null;
  trip_completed: boolean | null;

  auto_time: string | null;
  auto_latitude: string | null;
  auto_longitude: string | null;

  status: TripStatus;
  approved_by: number | null;
  approved_at: string | null;
  approval_notes: string | null;

  crew_count: number | null;
  captain_name: string | null;
  captain_mobile_no: string | null;
  crew_no: number | null;

  port_clearance_no: string | null;
  fuel_quantity: string | number | null;
  ice_quantity: string | number | null;

  safety_equipment: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;

  weather_conditions: string | null;
  sea_conditions: string | null;
  wind_speed: string | number | null;
  wave_height: string | number | null;

  estimated_catch_weight: number | null;
  target_species: string | null;
  catch_notes: string | null;

  fuel_cost: string | number | null;
  operational_cost: string | number | null;
  total_cost: string | number | null;
  revenue: string | number | null;
  profit: string | number | null;

  gps_track: any | null;
  last_gps_update: string | null;
  current_latitude: string | number | null;
  current_longitude: string | number | null;
  current_speed: string | number | null;
  current_heading: string | number | null;

  is_offline: boolean | null;
  last_online_at: string | null;
  went_offline_at: string | null;

  trip_photos: any | null;
  documents: any | null;

  created_at: string | null;
  updated_at: string | null;

  duration: string | null;
  distance_traveled: string | null;

  status_label?: string | null;
  trip_type_label?: string | null;
  is_active?: boolean | null;
  is_completed?: boolean | null;
  is_pending_approval?: boolean | null;

  current_location_formatted?: string | null;
  departure_location_formatted?: string | null;
  arrival_location_formatted?: string | null;

  fisherman?: ServerFisherman | null;
  boat?: any | null;

  fishing_activities?: ServerFishingActivity[] | null;

  // legacy compatibility (some APIs may still return these)
  fish_lots?: Array<{ id: number | string; lot_no: string; status: string }>;
  user?: { id: number; name: string } | null;
};

/* =========================
 * App-facing “TripDetails”
 * ========================= */
export type FishingActivity = {
  id: number | string;
  activity_id: string;
  number: number | null;
  date: string | null;     // yyyy-mm-dd or iso
  time: string | null;     // iso
  gps_latitude: string | null;
  gps_longitude: string | null;
  time_of_netting: string | null;
  time_of_hauling: string | null;
  gear_type: string | null;
  mesh_size: string | null;
  net_length: string | null;
  net_width: string | null;
  status: string | null;
  status_label?: string | null;
  gear_type_label?: string | null;
  mesh_size_label?: string | null;
  location_formatted?: string | null;
  fish_species?: Array<any>;
};

export type TripDetails = {
  /* identity */
  id: number | string;
  trip_name: string;         // from trip_id
  status: TripStatus;
  status_label?: string | null;
  trip_type?: string | null; // label if available
  trip_type_raw?: string | null;

  /* associations */
  fisherman?: { id: number; name: string; phone?: string | null } | null;
  boat_registration_no?: string | null;
  boat_name?: string | null;

  /* purpose & zone */
  trip_purpose?: string | null;
  fishing_zone?: string | null;

  /* departure */
  departure_port?: string | null;
  port_location?: string | null;
  departure_time?: string | null; // display-friendly
  departure_time_iso?: string | null;
  departure_lat?: number | string | null;
  departure_lng?: number | string | null;
  departure_notes?: string | null;
  departure_location_formatted?: string | null;

  /* arrival */
  arrival_port?: string | null;
  arrival_time?: string | null; // display-friendly
  arrival_time_iso?: string | null;
  arrival_lat?: number | string | null;
  arrival_lng?: number | string | null;
  arrival_notes?: string | null;
  arrival_location_formatted?: string | null;

  /* landing */
  landing_site?: string | null;
  landing_time?: string | null; // display-friendly
  landing_time_iso?: string | null;

  /* flags & computed */
  fishing_activity_count?: number | null;
  trip_started?: boolean | null;
  trip_completed?: boolean | null;
  is_active?: boolean | null;
  is_completed?: boolean | null;
  is_pending_approval?: boolean | null;

  /* auto */
  auto_time?: string | null; // display-friendly
  auto_time_iso?: string | null;
  auto_latitude?: string | null;
  auto_longitude?: string | null;

  /* approval */
  approved_by?: number | null;
  approved_at?: string | null; // display-friendly
  approved_at_iso?: string | null;
  approval_notes?: string | null;

  /* crew/admin */
  crew_count?: number | null;
  captain_name?: string | null;
  captain_mobile_no?: string | null;
  crew_no?: number | null;
  port_clearance_no?: string | null;
  fuel_quantity?: number | null;
  ice_quantity?: number | null;

  /* safety & emergency */
  safety_equipment?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;

  /* environment */
  weather?: string | null;
  sea_conditions?: string | null;
  wind_speed?: number | string | null;
  wave_height?: number | string | null;

  /* catch & economics */
  target_species?: string | null;
  estimated_catch?: number | null;
  catch_notes?: string | null;
  fuel_cost?: number | null;
  operational_cost?: number | null;
  total_cost?: number | null;
  revenue?: number | null;
  profit?: number | null;

  /* live telemetry */
  gps_track?: any | null;
  last_gps_update?: string | null; // display-friendly
  last_gps_update_iso?: string | null;
  current_latitude?: number | string | null;
  current_longitude?: number | string | null;
  current_speed?: number | string | null;
  current_heading?: number | string | null;
  is_offline?: boolean | null;
  last_online_at?: string | null; // display-friendly
  last_online_at_iso?: string | null;
  went_offline_at?: string | null; // display-friendly
  went_offline_at_iso?: string | null;
  current_location_formatted?: string | null;

  /* media & docs */
  trip_photos?: any | null;
  documents?: any | null;

  /* meta */
  created_at?: string | null; // display-friendly
  created_at_iso?: string | null;
  updated_at?: string | null; // display-friendly
  updated_at_iso?: string | null;

  duration?: string | null;
  distance_traveled?: string | null;

  /* collections */
  activities?: FishingActivity[];
  lots?: Array<{ id: number | string; lot_no: string; status: string }>; // legacy compatibility
};

/* =========================
 * Adapters & helpers
 * ========================= */
function pad(n: number) { return String(n).padStart(2, '0'); }
function toDisplay12h(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  let h = d.getHours();
  const m = pad(d.getMinutes());
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12; if (h === 0) h = 12;
  const hh = pad(h);
  return `${yyyy}-${mm}-${dd} ${hh}:${m} ${ap}`;
}
function asNumOrNull(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function adaptTrip(dto: ServerTripDTO): TripDetails {
  const activities: FishingActivity[] = (dto.fishing_activities ?? []).map(a => ({
    id: a.id,
    activity_id: a.activity_id,
    number: a.activity_number ?? null,
    date: a.activity_date,
    time: a.activity_time,
    gps_latitude: a.gps_latitude,
    gps_longitude: a.gps_longitude,
    time_of_netting: a.time_of_netting,
    time_of_hauling: a.time_of_hauling,
    gear_type: a.gear_type,
    mesh_size: a.mesh_size,
    net_length: a.net_length,
    net_width: a.net_width,
    status: a.status,
    status_label: a.status_label ?? null,
    gear_type_label: a.gear_type_label ?? null,
    mesh_size_label: a.mesh_size_label ?? null,
    location_formatted: a.location_formatted ?? null,
    fish_species: a.fish_species ?? [],
  }));

  return {
    /* identity */
    id: dto.id,
    trip_name: dto.trip_id ?? `Trip ${dto.id}`,
    status: dto.status,
    status_label: dto.status_label ?? null,
    trip_type: dto.trip_type_label ?? dto.trip_type ?? null,
    trip_type_raw: dto.trip_type ?? null,

    /* associations */
    fisherman: dto.fisherman
      ? { id: dto.fisherman.id, name: dto.fisherman.name, phone: dto.fisherman.phone ?? null }
      : dto.user
      ? { id: dto.user.id, name: dto.user.name, phone: null }
      : null,
    boat_registration_no: dto.boat_registration_number ?? null,
    boat_name: dto.boat_name ?? null,

    /* purpose & zone */
    trip_purpose: dto.trip_purpose ?? null,
    fishing_zone: dto.fishing_zone ?? null,

    /* departure */
    departure_port: dto.departure_port ?? null,
    port_location: dto.port_location ?? null,
    departure_time: toDisplay12h(dto.departure_time),
    departure_time_iso: dto.departure_time ?? null,
    departure_lat: dto.departure_latitude,
    departure_lng: dto.departure_longitude,
    departure_notes: dto.departure_notes ?? null,
    departure_location_formatted: dto.departure_location_formatted ?? null,

    /* arrival */
    arrival_port: dto.arrival_port ?? null,
    arrival_time: toDisplay12h(dto.arrival_time),
    arrival_time_iso: dto.arrival_time ?? null,
    arrival_lat: dto.arrival_latitude,
    arrival_lng: dto.arrival_longitude,
    arrival_notes: dto.arrival_notes ?? null,
    arrival_location_formatted: dto.arrival_location_formatted ?? null,

    /* landing */
    landing_site: dto.landing_site ?? null,
    landing_time: toDisplay12h(dto.landing_time),
    landing_time_iso: dto.landing_time ?? null,

    /* flags & computed */
    fishing_activity_count: dto.fishing_activity_count ?? null,
    trip_started: dto.trip_started ?? null,
    trip_completed: dto.trip_completed ?? null,
    is_active: dto.is_active ?? null,
    is_completed: dto.is_completed ?? null,
    is_pending_approval: dto.is_pending_approval ?? null,

    /* auto */
    auto_time: toDisplay12h(dto.auto_time),
    auto_time_iso: dto.auto_time ?? null,
    auto_latitude: dto.auto_latitude ?? null,
    auto_longitude: dto.auto_longitude ?? null,

    /* approval */
    approved_by: dto.approved_by ?? null,
    approved_at: toDisplay12h(dto.approved_at),
    approved_at_iso: dto.approved_at ?? null,
    approval_notes: dto.approval_notes ?? null,

    /* crew/admin */
    crew_count: dto.crew_count ?? null,
    captain_name: dto.captain_name ?? null,
    captain_mobile_no: dto.captain_mobile_no ?? null,
    crew_no: dto.crew_no ?? null,
    port_clearance_no: dto.port_clearance_no ?? null,
    fuel_quantity: asNumOrNull(dto.fuel_quantity),
    ice_quantity: asNumOrNull(dto.ice_quantity),

    /* safety & emergency */
    safety_equipment: dto.safety_equipment ?? null,
    emergency_contact: dto.emergency_contact ?? null,
    emergency_phone: dto.emergency_phone ?? null,

    /* environment */
    weather: dto.weather_conditions ?? null,
    sea_conditions: dto.sea_conditions ?? null,
    wind_speed: dto.wind_speed ?? null,
    wave_height: dto.wave_height ?? null,

    /* catch & economics */
    target_species: dto.target_species ?? null,
    estimated_catch: dto.estimated_catch_weight ?? null,
    catch_notes: dto.catch_notes ?? null,
    fuel_cost: asNumOrNull(dto.fuel_cost),
    operational_cost: asNumOrNull(dto.operational_cost),
    total_cost: asNumOrNull(dto.total_cost),
    revenue: asNumOrNull(dto.revenue),
    profit: asNumOrNull(dto.profit),

    /* live telemetry */
    gps_track: dto.gps_track ?? null,
    last_gps_update: toDisplay12h(dto.last_gps_update),
    last_gps_update_iso: dto.last_gps_update ?? null,
    current_latitude: dto.current_latitude ?? null,
    current_longitude: dto.current_longitude ?? null,
    current_speed: dto.current_speed ?? null,
    current_heading: dto.current_heading ?? null,
    is_offline: dto.is_offline ?? null,
    last_online_at: toDisplay12h(dto.last_online_at),
    last_online_at_iso: dto.last_online_at ?? null,
    went_offline_at: toDisplay12h(dto.went_offline_at),
    went_offline_at_iso: dto.went_offline_at ?? null,
    current_location_formatted: dto.current_location_formatted ?? null,

    /* media & meta */
    trip_photos: dto.trip_photos ?? null,
    documents: dto.documents ?? null,
    created_at: toDisplay12h(dto.created_at),
    created_at_iso: dto.created_at ?? null,
    updated_at: toDisplay12h(dto.updated_at),
    updated_at_iso: dto.updated_at ?? null,

    duration: dto.duration ?? null,
    distance_traveled: dto.distance_traveled ?? null,

    /* collections */
    activities,
    lots: dto.fish_lots ?? [],
  };
}

/* =========================
 * Shared helpers & wrappers
 * ========================= */
export type TripCounts = {
  all: number; pending: number; approved: number; active: number; completed: number; cancelled: number;
};
export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
};
export type TripStats = Record<string, any>;
export type ListParams = { page?: number; per_page?: number; status?: TripStatus; search?: string; };

function readTotal(p: any): number {
  if (typeof p?.total === 'number') return p.total;
  if (typeof p?.data?.total === 'number') return p.data.total;
  if (Array.isArray(p?.data?.data)) return p.data.data.length;
  if (Array.isArray(p?.data)) return p.data.length;
  return 0;
}
function unwrap<T>(json: any): T {
  return (json?.data ?? json) as T;
}

/* =========================
 * CRUD + actions (unchanged where possible)
 * ========================= */
export async function listTrips(params?: ListParams) {
  const json = await api('/trips', { query: params });
  return unwrap<Paginated<Trip>>(json);
}
export async function getTrip(id: ID) {
  const json = await api(`/trips/${id}`);
  return unwrap<Trip>(json);
}

/** Create payload (unchanged from your version) */
export type CreateTripBody = {
  trip_name: string;
  trip_id?: string;
  fisherman_id: number;
  boat_registration_number: string;
  trip_type: string;
  captain_name: string;
  captain_mobile_no: string;
  crew_no: number;
  crew_count: number;
  port_clearance_no: string;
  fuel_quantity: number;
  ice_quantity: number;
  departure_site: string;
  departure_port: string;
  destination_port: string;
  port_location: string;
  departure_date: string;
  departure_time: string;
  departure_latitude?: number;
  departure_longitude?: number;
  fishing_method?: string;
  target_species?: string;
  sea_type?: string;
  sea_conditions?: string;
  emergency_contact?: string;
  trip_cost?: number;
  fuel_cost?: number;
  estimated_catch?: number;
  equipment_cost?: number;
  notes?: string;
};
export type UpdateTripBody = Partial<CreateTripBody>;

export async function createTrip(body: CreateTripBody) {
  const clean = stripUndefined(body);
  const json = await api('/trips', { method: 'POST', body: clean });
  if (json?.trip) return json.trip;
  return unwrap<Trip>(json);
}
export async function updateTrip(id: ID, body: UpdateTripBody) {
  const json = await api(`/trips/${id}`, { method: 'PUT', body });
  return unwrap<Trip>(json);
}
export async function deleteTrip(id: number | string) {
  await api(`/trips/${id}`, { method: 'DELETE' });
}

export async function startTrip(id: ID) {
  const json = await api(`/trips/${id}/start-trip`, { method: 'POST' });
  return (json?.data ?? json) as Trip;
}
export async function cancelTrip(id: ID, body: { cancellation_reason: string }) {
  const json = await api(`/trips/${id}/cancel`, { method: 'POST', body });
  return (json?.data ?? json) as Trip;
}
export type CompleteTripPayload = {
  arrival_port: string;
  arrival_notes?: string;
  estimated_catch_weight?: number;
  catch_notes?: string;
  revenue?: number;
  arrival_latitude?: number;
  arrival_longitude?: number;
};
export async function completeTrip(id: ID, body: CompleteTripPayload) {
  const json = await api(`/trips/${id}/complete`, { method: 'POST', body });
  return (json?.data ?? json) as Trip;
}
export async function completedTrip(id: ID, body: CompleteTripPayload) {
  const json = await api(`/trips/${id}/complete-trip`, { method: 'POST', body });
  return (json?.data ?? json) as Trip;
}
// export async function rejectTrip(id: ID) {
//   const json = await api(`/trips/${id}/reject`, { method: 'POST' });
//   return unwrap<Trip>(json);
// }
// services/trips.ts
// ...
export async function rejectTrip(id: ID, payload: { rejection_reason: string }) {
  const json = await api(`/trips/${id}/reject`, {
    method: 'POST',
    body: payload, // must include rejection_reason
  });
  return unwrap<Trip>(json);
}

export async function approveTrip(id: ID) {
  const json = await api(`/trips/${id}/approve`, { method: 'POST' });
  return unwrap<Trip>(json);
}

export type UpdateLocationBody = { current_latitude: number; current_longitude: number; current_location?: string; };
export async function updateTripLocation(id: ID, body: UpdateLocationBody) {
  const json = await api(`/trips/${id}/update-location`, { method: 'POST', body });
  return unwrap<Trip>(json);
}
export async function uploadTripPhoto(id: ID, file: { uri: string; name?: string; type?: string }, caption?: string) {
  const form = new FormData();
  form.append('photo', { uri: file.uri, name: file.name ?? 'trip.jpg', type: file.type ?? 'image/jpeg' } as any);
  if (caption) form.append('caption', caption);
  const json = await upload(`/trips/${id}/upload-photo`, form);
  return unwrap<{ url?: string; [k: string]: any }>(json);
}

/* =========================
 * Stats / Filters / Search
 * ========================= */
export async function getTripStatistics(id: ID) {
  const json = await api(`/trips/${id}/statistics`);
  return unwrap<TripStats>(json);
}
export async function filterTripsByStatus(status: TripStatus, params?: { page?: number; per_page?: number }) {
  const json = await api(`/trips/filter/status/${status}`, { query: params });
  return unwrap<Paginated<Trip>>(json);
}
export type SearchTripsParams = { q?: string; status?: TripStatus; date_from?: string; date_to?: string; page?: number; per_page?: number; };
export async function searchTrips(params: SearchTripsParams) {
  const json = await api('/trips/search', { query: params });
  return unwrap<Paginated<Trip>>(json);
}

/* =========================
 * Details helpers
 * ========================= */
export async function getTripById(id: number | string) {
  const json = await api(`/trips/${id}`, { method: 'GET' });
  const dto: ServerTripDTO = json?.data ?? json;
  return adaptTrip(dto);
}
export async function getTripCounts(): Promise<{ totals: { all: number; pending: number; approved: number; active: number; completed: number; cancelled: number; }; errors: Partial<Record<'all' | TripStatus, string>>; }> {
  const statuses: TripStatus[] = ['pending','pending_approval', 'approved', 'active', 'completed', 'cancelled'];
  const reqs = [api('/trips', { query: { page: 1, per_page: 1 } }), ...statuses.map(status => api('/trips', { query: { status, page: 1, per_page: 1 } }))];
  const settled = await Promise.allSettled(reqs);

  const totals = { all: 0, pending: 0, pending_approval: 0, approved: 0, active: 0, completed: 0, cancelled: 0 };
  const errors: Partial<Record<'all' | TripStatus, string>> = {};

  const allRes = settled[0];
  if (allRes.status === 'fulfilled') totals.all = readTotal(allRes.value);
  else { totals.all = 0; errors.all = (allRes as any).reason?.message || 'Failed'; }

  statuses.forEach((status, i) => {
    const res = settled[i + 1];
    if (res.status === 'fulfilled') totals[status] = readTotal(res.value);
    else { totals[status] = 0; errors[status] = (res as any).reason?.message || 'Failed'; }
  });

  // Map pending_approval to pending for FCS dashboard display
  totals.pending = totals.pending + totals.pending_approval;

  return { totals, errors };
}

/* =========================
 * List rows (unchanged)
 * ========================= */
export type TripRowDTO = {
  id: number | string;
  trip_name: string;
  status: TripStatus;
  departure_port?: string | null;
  destination_port?: string | null;
  departure_time?: string | null;
  // additional optional info for richer mobile card rows
  fisherman_name?: string | null;
  boat_name?: string | null;
  boat_registration_number?: string | null;
  trip_type_label?: string | null;
  created_at?: string | null; // display friendly
  fishing_activity_count?: number | null;
};
export async function listTripsPage(params?: { page?: number; per_page?: number; }) {
  const page = params?.page ?? 1;
  const per_page = params?.per_page ?? 25;
  const json = await api('/trips', { query: { page, per_page } });

  const arr: any[] = Array.isArray(json?.data?.data) ? json.data.data : Array.isArray(json?.data) ? json.data : [];
  const rows: TripRowDTO[] = arr.map((t: any) => ({
    id: t.id ?? t.trip_id,
    trip_name: t.trip_name ?? t.trip_id ?? `Trip ${t.id ?? ''}`,
    status: (t.status ?? 'pending') as TripRowDTO['status'],
    departure_port: t.departure_port ?? t.port_location ?? null,
    destination_port: t.destination_port ?? null,
    departure_time: toDisplay12h(t.departure_time),
    fisherman_name: t.fisherman?.name ?? t.user?.name ?? null,
    boat_name: t.boat_name ?? null,
    boat_registration_number: t.boat_registration_number ?? null,
    trip_type_label: t.trip_type_label ?? t.trip_type ?? null,
    created_at: toDisplay12h(t.created_at),
    fishing_activity_count: typeof t.fishing_activity_count === 'number' ? t.fishing_activity_count : (Array.isArray(t.fishing_activities) ? t.fishing_activities.length : null),
  }));

  const total = Number(json?.data?.total ?? rows.length);
  const last_page = Number(json?.data?.last_page ?? 1);
  return { rows, total, last_page, raw: json };
}

/* =========================
 * Load table rows (unchanged)
 * ========================= */
export type TripListRow = {
  id: number | string;
  trip_name: string;
  status: TripStatus;
  departure_port: string | null;
  destination_port: string | null;
  departure_time: string | null;
};
export type LoadTripRowsParams = { page?: number; per_page?: number; status?: TripStatus; search?: string; signal?: AbortSignal; };

export async function loadTripRows(params?: LoadTripRowsParams) {
  const page = params?.page ?? 1;
  const per_page = params?.per_page ?? 25;
  const res = await api('/trips', { query: { page, per_page, status: params?.status, search: params?.search }, signal: params?.signal });

  const arr: any[] = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
  const rows: TripListRow[] = arr.map((t: any) => ({
    id: t?.id ?? t?.trip_id,
    trip_name: t?.trip_name ?? t?.trip_id ?? `Trip ${t?.id ?? ''}`,
    status: (t?.status ?? 'pending') as TripStatus,
    departure_port: t?.departure_port ?? t?.port_location ?? null,
    destination_port: t?.arrival_port ?? t?.destination_port ?? null,
    departure_time: toDisplay12h(t?.departure_time),
  }));

  rows.sort((a, b) => Number(b.id) - Number(a.id));
  const total = Number(res?.data?.total ?? rows.length);
  const last_page = Number(res?.data?.last_page ?? 1);
  return { rows, total, last_page };
}


// --- Trip Completion Data (for Complete modal) ---
export type MiddleManBrief = {
  id: number | string;
  name: string;
  email?: string | null;
  phone?: string | null;
  business_address?: string | null;
  city?: string | null;
  verification_status?: string | null;
  is_verified?: boolean;
};

export type LotBrief = {
  id: number | string;
  lot_no: string;
  species_name?: string | null;
  quantity_kg?: number | string | null;
  activity_no?: string | null;
  catch_type?: string | null;
  grade?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

export type TripCompletionMeta = {
  trip: {
    id: number;
    trip_id: string;
    captain_name: string | null;
    boat_registration_number: string | null;
    departure_site: string | null;      // e.g. 'karachi_fish_harbor'
    departure_date: string | null;
    status: string;
    fisherman_name: string | null;
  };
  lots: LotBrief[];
  middle_men: MiddleManBrief[];
  landing_sites: Record<string, string>; // { karachi_fish_harbor: 'Karachi Fish Harbor', ... }
  total_lots: number;
  total_middle_men: number;
};

export async function getTripCompletionData(id: ID) {
  const json = await api(`/trips/${id}/completion-data`, { method: 'GET' });
  return unwrap<TripCompletionMeta>(json);
}
