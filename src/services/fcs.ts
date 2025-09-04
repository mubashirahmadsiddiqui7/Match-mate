import { api } from './https';

// ===== TYPES =====

export type DistributionStatus = 'pending' | 'verified' | 'rejected';
export type TripStatus = 'pending' | 'pending_approval' | 'approved' | 'active' | 'completed' | 'cancelled';

export type DistributedLot = {
  notes: string | null;
  lot_id: string;
  quantity_kg: string;
  lot_no: string;
  species_name?: string;
};

export type FishLotDistribution = {
  id: number;
  trip_id: number;
  fisherman_id: number;
  middle_man_id: number;
  distributed_lots: DistributedLot[];
  total_quantity_kg: string;
  total_value: number | null;
  verification_status: DistributionStatus;
  verified_by: number | null;
  verified_at: string | null;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
  verification_status_label: string;
  trip?: {
    id: number;
    trip_id: string;
    fisherman_id: number;
    user_id: number | null;
    boat_registration_number: string;
    boat_name: string | null;
    trip_type: string;
    trip_purpose?: string | null;
    fishing_zone: string | null;
    port_location: string;
    departure_time: string;
    departure_latitude: string;
    departure_longitude: string;
    departure_port: string;
    departure_notes: string | null;
    arrival_time?: string | null;
    arrival_latitude?: string | null;
    arrival_longitude?: string | null;
    arrival_port?: string | null;
    landing_site: string;
    landing_time: string;
    fishing_activity_count: number;
    trip_started: boolean;
    trip_completed: boolean;
    auto_time: string;
    auto_latitude?: string | null;
    auto_longitude?: string | null;
    arrival_notes?: string | null;
    status: string;
    approved_by: number | null;
    approved_at: string | null;
    approval_notes?: string | null;
    crew_count: number;
    captain_name: string;
    captain_mobile_no: string;
    crew_no: number;
    port_clearance_no: string;
    fuel_quantity: string;
    ice_quantity: string;
    departure_site: string;
    safety_equipment: string | null;
    emergency_contact: string | null;
    emergency_phone: string | null;
    weather_conditions: string | null;
    sea_conditions: string | null;
    wind_speed: string | null;
    wave_height: string | null;
    estimated_catch_weight: string | null;
    target_species: string;
    catch_notes?: string | null;
    fuel_cost?: string | null;
    operational_cost?: string | null;
    total_cost?: string | null;
    revenue?: string | null;
    profit?: string | null;
    gps_track?: string | null;
    last_gps_update?: string | null;
    current_latitude?: string | null;
    current_longitude?: string | null;
    current_speed?: string | null;
    current_heading?: string | null;
    is_offline: boolean;
    last_online_at?: string | null;
    went_offline_at?: string | null;
    trip_photos?: string | null;
    documents?: string | null;
    created_at: string;
    updated_at: string;
    duration: string;
    distance_traveled: string;
    status_label: string;
    trip_type_label: string;
    is_active: boolean;
    is_completed: boolean;
    is_pending_approval: boolean;
    current_location_formatted: string;
    departure_location_formatted: string;
    arrival_location_formatted: string;
    fisherman?: {
      id: number;
      name: string;
      email: string;
      phone: string;
      first_name: string;
      last_name: string;
      boat_registration_number: string;
      fishing_zone: string;
      port_location: string;
    };
  };
  middle_man?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    company_name: string;
    business_address: string;
    business_phone: string;
    business_email: string;
  };
  verifier?: any;
};

export type TripRowDTO = {
  id: number;
  trip_name: string;
  boat_name: string | null;
  fisherman_name: string | null;
  departure_port: string | null;
  departure_time: string | null;
  created_at: string | null;
  status: TripStatus;
  trip_type: string | null;
  trip_purpose: string | null;
  fishing_zone: string | null;
  port_location: string | null;
  landing_site: string | null;
  landing_time: string | null;
  crew_count: number | null;
  captain_name: string | null;
  captain_mobile_no: string | null;
  status_label: string | null;
  trip_type_label: string | null;
  is_active: boolean | null;
  is_completed: boolean | null;
  is_pending_approval: boolean | null;
  current_location_formatted: string | null;
  departure_location_formatted: string | null;
  arrival_location_formatted: string | null;
};

export type TripDetails = {
  id: number;
  trip_name: string;
  boat_name: string | null;
  fisherman_name: string | null;
  departure_port: string | null;
  departure_time: string | null;
  created_at: string | null;
  status: TripStatus;
  trip_type: string | null;
  trip_purpose: string | null;
  fishing_zone: string | null;
  port_location: string | null;
  landing_site: string | null;
  landing_time: string | null;
  crew_count: number | null;
  captain_name: string | null;
  captain_mobile_no: string | null;
  status_label: string | null;
  trip_type_label: string | null;
  is_active: boolean | null;
  is_completed: boolean | null;
  is_pending_approval: boolean | null;
  current_location_formatted: string | null;
  departure_location_formatted: string | null;
  arrival_location_formatted: string | null;
  // Add other trip details as needed
};

export type PaginatedResponse<T> = {
  items: T[];
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
    links: any[];
    _raw: any;
  };
};

// ===== TRIP SERVICES =====

