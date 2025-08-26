// src/services/fishingActivities.ts
import { api } from './https';

export type CreateFishingActivityBody = {
  trip_id: number | string;
  activity_number: number; // 1..20
  time_of_netting: string | null; // "HH:mm" 24h or null
  time_of_hauling: string | null; // "HH:mm" 24h or null
  mesh_size: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | null;
  net_length: number | null; // meters
  net_width: number | null; // meters
  gps_latitude: number; // -90..90
  gps_longitude: number; // -180..180
};

export async function createFishingActivity(body: CreateFishingActivityBody) {
  // backend url: https://smartaisoft.com/MFD-Trace-Fish/api/fishing-activities
  // your api() helper already injects base URL / headers; if not, pass full URL.
  const json = await api('/fishing-activities', { method: 'POST', body });
  // backend usually returns { success, message, data } — unwrap as you prefer:
  return json?.data ?? json;
}
export async function updateFishingActivity(
  id: number | string,
  body: Partial<CreateFishingActivityBody> & { trip_code?: string | number },
) {
  const json = await api(`/fishing-activities/${id}`, {
    method: 'PUT', // use 'PUT' if your backend expects full replacement
    body,
  });
  return json?.data ?? json;
}

export type ActivityListParams = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: string; // e.g. 'active','completed'
};

