import { api } from './https';

// ===== TYPES =====

export type DistributionStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type AssignmentStatus = 'active' | 'inactive' | 'pending';
export type PurchaseStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// ===== CREATE DISTRIBUTION TYPES =====

export type CreateDistributionLot = {
  lot_no: number;
  quantity_kg: string;
  notes?: string;
};

export type CreateDistributionData = {
  trip_id: number;
  fisherman_id: number;
  middle_man_id: number;
  distributed_lots: CreateDistributionLot[];
  total_quantity_kg: string;
  total_value?: number;
  verification_notes?: string;
};

export type DistributedLot = {
  notes: string | null;
  lot_id: string;
  quantity_kg: string;
};

export type FishLotDistribution = {
  id: number;
  trip_id: number;
  fisherman_id: number;
  middle_man_id: number;
  distributed_lots: DistributedLot[];
  total_quantity_kg: string;
  total_value: number | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_by: number | null;
  verified_at: string | null;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
  verification_status_label: string;
  middle_man?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    fcs_license_number?: string | null;
    user_type?: string | null;
    role?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    is_verified?: boolean;
    verification_status?: string | null;
    is_active?: boolean;
  };
  verifier?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    mfd_employee_id?: string | null;
    user_type?: string | null;
    role?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    is_verified?: boolean;
    verification_status?: string | null;
    is_active?: boolean;
  };
};

export type MiddlemanAssignment = {
  id: number;
  middle_man_id: number;
  company_id: number;
  status: AssignmentStatus;
  assigned_date: string;
  expiry_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  status_label?: string | null;
  middle_man?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    company_name?: string | null;
    address?: string | null;
    fcs_license_number?: string | null;
    user_type?: string | null;
    role?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    is_verified?: boolean;
    verification_status?: string | null;
    is_active?: boolean;
  };
  company?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    business_address?: string | null;
    business_phone?: string | null;
    business_email?: string | null;
    company_name?: string | null;
    export_license_number?: string | null;
    user_type?: string | null;
    role?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    is_verified?: boolean;
    verification_status?: string | null;
    is_active?: boolean;
  };
};

export type FishPurchase = {
  id: number;
  distribution_id: number;
  middleman_id: number;
  lot_id: number;
  purchase_price: number;
  quantity_kg: number;
  status: PurchaseStatus;
  purchase_date: string;
  payment_status: 'pending' | 'paid' | 'partial';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  distribution?: FishLotDistribution;
  middleman?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    company_name?: string | null;
    address?: string | null;
  };
};

// ===== API PARAMETERS =====

export type ListDistributionsParams = {
  page?: number | string;
  per_page?: number | string;
  status?: DistributionStatus | string;
  middleman_id?: number | string;
  trip_id?: number | string;
  search?: string;
  date_from?: string;
  date_to?: string;
};

export type ListAssignmentsParams = {
  page?: number | string;
  per_page?: number | string;
  status?: AssignmentStatus | string;
  middleman_id?: number | string;
  company_id?: number | string;
  search?: string;
};

export type ListPurchasesParams = {
  page?: number | string;
  per_page?: number | string;
  status?: PurchaseStatus | string;
  middleman_id?: number | string;
  distribution_id?: number | string;
  search?: string;
  date_from?: string;
  date_to?: string;
};

// ===== PAGINATION TYPES =====

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
    links: Array<{ url: string | null; label: string; active: boolean }>;
    _raw?: any;
  };
};

// ===== DISTRIBUTIONS API =====

