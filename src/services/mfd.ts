import { api } from './https';
import { fetchTraceabilityRecords, type TraceabilityRecord } from './traceability';
// Removed unused imports

// ===== TYPES =====

export type DistributionStatus = 'pending' | 'verified' | 'rejected';
export type PurchaseStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type AssignmentStatus = 'active' | 'inactive' | 'pending';
export type RecordType = 'trip' | 'distribution' | 'purchase' | 'assignment' | 'boat';

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
  trip?: TripInfo;
  middle_man?: MiddleManInfo;
  verifier?: any;
};

export type DistributedLot = {
  notes: string | null;
  lot_id: string;
  quantity_kg: string;
  lot_no: string;
  species_name?: string;
};

export type FishPurchase = {
  id: number;
  distribution_id: number;
  company_id: number;
  purchase_reference?: string;
  final_product_name?: string;
  processing_notes?: string;
  final_weight_quantity?: string;
  status: PurchaseStatus;
  created_at: string;
  updated_at: string;
  company?: CompanyInfo;
  distribution?: DistributionInfo;
};

// Use MiddlemanAssignment for assignments
export type MFDCompanyAssignment = {
  id: number;
  middle_man_id: number;
  company_id: number;
  status: AssignmentStatus;
  assigned_date: string;
  expiry_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  status_label: string;
  middle_man: {
    id: number;
    name: string;
    email: string;
    phone: string;
    user_type: string;
    first_name: string;
    last_name: string;
    company_name: string | null;
    business_address: string | null;
    business_phone: string | null;
    business_email: string | null;
    is_verified: boolean;
    verification_status: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  company: {
    id: number;
    name: string;
    email: string;
    phone: string;
    user_type: string;
    first_name: string;
    last_name: string;
    export_license_number: string | null;
    address: string | null;
    is_verified: boolean;
    verification_status: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
};

export type Assignment = MFDCompanyAssignment;

export type Boat = {
  id: number;
  user_id: number;
  boat_name: string;
  boat_registration_number: string;
  boat_type?: string;
  length_m?: number;
  width_m?: number;
  capacity_crew?: number;
  mfd_approved_no?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  owner?: UserInfo;
};

// Use TraceabilityRecord for records
export type Record = TraceabilityRecord;

// Supporting types
export type TripInfo = {
  id: number;
  trip_id: string;
  captain_name: string;
  captain_mobile_no: string;
  departure_port: string;
  departure_time: string;
  status: string;
  status_label: string;
};

export type MiddleManInfo = {
  id: number;
  name: string;
  company_name: string;
  business_phone: string;
  business_email: string;
};

export type CompanyInfo = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

export type DistributionInfo = {
  id: number;
  total_quantity_kg: string;
  verification_status: string;
};

export type FishermanInfo = {
  id: number;
  name: string;
  phone: string;
  fishing_zone: string;
};

export type BoatInfo = {
  id: number;
  boat_name: string;
  boat_registration_number: string;
  boat_type?: string;
};

export type UserInfo = {
  id: number;
  name: string;
  email: string;
  phone: string;
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

// ===== DISTRIBUTION SERVICES =====

export async function fetchMFDDistributions(params: {
  page?: number;
  per_page?: number;
  status?: DistributionStatus;
} = {}): Promise<PaginatedResponse<FishLotDistribution>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.per_page) query.append('per_page', params.per_page.toString());
  if (params.status) query.append('status', params.status);

  const json = await api(`/middle-man-distributions?${query.toString()}`, { method: 'GET' });
  const payload = json?.data ?? json;

  let items: FishLotDistribution[] = [];
  let meta: PaginatedResponse<FishLotDistribution>['meta'];

  if (Array.isArray(payload)) {
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

export async function fetchMFDDistributionById(id: number | string): Promise<FishLotDistribution> {
  const json = await api(`/middle-man-distributions/${id}`, { method: 'GET' });
  return json?.data ?? json;
}

// ===== PURCHASE SERVICES =====

export async function fetchMFDPurchases(params: {
  page?: number;
  per_page?: number;
  status?: PurchaseStatus;
} = {}): Promise<PaginatedResponse<FishPurchase>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.per_page) query.append('per_page', params.per_page.toString());
  if (params.status) query.append('status', params.status);

  const json = await api(`/exporter-purchases?${query.toString()}`, { method: 'GET' });
  const payload = json?.data ?? json;

  let items: FishPurchase[] = [];
  let meta: PaginatedResponse<FishPurchase>['meta'];

  if (Array.isArray(payload)) {
    items = payload as FishPurchase[];
    meta = {
      current_page: 1,
      per_page: items.length,
      total: items.length,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
      path: '/exporter-purchases',
      from: items.length > 0 ? 1 : null,
      to: items.length,
      links: [],
      _raw: { data: items },
    };
  } else if (Array.isArray(payload?.data)) {
    items = payload.data as FishPurchase[];
    meta = {
      current_page: Number(payload.current_page ?? payload.meta?.current_page ?? 1),
      per_page: Number(payload.per_page ?? payload.meta?.per_page ?? items.length),
      total: Number(payload.total ?? payload.meta?.total ?? items.length),
      last_page: Number(payload.last_page ?? payload.meta?.last_page ?? 1),
      next_page_url: payload.next_page_url ?? payload.meta?.next_page_url ?? null,
      prev_page_url: payload.prev_page_url ?? payload.meta?.prev_page_url ?? null,
      path: payload.path ?? payload.meta?.path ?? '/exporter-purchases',
      from: payload.from ?? payload.meta?.from ?? (items.length > 0 ? 1 : null),
      to: payload.to ?? payload.meta?.to ?? items.length,
      links: Array.isArray(payload.links ?? payload.meta?.links) ? (payload.links ?? payload.meta?.links) : [],
      _raw: payload,
    };
  } else {
    items = [];
    meta = {
      current_page: 1,
      per_page: 0,
      total: 0,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
      path: '/exporter-purchases',
      from: null,
      to: null,
      links: [],
      _raw: payload,
    };
  }

  return { items, meta };
}

export async function fetchMFDPurchaseById(id: number | string): Promise<FishPurchase> {
  const json = await api(`/exporter-purchases/${id}`, { method: 'GET' });
  return json?.data ?? json;
}

// ===== RECORD SERVICES =====

export async function fetchMFDRecords(params: {
  page?: number;
  per_page?: number;
  type?: RecordType;
} = {}): Promise<PaginatedResponse<Record>> {
  // Use traceability service for records
  const items = await fetchTraceabilityRecords({
    status: params.type === 'trip' ? 'approved' : undefined,
  });

  // Convert to paginated response format
  const meta: PaginatedResponse<Record>['meta'] = {
    current_page: params.page || 1,
    per_page: params.per_page || items.length,
    total: items.length,
    last_page: 1,
    next_page_url: null,
    prev_page_url: null,
    path: '/traceability-records',
    from: items.length > 0 ? 1 : null,
    to: items.length,
    links: [],
    _raw: { data: items },
  };

  return { items, meta };
}

export async function fetchMFDRecordById(id: number | string): Promise<Record> {
  const json = await api(`/records/${id}`, { method: 'GET' });
  return json?.data ?? json;
}

// ===== BOAT SERVICES =====

export async function fetchMFDBoats(params: {
  page?: number;
  per_page?: number;
} = {}): Promise<PaginatedResponse<Boat>> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.per_page) query.append('per_page', params.per_page.toString());

  const json = await api(`/boats?${query.toString()}`, { method: 'GET' });
  const payload = json?.data ?? json;

  let items: Boat[] = [];
  let meta: PaginatedResponse<Boat>['meta'];

  if (Array.isArray(payload)) {
    items = payload as Boat[];
    meta = {
      current_page: 1,
      per_page: items.length,
      total: items.length,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
      path: '/boats',
      from: items.length > 0 ? 1 : null,
      to: items.length,
      links: [],
      _raw: { data: items },
    };
  } else if (Array.isArray(payload?.data)) {
    items = payload.data as Boat[];
    meta = {
      current_page: Number(payload.current_page ?? payload.meta?.current_page ?? 1),
      per_page: Number(payload.per_page ?? payload.meta?.per_page ?? items.length),
      total: Number(payload.total ?? payload.meta?.total ?? items.length),
      last_page: Number(payload.last_page ?? payload.meta?.last_page ?? 1),
      next_page_url: payload.next_page_url ?? payload.meta?.next_page_url ?? null,
      prev_page_url: payload.prev_page_url ?? payload.meta?.prev_page_url ?? null,
      path: payload.path ?? payload.meta?.path ?? '/boats',
      from: payload.from ?? payload.meta?.from ?? (items.length > 0 ? 1 : null),
      to: payload.to ?? payload.meta?.to ?? items.length,
      links: Array.isArray(payload.links ?? payload.meta?.links) ? (payload.links ?? payload.meta?.links) : [],
      _raw: payload,
    };
  } else {
    items = [];
    meta = {
      current_page: 1,
      per_page: 0,
      total: 0,
      last_page: 1,
      next_page_url: null,
      prev_page_url: null,
      path: '/boats',
      from: null,
      to: null,
      links: [],
      _raw: payload,
    };
  }

  return { items, meta };
}

