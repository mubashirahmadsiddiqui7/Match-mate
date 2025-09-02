import { api } from './https';

export type SelectedLot = {
  lot_no: string;
  quantity: string;
  final_product_name?: string;
};

export type TraceabilityRecord = {
  id: number;
  document_no: string;
  exporter_id: number;
  company_id: number | null;
  invoice_no?: string | null;
  consignee_name?: string | null;
  consignee_country?: string | null;
  document_date?: string | null;
  date_of_shipment?: string | null;
  export_certificate_no?: string | null;
  selected_lots?: SelectedLot[];
  total_quantity_kg?: string | null;
  total_value?: string | null;
  validating_authority?: string | null;
  exporter_name?: string | null;
  plant_address?: string | null;
  status?: string | null;           // approved | pending | rejected
  approved_by?: number | null;
  approved_at?: string | null;
  mfd_manual_id?: string | null;
  approval_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  status_label?: string | null;
  company?: any;
  approver?: any;
};

export type ListTraceabilityParams = {
  status?: string;
  date_from?: string;
  date_to?: string;
  country?: string;
  q?: string; // document_no or manual id
};

export async function fetchTraceabilityRecords(params: ListTraceabilityParams = {}): Promise<TraceabilityRecord[]> {
  const json = await api('/traceability-records', { method: 'GET', query: params });
  const data = json?.data;
  if (!Array.isArray(data)) return [];
  return data as TraceabilityRecord[];
}

export type CreateTraceabilityBody = Partial<TraceabilityRecord> & {
  selected_lots: SelectedLot[];
};

export async function createTraceabilityRecord(body: CreateTraceabilityBody): Promise<TraceabilityRecord> {
  const json = await api('/traceability-records', { method: 'POST', body });
  console.log('createTraceabilityRecord', json);
  return json?.data ?? json;
}

// Companies for exporters
export type ExporterCompany = {
  id: number;
  name: string;
  company_name: string;
  registration_no?: string | null;
  status?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
};

export async function fetchExporterCompanies(): Promise<ExporterCompany[]> {
  const json = await api('/all-exporter-companies', { method: 'GET' });
  const data = json?.data;
  if (!Array.isArray(data)) return [];
  return data as ExporterCompany[];
}