export async function fetchDistributions(params: ListDistributionsParams = {}): Promise<PaginatedResponse<FishLotDistribution>> {
  const json = await api('/middle-man-distributions', { method: 'GET', query: params });

  // The API returns a direct array, not paginated
  if (!json?.data || !Array.isArray(json.data)) {
    throw new Error('Invalid server response for /middle-man-distributions');
  }

  const items = json.data as FishLotDistribution[];
  
  // Create a mock pagination structure since the API doesn't provide pagination
  const meta: PaginatedResponse<FishLotDistribution>['meta'] = {
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

  return { items, meta };
}

export async function fetchDistributionById(id: number | string): Promise<FishLotDistribution> {
  const json = await api(`/middle-man-distributions/${id}`, { method: 'GET' });
  return json?.data ?? json;
}

export async function confirmDistribution(id: number | string, purchasePrice: number): Promise<FishLotDistribution> {
  const json = await api(`/middle-man-distributions/${id}/confirm`, { 
    method: 'POST', 
    body: { purchase_price: purchasePrice } 
  });
  return json?.data ?? json;
}

export async function completeDistribution(id: number | string): Promise<FishLotDistribution> {
  const json = await api(`/middle-man-distributions/${id}/complete`, { method: 'POST' });
  return json?.data ?? json;
}

export async function createDistribution(data: CreateDistributionData): Promise<FishLotDistribution> {
  const json = await api('/middle-man-distributions', { 
    method: 'POST', 
    body: data 
  });
  return json?.data ?? json;
}

// ===== ASSIGNMENTS API =====

export async function fetchAssignments(params: ListAssignmentsParams = {}): Promise<PaginatedResponse<MiddlemanAssignment>> {
  const json = await api('/middle-man-company-assignments', { method: 'GET', query: params });

  const envelope = json?.data;
  if (!envelope || !Array.isArray(envelope.data)) {
    throw new Error('Invalid server response for /middle-man-company-assignments');
  }

  const items = envelope.data as MiddlemanAssignment[];
  const meta: PaginatedResponse<MiddlemanAssignment>['meta'] = {
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

export async function fetchAssignmentById(id: number | string): Promise<MiddlemanAssignment> {
  const json = await api(`/middle-man-company-assignments/${id}`, { method: 'GET' });
  return json?.data ?? json;
}

// ===== PURCHASES API =====

export async function fetchPurchases(params: ListPurchasesParams = {}): Promise<PaginatedResponse<FishPurchase>> {
  const json = await api('/exporter-purchases', { method: 'GET', query: params });

  const envelope = json?.data;
  if (!envelope || !Array.isArray(envelope.data)) {
    throw new Error('Invalid server response for /exporter-purchases');
  }

  const items = envelope.data as FishPurchase[];
  const meta: PaginatedResponse<FishPurchase>['meta'] = {
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

export async function fetchPurchaseById(id: number | string): Promise<FishPurchase> {
  const json = await api(`/exporter-purchases/${id}`, { method: 'GET' });
  return json?.data ?? json;
}

export async function confirmPurchase(id: number | string): Promise<FishPurchase> {
  const json = await api(`/exporter-purchases/${id}/confirm`, { method: 'POST' });
  return json?.data ?? json;
}

export async function completePurchase(id: number | string): Promise<FishPurchase> {
  const json = await api(`/exporter-purchases/${id}/complete`, { method: 'POST' });
  return json?.data ?? json;
}

// ===== EXPORTER PURCHASE CREATE =====
export type CreateExporterPurchaseBody = {
  middle_man_id: number | string;
  company_id: number | string;
  purchase_reference?: string;
  final_product_name?: string;
  processing_notes?: string;
  purchased_lots: Array<{ lot_no: string; quantity_kg: number | string }>;
};

export async function createExporterPurchase(body: CreateExporterPurchaseBody): Promise<FishPurchase> {
  const json = await api('/exporter-purchases', { method: 'POST', body });
  return json?.data ?? json;
}

// ===== CONVENIENCE FUNCTIONS =====

export function fetchDistributionsByStatus(status: DistributionStatus, page = 1, per_page = 15) {
  return fetchDistributions({ status, page, per_page });
}

export function fetchPendingDistributions(page = 1, per_page = 15) {
  return fetchDistributions({ status: 'pending', page, per_page });
}

export function fetchAssignmentsByStatus(status: AssignmentStatus, page = 1, per_page = 15) {
  return fetchAssignments({ status, page, per_page });
}

export function fetchActiveAssignments(page = 1, per_page = 15) {
  return fetchAssignments({ status: 'active', page, per_page });
}

export function fetchPurchasesByStatus(status: PurchaseStatus, page = 1, per_page = 15) {
  return fetchPurchases({ status, page, per_page });
}

export function fetchPendingPurchases(page = 1, per_page = 15) {
  return fetchPurchases({ status: 'pending', page, per_page });
}

// ===== HELPER FUNCTIONS =====

export function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString();
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return '#ff9800';
    case 'confirmed':
    case 'active':
      return '#2196f3';
    case 'completed':
    case 'verified':
      return '#4caf50';
    case 'cancelled':
    case 'rejected':
    case 'inactive':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
}

export function getStatusText(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}