export type PaginatedActivities = {
  items: FishingActivity[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

// If you need edit/update later:
// export async function updateFishingActivity(id: number | string, body: Partial<FishingActivity>) {
//   const json = await api(`/fishing-activities/${id}`, { method: 'PUT', body });
//   return json?.data ?? json;
// }

export type FishingActivity = {
  id: number | string;
  trip_id: number | string;
  trip_code?: string | null; // e.g. "TRIP-20250825-008"
  fisherman_id?: number | string;
  activity_number: number;
  activity_time?: string | null; // ISO
  time_of_netting?: string | null;
  time_of_hauling?: string | null;
  gps_latitude?: string | number | null;
  gps_longitude?: string | number | null;
  mesh_size?: number | string | null;
  net_length?: number | string | null;
  net_width?: number | string | null;
  gear_type?: string | null;
  status?: 'active' | 'completed' | 'pending' | 'cancelled' | string;
};

export type ListFAParams = {
  page?: number;
  per_page?: number;
  q?: string;
  status?: 'active' | 'completed' | 'pending' | 'cancelled';
};

export async function listFishingActivities(params: ListFAParams = {}) {
  const json = await api('/fishing-activities/all/activities', {
    method: 'GET',
    query: params,
  });

  // server may return {success, data: {data:[], ...}} or {data:[], ...}
  const envelope = json?.data ?? json;
  const dataArr: any[] = Array.isArray(envelope?.data)
    ? envelope.data
    : Array.isArray(envelope?.data?.data)
    ? envelope.data.data
    : Array.isArray(envelope)
    ? envelope
    : [];

  return {
    items: dataArr as FishingActivity[],
    meta: {
      current_page: Number(
        envelope?.current_page ?? envelope?.data?.current_page ?? 1,
      ),
      per_page: Number(
        envelope?.per_page ??
          envelope?.data?.per_page ??
          (dataArr?.length || 15),
      ),
      // NOTE: wrap (||) when mixing with (??)
      total: Number(
        envelope?.total ?? envelope?.data?.total ?? (dataArr?.length || 0),
      ),
      last_page: Number(envelope?.last_page ?? envelope?.data?.last_page ?? 1),
    },
  };
}

export async function completeFishingActivity(id: number | string) {
  const json = await api(`/fishing-activities/${id}/complete`, {
    method: 'POST',
  });
  return json?.data ?? json;
}
/** Raw server payload */
// 1) Add a typed species row for clarity
// src/services/fishingActivity.ts

/** Raw species row as returned by the API */
type FishSpeciesRaw = {
  id: number | string;
  lot_no?: string | null;
  fishing_activity_id?: number | string;
  trip_id?: number | string;
  fisherman_id?: number | string;

  species_name?: string | null;
  quantity_kg?: string | number | null; // raw may be string
  type?: 'catch' | 'discard' | string | null;
  type_label?: string | null;

  grade?: string | null;
  grade_label?: string | null;
  notes?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

/** The embedded trip shape we actually use */
type TripEmbedded = {
  id: number | string;
  trip_id: string; // pretty code e.g. TRIP-20250826-012
  fisherman_id?: number | string;
  boat_registration_number?: string | null;
  boat_name?: string | null;
  status_label?: string | null;
  trip_type?: string | null;
  trip_type_label?: string | null;
  // allow extra unknown keys without typing everything
  [k: string]: any;
};

/** ✅ Declare the missing DTO used in adapt() */
export type ServerFishingActivityDTO = {
  id: number | string;
  activity_id: string;
  trip_id: number | string; // numeric PK
  fisherman_id: number | string;

  activity_number: number | null;
  activity_date: string | null; // ISO
  activity_time: string | null; // ISO
  gps_latitude: string | null;
  gps_longitude: string | null;
  time_of_netting: string | null; // ISO
  time_of_hauling: string | null; // ISO

  gear_type: string | null;
  mesh_size: string | null;
  net_length: string | null;
  net_width: string | null;

  status: string | null;
  created_at: string | null;
  updated_at: string | null;

  status_label?: string | null;
  gear_type_label?: string | null;
  mesh_size_label?: string | null;
  location_formatted?: string | null;

  fish_species?: FishSpeciesRaw[];

  trip?: TripEmbedded | null;
};

/** App-facing typed species row */
export type FishSpeciesItem = {
  id: number | string;
  lot_no?: string | null;
  fishing_activity_id?: number | string;
  trip_id?: number | string;
  fisherman_id?: number | string;

  species_name?: string | null;
  quantity_kg?: number | null; // parsed to number
  type?: 'catch' | 'discard' | string | null;
  type_label?: string | null;

  grade?: string | null;
  grade_label?: string | null;
  notes?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};

/** App-facing details used by the UI */
export type FishingActivityDetails = {
  id: number | string;
  activity_id: string;

  /** Trip identifiers */
  trip_pk: number | string; // numeric PK for navigation
  trip_id: string | null; // pretty code from nested trip

  /** Fishermen */
  fisherman_id: number | string;
  trip_fisherman_id?: number | string | null;

  /** Boat */
  boat_registration_number?: string | null;
  boat_name?: string | null;

  /** Timestamps & fields */
  activity_number?: number | null;
  activity_date?: string | null;
  activity_time?: string | null;
  time_of_netting?: string | null;
  time_of_hauling?: string | null;

  /** Location / gear */
  gps_latitude?: string | number | null;
  gps_longitude?: string | number | null;
  gear_type?: string | null;
  gear_type_label?: string | null;
  mesh_size?: string | null;
  mesh_size_label?: string | null;
  net_length?: string | number | null;
  net_width?: string | number | null;
  location_formatted?: string | null;

  /** Status */
  status?: string | null;
  status_label?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  /** Strongly typed species list */
  fish_species?: FishSpeciesItem[];
};

function unwrap<T>(j: any): T {
  return (j?.data ?? j) as T;
}

function adapt(dto: ServerFishingActivityDTO): FishingActivityDetails {
  return {
    id: dto.id,
    activity_id: dto.activity_id,

    // trip ids
    trip_pk: dto.trip_id,
    trip_id: dto.trip?.trip_id ?? null,

    // fishermen
    fisherman_id: dto.fisherman_id,
    trip_fisherman_id: dto.trip?.fisherman_id ?? null,

    // boat
    boat_registration_number: dto.trip?.boat_registration_number ?? null,
    boat_name: dto.trip?.boat_name ?? null,

    // fields
    activity_number: dto.activity_number ?? null,
    activity_date: dto.activity_date ?? null,
    activity_time: dto.activity_time ?? null,
    time_of_netting: dto.time_of_netting ?? null,
    time_of_hauling: dto.time_of_hauling ?? null,

    // location / gear
    gps_latitude: dto.gps_latitude ?? null,
    gps_longitude: dto.gps_longitude ?? null,
    gear_type: dto.gear_type ?? null,
    gear_type_label: dto.gear_type_label ?? null,
    mesh_size: dto.mesh_size ?? null,
    mesh_size_label: dto.mesh_size_label ?? null,
    net_length: dto.net_length ?? null,
    net_width: dto.net_width ?? null,
    location_formatted: dto.location_formatted ?? null,

    // status
    status: dto.status ?? null,
    status_label: dto.status_label ?? null,

    created_at: dto.created_at ?? null,
    updated_at: dto.updated_at ?? null,

    // species rows → parsed/normalized
    fish_species:
      dto.fish_species?.map(
        (s): FishSpeciesItem => ({
          id: s.id,
          lot_no: s.lot_no ?? null,
          fishing_activity_id: s.fishing_activity_id,
          trip_id: s.trip_id,
          fisherman_id: s.fisherman_id,

          species_name: s.species_name ?? null,
          quantity_kg:
            s.quantity_kg !== undefined &&
            s.quantity_kg !== null &&
            s.quantity_kg !== ''
              ? Number(s.quantity_kg)
              : null,
          type: s.type ?? null,
          type_label: s.type_label ?? null,

          grade: s.grade ?? null,
          grade_label: s.grade_label ?? null,
          notes: s.notes ?? null,

          created_at: s.created_at ?? null,
          updated_at: s.updated_at ?? null,
        }),
      ) ?? [],
  };
}

export async function getFishingActivityById(id: number | string) {
  const json = await api(`/fishing-activities/${id}`, { method: 'GET' });
  const dto = unwrap<ServerFishingActivityDTO>(json);
  return adapt(dto);
}
