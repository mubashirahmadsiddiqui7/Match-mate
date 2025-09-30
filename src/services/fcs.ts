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
  trip_id: string;
  fisherman_id: number;
  user_id: number | null;
  boat_registration_number: string;
  boat_name: string | null;
  trip_type: string;
  trip_purpose: string | null;
  fishing_zone: string | null;
  port_location: string;
  departure_time: string;
  departure_latitude: string;
  departure_longitude: string;
  departure_port: string;
  departure_notes: string | null;
  arrival_time: string | null;
  arrival_latitude: string | null;
  arrival_longitude: string | null;
  arrival_port: string | null;
  landing_site: string;
  landing_time: string;
  fishing_activity_count: number;
  trip_started: boolean;
  trip_completed: boolean;
  auto_time: string;
  auto_latitude: string | null;
  auto_longitude: string | null;
  arrival_notes: string | null;
  status: TripStatus;
  approved_by: number | null;
  approved_at: string | null;
  approval_notes: string | null;
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
  catch_notes: string | null;
  fuel_cost: string | null;
  operational_cost: string | null;
  total_cost: string | null;
  revenue: string | null;
  profit: string | null;
  gps_track: string | null;
  last_gps_update: string | null;
  current_latitude: string | null;
  current_longitude: string | null;
  current_speed: string | null;
  current_heading: string | null;
  is_offline: boolean;
  last_online_at: string | null;
  went_offline_at: string | null;
  trip_photos: string | null;
  documents: string | null;
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
  approver?: {
    id: number;
    name: string;
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
  };
  boat?: any;
  fishing_activities?: Array<{
    id: number;
    activity_id: string;
    trip_id: number;
    fisherman_id: number;
    activity_number: number;
    activity_date: string;
    activity_time: string;
    gps_latitude: string;
    gps_longitude: string;
    time_of_netting: string;
    time_of_hauling: string;
    gear_type: string;
    mesh_size: string;
    net_length: string;
    net_width: string;
    status: string;
    created_at: string;
    updated_at: string;
    status_label: string;
    gear_type_label: string;
    mesh_size_label: string;
    location_formatted: string;
    fish_species?: Array<{
      id: number;
      lot_no: string;
      fishing_activity_id: number;
      trip_id: number;
      fisherman_id: number;
      species_name: string;
      quantity_kg: string;
      type: string;
      grade: string | null;
      notes: string | null;
      photos: string | null;
      created_at: string;
      updated_at: string;
      type_label: string;
      grade_label: string;
    }>;
  }>;
  fish_species?: Array<{
    id: number;
    lot_no: string;
    fishing_activity_id: number;
    trip_id: number;
    fisherman_id: number;
    species_name: string;
    quantity_kg: string;
    type: string;
    grade: string | null;
    notes: string | null;
    photos: string | null;
    created_at: string;
    updated_at: string;
    type_label: string;
    grade_label: string;
  }>;
  // Legacy fields for backward compatibility
  trip_name: string;
  fisherman_name: string | null;
  departure_lat: string | null;
  departure_lng: string | null;
  arrival_lat: string | null;
  arrival_lng: string | null;
  estimated_catch: string | null;
  weather: string | null;
  boat_registration_no: string | null;
  activities?: any[];
  lots?: any[];
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

  const rawItems = Array.isArray(envelope.data) ? envelope.data : [];
  
  // Map the API response to TripRowDTO format
  const items: TripRowDTO[] = rawItems.map((trip: any) => ({
    id: trip.id,
    trip_name: trip.trip_id || `Trip-${trip.id}`,
    boat_name: trip.boat_name || trip.boat_registration_number || 'Unknown Boat',
    fisherman_name: trip.fisherman?.name || trip.captain_name || 'Unknown Captain',
    departure_port: trip.departure_port || trip.port_location || 'Unknown Port',
    departure_time: trip.departure_time || trip.created_at,
    created_at: trip.created_at,
    status: trip.status,
    trip_type: trip.trip_type,
    trip_purpose: trip.trip_purpose,
    fishing_zone: trip.fishing_zone,
    port_location: trip.port_location,
    landing_site: trip.landing_site,
    landing_time: trip.landing_time,
    crew_count: trip.crew_count,
    captain_name: trip.captain_name,
    captain_mobile_no: trip.captain_mobile_no,
    status_label: trip.status_label,
    trip_type_label: trip.trip_type_label,
    is_active: trip.is_active,
    is_completed: trip.is_completed,
    is_pending_approval: trip.is_pending_approval,
    current_location_formatted: trip.current_location_formatted,
    departure_location_formatted: trip.departure_location_formatted,
    arrival_location_formatted: trip.arrival_location_formatted,
  }));

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
  const trip = json?.data ?? json;
  
  // Map the API response to TripDetails format
  return {
    id: trip.id,
    trip_id: trip.trip_id,
    fisherman_id: trip.fisherman_id,
    user_id: trip.user_id,
    boat_registration_number: trip.boat_registration_number,
    boat_name: trip.boat_name,
    trip_type: trip.trip_type,
    trip_purpose: trip.trip_purpose,
    fishing_zone: trip.fishing_zone,
    port_location: trip.port_location,
    departure_time: trip.departure_time,
    departure_latitude: trip.departure_latitude,
    departure_longitude: trip.departure_longitude,
    departure_port: trip.departure_port,
    departure_notes: trip.departure_notes,
    arrival_time: trip.arrival_time,
    arrival_latitude: trip.arrival_latitude,
    arrival_longitude: trip.arrival_longitude,
    arrival_port: trip.arrival_port,
    landing_site: trip.landing_site,
    landing_time: trip.landing_time,
    fishing_activity_count: trip.fishing_activity_count,
    trip_started: trip.trip_started,
    trip_completed: trip.trip_completed,
    auto_time: trip.auto_time,
    auto_latitude: trip.auto_latitude,
    auto_longitude: trip.auto_longitude,
    arrival_notes: trip.arrival_notes,
    status: trip.status,
    approved_by: trip.approved_by,
    approved_at: trip.approved_at,
    approval_notes: trip.approval_notes,
    crew_count: trip.crew_count,
    captain_name: trip.captain_name,
    captain_mobile_no: trip.captain_mobile_no,
    crew_no: trip.crew_no,
    port_clearance_no: trip.port_clearance_no,
    fuel_quantity: trip.fuel_quantity,
    ice_quantity: trip.ice_quantity,
    departure_site: trip.departure_site,
    safety_equipment: trip.safety_equipment,
    emergency_contact: trip.emergency_contact,
    emergency_phone: trip.emergency_phone,
    weather_conditions: trip.weather_conditions,
    sea_conditions: trip.sea_conditions,
    wind_speed: trip.wind_speed,
    wave_height: trip.wave_height,
    estimated_catch_weight: trip.estimated_catch_weight,
    target_species: trip.target_species,
    catch_notes: trip.catch_notes,
    fuel_cost: trip.fuel_cost,
    operational_cost: trip.operational_cost,
    total_cost: trip.total_cost,
    revenue: trip.revenue,
    profit: trip.profit,
    gps_track: trip.gps_track,
    last_gps_update: trip.last_gps_update,
    current_latitude: trip.current_latitude,
    current_longitude: trip.current_longitude,
    current_speed: trip.current_speed,
    current_heading: trip.current_heading,
    is_offline: trip.is_offline,
    last_online_at: trip.last_online_at,
    went_offline_at: trip.went_offline_at,
    trip_photos: trip.trip_photos,
    documents: trip.documents,
    created_at: trip.created_at,
    updated_at: trip.updated_at,
    duration: trip.duration,
    distance_traveled: trip.distance_traveled,
    status_label: trip.status_label,
    trip_type_label: trip.trip_type_label,
    is_active: trip.is_active,
    is_completed: trip.is_completed,
    is_pending_approval: trip.is_pending_approval,
    current_location_formatted: trip.current_location_formatted,
    departure_location_formatted: trip.departure_location_formatted,
    arrival_location_formatted: trip.arrival_location_formatted,
    fisherman: trip.fisherman,
    approver: trip.approver,
    boat: trip.boat,
    fishing_activities: trip.fishing_activities,
    fish_species: trip.fish_species,
    // Legacy fields for backward compatibility
    trip_name: trip.trip_id || `Trip-${trip.id}`,
    fisherman_name: trip.fisherman?.name || trip.captain_name,
    departure_lat: trip.departure_latitude,
    departure_lng: trip.departure_longitude,
    arrival_lat: trip.arrival_latitude,
    arrival_lng: trip.arrival_longitude,
    estimated_catch: trip.estimated_catch_weight,
    weather: trip.weather_conditions,
    boat_registration_no: trip.boat_registration_number,
    activities: trip.fishing_activities,
    lots: trip.fish_species,
  };
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