export async function fetchMFDBoatById(id: number | string): Promise<Boat> {
  const json = await api(`/boats/${id}`, { method: 'GET' });
  return json?.data ?? json;
}

// ===== ASSIGNMENT SERVICES =====

export async function fetchMFDAssignments(params: {
  page?: number;
  per_page?: number;
  status?: AssignmentStatus;
} = {}): Promise<PaginatedResponse<Assignment>> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.per_page) queryParams.append('per_page', params.per_page.toString());
  if (params.status) queryParams.append('status', params.status);

  const json = await api(`/middle-man-company-assignments?${queryParams.toString()}`);
  
  return {
    items: json?.data?.data || [],
    meta: {
      current_page: json?.data?.current_page || 1,
      last_page: json?.data?.last_page || 1,
      per_page: json?.data?.per_page || 15,
      total: json?.data?.total || 0,
      from: json?.data?.from || 0,
      to: json?.data?.to || 0,
      next_page_url: json?.data?.next_page_url || null,
      prev_page_url: json?.data?.prev_page_url || null,
      path: json?.data?.path || '',
      links: json?.data?.links || [],
      _raw: json?.data || null,
    },
  };
}

export async function fetchMFDAssignmentById(id: number | string): Promise<Assignment> {
  const json = await api(`/middle-man-company-assignments/${id}`);
  return json?.data ?? json;
}

