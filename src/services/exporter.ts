import { api } from './https';

// ===== TYPES =====

export type EnrichedPurchasedLot = {
  lot_no: string;
  quantity_kg: string;
  species_name: string;
  grade: string;
  type: string;
  notes: string | null;
};

export type ExporterPurchase = {
  id: number;
  exporter_id: number;
  middle_man_id: number;
  company_id: number;
  purchased_lots: Array<{
    lot_no: string;
    quantity_kg: string;
  }>;
  enriched_purchased_lots?: EnrichedPurchasedLot[];
  total_quantity_kg: string;
  total_value: string;
  purchase_reference: string;
  final_product_name: string;
  final_weight_quantity: string;
  processing_notes: string | null;
  status: 'pending' | 'confirmed' | 'processed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  status_label: string;
  exporter: {
    id: number;
    name: string;
    email: string;
    phone: string;
    user_type: string;
    export_license_number: string | null;
    verification_status: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  middle_man: {
    id: number;
    name: string;
    email: string;
    phone: string;
    user_type: string;
    company_name: string | null;
    business_address: string | null;
    business_phone: string | null;
    business_email: string | null;
    verification_status: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  company: {
    id: number;
    name: string;
    company_name?: string | null;
    email: string;
    phone: string;
    user_type: string;
    export_license_number: string | null;
    verification_status: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
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
    links: Array<{ url: string | null; label: string; active: boolean }>;
  };
};

export type ListPurchasesParams = {
  page?: number | string;
  per_page?: number | string;
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
};

// ===== API FUNCTIONS =====

export async function fetchExporterPurchases(params: ListPurchasesParams = {}): Promise<PaginatedResponse<ExporterPurchase>> {
  const json = await api('/exporter-purchases', { method: 'GET', query: params });

  const envelope = json?.data;
  if (!envelope || !Array.isArray(envelope.data)) {
    throw new Error('Invalid server response for /exporter-purchases');
  }

  const items = envelope.data as ExporterPurchase[];
  const meta: PaginatedResponse<ExporterPurchase>['meta'] = {
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
  };

  return { items, meta };
}

export async function fetchExporterPurchaseById(id: number | string): Promise<ExporterPurchase> {
  const json = await api(`/exporter-purchases/${id}`, { method: 'GET' });
  return json?.data ?? json;
}

export async function processExporterPurchase(id: number | string): Promise<ExporterPurchase> {
  const json = await api(`/exporter-purchases/${id}/process`, { method: 'POST' });
  return json?.data ?? json;
}

export async function completeExporterPurchase(id: number | string): Promise<ExporterPurchase> {
  const json = await api(`/exporter-purchases/${id}/complete`, { method: 'POST' });
  return json?.data ?? json;
}

// Verify and approve purchase (for status pending_verification)
export async function verifyApproveExporterPurchase(id: number | string): Promise<ExporterPurchase> {
  const json = await api(`/exporter-purchases/${id}/verify`, { method: 'POST' });
  return json?.data ?? json;
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
      return '#2196f3';
    case 'processed':
      return '#9c27b0';
    case 'completed':
      return '#4caf50';
    case 'cancelled':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
}

export function getStatusText(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

// Get purchases for traceability dropdown
export async function fetchPurchasesForTraceability(): Promise<ExporterPurchase[]> {
  const json = await api('/exporter-purchases', { method: 'GET', query: { status: 'completed', per_page: 100 } });
  
  const envelope = json?.data;
  if (!envelope || !Array.isArray(envelope.data)) {
    return [];
  }

  return envelope.data as ExporterPurchase[];
}