export async function fetchFCSTrips(params: {
  page?: number;
  per_page?: number;
  status?: TripStatus;
} = {}): Promise<PaginatedResponse<TripRowDTO>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.per_page) query.append('per_page', params.per_page.toString());
  if (params.status) query.append('status', params.status);

  const json = await api(`/trips?${query.toString()}`, { method: 'GET' });
  const envelope = json?.data ?? json;

  const items = Array.isArray(envelope.data) ? envelope.data : [];
  const meta: PaginatedResponse<TripRowDTO>['meta'] = {
    current_page: Number(envelope.current_page ?? 1),
    per_page: Number(envelope.per_page ?? items.length),
    total: Number(envelope.total ?? items.length),
    last_page: Number(envelope.last_page ?? 1),
    next_page_url: envelope.next_page_url ?? null,
    prev_page_url: envelope.prev_page_url ?? null,
    path: envelope.path ?? '/trips',
    from: envelope.from ?? null,
    to: envelope.to ?? null,
    links: Array.isArray(envelope.links) ? envelope.links : [],
    _raw: envelope,
  };

  return { items, meta };
}

export async function fetchFCSTripById(id: number | string): Promise<TripDetails> {
  const json = await api(`/trips/${id}`, { method: 'GET' });
  return json?.data ?? json;
}

export async function approveFCSTrip(id: number | string): Promise<TripDetails> {
  const json = await api(`/trips/${id}/approve`, { method: 'POST' });
  return json?.data ?? json;
}

export async function rejectFCSTrip(id: number | string, payload: { rejection_reason: string }): Promise<TripDetails> {
  const json = await api(`/trips/${id}/reject`, {
    method: 'POST',
    body: payload,
  });
  return json?.data ?? json;
}

// ===== DISTRIBUTION SERVICES =====

export async function fetchFCSDistributions(params: {
  page?: number;
  per_page?: number;
  status?: DistributionStatus;
} = {}): Promise<PaginatedResponse<FishLotDistribution>> {
  // Standard paginated endpoint for FCS distributions
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.per_page) query.append('per_page', params.per_page.toString());
  if (params.status) query.append('status', params.status);

  const json = await api(`/middle-man-distributions?${query.toString()}`, { method: 'GET' });
  const payload = json?.data ?? json;

  // Support both shapes:
  // 1) { success, data: [...], meta: {...} }
  // 2) { data: [...], current_page, total, ... }
  // 3) Direct array [...]
  let items: FishLotDistribution[] = [];
  let meta: PaginatedResponse<FishLotDistribution>['meta'];

  if (Array.isArray(payload)) {
    // Direct array
    items = payload as FishLotDistribution[];
    meta = {
      current_page: 1,
      per_page: items.length,
      total: items.length,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
      path: '/middle-man-distributions',
      from: items.length > 0 ? 1 : null,
      to: items.length,
      links: [],
      _raw: { data: items },
    };
  } else if (Array.isArray(payload?.data)) {
    // data property contains array
    items = payload.data as FishLotDistribution[];
    meta = {
      current_page: Number(payload.current_page ?? payload.meta?.current_page ?? 1),
      per_page: Number(payload.per_page ?? payload.meta?.per_page ?? items.length),
      total: Number(payload.total ?? payload.meta?.total ?? items.length),
      last_page: Number(payload.last_page ?? payload.meta?.last_page ?? 1),
      next_page_url: payload.next_page_url ?? payload.meta?.next_page_url ?? null,
      prev_page_url: payload.prev_page_url ?? payload.meta?.prev_page_url ?? null,
      path: payload.path ?? payload.meta?.path ?? '/middle-man-distributions',
      from: payload.from ?? payload.meta?.from ?? (items.length > 0 ? 1 : null),
      to: payload.to ?? payload.meta?.to ?? items.length,
      links: Array.isArray(payload.links ?? payload.meta?.links) ? (payload.links ?? payload.meta?.links) : [],
      _raw: payload,
    };
  } else {
    // Fallback to empty
    items = [];
    meta = {
      current_page: 1,
      per_page: 0,
      total: 0,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
      path: '/middle-man-distributions',
      from: null,
      to: null,
      links: [],
      _raw: payload,
    };
  }

  return { items, meta };
}

export async function fetchFCSDistributionById(id: number | string): Promise<FishLotDistribution> {
  const json = await api(`/middle-man-distributions/${id}`, { method: 'GET' });
  return json?.data ?? json;
}

export async function verifyFCSDistribution(id: number | string): Promise<FishLotDistribution> {
  const json = await api(`/middle-man-distributions/${id}/verify`, { method: 'POST' });
  return json?.data ?? json;
}

export async function rejectFCSDistribution(id: number | string, payload: { verification_notes: string }): Promise<FishLotDistribution> {
  const json = await api(`/middle-man-distributions/${id}/reject`, {
    method: 'POST',
    body: payload,
  });
  return json?.data ?? json;
}

// ===== HELPER FUNCTIONS =====

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return '#ff9800';
    case 'pending_approval':
      return '#ff9800';
    case 'approved':
    case 'verified':
    case 'active':
      return '#4caf50';
    case 'completed':
      return '#2196f3';
    case 'cancelled':
    case 'rejected':
    case 'inactive':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
}

export function getStatusText(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}