export async function createMFDAssignment(data: {
  middle_man_id: number;
  company_id: number;
  assigned_date: string;
  expiry_date?: string | null;
  status?: AssignmentStatus;
  notes?: string | null;
}): Promise<Assignment> {
  const json = await api('/middle-man-company-assignments', {
    method: 'POST',
    body: data,
  });
  return json?.data ?? json;
}

export async function updateMFDAssignment(id: number | string, data: {
  assigned_date?: string;
  expiry_date?: string | null;
  status?: AssignmentStatus;
  notes?: string | null;
}): Promise<Assignment> {
  const json = await api(`/middle-man-company-assignments/${id}`, {
    method: 'PUT',
    body: data,
  });
  return json?.data ?? json;
}

export async function deleteMFDAssignment(id: number | string): Promise<void> {
  await api(`/assignments/${id}`, { method: 'DELETE' });
}

export async function activateMFDAssignment(id: number | string): Promise<Assignment> {
  const json = await api(`/middle-man-company-assignments/${id}/activate`, {
    method: 'POST',
  });
  return json?.data ?? json;
}

export async function deactivateMFDAssignment(id: number | string): Promise<Assignment> {
  const json = await api(`/middle-man-company-assignments/${id}/deactivate`, {
    method: 'POST',
  });
  return json?.data ?? json;
}

// ===== COMPANY AND MIDDLE MAN SERVICES =====

export type Company = {
  id: number;
  name: string;
  company_name: string | null;
};

export type MiddleMan = {
  id: number;
  name: string;
  email: string;
};

export async function fetchAllExporterCompanies(): Promise<Company[]> {
  const json = await api('/exporter-purchases/companies/all');
  return json?.data || [];
}

export async function fetchAllMiddleMen(): Promise<MiddleMan[]> {
  const json = await api('/exporter-purchases/distributions/all');
  // Response is an array in data: [...]; we collect unique middle_man entries
  const payload = json?.data ?? json;
  const distributions = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  const middleMenMap = new Map<number, MiddleMan>();

  distributions.forEach((distribution: any) => {
    const mm = distribution?.middle_man;
    if (mm && typeof mm.id === 'number') {
      middleMenMap.set(mm.id, {
        id: mm.id,
        name: mm.name,
        email: mm.email,
      });
    }
  });

  return Array.from(middleMenMap.values());
}

// ===== HELPER FUNCTIONS =====

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return '#ff9800';
    case 'verified':
    case 'confirmed':
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
