// src/services/boats.ts
import { api } from './https';

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface BoatOwner {
  id: number;
  name: string;
  email: string;
  user_type: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  is_active: boolean;
  is_verified: boolean;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  postal_code: string | null;
  country: string | null;
  boat_registration_number: string | null;
  fishing_zone: string | null;
  port_location: string | null;
  fcs_license_number: string | null;
  export_license_number: string | null;
  mfd_employee_id: string | null;
  company_name: string | null;
  company_id: string | null;
  business_address: string | null;
  business_phone: string | null;
  business_email: string | null;
  verified_at: string | null;
  verification_status: string;
  verification_document: string | null;
  profile_description: string | null;
  bio: string | null;
  website: string | null;
  profile_picture: string | null;
  cover_picture: string | null;
  phone_verified_at: string | null;
  last_login_at: string | null;
  preferences: any | null;
  created_at: string;
  updated_at: string;
}

export interface Boat {
  id: number;
  registration_number: string;
  boat_license_no: string | null;
  mfd_approved_no: string | null;
  name: string;
  owner_id: number;
  user_id: number;
  type: string;
  boat_type: string | null;
  length_m: string;
  width_m: string;
  capacity_crew: number;
  capacity_weight_kg: number | null;
  number_of_fish_holds: number | null;
  boat_size: string;
  boat_capacity: string;
  engine_power: string;
  year_built: number;
  fishing_equipment: string | null;
  safety_equipment: string | null;
  insurance_info: string | null;
  license_info: string | null;
  notes: string | null;
  home_port: string | null;
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected';
  documents: any | null;
  photos: any | null;
  created_at: string;
  updated_at: string;
  owner: BoatOwner;
}

export interface ListBoatsParams {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  type?: string;
}

export async function fetchBoats(params?: ListBoatsParams): Promise<PaginatedResponse<Boat>> {
  const json = await api('/boats', { method: 'GET', query: params });
  return json?.data ?? json;
}

export async function fetchBoatById(id: number | string): Promise<Boat> {
  const json = await api(`/boats/${id}`, { method: 'GET' });
  // The API returns { success: true, data: { boat_data } }
  return json?.data;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active': return '#4caf50';
    case 'inactive': return '#f44336';
    case 'pending': return '#ff9800';
    case 'approved': return '#4caf50';
    case 'rejected': return '#f44336';
    default: return '#757575';
  }
}

export function getStatusText(status: string): string {
  return status.toUpperCase();
}