export async function getFCSDistributionCounts(): Promise<{ totals: { all: number; verified: number; pending: number; rejected: number; }; errors: Partial<Record<'all' | DistributionStatus, string>>; }> {
  const statuses: DistributionStatus[] = ['verified', 'pending', 'rejected'];
  const reqs = [
    fetchFCSDistributions({ page: 1, per_page: 1 }), // Get total count
    ...statuses.map(status => fetchFCSDistributions({ status, page: 1, per_page: 1 }))
  ];
  const settled = await Promise.allSettled(reqs);

  const totals = { all: 0, verified: 0, pending: 0, rejected: 0 };
  const errors: Partial<Record<'all' | DistributionStatus, string>> = {};

  const allRes = settled[0];
  if (allRes.status === 'fulfilled') {
    totals.all = allRes.value.meta?.total || allRes.value.items?.length || 0;
  } else {
    totals.all = 0;
    errors.all = (allRes as any).reason?.message || 'Failed';
  }

  statuses.forEach((status, i) => {
    const res = settled[i + 1];
    if (res.status === 'fulfilled') {
      totals[status] = res.value.meta?.total || res.value.items?.length || 0;
    } else {
      totals[status] = 0;
      errors[status] = (res as any).reason?.message || 'Failed';
    }
  });

  return { totals, errors };
}

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
